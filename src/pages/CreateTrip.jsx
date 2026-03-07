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

const quickTemplates = [
  {
    title: "City Explorer",
    desc: "Museums, landmarks, food, and a balanced daily pace.",
    pace: "moderate",
    budget: "mid",
    interests: ["history", "food", "culture"],
    notes: "Balanced trip with iconic places, local food, and city highlights.",
  },
  {
    title: "Relaxed Escape",
    desc: "Lighter schedule with scenic places and less rushing.",
    pace: "relaxed",
    budget: "mid",
    interests: ["nature", "culture"],
    notes: "Slow-paced trip with scenic spots, cafes, and relaxed timing.",
  },
  {
    title: "Packed Adventure",
    desc: "See as much as possible with a dense itinerary.",
    pace: "packed",
    budget: "high",
    interests: ["history", "shopping", "nightlife"],
    notes: "High-energy schedule with many attractions and busy days.",
  },
];

function todayISOPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
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

  const [destination, setDestination] = useState(destinationParam);
  const [startDate, setStartDate] = useState(startDateParam || todayISOPlus(0));
  const [endDate, setEndDate] = useState(endDateParam || todayISOPlus(1));
  const [pace, setPace] = useState("moderate");
  const [budget, setBudget] = useState("mid");
  const [interests, setInterests] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const travelers = travelersParam;
  const sourceTab = sourceTabParam;
  const tripType = tripTypeParam;
  const from = fromParam;

  useEffect(() => {
    if (destinationParam) setDestination(destinationParam);
    if (startDateParam) setStartDate(startDateParam);
    if (endDateParam) setEndDate(endDateParam);

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
  }, [
    destinationParam,
    startDateParam,
    endDateParam,
    sourceTab,
    tripType,
  ]);

  const daysCount = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);

    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) {
      return null;
    }

    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const formSummary = useMemo(() => {
    if (!destination.trim()) return "Start by choosing where you want to go.";

    let summary = `A ${pace} ${daysCount || ""}-day trip to ${destination.trim()}`;
    if (budget) summary += ` with a ${budget} budget`;
    if (travelers) summary += ` for ${formatTravelersLabel(travelers).toLowerCase()}`;
    return summary;
  }, [destination, pace, daysCount, budget, travelers]);

  function toggleInterest(x) {
    setInterests((prev) =>
      prev.includes(x) ? prev.filter((i) => i !== x) : [...prev, x]
    );
  }

  function applyTemplate(template) {
    setPace(template.pace);
    setBudget(template.budget);
    setInterests(template.interests);
    setNotes(template.notes || "");
  }

  function resetForm() {
    setDestination(destinationParam || "");
    setStartDate(startDateParam || todayISOPlus(0));
    setEndDate(endDateParam || todayISOPlus(1));
    setPace("moderate");
    setBudget("mid");
    setInterests([]);
    setNotes("");
    setErr("");
  }

  async function generate(e) {
    e.preventDefault();
    setErr("");

    const cleanDestination = destination.trim();
    const cleanNotes = notes.trim();

    if (!cleanDestination) {
      setErr("Please enter a destination.");
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
      const { data: trip } = await api.post("/trips/generate-and-save", {
        destination: cleanDestination,
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
        },
      });

      nav(`/trip/${trip._id}`);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Generate failed. Please log in and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top banner */}
      <Card className="overflow-hidden border-slate-200 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.25)]">
        <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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

              <div className="mt-4 text-sm text-white/85">
                {formSummary}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {daysCount ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  {daysCount} days
                </Badge>
              ) : (
                <Badge className="border-white/20 bg-white/10 text-white">
                  Invalid dates
                </Badge>
              )}

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
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader
              title="Trip details"
              subtitle="Fill in the essentials for your itinerary"
              right={
                daysCount ? <Badge>{daysCount} days</Badge> : <Badge>Check dates</Badge>
              }
            />

            <CardBody>
              <form onSubmit={generate} className="space-y-5">
                <Input
                  label="Destination"
                  placeholder="e.g., Paris, France"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Start date"
                    type="date"
                    value={startDate}
                    min={todayISOPlus(0)}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    label="End date"
                    type="date"
                    value={endDate}
                    min={startDate || todayISOPlus(0)}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
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

                {(sourceTab || travelers || from || tripType) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-800">
                      Imported from Home page
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {sourceTab ? <MiniInfo label="Source tab" value={sourceTab} /> : null}
                      {travelers ? <MiniInfo label="Travelers" value={formatTravelersLabel(travelers)} /> : null}
                      {tripType ? <MiniInfo label="Trip type" value={tripType} /> : null}
                      {from ? <MiniInfo label="From" value={from} /> : null}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-700">Interests</div>
                    <div className="text-xs text-slate-500">
                      {interests.length} selected
                    </div>
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
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
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

          <Card>
            <CardHeader
              title="Quick templates"
              subtitle="Use a preset style to fill pace, budget, interests, and notes faster"
            />
            <CardBody className="space-y-3">
              {quickTemplates.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{template.title}</div>
                      <div className="mt-1 text-sm text-slate-600">{template.desc}</div>
                    </div>
                    <Badge>{template.pace}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.interests.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-6 lg:col-span-7">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
              <div className="text-sm font-semibold uppercase tracking-wide text-white/75">
                Live Preview
              </div>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-2xl font-black">
                    {destination || "Your destination"}
                  </div>
                  <div className="mt-2 text-sm text-white/85">
                    {startDate} → {endDate} • pace: {pace} • budget: {budget}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                    {daysCount ? `${daysCount} days` : "Invalid dates"}
                  </span>

                  {travelers ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
                      {formatTravelersLabel(travelers)}
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
                <MiniInfo label="Destination" value={destination || "Not selected yet"} />
                <MiniInfo label="Pace" value={pace} />
                <MiniInfo label="Budget" value={budget} />
              </div>

              {(sourceTab || travelers || tripType) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {sourceTab ? <MiniInfo label="Source" value={sourceTab} /> : null}
                  {travelers ? <MiniInfo label="Travelers" value={formatTravelersLabel(travelers)} /> : null}
                  {tripType ? <MiniInfo label="Trip type" value={tripType} /> : null}
                </div>
              )}

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
                destination
                  ? `Live location preview for ${destination}`
                  : "Enter a destination to preview it on the map"
              }
            />
            <CardBody className="space-y-4">
              <MapTilerMap query={destination} height={380} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Use the live map to confirm your destination before generating the full itinerary.
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Strong map preview makes the planning flow feel more visual and premium.
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