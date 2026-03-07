import { useState } from "react";
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
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left side */}
      <div className="lg:col-span-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-6 text-white">
            <Badge className="border-white/20 bg-white/15 text-white">
              Support
            </Badge>

            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Contact our travel team
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/90">
              Need help with your itinerary, account, or trip planning experience?
              Send us a message and we’ll get back to you soon.
            </p>

            <div className="mt-6 grid gap-3">
              <InfoCard
                title="Trip planning help"
                text="Questions about destinations, preferences, and itinerary generation."
              />
              <InfoCard
                title="Account support"
                text="Need help with login, profile, or email verification issues."
              />
              <InfoCard
                title="Feature requests"
                text="Share ideas to make your travel planner feel even more powerful."
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Right side */}
      <div className="lg:col-span-7">
        <Card>
          <CardHeader
            title="Send us a message"
            subtitle="We’d love to hear from you"
          />

          <CardBody>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Name" placeholder="Your name" required />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@email.com"
                  required
                />
              </div>

              <label className="block">
                <div className="mb-1.5 text-sm font-semibold text-slate-700">
                  Message
                </div>
                <textarea
                  required
                  rows={6}
                  placeholder="Tell us how we can help you..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                />
              </label>

              {sent ? (
                <Alert type="success">
                  Message sent successfully (demo). We’ll reply soon.
                </Alert>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit">Send Message</Button>
                <div className="text-xs text-slate-500">
                  Demo form for now — no backend email sending yet.
                </div>
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