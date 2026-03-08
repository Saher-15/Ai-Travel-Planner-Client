import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
} from "../components/UI.jsx";

const BLOCKS = ["morning", "afternoon", "evening"];

const BLOCK_META = {
  morning: {
    icon: "☀️",
    title: "Morning",
    desc: "Start the day with light, practical activities.",
  },
  afternoon: {
    icon: "🌤️",
    title: "Afternoon",
    desc: "Main visits, attractions, and experiences.",
  },
  evening: {
    icon: "🌙",
    title: "Evening",
    desc: "Dinner, walks, nightlife, or relaxed plans.",
  },
};

function makeEmptyActivity() {
  return {
    title: "",
    location: "",
    notes: "",
    durationHours: "",
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeTripForForm(trip) {
  return {
    tripMode: trip?.tripMode || "single",
    destination: trip?.destination || "",
    destinations: safeArray(trip?.destinations),
    startDate: trip?.startDate || "",
    endDate: trip?.endDate || "",
    preferences: {
      pace: trip?.preferences?.pace || "moderate",
      budget: trip?.preferences?.budget || "mid",
      interests: safeArray(trip?.preferences?.interests),
      notes: trip?.preferences?.notes || "",
      travelers: trip?.preferences?.travelers || "",
      sourceTab: trip?.preferences?.sourceTab || "",
      tripType: trip?.preferences?.tripType || "",
      from: trip?.preferences?.from || "",
      includeEvents:
        trip?.preferences?.includeEvents === undefined
          ? true
          : Boolean(trip?.preferences?.includeEvents),
      eventTypes: safeArray(trip?.preferences?.eventTypes),
    },
    itinerary: {
      tripSummary: trip?.itinerary?.tripSummary || {},
      tips: safeArray(trip?.itinerary?.tips),
      recommendedPlaces: safeArray(trip?.itinerary?.recommendedPlaces).map((place) => ({
        name: place?.name || "",
        reason: place?.reason || "",
        category: place?.category || "",
        location: place?.location || "",
      })),
      days: safeArray(trip?.itinerary?.days).map((day, index) => ({
        day: day?.day ?? index + 1,
        title: day?.title || "",
        date: day?.date || "",
        morning: safeArray(day?.morning).map((a) => ({
          title: a?.title || "",
          location: a?.location || "",
          notes: a?.notes || "",
          durationHours:
            a?.durationHours === null || a?.durationHours === undefined
              ? ""
              : String(a.durationHours),
        })),
        afternoon: safeArray(day?.afternoon).map((a) => ({
          title: a?.title || "",
          location: a?.location || "",
          notes: a?.notes || "",
          durationHours:
            a?.durationHours === null || a?.durationHours === undefined
              ? ""
              : String(a.durationHours),
        })),
        evening: safeArray(day?.evening).map((a) => ({
          title: a?.title || "",
          location: a?.location || "",
          notes: a?.notes || "",
          durationHours:
            a?.durationHours === null || a?.durationHours === undefined
              ? ""
              : String(a.durationHours),
        })),
        foodSuggestion: day?.foodSuggestion || "",
        backupPlan: day?.backupPlan || "",
      })),
    },
    events: safeArray(trip?.events),
  };
}

function normalizeDayNumbers(days) {
  return safeArray(days).map((day, index) => ({
    ...day,
    day: index + 1,
  }));
}

function countDayActivities(day) {
  return (
    safeArray(day?.morning).length +
    safeArray(day?.afternoon).length +
    safeArray(day?.evening).length
  );
}

function getDayEstimatedHours(day) {
  const activities = [
    ...safeArray(day?.morning),
    ...safeArray(day?.afternoon),
    ...safeArray(day?.evening),
  ];

  const total = activities.reduce((sum, activity) => {
    const n = Number(activity?.durationHours);
    return Number.isFinite(n) && n > 0 ? sum + n : sum;
  }, 0);

  return total;
}

function formatHours(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (Number.isInteger(value)) return `${value}h`;
  return `${value.toFixed(1)}h`;
}

export default function EditTrip() {
  const nav = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const { data } = await api.get(`/trips/${id}`);
        if (!alive) return;

        const normalized = normalizeTripForForm(data);
        setForm(normalized);
        setInitialSnapshot(JSON.stringify(normalized));
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load trip.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const hasUnsavedChanges = useMemo(() => {
    if (!form) return false;
    return JSON.stringify(form) !== initialSnapshot;
  }, [form, initialSnapshot]);

  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const daysCount = useMemo(() => {
    if (!form?.startDate || !form?.endDate) return null;

    const s = new Date(form.startDate);
    const e = new Date(form.endDate);

    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return null;
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }, [form?.startDate, form?.endDate]);

  const totalActivities = useMemo(() => {
    if (!form?.itinerary?.days?.length) return 0;
    return form.itinerary.days.reduce((sum, day) => sum + countDayActivities(day), 0);
  }, [form]);

  const totalEstimatedHours = useMemo(() => {
    if (!form?.itinerary?.days?.length) return 0;
    return form.itinerary.days.reduce((sum, day) => sum + getDayEstimatedHours(day), 0);
  }, [form]);

  function updateDay(dayIndex, field, value) {
    setForm((prev) => {
      const days = [...prev.itinerary.days];
      days[dayIndex] = { ...days[dayIndex], [field]: value };
      return {
        ...prev,
        itinerary: { ...prev.itinerary, days },
      };
    });
  }

  function updateActivity(dayIndex, block, activityIndex, field, value) {
    setForm((prev) => {
      const days = [...prev.itinerary.days];
      const day = { ...days[dayIndex] };
      const activities = [...day[block]];

      activities[activityIndex] = {
        ...activities[activityIndex],
        [field]: value,
      };

      day[block] = activities;
      days[dayIndex] = day;

      return {
        ...prev,
        itinerary: { ...prev.itinerary, days },
      };
    });
  }

  function addActivity(dayIndex, block) {
    setForm((prev) => {
      const days = [...prev.itinerary.days];
      const day = { ...days[dayIndex] };
      day[block] = [...day[block], makeEmptyActivity()];
      days[dayIndex] = day;

      return {
        ...prev,
        itinerary: { ...prev.itinerary, days },
      };
    });
  }

  function removeActivity(dayIndex, block, activityIndex) {
    setForm((prev) => {
      const days = [...prev.itinerary.days];
      const day = { ...days[dayIndex] };
      day[block] = day[block].filter((_, i) => i !== activityIndex);
      days[dayIndex] = day;

      return {
        ...prev,
        itinerary: { ...prev.itinerary, days },
      };
    });
  }



  function moveActivityWithinBlock(dayIndex, block, activityIndex, direction) {
    setForm((prev) => {
      const days = [...prev.itinerary.days];
      const day = { ...days[dayIndex] };
      const activities = [...day[block]];
      const targetIndex = direction === "up" ? activityIndex - 1 : activityIndex + 1;

      if (targetIndex < 0 || targetIndex >= activities.length) return prev;

      [activities[activityIndex], activities[targetIndex]] = [
        activities[targetIndex],
        activities[activityIndex],
      ];

      day[block] = activities;
      days[dayIndex] = day;

      return {
        ...prev,
        itinerary: { ...prev.itinerary, days },
      };
    });
  }

  function moveActivityToAnotherBlock(dayIndex, block, activityIndex, direction) {
    const currentBlockIndex = BLOCKS.indexOf(block);
    const targetBlockIndex =
      direction === "prev" ? currentBlockIndex - 1 : currentBlockIndex + 1;

    if (targetBlockIndex < 0 || targetBlockIndex >= BLOCKS.length) return;

    const targetBlock = BLOCKS[targetBlockIndex];

    setForm((prev) => {
      const days = [...prev.itinerary.days];
      const day = { ...days[dayIndex] };

      const fromActivities = [...day[block]];
      const toActivities = [...day[targetBlock]];
      const [movedActivity] = fromActivities.splice(activityIndex, 1);

      if (!movedActivity) return prev;

      toActivities.push(movedActivity);

      day[block] = fromActivities;
      day[targetBlock] = toActivities;
      days[dayIndex] = day;

      return {
        ...prev,
        itinerary: { ...prev.itinerary, days },
      };
    });
  }

  function moveDay(dayIndex, direction) {
    setForm((prev) => {
      const days = [...prev.itinerary.days];
      const targetIndex = direction === "up" ? dayIndex - 1 : dayIndex + 1;

      if (targetIndex < 0 || targetIndex >= days.length) return prev;

      [days[dayIndex], days[targetIndex]] = [days[targetIndex], days[dayIndex]];

      return {
        ...prev,
        itinerary: {
          ...prev.itinerary,
          days: normalizeDayNumbers(days),
        },
      };
    });
  }



  function removeEmptyActivitiesFromDay(dayIndex) {
    setForm((prev) => {
      const days = [...prev.itinerary.days];
      const day = { ...days[dayIndex] };

      for (const block of BLOCKS) {
        day[block] = safeArray(day[block]).filter(
          (a) =>
            (a?.title || "").trim() ||
            (a?.location || "").trim() ||
            (a?.notes || "").trim() ||
            String(a?.durationHours || "").trim()
        );
      }

      days[dayIndex] = day;

      return {
        ...prev,
        itinerary: {
          ...prev.itinerary,
          days,
        },
      };
    });
  }

  async function saveTrip(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!form.destination.trim()) {
      setErr("Please enter a destination.");
      return;
    }

    if (!daysCount) {
      setErr("Please enter valid dates.");
      return;
    }

    setSaving(true);

    try {
      const normalizedDays = normalizeDayNumbers(
        safeArray(form.itinerary.days).map((day) => ({
          ...day,
          title: (day.title || "").trim(),
          date: day.date || "",
          morning: safeArray(day.morning).map((a) => ({
            title: (a.title || "").trim(),
            location: (a.location || "").trim(),
            notes: (a.notes || "").trim(),
            durationHours:
              a.durationHours === "" || a.durationHours === null || a.durationHours === undefined
                ? null
                : Number(a.durationHours),
          })),
          afternoon: safeArray(day.afternoon).map((a) => ({
            title: (a.title || "").trim(),
            location: (a.location || "").trim(),
            notes: (a.notes || "").trim(),
            durationHours:
              a.durationHours === "" || a.durationHours === null || a.durationHours === undefined
                ? null
                : Number(a.durationHours),
          })),
          evening: safeArray(day.evening).map((a) => ({
            title: (a.title || "").trim(),
            location: (a.location || "").trim(),
            notes: (a.notes || "").trim(),
            durationHours:
              a.durationHours === "" || a.durationHours === null || a.durationHours === undefined
                ? null
                : Number(a.durationHours),
          })),
          foodSuggestion: (day.foodSuggestion || "").trim(),
          backupPlan: (day.backupPlan || "").trim(),
        }))
      );

      const payload = {
        tripMode: form.tripMode,
        destination: form.destination.trim(),
        destinations: safeArray(form.destinations).length
          ? safeArray(form.destinations)
          : [form.destination.trim()],
        startDate: form.startDate,
        endDate: form.endDate,
        preferences: {
          ...form.preferences,
          notes: (form.preferences.notes || "").trim(),
        },
        itinerary: {
          ...form.itinerary,
          tripSummary: form.itinerary.tripSummary || {},
          tips: safeArray(form.itinerary.tips),
          recommendedPlaces: safeArray(form.itinerary.recommendedPlaces),
          days: normalizedDays,
        },
        events: safeArray(form.events),
      };

      await api.put(`/trips/${id}`, payload);

      setSuccess("Trip updated successfully.");
      setInitialSnapshot(JSON.stringify(form));

      setTimeout(() => {
        nav(`/trip/${id}`);
      }, 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to update trip.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <Card className="overflow-hidden">
          <CardBody className="space-y-4">
            <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
            <div className="h-28 animate-pulse rounded-3xl bg-slate-100" />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-52 animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-52 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (err && !form) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert type="error">{err}</Alert>
        <Button onClick={() => nav("/trips")} variant="secondary">
          Back to My Trips
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="overflow-hidden border-slate-200 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.28)]">
        <div className="relative overflow-hidden bg-linear-to-r from-sky-700 via-blue-700 to-indigo-800 px-6 py-7 text-white sm:px-8">
          <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
                Manual trip editor
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                {form.destination || "Edit Trip"}
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
                Reorder days, move activities between plans, and enrich your itinerary with notes and durations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {daysCount ? (
                <Badge className="border-white/20 bg-white/10 text-white">
                  {daysCount} days
                </Badge>
              ) : null}
              <Badge className="border-white/20 bg-white/10 text-white">
                {totalActivities} activities
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white">
                {formatHours(totalEstimatedHours)}
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white">
                {hasUnsavedChanges ? "Unsaved changes" : "Saved state"}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {err ? <Alert type="error">{err}</Alert> : null}
      {success ? <Alert type="success">{success}</Alert> : null}

      <form onSubmit={saveTrip} className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <div className="lg:sticky lg:top-6 lg:space-y-6">
            <Card>
              <CardHeader
                title="Actions"
                subtitle="Save your changes or go back to the trip page"
              />
              <CardBody className="space-y-3">
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Saving changes..." : "Save Changes"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => nav(`/trip/${id}`)}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => nav("/trips")}
                >
                  Back to My Trips
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Protected content"
                subtitle="These are preserved when you edit the trip"
              />
              <CardBody className="space-y-3">
                <MiniInfo
                  label="Recommended Places"
                  value={safeArray(form?.itinerary?.recommendedPlaces).length}
                />
                <MiniInfo
                  label="Tips"
                  value={safeArray(form?.itinerary?.tips).length}
                />
                <MiniInfo
                  label="Events"
                  value={safeArray(form?.events).length}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Editor tools"
                subtitle="Quick summary of your current edit state"
              />
              <CardBody className="space-y-3">
                <MiniInfo label="Days" value={safeArray(form?.itinerary?.days).length} />
                <MiniInfo label="Total Activities" value={totalActivities} />
                <MiniInfo label="Estimated Hours" value={formatHours(totalEstimatedHours)} />
                <MiniInfo
                  label="Status"
                  value={hasUnsavedChanges ? "Editing..." : "No pending changes"}
                />
              </CardBody>
            </Card>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          {form.itinerary.days.map((day, dayIndex) => {
            const dayActivities = countDayActivities(day);
            const dayHours = getDayEstimatedHours(day);

            return (
              <Card
                key={dayIndex}
                className="overflow-hidden border border-slate-200 shadow-sm transition duration-300 hover:shadow-md"
              >
                <div className="bg-linear-to-r from-slate-900 to-slate-800 p-5 text-white">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/75">
                          Day {day.day}
                        </div>
                        <div className="mt-1 text-xl font-black">Edit day plan</div>
                        <div className="mt-1 text-sm text-white/75">
                          Refine activities, titles, day details, durations, and notes
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className="border-white/20 bg-white/10 text-white">
                          {dayActivities} activities
                        </Badge>
                        <Badge className="border-white/20 bg-white/10 text-white">
                          {formatHours(dayHours)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => moveDay(dayIndex, "up")}
                        disabled={dayIndex === 0}
                      >
                        ↑ Move day up
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => moveDay(dayIndex, "down")}
                        disabled={dayIndex === form.itinerary.days.length - 1}
                      >
                        ↓ Move day down
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="px-3 py-2 text-xs"
                        onClick={() => removeEmptyActivitiesFromDay(dayIndex)}
                      >
                        Clean empty activities
                      </Button>
                    </div>
                  </div>
                </div>

                <CardBody className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Day title"
                      placeholder="e.g. Historic center and local food"
                      value={day.title}
                      onChange={(e) => updateDay(dayIndex, "title", e.target.value)}
                    />
                    <Input
                      label="Day date"
                      type="date"
                      value={day.date}
                      onChange={(e) => updateDay(dayIndex, "date", e.target.value)}
                    />
                  </div>

                  {BLOCKS.map((block) => {
                    const meta = BLOCK_META[block];

                    return (
                      <div
                        key={block}
                        className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
                      >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                              <span>{meta.icon}</span>
                              {meta.title}
                              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                {safeArray(day[block]).length}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{meta.desc}</div>
                          </div>

                          <Button
                            type="button"
                            variant="secondary"
                            className="px-3 py-2 text-xs"
                            onClick={() => addActivity(dayIndex, block)}
                          >
                            Add activity
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {day[block].length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                              No activities yet in this block.
                            </div>
                          ) : (
                            day[block].map((activity, activityIndex) => (
                              <div
                                key={`${block}-${activityIndex}`}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                              >
                                <div className="mb-3 flex flex-col gap-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Activity {activityIndex + 1}
                                    </div>

                                    <Button
                                      type="button"
                                      variant="secondary"
                                      className="px-3 py-2 text-xs"
                                      onClick={() =>
                                        removeActivity(dayIndex, block, activityIndex)
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="px-3 py-2 text-xs"
                                      onClick={() =>
                                        moveActivityWithinBlock(
                                          dayIndex,
                                          block,
                                          activityIndex,
                                          "up"
                                        )
                                      }
                                      disabled={activityIndex === 0}
                                    >
                                      ↑ Up
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="px-3 py-2 text-xs"
                                      onClick={() =>
                                        moveActivityWithinBlock(
                                          dayIndex,
                                          block,
                                          activityIndex,
                                          "down"
                                        )
                                      }
                                      disabled={activityIndex === day[block].length - 1}
                                    >
                                      ↓ Down
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="px-3 py-2 text-xs"
                                      onClick={() =>
                                        moveActivityToAnotherBlock(
                                          dayIndex,
                                          block,
                                          activityIndex,
                                          "prev"
                                        )
                                      }
                                      disabled={BLOCKS.indexOf(block) === 0}
                                    >
                                      ← Previous plan
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className="px-3 py-2 text-xs"
                                      onClick={() =>
                                        moveActivityToAnotherBlock(
                                          dayIndex,
                                          block,
                                          activityIndex,
                                          "next"
                                        )
                                      }
                                      disabled={BLOCKS.indexOf(block) === BLOCKS.length - 1}
                                    >
                                      Next plan →
                                    </Button>

                                  </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <Input
                                    label="Title"
                                    placeholder="e.g. Visit the Colosseum"
                                    value={activity.title}
                                    onChange={(e) =>
                                      updateActivity(
                                        dayIndex,
                                        block,
                                        activityIndex,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <Input
                                    label="Location"
                                    placeholder="e.g. Colosseum, Rome, Italy"
                                    value={activity.location}
                                    onChange={(e) =>
                                      updateActivity(
                                        dayIndex,
                                        block,
                                        activityIndex,
                                        "location",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                  <Input
                                    label="Duration (hours)"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="e.g. 2"
                                    value={activity.durationHours}
                                    onChange={(e) =>
                                      updateActivity(
                                        dayIndex,
                                        block,
                                        activityIndex,
                                        "durationHours",
                                        e.target.value
                                      )
                                    }
                                  />

                                  <label className="block">
                                    <div className="mb-1.5 text-sm font-semibold text-slate-700">
                                      Notes
                                    </div>
                                    <textarea
                                      value={activity.notes}
                                      onChange={(e) =>
                                        updateActivity(
                                          dayIndex,
                                          block,
                                          activityIndex,
                                          "notes",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Extra notes, reminders, or advice..."
                                      className="min-h-25 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                                    />
                                  </label>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <div className="mb-1.5 text-sm font-semibold text-slate-700">
                        Food Suggestion
                      </div>
                      <textarea
                        value={day.foodSuggestion}
                        onChange={(e) => updateDay(dayIndex, "foodSuggestion", e.target.value)}
                        placeholder="Recommended meal, restaurant style, or local specialty..."
                        className="min-h-25 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1.5 text-sm font-semibold text-slate-700">
                        Backup Plan
                      </div>
                      <textarea
                        value={day.backupPlan}
                        onChange={(e) => updateDay(dayIndex, "backupPlan", e.target.value)}
                        placeholder="Alternative idea in case of weather or time issues..."
                        className="min-h-25 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                      />
                    </label>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </form>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}