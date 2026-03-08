import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useAuth } from "../auth/AuthProvider";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => {
    return normalizeEmail(email) && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

  async function onSubmit(e) {
    e.preventDefault();

    if (loading) return;

    const cleanEmail = normalizeEmail(email);
    const cleanPassword = password;

    setErr("");

    if (!cleanEmail || !cleanPassword.trim()) {
      setErr("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        "/auth/login",
        { email: cleanEmail, password: cleanPassword },
        { withCredentials: true }
      );

      await refresh();

      const loggedInUser = data?.user;

      if (loggedInUser?.verified === false) {
        nav("/profile");
      } else {
        nav("/");
      }
    } catch (e2) {
      if (e2?.response?.status === 429) {
        setErr("Too many login attempts. Please wait a few minutes and try again.");
      } else {
        setErr(e2?.response?.data?.message || "Login failed");
      }
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
              Welcome Back
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Sign in to your travel account
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Access your saved trips, generate new itineraries, and continue
              planning with a cleaner, smarter, and more premium travel
              experience.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <HeroStat
                title="Trips"
                value="Saved"
                subtitle="Your itineraries in one place"
              />
              <HeroStat
                title="Planner"
                value="AI"
                subtitle="Generate smarter travel plans"
              />
              <HeroStat
                title="Access"
                value="Secure"
                subtitle="Manage your account safely"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="text-sm font-bold text-slate-900">
                Why sign in?
              </div>

              <div className="mt-4 grid gap-3">
                <MiniInfo
                  title="Saved itineraries"
                  text="Open and manage the trips you already created."
                />
                <MiniInfo
                  title="AI trip generation"
                  text="Build day-by-day travel plans faster."
                />
                <MiniInfo
                  title="Profile & support"
                  text="Manage your account and view support replies."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Login"
              subtitle="Enter your email and password to continue"
            />

            <CardBody className="space-y-6 bg-linear-to-b from-white to-slate-50/60">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <div className="text-lg font-bold text-slate-900">
                      Account details
                    </div>
                    <div className="text-sm text-slate-500">
                      Use the same account you used to save your trips
                    </div>
                  </div>

                  <div className="space-y-5">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                      autoComplete="email"
                    />

                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {err ? <Alert type="error">{err}</Alert> : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    Secure login for your personal travel dashboard.
                  </div>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-sky-700 transition hover:text-sky-900"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  Sign in to create trips, save itineraries, and manage your
                  travel plans from one place.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-slate-700 transition hover:text-sky-700"
                  >
                    Create account →
                  </Link>

                  <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="What you get after login"
              subtitle="Your travel tools in one place"
            />

            <CardBody className="bg-linear-to-b from-white to-slate-50/60">
              <div className="space-y-4">
                <StepCard
                  number="1"
                  title="Access your saved trips"
                  text="Open your personal itinerary library and continue planning."
                />
                <StepCard
                  number="2"
                  title="Create smarter travel plans"
                  text="Generate structured day-by-day trips for your destinations."
                />
                <StepCard
                  number="3"
                  title="Manage your profile"
                  text="Update account security and view support replies easily."
                />
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Need an account?"
              subtitle="Start your travel planner journey"
            />

            <CardBody className="bg-linear-to-b from-white to-slate-50/60">
              <div className="rounded-[1.5rem] border border-sky-100 bg-linear-to-r from-sky-50 to-indigo-50 p-5">
                <div className="text-base font-bold text-slate-900">
                  New here?
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  Create an account to save itineraries, access your profile, and
                  keep your travel plans organized in one premium dashboard.
                </div>

                <div className="mt-5">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ title, value, subtitle }) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
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

function StepCard({ number, title, text }) {
  return (
    <div className="flex gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-sky-500 via-blue-600 to-indigo-700 text-sm font-black text-white">
        {number}
      </div>

      <div>
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="mt-1 text-sm leading-6 text-slate-600">{text}</div>
      </div>
    </div>
  );
}