import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
} from "../components/UI.jsx";
import TripRouteMap from "../components/TripRouteMap.jsx";

const BLOCKS = ["morning", "afternoon", "evening"];
const BLOCK_ORDER = { morning: 1, afternoon: 2, evening: 3 };

const fmtRange = (s, e) => (s && e ? `${s} → ${e}` : "");
const clamp = (s, n = 120) => {
  const str = (s ?? "").toString();
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
};

function normalizeTripMode(mode) {
  return mode === "multi" ? "multi" : "single";
}

function getTripDestinations(trip) {
  if (Array.isArray(trip?.destinations) && trip.destinations.length) {
    return trip.destinations.filter(Boolean);
  }

  return trip?.destination ? [trip.destination] : [];
}

function extractUniqueLocations(itinerary) {
  const rows =
    itinerary?.days?.flatMap((d) =>
      BLOCKS.flatMap((block) =>
        (d?.[block] ?? [])
          .map((a) => ({
            day: d.day,
            date: d.date,
            title: a?.title || "Place",
            timeBlock: block,
            location: (a?.location || "").trim(),
            notes: a?.notes || "",
            durationHours: a?.durationHours ?? null,
          }))
          .filter((x) => x.location)
      )
    ) ?? [];

  const unique = Array.from(
    new Map(rows.map((x) => [x.location.toLowerCase(), x])).values()
  );

  return unique.sort(
    (a, b) =>
      (a.day ?? 0) - (b.day ?? 0) ||
      (BLOCK_ORDER[a.timeBlock] ?? 99) - (BLOCK_ORDER[b.timeBlock] ?? 99)
  );
}

function extractRecommendedPlaces(itinerary) {
  const rows = Array.isArray(itinerary?.recommendedPlaces)
    ? itinerary.recommendedPlaces
        .map((p, index) => ({
          id: `${p?.name || "place"}-${index}`,
          name: (p?.name || "Recommended Place").trim(),
          reason: (p?.reason || "").trim(),
          category: (p?.category || "").trim(),
          location: (p?.location || "").trim(),
        }))
        .filter((p) => p.location)
    : [];

  return Array.from(
    new Map(rows.map((x) => [x.location.toLowerCase(), x])).values()
  );
}

function countDayActivities(day) {
  return (
    (Array.isArray(day?.morning) ? day.morning.length : 0) +
    (Array.isArray(day?.afternoon) ? day.afternoon.length : 0) +
    (Array.isArray(day?.evening) ? day.evening.length : 0)
  );
}

function getDayEstimatedHours(day) {
  const activities = [
    ...(Array.isArray(day?.morning) ? day.morning : []),
    ...(Array.isArray(day?.afternoon) ? day.afternoon : []),
    ...(Array.isArray(day?.evening) ? day.evening : []),
  ];

  return activities.reduce((sum, activity) => {
    const n = Number(activity?.durationHours);
    return Number.isFinite(n) && n > 0 ? sum + n : sum;
  }, 0);
}

function formatHours(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (Number.isInteger(value)) return `${value}h`;
  return `${value.toFixed(1)}h`;
}

function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));

    (async () => {
      try {
        const data = await fn();
        if (alive) setState({ data, loading: false, error: "" });
      } catch (e) {
        if (alive) {
          setState({
            data: null,
            loading: false,
            error: e?.response?.data?.message || e?.message || "Something went wrong",
          });
        }
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

function useGeoPoints(locations) {
  return useAsync(async () => {
    if (!locations.length) return { points: [], failed: [] };

    const normalize = (s) => String(s || "").trim().toLowerCase();
    const includesCity = (text, city) =>
      normalize(text).includes(normalize(city));

    const queries = locations.map((p) => p.location);
    const { data: geo } = await api.post("/geocode/batch", { queries });

    const results = Array.isArray(geo?.results) ? geo.results : [];
    const byQuery = new Map(results.map((r) => [normalize(r.query), r]));

    const points = [];
    const failed = [];

    async function retrySingle(forcedQuery) {
      const { data } = await api.post("/geocode/batch", { queries: [forcedQuery] });
      const r = Array.isArray(data?.results) ? data.results[0] : null;
      return r && Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lon))
        ? r
        : null;
    }

    for (const p of locations) {
      const q = p.location.trim();
      const qNorm = normalize(q);

      let hit = byQuery.get(qNorm) || null;

      const hitLat = Number(hit?.lat);
      const hitLon = Number(hit?.lon);

      const wantsParis = qNorm.includes("paris");
      const hitName = hit?.display_name || "";

      const looksWrongCity = wantsParis && hit && !includesCity(hitName, "paris");

      if (!Number.isFinite(hitLat) || !Number.isFinite(hitLon) || looksWrongCity) {
        const forced = wantsParis
          ? `${q.replace(/,?\s*paris.*$/i, "")}, Paris, Île-de-France, France`
          : q;

        const retried = await retrySingle(forced);

        if (retried) {
          hit = retried;
        } else {
          failed.push({
            q,
            reason: !hit
              ? "No match returned"
              : looksWrongCity
              ? "Matched wrong city (retry failed)"
              : "No lat/lon returned",
          });
          continue;
        }
      }

      const lat = Number(hit?.lat);
      const lon = Number(hit?.lon);

      try {
        const { data: detail } = await api.get("/geocode/place-details", {
          params: { lat, lon, q },
        });

        points.push({
          ...p,
          lat,
          lon,
          photoUrl: detail?.photoUrl ?? null,
          displayName: detail?.display_name ?? hit?.display_name ?? null,
          category: p?.category || detail?.category || null,
          type: detail?.type ?? null,
          address: detail?.address ?? null,
          wikipedia: detail?.wikipedia ?? null,
        });
      } catch {
        points.push({
          ...p,
          lat,
          lon,
          displayName: hit?.display_name ?? null,
        });
      }
    }

    return { points, failed };
  }, [locations]);
}

function useDestinationWeather(destination, fallbackPoint) {
  return useAsync(async () => {
    if (!destination && !fallbackPoint) return null;

    let lat = Number(fallbackPoint?.lat);
    let lon = Number(fallbackPoint?.lon);
    let resolvedName = destination || fallbackPoint?.displayName || "";

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      const { data } = await api.post("/geocode/batch", {
        queries: [destination],
      });

      const first = Array.isArray(data?.results) ? data.results[0] : null;
      lat = Number(first?.lat);
      lon = Number(first?.lon);
      resolvedName = first?.display_name || resolvedName;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error("Could not find destination weather coordinates.");
    }

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
      `&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&forecast_days=7&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to load weather.");
    }

    const weather = await res.json();

    return {
      name: resolvedName || destination,
      lat,
      lon,
      current: weather?.current ?? null,
      daily: weather?.daily ?? null,
    };
  }, [destination, fallbackPoint?.lat, fallbackPoint?.lon, fallbackPoint?.displayName]);
}

function weatherCodeToLabel(code) {
  const map = {
    0: "Clear sky",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail",
  };

  return map[code] || "Weather update";
}

function weatherCodeToEmoji(code) {
  if (code === 0) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌍";
}

function dayName(dateStr) {
  if (!dateStr) return "Day";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function ViewTrip() {
  const nav = useNavigate();
  const { id } = useParams();

  const tripState = useAsync(async () => (await api.get(`/trips/${id}`)).data, [id]);
  const trip = tripState.data;
  const summary = trip?.itinerary?.tripSummary || {};
  const tripMode = normalizeTripMode(trip?.tripMode);
  const destinations = getTripDestinations(trip);
  const primaryDestination = destinations[0] || trip?.destination || "";

  const pdfRef = useRef(null);

  const [openDays, setOpenDays] = useState({});

  useEffect(() => {
    if (!trip?.itinerary?.days?.length) return;
    const next = {};
    trip.itinerary.days.forEach((day, index) => {
      next[day.day] = index === 0;
    });
    setOpenDays(next);
  }, [trip]);

  const toggleDay = (dayNumber) => {
    setOpenDays((prev) => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }));
  };

  const openAllDays = () => {
    const next = {};
    (trip?.itinerary?.days || []).forEach((day) => {
      next[day.day] = true;
    });
    setOpenDays(next);
  };

  const collapseAllDays = () => {
    const next = {};
    (trip?.itinerary?.days || []).forEach((day) => {
      next[day.day] = false;
    });
    setOpenDays(next);
  };

const downloadPDF = async () => {
  try {
    const res = await api.get(`/trips/${id}/pdf`, { responseType: "blob" });

    const contentType = res?.headers?.["content-type"] || "";
    if (!contentType.includes("pdf")) {
      throw new Error("Invalid PDF response");
    }

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    const safeName = (trip?.destination || "planner")
      .toString()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-${safeName || "planner"}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download PDF error:", err);
  }
};

  const locations = useMemo(() => extractUniqueLocations(trip?.itinerary), [trip]);
  const recommendedPlaces = useMemo(
    () => extractRecommendedPlaces(trip?.itinerary),
    [trip]
  );

  const examples = useMemo(() => locations.slice(0, 3).map((x) => x.location), [locations]);

  const geoState = useGeoPoints(locations);
  const mapPoints = geoState.data?.points ?? [];
  const geoFailed = geoState.data?.failed ?? [];

  const recommendedGeoState = useGeoPoints(recommendedPlaces);
  const recommendedPoints = recommendedGeoState.data?.points ?? [];

  const weatherState = useDestinationWeather(primaryDestination, mapPoints[0]);

  const totalActivities = useMemo(() => {
    return (trip?.itinerary?.days || []).reduce((sum, day) => sum + countDayActivities(day), 0);
  }, [trip]);

  const totalHours = useMemo(() => {
    return (trip?.itinerary?.days || []).reduce((sum, day) => sum + getDayEstimatedHours(day), 0);
  }, [trip]);

  if (tripState.loading) return <TripSkeleton />;

  if (tripState.error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert type="error">{tripState.error}</Alert>
        <div className="flex gap-2">
          <Button onClick={() => nav("/trips")} variant="secondary">
            Back
          </Button>
          <Button onClick={() => nav("/create")} variant="ghost">
            Create New
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div ref={pdfRef} className="space-y-6">
        <Header
          trip={trip}
          summary={summary}
          tripMode={tripMode}
          destinations={destinations}
          onBack={() => nav("/trips")}
          onNew={() => nav("/create")}
          onEdit={() => nav(`/trip/${id}/edit`)}
          onDownload={downloadPDF}
        />

        <TripOverview
          trip={trip}
          summary={summary}
          tripMode={tripMode}
          destinations={destinations}
          totalActivities={totalActivities}
          totalHours={totalHours}
        />

        <CityPlanSection summary={summary} tripMode={tripMode} destinations={destinations} />

        <WeatherSection
          state={weatherState}
          destination={primaryDestination}
          tripMode={tripMode}
        />

        <EventsSection events={trip?.events || []} />

        {!!trip?.itinerary?.days?.length && (
          <DayNavigator
            days={trip.itinerary.days}
            openAll={openAllDays}
            collapseAll={collapseAllDays}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {trip?.itinerary?.days?.map((d) => (
            <DayCard
              key={d.day}
              day={d}
              isOpen={Boolean(openDays[d.day])}
              onToggle={() => toggleDay(d.day)}
            />
          ))}
        </div>

        {!!trip?.itinerary?.tips?.length && (
          <Card className="overflow-hidden">
            <CardHeader
              title="Trip Tips"
              subtitle="Helpful reminders for a smoother travel experience"
            />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                {trip.itinerary.tips.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {!!trip?.itinerary?.recommendedPlaces?.length && (
          <RecommendedPlacesSection
            places={trip.itinerary.recommendedPlaces}
            enrichedPlaces={recommendedPoints}
            loading={recommendedGeoState.loading}
            error={recommendedGeoState.error}
          />
        )}
      </div>

      <Card className="relative z-0 overflow-hidden">
        <CardHeader
          title="Destination Map"
          subtitle={
            tripMode === "multi"
              ? "Places and route across your multi-city itinerary"
              : "Places and route from your itinerary"
          }
        />

        <CardBody className="space-y-4">
          {geoState.error ? <Alert type="error">{geoState.error}</Alert> : null}

          {geoState.loading ? (
            <MapSkeleton />
          ) : locations.length === 0 ? (
            <NiceEmptyState
              title="No map locations found"
              subtitle="This saved itinerary doesn’t include activity location fields."
              action={
                <Button onClick={() => nav("/create")} variant="secondary">
                  Create a new trip
                </Button>
              }
            />
          ) : mapPoints.length === 0 ? (
            <NiceEmptyState
              title="We couldn’t geocode your locations"
              subtitle={
                <>
                  Found <b>{locations.length}</b> location strings, but got <b>0</b>{" "}
                  coordinates back.
                </>
              }
              hint={
                <div className="space-y-2">
                  <div className="break-words text-xs text-slate-500">
                    Example queries: {examples.join(" | ")}
                  </div>
                  {geoFailed.length ? (
                    <div className="break-words text-xs text-slate-500">
                      Failed examples:{" "}
                      {geoFailed
                        .slice(0, 3)
                        .map((x) => `${x.q} (${x.reason})`)
                        .join(" | ")}
                    </div>
                  ) : null}
                </div>
              }
              action={
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => window.location.reload()} variant="secondary">
                    Retry
                  </Button>
                  <Button onClick={() => nav("/create")} variant="ghost">
                    Create New
                  </Button>
                </div>
              }
            />
          ) : (
            <>
              <div className="relative z-0 overflow-hidden rounded-3xl border border-slate-200">
                <TripRouteMap points={mapPoints} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div>
                  Showing <b>{mapPoints.length}</b> pinned places
                  {mapPoints.length > 1 ? " with route" : ""}.
                </div>
                <div>
                  Total requested: <b>{locations.length}</b>
                  {geoFailed.length ? (
                    <>
                      {" "}• Failed: <b>{geoFailed.length}</b>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {mapPoints.length > 0 && <PlacesGallery points={mapPoints} />}
    </div>
  );
}

function Header({ trip, summary, tripMode, destinations, onBack, onNew, onEdit, onDownload }) {
  return (
    <Card className="relative z-50 isolate overflow-hidden">
      <div className="pointer-events-auto relative z-50 bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 text-white">
        <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
              {tripMode === "multi" ? "Your Multi-City Trip" : "Your Trip"}
            </div>

            <div className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {trip?.destination || "Trip"}
            </div>

            <div className="mt-2 text-sm text-white/85">
              {fmtRange(trip?.startDate, trip?.endDate)}
            </div>

            {tripMode === "multi" && destinations.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {destinations.map((city) => (
                  <span
                    key={city}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                  >
                    {city}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {summary.days ? (
              <Badge className="border-white/20 bg-white/10 text-white">
                {summary.days} days
              </Badge>
            ) : null}

            {tripMode === "multi" ? (
              <Badge className="border-white/20 bg-white/10 text-white">
                {destinations.length} cities
              </Badge>
            ) : null}

            {summary.style ? (
              <Badge className="border-white/20 bg-white/10 text-white">
                pace: {summary.style}
              </Badge>
            ) : null}

            {summary.budget ? (
              <Badge className="border-white/20 bg-white/10 text-white">
                budget: {summary.budget}
              </Badge>
            ) : null}

            {!!trip?.events?.length ? (
              <Badge className="border-white/20 bg-white/10 text-white">
                {trip.events.length} events
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-6 pb-6">
          <Button type="button" onClick={onBack} variant="secondary">
            Back to My Trips
          </Button>

          <Button
            type="button"
            onClick={onEdit}
            variant="secondary"
            className="bg-white/15 text-white hover:bg-white/20"
          >
            Edit Trip
          </Button>

          <Button
            type="button"
            onClick={onNew}
            variant="ghost"
            className="bg-white/10 text-white hover:bg-white/15"
          >
            Create New
          </Button>

          <Button
            type="button"
            className="pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDownload?.();
            }}
          >
            Download PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TripOverview({ trip, summary, tripMode, destinations, totalActivities, totalHours }) {
  const preferences = trip?.preferences || {};
  const interests = Array.isArray(preferences?.interests) ? preferences.interests : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Trip Overview"
        subtitle="A quick summary of the trip settings and preferences"
      />
      <CardBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile
            label={tripMode === "multi" ? "Trip mode" : "Destination"}
            value={tripMode === "multi" ? "Multi-city" : trip?.destination || "—"}
          />
          <InfoTile label="Dates" value={fmtRange(trip?.startDate, trip?.endDate) || "—"} />
          <InfoTile label="Pace" value={summary?.style || preferences?.pace || "—"} />
          <InfoTile label="Budget" value={summary?.budget || preferences?.budget || "—"} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoTile label="Activities" value={totalActivities || "0"} />
          <InfoTile label="Estimated Hours" value={formatHours(totalHours)} />
          <InfoTile label="Events" value={trip?.events?.length || "0"} />
          <InfoTile label="Map Places" value={extractUniqueLocations(trip?.itinerary).length || "0"} />
        </div>

        {tripMode === "multi" && destinations.length > 1 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Cities in this trip
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {destinations.map((city) => (
                <span
                  key={city}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {!!interests.length && (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Interests
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {preferences?.notes ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Notes
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-700">{preferences.notes}</div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

function CityPlanSection({ summary, tripMode, destinations }) {
  const cityPlan = Array.isArray(summary?.cityPlan) ? summary.cityPlan : [];

  if (tripMode !== "multi" || !destinations.length) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="City Plan"
        subtitle="How your days are distributed across the cities in this trip"
        right={<Badge>{destinations.length} cities</Badge>}
      />
      <CardBody>
        {cityPlan.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cityPlan.map((segment, index) => (
              <div
                key={`${segment.city}-${index}`}
                className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  City {index + 1}
                </div>
                <div className="mt-1 text-base font-bold text-slate-900">
                  {segment.city}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {segment.days} day{segment.days > 1 ? "s" : ""}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {fmtRange(segment.startDate, segment.endDate)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            This is a multi-city trip with {destinations.length} cities.
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function DayNavigator({ days, openAll, collapseAll }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Jump to a Day"
        subtitle="Quick navigation for longer itineraries"
        right={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={openAll}>
              Expand all
            </Button>
            <Button type="button" variant="ghost" className="px-3 py-2 text-xs" onClick={collapseAll}>
              Collapse all
            </Button>
          </div>
        }
      />

    </Card>
  );
}

function EventsSection({ events }) {
  if (!events?.length) return null;

  const grouped = events.reduce((acc, event) => {
    const key = event?.date || "Unknown date";
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const orderedDates = Object.keys(grouped).sort();

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Events During Your Trip"
        subtitle="Local events, parties, concerts, and activities matching your trip dates"
        right={<Badge>{events.length} events</Badge>}
      />
      <CardBody className="space-y-5">
        {orderedDates.map((dateKey) => (
          <div key={dateKey}>
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              {dateKey}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {grouped[dateKey].map((event, i) => (
                <div
                  key={`${event.name}-${event.date}-${i}`}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-bold text-slate-900">
                      {event.name || "Event"}
                    </div>

                    {event.category ? (
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                        {event.category}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    {event.time || "Time not specified"}
                  </div>

                  {event.location ? (
                    <div className="mt-2 text-sm font-medium text-slate-700">
                      {event.location}
                    </div>
                  ) : null}

                  {event.description ? (
                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      {event.description}
                    </div>
                  ) : null}

                  {(event.source || event.link) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {event.source ? (
                        <span className="text-xs text-slate-500">
                          {event.source}
                        </span>
                      ) : null}

                      {event.link ? (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                        >
                          View event
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function WeatherSection({ state, destination, tripMode }) {
  if (state.loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader
          title="Weather Preview"
          subtitle={`Checking current conditions for ${destination || "your destination"}`}
        />
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="h-36 animate-pulse rounded-3xl bg-slate-100" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (state.error || !state.data?.current) {
    return null;
  }

  const current = state.data.current;
  const daily = state.data.daily || {};
  const days = Array.isArray(daily?.time)
    ? daily.time.map((date, i) => ({
        date,
        weatherCode: daily?.weather_code?.[i],
        max: daily?.temperature_2m_max?.[i],
        min: daily?.temperature_2m_min?.[i],
        rainChance: daily?.precipitation_probability_max?.[i],
      }))
    : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Weather Preview"
        subtitle={
          tripMode === "multi"
            ? `Current forecast for your first city: ${state.data?.name || destination || "destination"}`
            : `Current forecast for ${state.data?.name || destination || "your destination"}`
        }
        right={
          <Badge className="border-sky-200 bg-sky-50 text-sky-700">
            Live weather
          </Badge>
        }
      />
      <CardBody className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-500">
                  Right now
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="text-4xl">{weatherCodeToEmoji(current.weather_code)}</div>
                  <div>
                    <div className="text-3xl font-black tracking-tight text-slate-900">
                      {Math.round(current.temperature_2m)}°C
                    </div>
                    <div className="text-sm text-slate-600">
                      {weatherCodeToLabel(current.weather_code)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:min-w-[220px] sm:grid-cols-2">
                <MetricTile
                  label="Feels like"
                  value={`${Math.round(current.apparent_temperature)}°C`}
                />
                <MetricTile
                  label="Wind"
                  value={`${Math.round(current.wind_speed_10m)} km/h`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {days.slice(0, 7).map((item, i) => (
              <div
                key={`${item.date}-${i}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {i === 0 ? "Today" : dayName(item.date)}
                </div>
                <div className="mt-2 text-2xl">{weatherCodeToEmoji(item.weatherCode)}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {weatherCodeToLabel(item.weatherCode)}
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  {Math.round(item.max)}° / {Math.round(item.min)}°
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Rain: {Number.isFinite(item.rainChance) ? `${item.rainChance}%` : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function RecommendedPlacesSection({ places, enrichedPlaces, loading, error }) {
  const displayedPlaces =
    enrichedPlaces.length > 0
      ? enrichedPlaces
      : places.map((p, index) => ({
          id: `${p?.name || "place"}-${index}`,
          name: p?.name || "Recommended Place",
          reason: p?.reason || "",
          category: p?.category || "",
          location: p?.location || "",
        }));

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Recommended Places & Attractions"
        subtitle="Extra ideas, nearby highlights, and must-visit spots for this destination"
        right={<Badge>{displayedPlaces.length} picks</Badge>}
      />
      <CardBody className="space-y-4">
        {error ? <Alert type="error">{error}</Alert> : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                <div className="h-44 animate-pulse bg-slate-100" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayedPlaces.map((place, i) => (
              <div
                key={place.id || `${place.location}-${i}`}
                className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  {place.photoUrl ? (
                    <img
                      src={place.photoUrl}
                      alt={place.name || place.location}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No photo available
                    </div>
                  )}

                  {place.category ? (
                    <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
                      {place.category}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {place.name || place.title || place.location}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {place.displayName || place.location}
                    </div>
                  </div>

                  {place.reason ? (
                    <div className="text-sm leading-6 text-slate-600">{place.reason}</div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {place.type ? (
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                        {place.type}
                      </span>
                    ) : null}
                    {place.category ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {place.category}
                      </span>
                    ) : null}
                  </div>

                  {place.address ? (
                    <div className="text-xs leading-5 text-slate-500">{place.address}</div>
                  ) : null}

                  {place.wikipedia ? (
                    <a
                      href={place.wikipedia}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-xs font-semibold text-sky-700 hover:text-sky-800"
                    >
                      Learn more
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function PlacesGallery({ points }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Places from your itinerary"
        subtitle="Photos and details for the locations in your saved trip"
        right={<Badge>{points.length} places</Badge>}
      />
      <CardBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {points.map((place, i) => (
            <div
              key={`${place.location}-${i}`}
              className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                {place.photoUrl ? (
                  <img
                    src={place.photoUrl}
                    alt={place.title || place.location}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No photo available
                  </div>
                )}

                <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
                  Day {place.day} • {place.timeBlock}
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {place.title || place.location}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {place.displayName || place.location}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {place.durationHours ? (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
                      {formatHours(Number(place.durationHours))}
                    </span>
                  ) : null}

                  {place.category ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {place.category}
                    </span>
                  ) : null}

                  {place.type ? (
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                      {place.type}
                    </span>
                  ) : null}
                </div>

                {place.notes ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    {place.notes}
                  </div>
                ) : null}

                {place.address ? (
                  <div className="text-xs leading-5 text-slate-500">{place.address}</div>
                ) : null}

                {place.wikipedia ? (
                  <a
                    href={place.wikipedia}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-xs font-semibold text-sky-700 hover:text-sky-800"
                  >
                    Learn more
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function DayCard({ day, isOpen, onToggle }) {
  const activityCount = countDayActivities(day);
  const totalHours = getDayEstimatedHours(day);

  return (
    <Card id={`day-${day.day}`} className="overflow-hidden scroll-mt-28">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/75">
              Day {day.day}
            </div>
            <div className="mt-1 text-xl font-black leading-snug">{day.title}</div>
            <div className="mt-1 text-sm text-white/80">{day.date}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-white">
              {activityCount} activities
            </Badge>
            <Badge className="border-white/20 bg-white/10 text-white">
              {formatHours(totalHours)}
            </Badge>
            <Button
              type="button"
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/20"
              onClick={onToggle}
            >
              {isOpen ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </div>

      {isOpen ? (
        <CardBody>
          <MiniSection title="Morning" items={day.morning} icon="☀️" />
          <MiniSection title="Afternoon" items={day.afternoon} icon="🌤️" />
          <MiniSection title="Evening" items={day.evening} icon="🌙" />

          {(day.foodSuggestion || day.backupPlan) && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {day.foodSuggestion ? (
                <InfoTile label="Food Suggestion" value={clamp(day.foodSuggestion)} />
              ) : null}
              {day.backupPlan ? (
                <InfoTile label="Backup Plan" value={clamp(day.backupPlan)} />
              ) : null}
            </div>
          )}
        </CardBody>
      ) : null}
    </Card>
  );
}

function TripSkeleton() {
  return (
    <div className="mx-auto max-w-5xl">
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-5 h-28 animate-pulse rounded-2xl bg-slate-100" />
        </CardBody>
      </Card>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">Finding locations…</div>
          <div className="mt-1 text-xs text-slate-500">
            Converting place names into coordinates.
          </div>
        </div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 h-48 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

function NiceEmptyState({ title, subtitle, hint, action }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50">
          <div className="h-4 w-4 rounded bg-sky-300" />
        </div>

        <div className="flex-1">
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
          {hint ? <div className="mt-3 text-xs leading-relaxed text-slate-500">{hint}</div> : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm leading-relaxed text-slate-800">{value}</div>
    </div>
  );
}

function MiniSection({ title, items, icon }) {
  if (!items?.length) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <span className="text-sm normal-case">{icon}</span>
          {title}
        </div>
        <div className="text-[11px] text-slate-500">
          {items.length} item{items.length > 1 ? "s" : ""}
        </div>
      </div>

      <ul className="mt-2 space-y-2 text-sm text-slate-800">
        {items.map((x, i) => (
          <li
            key={x.id ?? `${x.title}-${x.location}-${i}`}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 transition hover:border-sky-200 hover:bg-sky-50/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">{x.title}</div>

                {x.location ? (
                  <div className="mt-0.5 text-xs text-slate-500">{x.location}</div>
                ) : null}

                {x.notes ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    {x.notes}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {x.durationHours ? (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">
                    {formatHours(Number(x.durationHours))}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}