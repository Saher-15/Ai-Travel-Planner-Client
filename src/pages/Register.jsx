import { useState } from "react";
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

export default function Register() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function isStrongPassword(pw) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      pw
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErr("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    if (!isStrongPassword(password)) {
      setErr(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post(
        "/auth/register",
        {
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        },
        { withCredentials: false }
      );

      setOk("Account created successfully. Redirecting to login...");
      setTimeout(() => nav("/login"), 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Register failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left side */}
      <div className="lg:col-span-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white">
            <Badge className="border-white/20 bg-white/15 text-white">
              New Account
            </Badge>

            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Create your travel account
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/90">
              Join your AI travel planner to generate itineraries, save trips,
              and manage your travel ideas in one clean dashboard.
            </p>

            <div className="mt-6 grid gap-3">
              <InfoCard
                title="Generate smarter trips"
                text="Create day-by-day travel plans based on destination, pace, and interests."
              />
              <InfoCard
                title="Save everything"
                text="Store your itineraries in your account and come back to them anytime."
              />
              <InfoCard
                title="Secure access"
                text="Create your account once and manage your travel planning securely."
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Right side */}
      <div className="lg:col-span-7">
        <Card>
          <CardHeader
            title="Register"
            subtitle="Create your account to start planning trips"
          />

          <CardBody>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())} autoComplete="email"
                />
              </div>

              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Your password must include uppercase, lowercase, number, and a
                special character.
              </div>

              {err ? <Alert type="error">{err}</Alert> : null}
              {ok ? <Alert type="success">{ok}</Alert> : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Creating..." : "Create Account"}
                </Button>

                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 transition hover:text-sky-700"
                >
                  Already have an account →
                </Link>
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