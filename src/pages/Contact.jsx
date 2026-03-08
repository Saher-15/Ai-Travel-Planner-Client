import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthProvider";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
} from "../components/UI.jsx";

export default function Contact() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const { data } = await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setMsg({
        type: "success",
        text: data?.message || "Message sent successfully. We’ll reply soon.",
      });

      setForm((prev) => ({
        ...prev,
        subject: "",
        message: "",
      }));
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Failed to send message. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-white to-indigo-50" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative grid gap-6 p-6 lg:grid-cols-12 lg:p-8">
          <div className="lg:col-span-8">
            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
              Support Center
            </Badge>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Contact our travel team
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Need help with your itinerary, account, or planning experience?
              Send us a message and admin replies will appear inside your profile
              page so everything stays organized in one place.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <HeroStat
                title="Trip help"
                value="AI"
                subtitle="Planner guidance"
              />
              <HeroStat
                title="Support"
                value="24/7"
                subtitle="Message anytime"
              />
              <HeroStat
                title="Replies"
                value="Profile"
                subtitle="Track responses"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="text-sm font-bold text-slate-900">
                What can we help with?
              </div>

              <div className="mt-4 grid gap-3">
                <MiniInfo
                  title="Trip planning help"
                  text="Destinations, itinerary preferences, and travel ideas."
                />
                <MiniInfo
                  title="Account support"
                  text="Profile, login, verification, and account questions."
                />
                <MiniInfo
                  title="Feature requests"
                  text="Share improvements you want to see in the planner."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Send us a message"
              subtitle="We’d love to hear from you"
            />

            <CardBody className="space-y-6 bg-linear-to-b from-white to-slate-50/60">
              {msg ? <Alert type={msg.type}>{msg.text}</Alert> : null}

              <form onSubmit={onSubmit} className="space-y-6">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <div className="text-lg font-bold text-slate-900">
                      Your information
                    </div>
                    <div className="text-sm text-slate-500">
                      We’ll use these details for your support request
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Name"
                      placeholder="Your name"
                      required
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="you@email.com"
                      required
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5">
                    <div className="text-lg font-bold text-slate-900">
                      Message details
                    </div>
                    <div className="text-sm text-slate-500">
                      Tell us clearly what you need help with
                    </div>
                  </div>

                  <div className="space-y-5">
                    <Input
                      label="Subject"
                      placeholder="What do you need help with?"
                      required
                      value={form.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                    />

                    <label className="block">
                      <div className="mb-1.5 text-sm font-semibold text-slate-700">
                        Message
                      </div>
                      <textarea
                        required
                        rows={7}
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        placeholder="Tell us how we can help you..."
                        className="w-full resize-none rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                      />
                      <div className="mt-2 text-xs text-slate-500">
                        Be specific so we can help you faster and better.
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    Replies from admin will appear in your profile page.
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="How support works"
              subtitle="Simple and organized communication"
            />

            <CardBody className="bg-linear-to-b from-white to-slate-50/60">
              <div className="space-y-4">
                <StepCard
                  number="1"
                  title="Send your message"
                  text="Write your support request with your subject and details."
                />
                <StepCard
                  number="2"
                  title="Admin reviews it"
                  text="Your message is received and checked from the admin panel."
                />
                <StepCard
                  number="3"
                  title="Reply appears in profile"
                  text="When admin responds, you’ll see the reply inside your profile page."
                />
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.16)]">
            <CardHeader
              title="Best message tips"
              subtitle="Get better support answers"
            />

            <CardBody className="bg-linear-to-b from-white to-slate-50/60">
              <div className="space-y-3 text-sm text-slate-600">
                <TipItem text="Use a clear subject line." />
                <TipItem text="Describe the issue or request in simple steps." />
                <TipItem text="Mention where the problem happened in the app." />
                <TipItem text="Include enough detail so support can understand quickly." />
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

function TipItem({ text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
      <div>{text}</div>
    </div>
  );
}