import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Compass,
  MapPinned,
  Sparkles,
  UtensilsCrossed,
  Wand2,
  Stars,
  PlaneTakeoff,
} from "lucide-react";
import { api } from "../api/client.js";
import { Alert, Badge, Button, Card, CardBody } from "../components/UI.jsx";

const STEPS = [
  {
    icon: <MapPinned size={18} />,
    title: "Checking destination details",
    text: "Preparing the best starting point for your trip.",
  },
  {
    icon: <Compass size={18} />,
    title: "Designing your route",
    text: "Balancing pace, interests, and travel style.",
  },
  {
    icon: <UtensilsCrossed size={18} />,
    title: "Adding local experiences",
    text: "Mixing food, culture, and meaningful recommendations.",
  },
  {
    icon: <CalendarDays size={18} />,
    title: "Building your itinerary",
    text: "Organizing day-by-day travel plans.",
  },
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function GeneratingTrip() {
  const nav = useNavigate();
  const location = useLocation();

  const payload = location.state?.payload || null;

  const [activeStep, setActiveStep] = useState(0);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(true);
  const [pulseIndex, setPulseIndex] = useState(0);

  const destinationLabel = useMemo(() => {
    if (!payload) return "your destination";
    return payload.destination || "your destination";
  }, [payload]);

  const tripMeta = useMemo(() => {
    if (!payload) {
      return {
        days: "—",
        pace: "—",
        budget: "—",
        travelers: "—",
      };
    }

    return {
      days:
        payload.startDate && payload.endDate
          ? `${payload.startDate} → ${payload.endDate}`
          : "—",
      pace: payload.preferences?.pace || "—",
      budget: payload.preferences?.budget || "—",
      travelers: payload.preferences?.travelers?.summary || "—",
    };
  }, [payload]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!payload) {
      setSubmitting(false);
      setErr("Missing trip details. Please return and generate your trip again.");
      return;
    }

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    const pulseInterval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 3);
    }, 900);

    return () => {
      clearInterval(stepInterval);
      clearInterval(pulseInterval);
    };
  }, [payload]);

  useEffect(() => {
    if (!payload) return;

    let cancelled = false;

    async function runGeneration() {
      try {
        const { data: trip } = await api.post("/trips/generate-and-save", payload);

        if (cancelled) return;
        nav(`/trip/${trip._id}`, { replace: true });
      } catch (e2) {
        if (cancelled) return;
        setErr(
          e2?.response?.data?.message ||
            "Generate failed. Please log in and try again."
        );
        setSubmitting(false);
      }
    }

    runGeneration();

    return () => {
      cancelled = true;
    };
  }, [payload, nav]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950 text-white shadow-[0_30px_90px_-35px_rgba(15,23,42,0.75)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_26%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.10),transparent_30%)]" />
        <div className="absolute -left-12 top-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[30px_30px] opacity-20" />

        <div className="relative px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="border-white/10 bg-white/10 text-white backdrop-blur">
              AI Generation in Progress
            </Badge>

            <div className="mx-auto mt-6 flex h-18 w-18 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white shadow-[0_16px_40px_-12px_rgba(59,130,246,0.6)]">
              <Sparkles size={28} />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Crafting your journey to{" "}
              <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                {destinationLabel}
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              Your itinerary is being built with AI using your dates, travel style,
              interests, and trip preferences.
            </p>

            <div className="mt-8 flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cx(
                    "h-3 w-3 rounded-full transition-all duration-500",
                    pulseIndex === i
                      ? "scale-125 bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.9)]"
                      : "bg-white/20"
                  )}
                />
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <LuxuryStat
                icon={<CalendarDays size={16} />}
                label="Trip window"
                value={tripMeta.days}
              />
              <LuxuryStat
                icon={<Compass size={16} />}
                label="Pace"
                value={tripMeta.pace}
              />
              <LuxuryStat
                icon={<Stars size={16} />}
                label="Budget"
                value={tripMeta.budget}
              />
              <LuxuryStat
                icon={<PlaneTakeoff size={16} />}
                label="Travelers"
                value={tripMeta.travelers}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardBody className="space-y-4 bg-gradient-to-b from-white to-slate-50/60 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white shadow-sm">
                  <Wand2 size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Generation progress
                  </div>
                  <div className="text-sm text-slate-500">
                    Building a polished day-by-day itinerary for your trip.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {STEPS.map((step, index) => {
                  const isDone = index < activeStep;
                  const isActive = index === activeStep;

                  return (
                    <div
                      key={step.title}
                      className={cx(
                        "rounded-3xl border p-4 transition-all duration-300",
                        isDone
                          ? "border-emerald-200 bg-emerald-50"
                          : isActive
                          ? "border-sky-200 bg-sky-50 shadow-sm"
                          : "border-slate-200 bg-white"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cx(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                            isDone
                              ? "bg-emerald-600 text-white"
                              : isActive
                              ? "bg-sky-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {isDone ? "✓" : step.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900">
                            {step.title}
                          </div>
                          <div className="mt-1 text-sm leading-6 text-slate-600">
                            {step.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                This page will redirect automatically as soon as your trip is ready.
              </div>

              {err ? <Alert type="error">{err}</Alert> : null}

              {err ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => nav("/create")} className="w-full sm:w-auto">
                    Back to Create Trip
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <div className="xl:col-span-5">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardBody className="space-y-4 bg-gradient-to-b from-white to-slate-50/60 p-6">
              <div className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-5">
                <div className="text-base font-bold text-slate-900">
                  What the AI is doing now
                </div>

                <div className="mt-4 space-y-3">
                  <InfoLine text="Analyzing your destination and trip mode" />
                  <InfoLine text="Matching pace, budget, and traveler preferences" />
                  <InfoLine text="Preparing activity ideas and local experiences" />
                  <InfoLine text="Structuring your daily itinerary blocks" />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm font-bold text-slate-900">
                  Premium planning flow
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  Your itinerary is created first, then saved directly to your account
                  so it’s ready in your trip library.
                </div>
              </div>

              {!submitting && err ? (
                <Button
                  variant="secondary"
                  onClick={() => nav("/trips")}
                  className="w-full sm:w-auto"
                >
                  View My Trips
                </Button>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LuxuryStat({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left shadow-sm backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white">
        {icon}
      </div>
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function InfoLine({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
      <div>{text}</div>
    </div>
  );
}