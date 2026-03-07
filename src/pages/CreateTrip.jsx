import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
} from "../components/UI.jsx";
import MapTilerMap from "../components/MapTilerMap.jsx";

const interestOptions = [
  "history",
  "food",
  "culture",
  "nature",
  "shopping",
  "nightlife",
  "family",
];

const eventTypeOptions = [
  "festival",
  "concert",
  "culture",
  "nightlife",
  "food",
  "family",
  "sports",
];

function toISODateLocal(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayISOPlus(days = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toISODateLocal(d);
}

function addDays(isoDate, days) {
  if (!isoDate) return todayISOPlus(days);
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return todayISOPlus(days);
  d.setDate(d.getDate() + days);
  return toISODateLocal(d);
}

function clampToToday(isoDate) {
  const today = todayISOPlus(0);
  if (!isoDate) return today;
  return isoDate < today ? today : isoDate;
}

function parseCities(text) {
  return String(text || "")
    .split("\n")
    .map((city) => city.trim())
    .filter(Boolean);
}

function formatTravelersLabel(value) {
  if (!value) return "Not specified";
  return `${value} traveler${value === "1" ? "" : "s"}`;
}

function normalizeSourceTab(tab) {
  if (!tab) return "";
  if (["Flights", "Hotels", "Stays", "Activities"].includes(tab)) return tab;
  return "";
}

function getTripEnergy(pace, budget) {
  if (pace === "packed" && budget === "high") {
    return "Fast, premium, and full of highlights";
  }
  if (pace === "packed") return "Busy days with maximum exploration";
  if (pace === "relaxed" && budget === "high") {
    return "Comfort-first with a luxury feel";
  }
  if (pace === "relaxed") return "Easy rhythm, less rush, more breathing room";
  return "Balanced flow with smart daily pacing";
}

export default function CreateTrip() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const destinationParam = searchParams.get("destination") || "";
  const startDateParam = searchParams.get("startDate") || "";
  const endDateParam = searchParams.get("endDate") || "";
  const travelersParam = searchParams.get("travelers") || "";
  const sourceTabParam = normalizeSourceTab(searchParams.get("sourceTab") || "");
  const tripTypeParam = searchParams.get("tripType") || "";
  const fromParam = searchParams.get("from") || "";

  const safeInitialStart = clampToToday(startDateParam || todayISOPlus(0));
  const safeInitialEnd =
    endDateParam && endDateParam > safeInitialStart
      ? endDateParam
      : addDays(safeInitialStart, 1);

  const [tripMode, setTripMode] = useState("single");
  const [destination, setDestination] = useState(destinationParam);
  const [multiCities, setMultiCities] = useState("");
  const [startDate, setStartDate] = useState(safeInitialStart);
  const [endDate, setEndDate] = useState(safeInitialEnd);
  const [pace, setPace] = useState("moderate");
  const [budget, setBudget] = useState("mid");
  const [interests, setInterests] = useState([]);
  const [notes, setNotes] = useState("");
  const [includeEvents, setIncludeEvents] = useState(true);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const travelers = travelersParam;
  const sourceTab = sourceTabParam;
  const tripType = tripTypeParam;
  const from = fromParam;

  useEffect(() => {
    const nextStart = clampToToday(startDateParam || todayISOPlus(0));
    const nextEnd =
      endDateParam && endDateParam > nextStart
        ? endDateParam
        : addDays(nextStart, 1);

    setDestination(destinationParam || "");
    setStartDate(nextStart);
    setEndDate(nextEnd);

    if (sourceTab === "Activities") {
      setInterests((prev) => {
        const next = new Set(prev);
        next.add("culture");

        if (tripType === "food") next.add("food");
        if (tripType === "nature") next.add("nature");
        if (tripType === "highlights") next.add("history");

        return [...next];
      });
    }

    if (sourceTab === "Hotels" || sourceTab === "Stays") {
      setPace("relaxed");

      if (tripType === "suite") {
        setBudget("high");
      } else if (tripType === "apartment") {
        setBudget("mid");
      }
    }

    if (sourceTab === "Flights") {
      if (tripType === "multi") {
        setPace("packed");
      } else if (tripType === "oneway") {
        setPace("moderate");
      }
    }
  }, [destinationParam, startDateParam, endDateParam, sourceTab, tripType]);

  const minStartDate = todayISOPlus(0);
  const minEndDate = useMemo(() => addDays(startDate || minStartDate, 1), [startDate]);

  const parsedCities = useMemo(() => parseCities(multiCities), [multiCities]);

  const daysCount = useMemo(() => {
    const s = new Date(`${startDate}T12:00:00`);
    const e = new Date(`${endDate}T12:00:00`);

    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s >= e) {
      return null;
    }

    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const tripEnergy = useMemo(() => getTripEnergy(pace, budget), [pace, budget]);

  const previewTitle = useMemo(() => {
    if (tripMode === "multi") {
      return parsedCities.length ? parsedCities.join(" → ") : "Your cities";
    }
    return destination || "Your destination";
  }, [tripMode, parsedCities, destination]);

  const mapQuery = useMemo(() => {
    if (tripMode === "multi") return parsedCities[0] || "";
    return destination;
  }, [tripMode, parsedCities, destination]);

  const formSummary = useMemo(() => {
    if (tripMode === "single" && !destination.trim()) {
      return "Start by choosing where you want to go.";
    }

    if (tripMode === "multi" && parsedCities.length === 0) {
      return "Add the cities you want to visit, one city per line.";
    }

    const target =
      tripMode === "multi"
        ? parsedCities.join(" → ")
        : destination.trim();

    let summary = `A ${pace} ${daysCount || ""}-day trip to ${target}`;
    if (budget) summary += ` with a ${budget} budget`;
    if (travelers) summary += ` for ${formatTravelersLabel(travelers).toLowerCase()}`;
    if (includeEvents) summary += " including local events";
    return summary;
  }, [tripMode, destination, parsedCities, pace, daysCount, budget, travelers, includeEvents]);

  function toggleInterest(x) {
    setInterests((prev) =>
      prev.includes(x) ? prev.filter((i) => i !== x) : [...prev, x]
    );
  }

  function toggleEventType(x) {
    setEventTypes((prev) =>
      prev.includes(x) ? prev.filter((i) => i !== x) : [...prev, x]
    );
  }

  function handleStartDateChange(value) {
    const safeStart = clampToToday(value || todayISOPlus(0));
    setStartDate(safeStart);
    setEndDate(addDays(safeStart, 1));
  }

  function handleEndDateChange(value) {
    if (!value) {
      setEndDate(addDays(startDate, 1));
      return;
    }

    if (value <= startDate) {
      setEndDate(addDays(startDate, 1));
      return;
    }

    setEndDate(value);
  }

  function resetForm() {
    const nextStart = clampToToday(startDateParam || todayISOPlus(0));
    setTripMode("single");
    setDestination(destinationParam || "");
    setMultiCities("");
    setStartDate(nextStart);
    setEndDate(addDays(nextStart, 1));
    setPace("moderate");
    setBudget("mid");
    setInterests([]);
    setNotes("");
    setIncludeEvents(true);
    setEventTypes([]);
    setErr("");
  }

  async function generate(e) {
    e.preventDefault();
    setErr("");

    const cleanDestination = destination.trim();
    const cleanNotes = notes.trim();
    const cities = parsedCities;

    if (tripMode === "single" && !cleanDestination) {
      setErr("Please enter a destination.");
      return;
    }

    if (tripMode === "multi" && cities.length < 2) {
      setErr("Please enter at least 2 cities for a multi-city trip.");
      return;
    }

    if (!daysCount) {
      setErr("Please select valid dates.");
      return;
    }

    if (daysCount > 30) {
      setErr("Please choose a trip length of 30 days or less.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        tripMode,
        destination: tripMode === "single" ? cleanDestination : cities.join(" → "),
        destinations: tripMode === "multi" ? cities : [cleanDestination],
        startDate,
        endDate,
        preferences: {
          pace,
          budget,
          interests,
          notes: cleanNotes,
          travelers,
          sourceTab,
          tripType,
          from,
          includeEvents,
          eventTypes,
        },
      };

      const { data: trip } = await api.post("/trips/generate-and-save", payload);
      nav(`/trip/${trip._id}`);
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          "Generate failed. Please log in and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.25)]">
        <div className="relative overflow-hidden bg-linear-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 text-white sm:p-8">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="border-white/20 bg-white/10 text-white">
                AI Trip Builder
              </Badge>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Create your next trip in minutes
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/90 sm:text-base">
                Choose your destination, dates, pace, budget, and interests — then let AI
                generate a polished itinerary you can save and explore.
              </p>

              <div className="mt-4 text-sm text-white/85">{formSummary}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/20 bg-white/10 text-white">
                {tripMode === "multi" ? "Multi city" : "One city"}
              </Badge>

              {daysCount ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  {daysCount} days
                </Badge>
              ) : (
                <Badge className="border-white/20 bg-white/10 text-white">
                  Invalid dates
                </Badge>
              )}

              {tripMode === "multi" && parsedCities.length ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  {parsedCities.length} cities
                </Badge>
              ) : null}

              {travelers ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  {formatTravelersLabel(travelers)}
                </Badge>
              ) : null}

              {sourceTab ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  From {sourceTab}
                </Badge>
              ) : null}

              {tripType ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  {tripType}
                </Badge>
              ) : null}

              {includeEvents ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  Events on
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader
              title="Trip details"
              subtitle="Fill in the essentials for your itinerary"
              right={daysCount ? <Badge>{daysCount} days</Badge> : <Badge>Check dates</Badge>}
            />

            <CardBody>
              <form onSubmit={generate} className="space-y-5">
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-700">Trip mode</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTripMode("single")}
                      className={[
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        tripMode === "single"
                          ? "border-sky-600 bg-sky-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      One city
                    </button>

                    <button
                      type="button"
                      onClick={() => setTripMode("multi")}
                      className={[
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        tripMode === "multi"
                          ? "border-sky-600 bg-sky-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Multi city
                    </button>
                  </div>
                </div>

                {tripMode === "single" ? (
                  <Input
                    label="Destination"
                    placeholder="e.g., Paris, France"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                ) : (
                  <label className="block">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                      <span>Cities</span>
                      <span className="text-xs font-medium text-slate-400">
                        {parsedCities.length} selected
                      </span>
                    </div>

                    <textarea
                      value={multiCities}
                      onChange={(e) => setMultiCities(e.target.value)}
                      placeholder={`Paris, France\nRome, Italy\nBarcelona, Spain`}
                      className="min-h-30 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                    />

                    <div className="mt-2 text-xs text-slate-500">
                      Enter one city per line. The itinerary will include all listed cities.
                    </div>
                  </label>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Input
                      label="Start date"
                      type="date"
                      value={startDate}
                      min={minStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <Input
                      label="End date"
                      type="date"
                      value={endDate}
                      min={minEndDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Select label="Pace" value={pace} onChange={(e) => setPace(e.target.value)}>
                    <option value="relaxed">relaxed</option>
                    <option value="moderate">moderate</option>
                    <option value="packed">packed</option>
                  </Select>

                  <Select label="Budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
                    <option value="low">low</option>
                    <option value="mid">mid</option>
                    <option value="high">high</option>
                  </Select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-700">Interests</div>
                    <div className="text-xs text-slate-500">{interests.length} selected</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((x) => {
                      const active = interests.includes(x);

                      return (
                        <button
                          type="button"
                          key={x}
                          onClick={() => toggleInterest(x)}
                          className={[
                            "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition",
                            active
                              ? "border-sky-600 bg-sky-600 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {x}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        Events during your trip
                      </div>
                      <div className="text-xs text-slate-500">
                        Discover local festivals, parties, concerts, and more on your selected dates.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIncludeEvents((prev) => !prev)}
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                        includeEvents
                          ? "bg-sky-600 text-white"
                          : "bg-slate-200 text-slate-700",
                      ].join(" ")}
                    >
                      {includeEvents ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {includeEvents ? (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Event types
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {eventTypeOptions.map((x) => {
                          const active = eventTypes.includes(x);

                          return (
                            <button
                              type="button"
                              key={x}
                              onClick={() => toggleEventType(x)}
                              className={[
                                "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition",
                                active
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              {x}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <label className="block">
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                    <span>Notes (optional)</span>
                    <span className="text-xs font-medium text-slate-400">
                      {notes.length}/300
                    </span>
                  </div>

                  <textarea
                    value={notes}
                    maxLength={300}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., we like walking, cafes, local food, not too early, family-friendly..."
                    className="min-h-30 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  />
                </label>

                {err ? <Alert type="error">{err}</Alert> : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Generating..." : "Generate & Save"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => nav("/trips")}
                  >
                    View My Trips
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={resetForm}
                  >
                    Reset Form
                  </Button>
                </div>

                <div className="text-xs text-slate-500">
                  Generates an AI itinerary and saves it directly to your account.
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <Card className="overflow-hidden">
            <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
              <div className="text-sm font-semibold uppercase tracking-wide text-white/75">
                Live Preview
              </div>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-2xl font-black">{previewTitle}</div>
                  <div className="mt-2 text-sm text-white/85">
                    {startDate} → {endDate} • pace: {pace} • budget: {budget}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                    {daysCount ? `${daysCount} days` : "Invalid dates"}
                  </span>

                  {tripMode === "multi" && parsedCities.length ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                      {parsedCities.length} cities
                    </span>
                  ) : null}

                  {travelers ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                      {formatTravelersLabel(travelers)}
                    </span>
                  ) : null}

                  {includeEvents ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                      local events
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(interests.length ? interests : ["custom trip"]).slice(0, 6).map((x) => (
                  <span
                    key={x}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold capitalize"
                  >
                    {x}
                  </span>
                ))}

                {includeEvents &&
                  eventTypes.slice(0, 4).map((x) => (
                    <span
                      key={`event-${x}`}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold capitalize"
                    >
                      {x}
                    </span>
                  ))}
              </div>
            </div>

            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <PreviewCard title="Day structure" text="Morning / Afternoon / Evening" />
                <PreviewCard title="Smart pacing" text="Balanced flow based on your trip style" />
                <PreviewCard title="Preferences-aware" text="Interests, notes, and source context included" />
                <PreviewCard title="Saved securely" text="Stored in your account for later access" />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniInfo
                  label={tripMode === "multi" ? "Trip mode" : "Destination"}
                  value={tripMode === "multi" ? "Multi-city" : (destination || "Not selected yet")}
                />
                <MiniInfo label="Pace" value={pace} />
                <MiniInfo label="Budget" value={budget} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniInfo label="Trip energy" value={tripEnergy} />
                <MiniInfo label="Date rule" value="End date stays after start date" />
              </div>

              {tripMode === "multi" && parsedCities.length ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cities in this trip
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedCities.map((city) => (
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

              {(sourceTab || travelers || tripType) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {sourceTab ? <MiniInfo label="Source" value={sourceTab} /> : null}
                  {travelers ? <MiniInfo label="Travelers" value={formatTravelersLabel(travelers)} /> : null}
                  {tripType ? <MiniInfo label="Trip type" value={tripType} /> : null}
                </div>
              )}

              {includeEvents ? (
                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-slate-600">
                  <div className="mb-1 font-semibold text-slate-800">Events enabled</div>
                  Your trip will also try to include local happenings for the selected date range.
                </div>
              ) : null}

              {notes.trim() && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="mb-1 font-semibold text-slate-800">Trip notes</div>
                  {notes.trim()}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                When you click <b>Generate & Save</b>, your itinerary is created and saved immediately.
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Destination map"
              subtitle={
                mapQuery
                  ? `Live location preview for ${mapQuery}`
                  : "Enter a destination to preview it on the map"
              }
            />
            <CardBody className="space-y-4">
              <MapTilerMap query={mapQuery} height={380} />

              <div className="grid gap-3 sm:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {tripMode === "multi"
                    ? "For multi-city trips, the map previews your first city before generation."
                    : "Use the live map to confirm your destination before generating the full itinerary."}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{text}</div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}