import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Alert,
  Badge,
} from "../components/UI";

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
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
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

export default function ResetPassword() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { token } = useParams();
  const nav = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function isStrongPassword(pw) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      pw
    );
  }

  const passwordChecks = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[@$!%*?&]/.test(newPassword),
      matches:
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const canSubmit = useMemo(() => {
    return (
      !loading &&
      Boolean(token) &&
      newPassword.trim().length > 0 &&
      confirmPassword.trim().length > 0
    );
  }, [loading, token, newPassword, confirmPassword]);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!token) {
      setErr("Invalid or missing reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setErr(
        "Password must be 8+ characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        newPassword,
        confirmPassword,
      });

      setMsg(data?.message || "Password reset successfully.");
      setTimeout(() => nav("/login"), 1000);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50" />
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative grid gap-6 p-6 lg:grid-cols-12 lg:p-8">
          <div className="lg:col-span-8">
            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
              Secure Reset
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Create your new password
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Choose a strong password to keep your travel account secure and
              regain access to your saved trips, itineraries, and profile.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <InfoStat
                icon={<LockKeyhole size={18} />}
                title="Protected"
                text="Your account security comes first."
              />
              <InfoStat
                icon={<ShieldCheck size={18} />}
                title="Strong Password"
                text="Use a safer password for better protection."
              />
              <InfoStat
                icon={<Eye size={18} />}
                title="Easy Review"
                text="Show or hide passwords while typing."
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="text-sm font-bold text-slate-900">
                Helpful tip
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-600">
                Use a password you have not used before and make sure it is easy
                for you to remember but hard for others to guess.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Reset Password"
              subtitle="Enter and confirm your new password"
            />

            <CardBody className="space-y-6 bg-gradient-to-b from-white to-slate-50/60">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <div className="text-lg font-bold text-slate-900">
                      New password
                    </div>
                    <div className="text-sm text-slate-500">
                      Make sure your new password meets all security requirements
                    </div>
                  </div>

                  <div className="space-y-5">
                    <PasswordField
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      show={showNewPassword}
                      onToggle={() => setShowNewPassword((v) => !v)}
                    />

                    <PasswordField
                      label="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      show={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((v) => !v)}
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

                {msg ? <Alert type="success">{msg}</Alert> : null}
                {err ? <Alert type="error">{err}</Alert> : null}

                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  After resetting your password, you will be redirected to the
                  login page to sign in with your new credentials.
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-700 transition hover:text-sky-700"
                  >
                    Back to login
                  </Link>

                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full sm:w-auto"
                  >
                    {loading ? "Updating..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Security checklist"
              subtitle="A strong password protects your account"
            />

            <CardBody className="bg-gradient-to-b from-white to-slate-50/60">
              <div className="space-y-4">
                <SideStep
                  number="1"
                  title="Use a unique password"
                  text="Avoid reusing an old password from another account."
                />
                <SideStep
                  number="2"
                  title="Keep it strong"
                  text="Use uppercase, lowercase, numbers, and symbols."
                />
                <SideStep
                  number="3"
                  title="Save it safely"
                  text="Store it in a trusted password manager if needed."
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoStat({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white">
        {icon}
      </div>
      <div className="mt-3 text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{text}</div>
    </div>
  );
}

function SideStep({ number, title, text }) {
  return (
    <div className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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