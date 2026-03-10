import { useState, useEffect} from "react";
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
    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
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
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-white to-indigo-50" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative grid gap-6 p-6 lg:grid-cols-12 lg:p-8">
          <div className="lg:col-span-8">
            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
              New Account
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Create your travel account
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Join your AI travel planner to generate itineraries, save trips,
              and manage your travel ideas in one clean and premium dashboard.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <HeroStat
                title="Trips"
                value="Smart"
                subtitle="Build better itineraries"
              />
              <HeroStat
                title="Library"
                value="Saved"
                subtitle="Keep all plans in one place"
              />
              <HeroStat
                title="Account"
                value="Secure"
                subtitle="Protected access and profile tools"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="text-sm font-bold text-slate-900">
                Why create an account?
              </div>

              <div className="mt-4 grid gap-3">
                <MiniInfo
                  title="Generate smarter trips"
                  text="Create day-by-day plans based on destination, pace, and interests."
                />
                <MiniInfo
                  title="Save everything"
                  text="Store itineraries and come back to them anytime."
                />
                <MiniInfo
                  title="Manage securely"
                  text="Keep your travel planning organized in one account."
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
              title="Register"
              subtitle="Create your account to start planning trips"
            />

            <CardBody className="space-y-6 bg-linear-to-b from-white to-slate-50/60">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <div className="text-lg font-bold text-slate-900">
                      Personal details
                    </div>
                    <div className="text-sm text-slate-500">
                      Enter your basic account information
                    </div>
                  </div>

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
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <div className="text-lg font-bold text-slate-900">
                      Security setup
                    </div>
                    <div className="text-sm text-slate-500">
                      Create a strong password for your account
                    </div>
                  </div>

                  <div className="space-y-5">
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
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-800">
                    Password requirements
                  </div>
                  <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div>• At least 8 characters</div>
                    <div>• One uppercase letter</div>
                    <div>• One lowercase letter</div>
                    <div>• One number</div>
                    <div>• One special character</div>
                  </div>
                </div>

                {err ? <Alert type="error">{err}</Alert> : null}
                {ok ? <Alert type="success">{ok}</Alert> : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-700 transition hover:text-sky-700"
                  >
                    Already have an account →
                  </Link>

                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="What happens next"
              subtitle="A simple start to your travel planning"
            />

            <CardBody className="bg-linear-to-b from-white to-slate-50/60">
              <div className="space-y-4">
                <StepCard
                  number="1"
                  title="Create your account"
                  text="Set up your personal travel planner profile in seconds."
                />
                <StepCard
                  number="2"
                  title="Log in and start planning"
                  text="Access the planner tools and create your first itinerary."
                />
                <StepCard
                  number="3"
                  title="Save and manage trips"
                  text="Keep your travel ideas organized in your own dashboard."
                />
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Already a member?"
              subtitle="Sign in and continue your journey"
            />

            <CardBody className="bg-linear-to-b from-white to-slate-50/60">
              <div className="rounded-[1.5rem] border border-sky-100 bg-linear-to-r from-sky-50 to-indigo-50 p-5">
                <div className="text-base font-bold text-slate-900">
                  Welcome back
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  If you already have an account, sign in to access saved trips,
                  manage your profile, and continue planning with your AI travel dashboard.
                </div>

                <div className="mt-5">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
                  >
                    Go to Login
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