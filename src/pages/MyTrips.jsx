import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function fmtRange(start, end) {
  return start && end ? `${start} → ${end}` : "Dates not set";
}

export default function MyTrips() {
    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const nav = useNavigate();

  const [trips, setTrips] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setErr("");
    setLoading(true);

    try {
      const { data } = await api.get("/trips");
      setTrips(Array.isArray(data) ? data : []);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to load trips (login first)");
    } finally {
      setLoading(false);
    }
  }

  async function del(id) {
    if (!window.confirm("Delete this trip?")) return;

    try {
      await api.delete(`/trips/${id}`);
      setTrips((prev) => prev.filter((item) => item._id !== id));
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to delete trip");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;

    return trips.filter((t) => (t.destination || "").toLowerCase().includes(q));
  }, [trips, query]);

  const totalTrips = trips.length;
  const filteredTrips = filtered.length;
  const totalDays = trips.reduce(
    (sum, trip) => sum + Number(trip?.itinerary?.tripSummary?.days || 0),
    0
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-4xl border border-slate-200/70 bg-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-white to-indigo-50" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative grid gap-6 p-6 lg:grid-cols-12 lg:p-8">
          <div className="lg:col-span-8">
            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
              Travel Dashboard
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              My Trips
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Explore, search, and manage all your saved itineraries in one clean
              dashboard built for a stronger and more premium trip planning
              experience.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <HeroStat
                title="Saved Trips"
                value={totalTrips}
                subtitle="Stored in your account"
              />
              <HeroStat
                title="Search Results"
                value={filteredTrips}
                subtitle="Matching your filter"
              />
              <HeroStat
                title="Planned Days"
                value={totalDays}
                subtitle="Across all itineraries"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="text-sm font-bold text-slate-900">
                Manage your journey library
              </div>

              <div className="mt-4 grid gap-3">
                <MiniInfo
                  title="View itineraries"
                  text="Open full day-by-day trip plans anytime."
                />
                <MiniInfo
                  title="Search quickly"
                  text="Find trips fast by destination name."
                />
                <MiniInfo
                  title="Stay organized"
                  text="Keep your travel ideas saved in one place."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
        <CardHeader
          title="Trip library"
          subtitle="Search your destinations and manage saved itineraries"
        />

        <CardBody className="space-y-5 bg-linear-to-b from-white to-slate-50/60">
          <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <Input
                label="Search by destination"
                placeholder="e.g., City"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="lg:col-span-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button onClick={() => nav("/create")}>Create Trip</Button>
                <Button onClick={load} variant="secondary">
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="border-slate-200 bg-white text-slate-700">
              {filteredTrips} trip{filteredTrips !== 1 ? "s" : ""}
            </Badge>
            <Badge className="border-slate-200 bg-white text-slate-700">
              Saved in your account
            </Badge>
            {!!query.trim() && (
              <Badge className="border-sky-200 bg-sky-50 text-sky-700">
                Filter: {query.trim()}
              </Badge>
            )}
          </div>

          {err ? <Alert type="error">{err}</Alert> : null}
        </CardBody>
      </Card>

      {loading ? (
        <TripsSkeleton />
      ) : filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((t) => (
            <TripCard
              key={t._id}
              trip={t}
              onView={() => nav(`/trip/${t._id}`)}
              onDelete={() => del(t._id)}
            />
          ))}
        </div>
      ) : (
        <EmptyTrips
          hasSearch={Boolean(query.trim())}
          onCreate={() => nav("/create")}
          onClear={() => setQuery("")}
        />
      )}
    </div>
  );
}

function TripCard({ trip, onView, onDelete }) {
  const destination = trip.destination || "Untitled Trip";
  const tripDays = trip.itinerary?.tripSummary?.days;
  const budget = trip.preferences?.budget;
  const pace = trip.preferences?.pace;
  const interests = trip.preferences?.interests || [];

  return (
    <Card className="group overflow-hidden border border-slate-200/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_-24px_rgba(15,23,42,0.24)]">
      <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-sky-400/10 blur-2xl" />

        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            Destination
          </div>

          <div className="mt-2 line-clamp-2 text-2xl font-black tracking-tight">
            {destination}
          </div>

          <div className="mt-3 text-sm text-white/85">
            {fmtRange(trip.startDate, trip.endDate)}
          </div>
        </div>
      </div>

      <CardBody className="space-y-5 bg-linear-to-b from-white to-slate-50/50">
        <div className="flex flex-wrap gap-2">
          {pace ? (
            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
              Pace: {pace}
            </Badge>
          ) : null}

          {budget ? (
            <Badge className="border-violet-200 bg-violet-50 text-violet-700">
              Budget: {budget}
            </Badge>
          ) : null}

          {tripDays ? (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
              {tripDays} days
            </Badge>
          ) : null}
        </div>

        {!!interests.length && (
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Interests
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.slice(0, 5).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Open this itinerary to explore daily plans, map routes, and trip tips in
          a more detailed travel view.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onView} variant="secondary" className="w-full sm:flex-1">
            View Trip
          </Button>
          <Button onClick={onDelete} variant="danger" className="w-full sm:flex-1">
            Delete
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function EmptyTrips({ onCreate, onClear, hasSearch }) {
  return (
    <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
      <CardBody className="bg-linear-to-b from-white to-slate-50/60">
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-linear-to-br from-sky-500 via-blue-600 to-indigo-700 text-xl font-black text-white shadow-lg">
            ✈
          </div>

          <div className="mt-5 text-2xl font-black tracking-tight text-slate-900">
            {hasSearch ? "No matching trips found" : "No trips yet"}
          </div>

          <div className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
            {hasSearch
              ? "Try a different destination keyword or clear your search to see all saved itineraries."
              : "You haven’t saved any itineraries yet. Create your first trip and start building your personal travel dashboard."}
          </div>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {hasSearch ? (
              <Button variant="secondary" onClick={onClear}>
                Clear Search
              </Button>
            ) : null}
            <Button onClick={onCreate}>Create Trip</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function TripsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border border-slate-200/80">
          <div className="h-36 animate-pulse bg-slate-200" />
          <CardBody className="space-y-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="flex gap-2">
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="h-24 animate-pulse rounded-[1.25rem] bg-slate-100" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function HeroStat({ title, value, subtitle }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

function MiniInfo({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  );
}