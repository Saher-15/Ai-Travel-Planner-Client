import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
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

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder = "••••••••",
  autoComplete = "new-password",
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-sky-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function Requirement({ ok, text }) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 text-sm transition ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {text}
    </div>
  );
}

export default function Register() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function isStrongPassword(pw) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      pw
    );
  }

  const passwordChecks = useMemo(() => {
    return {
      minLength: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
      matches:
        password.length > 0 &&
        confirmPassword.length > 0 &&
        password === confirmPassword,
    };
  }, [password, confirmPassword]);

  const canSubmit = useMemo(() => {
    return (
      !loading &&
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length > 0 &&
      confirmPassword.trim().length > 0
    );
  }, [name, email, password, confirmPassword, loading]);

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
          email: email.trim().toLowerCase(),
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
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50" />
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
                icon={<Sparkles size={18} />}
                title="Trips"
                value="Smart"
                subtitle="Build better itineraries"
              />
              <HeroStat
                icon={<UserPlus size={18} />}
                title="Library"
                value="Saved"
                subtitle="Keep all plans in one place"
              />
              <HeroStat
                icon={<ShieldCheck size={18} />}
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

            <CardBody className="space-y-6 bg-gradient-to-b from-white to-slate-50/60">
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
                    <PasswordField
                      label="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      show={showPassword}
                      onToggle={() => setShowPassword((prev) => !prev)}
                      placeholder="Create a strong password"
                    />

                    <PasswordField
                      label="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      show={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((prev) => !prev)}
                      placeholder="Re-enter your password"
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-800">
                    Password requirements
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Requirement
                      ok={passwordChecks.minLength}
                      text="At least 8 characters"
                    />
                    <Requirement
                      ok={passwordChecks.upper}
                      text="One uppercase letter"
                    />
                    <Requirement
                      ok={passwordChecks.lower}
                      text="One lowercase letter"
                    />
                    <Requirement
                      ok={passwordChecks.number}
                      text="One number"
                    />
                    <Requirement
                      ok={passwordChecks.special}
                      text="One special character"
                    />
                    <Requirement
                      ok={passwordChecks.matches}
                      text="Passwords match"
                    />
                  </div>
                </div>

                {err ? <Alert type="error">{err}</Alert> : null}
                {ok ? <Alert type="success">{ok}</Alert> : null}

                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  Create your account to start generating itineraries, saving
                  trips, and organizing your travel plans in one place.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-700 transition hover:text-sky-700"
                  >
                    Already have an account →
                  </Link>

                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full sm:w-auto"
                  >
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

            <CardBody className="bg-gradient-to-b from-white to-slate-50/60">
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

            <CardBody className="bg-gradient-to-b from-white to-slate-50/60">
              <div className="rounded-[1.5rem] border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-5">
                <div className="text-base font-bold text-slate-900">
                  Welcome back
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  If you already have an account, sign in to access saved trips,
                  manage your profile, and continue planning with your AI travel
                  dashboard.
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

function HeroStat({ icon, title, value, subtitle }) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white">
        {icon}
      </div>
      <div className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
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
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-sm font-black text-white">
        {number}
      </div>

      <div>
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="mt-1 text-sm leading-6 text-slate-600">{text}</div>
      </div>
    </div>
  );
}