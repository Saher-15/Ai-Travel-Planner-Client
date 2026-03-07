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
      load();
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

    return trips.filter((t) =>
      (t.destination || "").toLowerCase().includes(q)
    );
  }, [trips, query]);

  return (
    <div className="space-y-6">
      {/* Top hero/dashboard card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-white/80">
                Travel dashboard
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                My Trips
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
                View, search, and manage your saved itineraries in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="border-white/20 bg-white/10 text-white">
                {filtered.length} trip{filtered.length !== 1 ? "s" : ""}
              </Badge>
              <Badge className="border-white/20 bg-white/10 text-white">
                Saved in your account
              </Badge>
            </div>
          </div>
        </div>

        <CardBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:max-w-sm">
              <Input
                label="Search by destination"
                placeholder="e.g., Paris"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => nav("/create")}>Create Trip</Button>
              <Button onClick={load} variant="secondary">
                Refresh
              </Button>
            </div>
          </div>

          {err ? (
            <div className="mt-4">
              <Alert type="error">{err}</Alert>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* Content */}
      {loading ? (
        <TripsSkeleton />
      ) : filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
        <EmptyTrips onCreate={() => nav("/create")} />
      )}
    </div>
  );
}

function TripCard({ trip, onView, onDelete }) {
  return (
    <Card className="group overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.28)]">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/75">
          Destination
        </div>

        <div className="mt-1 text-xl font-black tracking-tight">
          {trip.destination || "Untitled Trip"}
        </div>

        <div className="mt-2 text-sm text-white/85">
          {fmtRange(trip.startDate, trip.endDate)}
        </div>
      </div>

      <CardBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {trip.preferences?.pace ? (
            <Badge>pace: {trip.preferences.pace}</Badge>
          ) : null}

          {trip.preferences?.budget ? (
            <Badge>budget: {trip.preferences.budget}</Badge>
          ) : null}

          {trip.itinerary?.tripSummary?.days ? (
            <Badge>{trip.itinerary.tripSummary.days} days</Badge>
          ) : null}
        </div>

        {!!trip.preferences?.interests?.length && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Interests
            </div>
            <div className="flex flex-wrap gap-2">
              {trip.preferences.interests.slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Open this itinerary to view daily plans, map route, and trip tips.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onView} variant="secondary" className="w-full sm:w-auto">
            View Trip
          </Button>
          <Button onClick={onDelete} variant="danger" className="w-full sm:w-auto">
            Delete
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function EmptyTrips({ onCreate }) {
  return (
    <Card>
      <CardBody>
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-black text-slate-900">No trips found</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">
              You haven’t saved any itineraries yet. Create your first trip and
              start building your travel dashboard.
            </div>
          </div>

          <Button onClick={onCreate}>Create Trip</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function TripsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-28 animate-pulse bg-slate-200" />
          <CardBody>
            <div className="space-y-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
              </div>
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}