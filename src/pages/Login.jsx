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
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left side */}
      <div className="lg:col-span-5">
        <Card className="overflow-hidden border-slate-200 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.28)]">
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white sm:p-8">
            <div className="absolute -left-8 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative">
              <Badge className="border-white/20 bg-white/15 text-white">
                Welcome Back
              </Badge>

              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Sign in to your travel account
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/90">
                Access your saved trips, generate new itineraries, and continue planning
                with a cleaner, smarter travel experience.
              </p>

              <div className="mt-6 grid gap-3">
                <InfoCard
                  title="Saved itineraries"
                  text="Open and manage the trips you already created in your account."
                />
                <InfoCard
                  title="AI trip generation"
                  text="Build day-by-day travel plans based on your destination and preferences."
                />
                <InfoCard
                  title="Secure account access"
                  text="Sign in safely and manage your profile in one place."
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Right side */}
      <div className="lg:col-span-7">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader
            title="Login"
            subtitle="Enter your email and password to continue"
          />

          <CardBody>
            <form onSubmit={onSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())} autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              {err ? <Alert type="error">{err}</Alert> : null}

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Use the same account you used to save your trips.
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-sky-700 transition hover:text-sky-900"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                  {loading ? "Logging in..." : "Login"}
                </Button>

                <Link
                  to="/register"
                  className="text-sm font-semibold text-slate-700 transition hover:text-sky-700"
                >
                  Create account →
                </Link>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Sign in to create trips, save itineraries, and manage your travel plans
                from one dashboard.
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="text-sm font-bold text-white">{title}</div>
      <div className="mt-1 text-sm leading-6 text-white/85">{text}</div>
    </div>
  );
}