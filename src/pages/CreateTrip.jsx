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
import CityAutoComplete from "../components/CityAutoComplete.jsx";

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

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getTravelerSummary(travelers) {
  const adults = Number(travelers.adults || 0);
  const children = Number(travelers.children || 0);
  const infants = Number(travelers.infants || 0);
  const total = adults + children + infants;

  if (!total) return "Not specified";

  const parts = [];
  if (adults) parts.push(`${adults} adult${adults > 1 ? "s" : ""}`);
  if (children) parts.push(`${children} child${children > 1 ? "ren" : ""}`);
  if (infants) parts.push(`${infants} infant${infants > 1 ? "s" : ""}`);

  return parts.join(", ");
}

function getTravelerCount(travelers) {
  return (
    Number(travelers?.adults || 0) +
    Number(travelers?.children || 0) +
    Number(travelers?.infants || 0)
  );
}

function clampTravelerValue(value, min, max) {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function parseTravelersParam(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return { adults: 2, children: 0, infants: 0 };
  }

  if (/^\d+$/.test(raw)) {
    const total = clampTravelerValue(Number(raw), 1, 12);
    return { adults: total, children: 0, infants: 0 };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      adults: clampTravelerValue(parsed?.adults, 1, 12),
      children: clampTravelerValue(parsed?.children, 0, 8),
      infants: clampTravelerValue(parsed?.infants, 0, 6),
    };
  } catch {
    return { adults: 2, children: 0, infants: 0 };
  }
}

function normalizePlace(place) {
  if (!place) return null;

  const placeName = String(place.placeName || place.name || "").trim();
  if (!placeName) return null;

  return {
    id:
      place.id ||
      `${placeName}-${place.center?.[0] || 0}-${place.center?.[1] || 0}`,
    name: place.name || placeName,
    placeName,
    center: Array.isArray(place.center) ? place.center : [],
    country: place.country || "",
    region: place.region || "",
    countryCode: place.countryCode || "",
    flag: place.flag || "🌍",
    type: place.type || "place",
  };
}

export default function CreateTrip() {
    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
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
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [multiCityInput, setMultiCityInput] = useState("");
  const [multiCitySelectedPlace, setMultiCitySelectedPlace] = useState(null);
  const [multiCityPlaces, setMultiCityPlaces] = useState([]);

  const [startDate, setStartDate] = useState(safeInitialStart);
  const [endDate, setEndDate] = useState(safeInitialEnd);
  const [pace, setPace] = useState("moderate");
  const [budget, setBudget] = useState("mid");
  const [interests, setInterests] = useState([]);
  const [notes, setNotes] = useState("");
  const [includeEvents, setIncludeEvents] = useState(true);
  const [eventTypes, setEventTypes] = useState([]);
  const [travelers, setTravelers] = useState(parseTravelersParam(travelersParam));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

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
    setSelectedPlace(null);
    setMultiCityInput("");
    setMultiCitySelectedPlace(null);
    setMultiCityPlaces([]);
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setTravelers(parseTravelersParam(travelersParam));

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
  }, [destinationParam, startDateParam, endDateParam, travelersParam, sourceTab, tripType]);

  const minStartDate = todayISOPlus(0);
  const minEndDate = useMemo(
    () => addDays(startDate || minStartDate, 1),
    [startDate, minStartDate]
  );

  const travelerCount = useMemo(() => getTravelerCount(travelers), [travelers]);
  const travelerSummary = useMemo(() => getTravelerSummary(travelers), [travelers]);

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
      return multiCityPlaces.length
        ? multiCityPlaces.map((city) => city.placeName).join(" → ")
        : "Your cities";
    }
    return destination || "Your destination";
  }, [tripMode, multiCityPlaces, destination]);

  const mapQuery = useMemo(() => {
    if (tripMode === "multi") return multiCityPlaces[0]?.placeName || "";
    return destination;
  }, [tripMode, multiCityPlaces, destination]);

  const formSummary = useMemo(() => {
    if (tripMode === "single" && !destination.trim()) {
      return "Start by choosing where you want to go.";
    }

    if (tripMode === "multi" && multiCityPlaces.length === 0) {
      return "Add the cities you want to visit in order.";
    }

    const target =
      tripMode === "multi"
        ? multiCityPlaces.map((city) => city.placeName).join(" → ")
        : destination.trim();

    let summary = `A ${pace} ${daysCount || ""}-day trip to ${target}`;
    if (budget) summary += ` with a ${budget} budget`;
    if (travelerCount) summary += ` for ${travelerSummary.toLowerCase()}`;
    if (includeEvents) summary += " including local events";
    return summary;
  }, [
    tripMode,
    destination,
    multiCityPlaces,
    pace,
    daysCount,
    budget,
    travelerCount,
    travelerSummary,
    includeEvents,
  ]);

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

  function updateTraveler(type, delta) {
    setTravelers((prev) => {
      const limits = {
        adults: { min: 1, max: 12 },
        children: { min: 0, max: 8 },
        infants: { min: 0, max: 6 },
      };

      const current = Number(prev[type] || 0);
      const nextValue = clampTravelerValue(
        current + delta,
        limits[type].min,
        limits[type].max
      );

      return { ...prev, [type]: nextValue };
    });
  }

  function addMultiCity() {
    const normalized = normalizePlace(multiCitySelectedPlace);

    if (!normalized) {
      setErr("Please choose a city from the suggestions, then click Add city.");
      return;
    }

    const alreadyExists = multiCityPlaces.some(
      (city) => city.placeName.toLowerCase() === normalized.placeName.toLowerCase()
    );

    if (alreadyExists) {
      setErr("This city is already added.");
      return;
    }

    setMultiCityPlaces((prev) => [...prev, normalized]);
    setMultiCityInput("");
    setMultiCitySelectedPlace(null);
    setErr("");
  }

  function removeMultiCity(index) {
    setMultiCityPlaces((prev) => prev.filter((_, i) => i !== index));
  }

  function moveMultiCityUp(index) {
    if (index === 0) return;
    setMultiCityPlaces((prev) => {
      const copy = [...prev];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  }

  function moveMultiCityDown(index) {
    setMultiCityPlaces((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
      return copy;
    });
  }

  function resetForm() {
    const nextStart = clampToToday(startDateParam || todayISOPlus(0));
    setTripMode("single");
    setDestination(destinationParam || "");
    setSelectedPlace(null);
    setMultiCityInput("");
    setMultiCitySelectedPlace(null);
    setMultiCityPlaces([]);
    setStartDate(nextStart);
    setEndDate(addDays(nextStart, 1));
    setPace("moderate");
    setBudget("mid");
    setInterests([]);
    setNotes("");
    setIncludeEvents(true);
    setEventTypes([]);
    setTravelers(parseTravelersParam(travelersParam));
    setErr("");
  }

  async function generate(e) {
    e.preventDefault();
    setErr("");

    const cleanDestination = destination.trim();
    const cleanNotes = notes.trim();
    const cities = multiCityPlaces.map((city) => city.placeName);

    if (tripMode === "single" && !cleanDestination) {
      setErr("Please enter a destination.");
      return;
    }

    if (tripMode === "single" && !selectedPlace) {
      setErr("Please choose a destination from the suggestions list.");
      return;
    }

    if (tripMode === "multi" && multiCityPlaces.length < 2) {
      setErr("Please add at least 2 cities for a multi-city trip.");
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

    if (travelerCount < 1) {
      setErr("Please choose at least 1 traveler.");
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
          travelers: {
            adults: Number(travelers.adults || 0),
            children: Number(travelers.children || 0),
            infants: Number(travelers.infants || 0),
            total: travelerCount,
            summary: travelerSummary,
          },
          sourceTab,
          tripType,
          from,
          includeEvents,
          eventTypes,
        },
        placeMeta:
          tripMode === "single" && selectedPlace
            ? {
              label: selectedPlace.placeName,
              name: selectedPlace.name,
              country: selectedPlace.country,
              region: selectedPlace.region || "",
              lng: selectedPlace.center?.[0] ?? null,
              lat: selectedPlace.center?.[1] ?? null,
            }
            : null,
        multiCityMeta:
          tripMode === "multi"
            ? multiCityPlaces.map((city) => ({
              label: city.placeName,
              name: city.name,
              country: city.country,
              region: city.region || "",
              lng: city.center?.[0] ?? null,
              lat: city.center?.[1] ?? null,
            }))
            : [],
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
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-white to-indigo-50" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative grid gap-6 p-6 lg:grid-cols-12 lg:p-8">
          <div className="lg:col-span-8">
            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
              AI Trip Builder
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Create your next trip
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Build your itinerary with destination, dates, travel style,
              travelers, interests, notes, and local events — then generate and
              save it directly to your account.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <TopHeroStat
                label="Trip mode"
                value={tripMode === "multi" ? "Multi-city" : "One city"}
              />
              <TopHeroStat
                label="Duration"
                value={daysCount ? `${daysCount} days` : "Check dates"}
              />
              <TopHeroStat
                label="Travelers"
                value={travelerCount ? `${travelerCount} total` : "Not set"}
              />
              <TopHeroStat
                label="Events"
                value={includeEvents ? "Enabled" : "Disabled"}
              />
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-sky-100 bg-white/80 p-4 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                Trip summary
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-700">
                {formSummary}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="text-sm font-bold text-slate-900">
                Live planning insights
              </div>
              <div className="mt-4 grid gap-3">
                <MiniInsight
                  title="Smart pacing"
                  text="Your itinerary adapts to relaxed, moderate, or packed travel styles."
                />
                <MiniInsight
                  title="Traveler aware"
                  text="Solo, couple, family, and group plans can feel more realistic."
                />
                <MiniInsight
                  title="Events ready"
                  text="Optionally include concerts, food, culture, nightlife, and more."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-5">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Trip details"
              subtitle="Customize the essentials before generating your itinerary"
              right={
                <Badge className="border-sky-200 bg-sky-50 text-sky-700">
                  {daysCount ? `${daysCount} days` : "Check dates"}
                </Badge>
              }
            />

            <CardBody className="space-y-6 bg-linear-to-b from-white to-slate-50/60">
              <form onSubmit={generate} className="space-y-6">
                <SectionBlock
                  title="Trip mode"
                  subtitle="Choose whether you want one destination or multiple cities"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ModeCard
                      active={tripMode === "single"}
                      tone="sky"
                      title="One city"
                      text="Best for focused trips with one destination"
                      onClick={() => setTripMode("single")}
                    />
                    <ModeCard
                      active={tripMode === "multi"}
                      tone="indigo"
                      title="Multi city"
                      text="Best for route-based travel across cities"
                      onClick={() => setTripMode("multi")}
                    />
                  </div>
                </SectionBlock>

                <SectionBlock
                  title={tripMode === "single" ? "Destination" : "Cities"}
                  subtitle={
                    tripMode === "single"
                      ? "Choose the main place you want to visit"
                      : "Search and add cities in the exact order you want to visit them"
                  }
                  right={
                    tripMode === "multi" ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {multiCityPlaces.length} selected
                      </span>
                    ) : null
                  }
                >
                  {tripMode === "single" ? (
                    <CityAutoComplete
                      label="Destination"
                      placeholder="Search city, region, or country..."
                      value={destination}
                      onChange={(value) => {
                        setDestination(value);
                        setSelectedPlace(null);
                      }}
                      onSelect={(place) => {
                        setDestination(place.placeName || place.name || "");
                        setSelectedPlace(place);
                      }}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                        <CityAutoComplete
                          label="Add city"
                          placeholder="Search and choose a city..."
                          value={multiCityInput}
                          onChange={(value) => {
                            setMultiCityInput(value);
                            setMultiCitySelectedPlace(null);
                          }}
                          onSelect={(place) => {
                            setMultiCityInput(place.placeName || place.name || "");
                            setMultiCitySelectedPlace(place);
                          }}
                          onEnter={() => {
                            addMultiCity();
                          }}
                        />

                        <Button
                          type="button"
                          className="w-full sm:w-auto"
                          onClick={addMultiCity}
                        >
                          Add city
                        </Button>
                      </div>

                      {multiCityPlaces.length ? (
                        <div className="space-y-3">
                          {multiCityPlaces.map((city, index) => (
                            <div
                              key={city.id}
                              className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{city.flag || "🌍"}</span>
                                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                                    Stop {index + 1}
                                  </span>
                                </div>

                                <div className="mt-2 text-sm font-bold text-slate-900">
                                  {city.placeName}
                                </div>

                                {(city.region || city.country) && (
                                  <div className="mt-1 text-xs text-slate-500">
                                    {[city.region, city.country]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveMultiCityUp(index)}
                                  disabled={index === 0}
                                  className={cx(
                                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                                    index === 0
                                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  )}
                                >
                                  ↑ Up
                                </button>

                                <button
                                  type="button"
                                  onClick={() => moveMultiCityDown(index)}
                                  disabled={index === multiCityPlaces.length - 1}
                                  className={cx(
                                    "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                                    index === multiCityPlaces.length - 1
                                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  )}
                                >
                                  ↓ Down
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeMultiCity(index)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                          No cities added yet. Search for a city and click
                          <b> Add city</b>.
                        </div>
                      )}
                    </div>
                  )}
                </SectionBlock>

                <SectionBlock title="Trip dates" subtitle="Choose your travel period">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label="Start date"
                      type="date"
                      value={startDate}
                      min={minStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                    <Input
                      label="End date"
                      type="date"
                      value={endDate}
                      min={minEndDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                    />
                  </div>
                </SectionBlock>

                <SectionBlock
                  title="Travel style"
                  subtitle="Set the rhythm and budget for the trip"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Select
                      label="Pace"
                      value={pace}
                      onChange={(e) => setPace(e.target.value)}
                    >
                      <option value="relaxed">relaxed</option>
                      <option value="moderate">moderate</option>
                      <option value="packed">packed</option>
                    </Select>

                    <Select
                      label="Budget"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    >
                      <option value="low">low</option>
                      <option value="mid">mid</option>
                      <option value="high">high</option>
                    </Select>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-sky-100 bg-sky-50/70 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                      Trip energy
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {tripEnergy}
                    </div>
                  </div>
                </SectionBlock>

                <SectionBlock
                  title="Travelers"
                  subtitle="Choose who is going so the AI can shape better suggestions"
                  right={
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {travelerCount} total
                    </span>
                  }
                >
                  <div className="space-y-3">
                    <TravelerRow
                      title="Adults"
                      subtitle="Age 13+"
                      value={travelers.adults}
                      onDecrease={() => updateTraveler("adults", -1)}
                      onIncrease={() => updateTraveler("adults", 1)}
                      disableDecrease={Number(travelers.adults) <= 1}
                      disableIncrease={Number(travelers.adults) >= 12}
                    />

                    <TravelerRow
                      title="Children"
                      subtitle="Age 2–12"
                      value={travelers.children}
                      onDecrease={() => updateTraveler("children", -1)}
                      onIncrease={() => updateTraveler("children", 1)}
                      disableDecrease={Number(travelers.children) <= 0}
                      disableIncrease={Number(travelers.children) >= 8}
                    />

                    <TravelerRow
                      title="Infants"
                      subtitle="Under 2"
                      value={travelers.infants}
                      onDecrease={() => updateTraveler("infants", -1)}
                      onIncrease={() => updateTraveler("infants", 1)}
                      disableDecrease={Number(travelers.infants) <= 0}
                      disableIncrease={Number(travelers.infants) >= 6}
                    />
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Traveler summary
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {travelerSummary}
                    </div>
                  </div>
                </SectionBlock>

                <SectionBlock
                  title="Interests"
                  subtitle="Help the AI shape your itinerary around what matters most"
                  right={
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {interests.length} selected
                    </span>
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((x) => {
                      const active = interests.includes(x);

                      return (
                        <button
                          type="button"
                          key={x}
                          onClick={() => toggleInterest(x)}
                          className={cx(
                            "rounded-full border px-3.5 py-2 text-xs font-semibold capitalize transition-all duration-200",
                            active
                              ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                          )}
                        >
                          {x}
                        </button>
                      );
                    })}
                  </div>
                </SectionBlock>

                <SectionBlock
                  title="Events during your trip"
                  subtitle="Add local concerts, nightlife, festivals, food events, and more"
                  tone="indigo"
                  right={
                    <button
                      type="button"
                      onClick={() => setIncludeEvents((prev) => !prev)}
                      className={cx(
                        "rounded-full px-4 py-2 text-xs font-bold transition-all duration-200",
                        includeEvents
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "bg-slate-200 text-slate-700"
                      )}
                    >
                      {includeEvents ? "Enabled" : "Disabled"}
                    </button>
                  }
                >
                  {includeEvents ? (
                    <div>
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
                              className={cx(
                                "rounded-full border px-3.5 py-2 text-xs font-semibold capitalize transition-all duration-200",
                                active
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              {x}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[1.25rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500">
                      Events are currently turned off for this trip.
                    </div>
                  )}
                </SectionBlock>

                <SectionBlock
                  title="Notes"
                  subtitle="Optional preferences for food, walking, family style, timing, and more"
                  right={
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {notes.length}/300
                    </span>
                  }
                >
                  <label className="block">
                    <textarea
                      value={notes}
                      maxLength={300}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., we like walking, cafes, local food, not too early, family-friendly..."
                      className="min-h-36 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>
                </SectionBlock>

                {err ? <Alert type="error">{err}</Alert> : null}

                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  When you click <b>Generate &amp; Save</b>, your AI itinerary is
                  created and saved directly to your account.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
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
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-7">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <div className="relative overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white">
              <div className="absolute inset-0">
                <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
              </div>

              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                  Live Preview
                </div>

                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-2xl font-black tracking-tight sm:text-3xl">
                      {previewTitle}
                    </div>
                    <div className="mt-2 text-sm text-white/75">
                      {startDate} → {endDate} • pace: {pace} • budget: {budget}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <GlassPill>
                      {daysCount ? `${daysCount} days` : "Invalid dates"}
                    </GlassPill>
                    {tripMode === "multi" && multiCityPlaces.length ? (
                      <GlassPill>{multiCityPlaces.length} cities</GlassPill>
                    ) : null}
                    {travelerCount ? (
                      <GlassPill>{travelerSummary}</GlassPill>
                    ) : null}
                    {includeEvents ? <GlassPill>local events</GlassPill> : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(interests.length ? interests : ["custom trip"])
                    .slice(0, 6)
                    .map((x) => (
                      <GlassPill key={x} className="capitalize">
                        {x}
                      </GlassPill>
                    ))}

                  {includeEvents &&
                    eventTypes.slice(0, 4).map((x) => (
                      <GlassPill key={`event-${x}`} className="capitalize">
                        {x}
                      </GlassPill>
                    ))}
                </div>
              </div>
            </div>

            <CardBody className="space-y-6 bg-linear-to-b from-white to-slate-50/60">
              <div className="grid gap-4 sm:grid-cols-2">
                <PreviewCard
                  title="Day structure"
                  text="Morning / Afternoon / Evening planning blocks"
                />
                <PreviewCard
                  title="Smart pacing"
                  text="Trip flow adjusts to your selected pace and budget"
                />
                <PreviewCard
                  title="Traveler-aware"
                  text="Suggestions can better fit solo travel, couples, families, and groups"
                />
                <PreviewCard
                  title="Saved securely"
                  text="Your itinerary is stored in your account for later use"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <MiniInfo
                  label={tripMode === "multi" ? "Trip mode" : "Destination"}
                  value={
                    tripMode === "multi"
                      ? "Multi-city"
                      : destination || "Not selected yet"
                  }
                />
                <MiniInfo label="Pace" value={pace} />
                <MiniInfo label="Budget" value={budget} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <MiniInfo label="Travelers" value={travelerSummary} />
                <MiniInfo label="Trip energy" value={tripEnergy} />
              </div>

              {tripMode === "multi" && multiCityPlaces.length ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-slate-900">
                      Cities in this trip
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {multiCityPlaces.length} cities
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {multiCityPlaces.map((city, index) => (
                      <span
                        key={city.id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        {index + 1}. {city.placeName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {(sourceTab || travelerCount || tripType) && (
                <div className="grid gap-3 md:grid-cols-3">
                  {sourceTab ? <MiniInfo label="Source" value={sourceTab} /> : null}
                  {travelerCount ? (
                    <MiniInfo label="Total people" value={`${travelerCount}`} />
                  ) : null}
                  {tripType ? <MiniInfo label="Trip type" value={tripType} /> : null}
                </div>
              )}

              {includeEvents ? (
                <div className="rounded-[1.5rem] border border-indigo-100 bg-linear-to-r from-indigo-50 to-sky-50 p-4 text-sm text-slate-600">
                  <div className="mb-1 font-bold text-slate-900">
                    Events enabled
                  </div>
                  Your trip will also try to include local happenings within your
                  selected date range.
                </div>
              ) : null}

              {notes.trim() ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                  <div className="mb-2 font-bold text-slate-900">Trip notes</div>
                  {notes.trim()}
                </div>
              ) : null}

              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Preview your trip settings here before generating the final
                itinerary.
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Destination map"
              subtitle={
                mapQuery
                  ? `Live location preview for ${mapQuery}`
                  : "Enter a destination to preview it on the map"
              }
              right={
                mapQuery ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    Preview ready
                  </Badge>
                ) : (
                  <Badge className="border-slate-200 bg-slate-100 text-slate-600">
                    Waiting
                  </Badge>
                )
              }
            />

            <CardBody className="space-y-4 bg-linear-to-b from-white to-slate-50/60">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 shadow-sm">
                <MapTilerMap query={mapQuery} height={400} />
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                {tripMode === "multi"
                  ? "For multi-city trips, the map previews your first city before generation."
                  : "Use the live map to confirm your destination before generating the full itinerary."}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ title, subtitle, right, children, tone = "default" }) {
  const toneClass =
    tone === "indigo"
      ? "border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50"
      : "border-slate-200 bg-white";

  return (
    <section className={`rounded-[1.5rem] border p-4 shadow-sm ${toneClass}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ModeCard({ active, tone, title, text, onClick }) {
  const activeClasses =
    tone === "indigo"
      ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
      : "border-sky-500 bg-sky-50 shadow-md shadow-sky-100";

  const titleActive = tone === "indigo" ? "text-indigo-700" : "text-sky-700";
  const dotActive = tone === "indigo" ? "bg-indigo-600" : "bg-sky-600";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group rounded-[1.25rem] border px-4 py-4 text-left transition-all duration-200",
        active
          ? activeClasses
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={cx("text-sm font-bold", active ? titleActive : "text-slate-900")}>
            {title}
          </div>
          <div className="mt-1 text-xs text-slate-500">{text}</div>
        </div>
        <div
          className={cx("h-3 w-3 rounded-full", active ? dotActive : "bg-slate-300")}
        />
      </div>
    </button>
  );
}

function TravelerRow({
  title,
  subtitle,
  value,
  onDecrease,
  onIncrease,
  disableDecrease,
  disableIncrease,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div>
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disableDecrease}
          className={cx(
            "grid h-10 w-10 place-items-center rounded-2xl border text-lg font-bold transition",
            disableDecrease
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          −
        </button>

        <div className="min-w-[2.5rem] text-center text-lg font-black text-slate-900">
          {value}
        </div>

        <button
          type="button"
          onClick={onIncrease}
          disabled={disableIncrease}
          className={cx(
            "grid h-10 w-10 place-items-center rounded-2xl border text-lg font-bold transition",
            disableIncrease
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          +
        </button>
      </div>
    </div>
  );
}

function TopHeroStat({ label, value }) {
  return (
    <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function MiniInsight({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  );
}

function GlassPill({ children, className = "" }) {
  return (
    <span
      className={cx(
        "rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md",
        className
      )}
    >
      {children}
    </span>
  );
}

function PreviewCard({ title, text }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1.5 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}