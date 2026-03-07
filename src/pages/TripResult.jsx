import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { api } from "../api/client.js";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
} from "../components/UI.jsx";
import MapTilerMap from "../components/MapTilerMap.jsx";

function Section({ title, items, icon }) {
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

      <ul className="mt-2 space-y-2">
        {items.map((x, idx) => (
          <li
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-sky-200 hover:bg-sky-50/30"
          >
            <div className="text-sm font-semibold text-slate-900">{x.title}</div>

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              {x.durationHours ? <span>{x.durationHours}h</span> : null}
              {x.notes ? <span>{x.notes}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoTile({ label, value }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm leading-6 text-slate-800">{value}</div>
    </div>
  );
}

function TipsGrid({ tips }) {
  if (!tips?.length) return null;

  return (
    <Card>
      <CardHeader
        title="Trip Tips"
        subtitle="Small things that can make the trip smoother"
      />
      <CardBody>
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
            >
              {tip}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export default function TripResult() {
  const nav = useNavigate();
  const { state } = useLocation();

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const itinerary = state?.itinerary;

  const meta = useMemo(() => {
    if (!itinerary) return null;

    const s = itinerary.tripSummary || {};

    return {
      title: s.destination || state?.destination || "Trip",
      days: s.days || itinerary.days?.length || 0,
      budget: s.budget,
      style: s.style,
    };
  }, [itinerary, state]);

  if (!itinerary) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert type="error">
          No itinerary found. Go back to Create Trip and generate one.
        </Alert>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => nav("/create")}>Back to Create</Button>
          <Button onClick={() => nav("/trips")} variant="secondary">
            My Trips
          </Button>
        </div>
      </div>
    );
  }

  async function saveTrip() {
    setErr("");
    setMsg("");
    setSaving(true);

    try {
      await api.post("/trips", {
        destination: state.destination,
        startDate: state.startDate,
        endDate: state.endDate,
        preferences: state.preferences,
        itinerary,
      });

      setMsg("Trip saved successfully.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top hero */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
                AI Generated Itinerary
              </div>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {meta?.title || "Trip"} itinerary
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/90 sm:text-base">
                {state.startDate} → {state.endDate}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {meta?.days ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  {meta.days} days
                </Badge>
              ) : null}

              {meta?.style ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  pace: {meta.style}
                </Badge>
              ) : null}

              {meta?.budget ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  budget: {meta.budget}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => nav("/create")} variant="secondary">
              New Trip
            </Button>

            <Button onClick={saveTrip} disabled={saving}>
              {saving ? "Saving..." : "Save Trip"}
            </Button>

            <Button onClick={() => nav("/trips")} variant="ghost">
              My Trips
            </Button>
          </div>

          {(err || msg) && (
            <div className="space-y-3">
              {err ? <Alert type="error">{err}</Alert> : null}
              {msg ? <Alert type="success">{msg}</Alert> : null}
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Review the full itinerary below, preview the destination on the map,
            and save the trip to your account when you’re ready.
          </div>
        </CardBody>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Destination Preview"
          subtitle={`Map preview for ${state.destination || "your destination"}`}
        />
        <CardBody className="space-y-4">
          <MapTilerMap query={state.destination} height={380} />

          <div className="flex flex-wrap gap-2">
            <MiniInfo label="Destination" value={state.destination || "Not set"} />
            <MiniInfo label="Dates" value={`${state.startDate} → ${state.endDate}`} />
            <MiniInfo label="Days" value={String(meta?.days || 0)} />
          </div>
        </CardBody>
      </Card>

      {/* Days */}
      <div className="grid gap-6 md:grid-cols-2">
        {itinerary.days.map((d) => (
          <Card
            key={d.day}
            className="overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.28)]"
          >
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/75">
                    Day {d.day}
                  </div>
                  <div className="mt-1 text-xl font-black">{d.title}</div>
                  <div className="mt-1 text-sm text-white/80">{d.date}</div>
                </div>

                <Badge className="border-white/20 bg-white/10 text-white">
                  Day Plan
                </Badge>
              </div>
            </div>

            <CardBody>
              <Section title="Morning" icon="☀️" items={d.morning} />
              <Section title="Afternoon" icon="🌤️" items={d.afternoon} />
              <Section title="Evening" icon="🌙" items={d.evening} />

              {(d.foodSuggestion || d.backupPlan) && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Food suggestion" value={d.foodSuggestion} />
                  <InfoTile label="Backup plan" value={d.backupPlan} />
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <TipsGrid tips={itinerary.tips} />
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