import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Badge } from "../components/UI.jsx";

const cx = (...c) => c.filter(Boolean).join(" ");

const STOCK = {
  hero: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",  ],
  visual:
    "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=80",
};

const features = [
  {
    title: "AI day-by-day itinerary",
    text: "Generate practical travel plans with structured morning, afternoon, and evening activities.",
    icon: "✨",
  },
  {
    title: "Smart travel pacing",
    text: "Build trips that match different travel rhythms like relaxed, balanced, or packed adventures.",
    icon: "⚡",
  },
  {
    title: "Save your journeys",
    text: "Keep all your travel plans in one place and revisit them anytime from your trip library.",
    icon: "📁",
  },
  {
    title: "Visual planning experience",
    text: "Enjoy a premium planner interface that feels modern, clean, and inspiring.",
    icon: "🗺️",
  },
];

const highlights = [
  "AI itinerary generation",
  "Portfolio-ready planner UI",
  "Destination-focused experience",
];

const stats = [
  { label: "Generation speed", value: "Fast", sub: "quick itinerary creation flow" },
  { label: "Daily structure", value: "3 blocks", sub: "morning / afternoon / evening" },
  { label: "Trip management", value: "Easy", sub: "save and revisit your plans" },
  { label: "Experience", value: "Premium", sub: "modern clean planner design" },
];

const steps = [
  {
    title: "Choose your destination",
    text: "Start with the place you want to visit and define your travel dates.",
    number: "01",
  },
  {
    title: "Set your travel style",
    text: "Decide how you want your journey to feel before generating the itinerary.",
    number: "02",
  },
  {
    title: "Generate the trip plan",
    text: "Let the planner create a structured and inspiring trip for your journey.",
    number: "03",
  },
];

const POPULAR_DESTINATIONS = [
  {
    name: "Paris, France",
    tag: "Romantic city energy",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    badge: "Inspiration",
  },
  {
    name: "Tokyo, Japan",
    tag: "Modern culture & food",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    badge: "Popular",
  },
  {
    name: "Bali, Indonesia",
    tag: "Nature & calm escape",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    badge: "Relaxed",
  },
  {
    name: "New York, USA",
    tag: "Urban discovery",
    image:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    badge: "City trip",
  },
];

const plannerBenefits = [
  "Cleaner project identity",
  "More relevant user experience",
  "Stronger AI travel planner branding",
  "Better portfolio and recruiter impression",
];

const travelModes = [
  {
    title: "Relaxed planner",
    text: "For travelers who want slower days, fewer stops, and more breathing space.",
    icon: "🌿",
  },
  {
    title: "Balanced explorer",
    text: "For travelers who want a healthy mix of attractions, food, and free time.",
    icon: "🧭",
  },
  {
    title: "Packed adventure",
    text: "For travelers who want to maximize the day and explore more locations.",
    icon: "🔥",
  },
];

export default function Home() {
    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const nav = useNavigate();
  const [a, b, c] = useMemo(() => STOCK.hero, []);

  const goToCreate = (payload = {}) => {
    const params = new URLSearchParams();

    if (payload.destination) params.set("destination", payload.destination);
    if (payload.travelers) params.set("travelers", payload.travelers);
    if (payload.tripType) params.set("tripType", payload.tripType);

    nav(`/create?${params.toString()}`);
  };

  return (
    <div className="space-y-20">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_30px_100px_-35px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),linear-gradient(to_bottom_right,#f8fbff,#ffffff,#f2f8ff)]" />
          <div className="absolute -left-10 top-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-100/30 blur-3xl" />
          <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[32px_32px]" />
        </div>

        <div className="relative grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-12 lg:px-10 lg:py-14">
          {/* LEFT */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.9)]" />
              AI-powered travel planner
            </div>

            <div className="mt-6 max-w-3xl">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl">
                Turn ideas into
                <span className="mt-2 block bg-linear-to-r from-sky-700 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  extraordinary travel plans.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Build beautiful AI-generated itineraries without booking clutter.
                Focus on destination inspiration, smart daily planning, and a premium
                experience from the first click.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur"
                >
                  <span className="text-emerald-600">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="w-full sm:w-auto" onClick={() => nav("/create")}>
                Start Planning
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => nav("/trips")}
              >
                Explore My Trips
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{item.value}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="grid gap-4 sm:grid-cols-2">
                <PhotoCard
                  src={a}
                  className="min-h-60 sm:row-span-2 sm:min-h-full"
                  badge="Top destinations"
                />
                <PhotoCard src={b} className="min-h-42.5" badge="Culture & food" />
                <PhotoCard src={c} className="min-h-42.5" badge="Nature & escape" />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoCard
                  title="Focused planning"
                  subtitle="No bookings. Just destination-first trip creation."
                  badge="Clear identity"
                />
                <div className="rounded-3xl border border-sky-100 bg-linear-to-br from-sky-600 to-blue-700 p-4 text-white shadow-lg">
                  <div className="text-sm font-bold">Premium planner feel</div>
                  <div className="mt-1 text-xs text-white/80">
                    Strong visuals, smart sections, and a cleaner project story.
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUE STRIP */}
      <section className="overflow-hidden rounded-4xl border border-slate-200 bg-white px-6 py-5 shadow-sm sm:px-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            "AI itinerary builder",
            "Smart daily trip flow",
            "Visual travel inspiration",
            "Saved trips experience",
          ].map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            How it works
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            A simple journey from inspiration to itinerary
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
            Your homepage should guide visitors naturally into creating a trip, not
            feel like a reservation marketplace.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <Card
              key={step.number}
              className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(15,23,42,0.3)]"
            >
              <CardBody className="relative space-y-4">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-100 blur-2xl transition duration-300 group-hover:bg-sky-200" />
                <div className="relative">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-sm font-black text-white shadow-sm">
                    {step.number}
                  </div>
                  <div className="mt-4 text-lg font-black text-slate-900">{step.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{step.text}</div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* PLANNING MODES */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            Planning styles
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            Choose how the trip should feel
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
            These blocks make the planner feel smarter and more personalized.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {travelModes.map((mode) => (
            <Card
              key={mode.title}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(15,23,42,0.3)]"
            >
              <CardBody className="space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-2xl shadow-sm">
                  {mode.icon}
                </div>
                <div className="text-lg font-black text-slate-900">{mode.title}</div>
                <div className="text-sm leading-6 text-slate-600">{mode.text}</div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* POPULAR DESTINATIONS */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              Destination inspiration
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Pick a place and jump directly into planning
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
              Each card acts as an inspiration-first shortcut to your Create Trip page.
            </p>
          </div>

          <Button variant="secondary" className="text-xs sm:text-sm" onClick={() => nav("/create")}>
            Start a blank trip
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {POPULAR_DESTINATIONS.map((d) => (
            <Card
              key={d.name}
              className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(15,23,42,0.3)]"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={d.image}
                  alt={d.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    {d.badge}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-lg font-black text-white">{d.name}</div>
                  <div className="text-xs text-white/80">{d.tag}</div>
                </div>
              </div>

              <CardBody className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Inspiration ready
                  </span>
                  <Badge>{d.badge}</Badge>
                </div>

                <Button
                  className="w-full"
                  onClick={() =>
                    goToCreate({
                      destination: d.name,
                      travelers: "2",
                      tripType: "round",
                    })
                  }
                >
                  Plan this destination
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            Powerful features
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            Everything your planner needs
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
            Focused features make your product feel more complete and more believable.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(15,23,42,0.3)]"
            >
              <CardBody className="relative">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-100 blur-2xl transition duration-300 group-hover:bg-sky-200" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-xl text-white shadow-sm">
                    {f.icon}
                  </div>
                  <div className="text-lg font-black text-slate-900">{f.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{f.text}</div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card className="h-full overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
            <CardBody className="flex h-full flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex rounded-full border border-slate-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Focused product identity
                </div>

                <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                  A homepage that truly matches your planner
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Removing irrelevant booking sections makes your app cleaner,
                  smarter, and much more convincing as a real AI travel planner.
                </p>
              </div>

              <div className="space-y-3">
                {plannerBenefits.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="mt-0.5 text-emerald-600">●</span>
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <div>
                <Button variant="secondary" onClick={() => nav("/create")}>
                  Build My Trip
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <div className="group relative overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)]">
            <img
              src={STOCK.visual}
              alt="Travel inspiration"
              className="h-110 w-full object-cover transition duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-900/20 to-transparent" />

            <div className="absolute left-5 right-5 top-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Inspiration first
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                AI planning
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Premium UX
              </span>
            </div>

            <div className="absolute bottom-5 left-5 right-5">
              <div className="max-w-xl rounded-3xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-md">
                <div className="text-sm font-semibold uppercase tracking-wide text-white/80">
                  Visual experience
                </div>
                <div className="mt-2 text-2xl font-black">
                  Inspire the trip before generating the journey
                </div>
                <div className="mt-2 text-sm leading-6 text-white/85">
                  The homepage now feels more like a premium planning product and less
                  like a generic booking website.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden rounded-4xl border border-slate-200 bg-linear-to-br from-sky-700 via-blue-700 to-indigo-800 p-8 text-white shadow-[0_20px_80px_-30px_rgba(15,23,42,0.5)] sm:p-10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -right-5 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-size-[30px_30px]" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              Ready to begin?
            </div>
            <h3 className="mt-4 text-3xl font-black tracking-tight">
              Start planning your next unforgettable journey
            </h3>
            <p className="mt-2 text-sm leading-7 text-white/80 sm:text-base">
              Choose a destination, shape the travel style, and generate a smarter
              itinerary with a homepage that truly fits your project.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={() => nav("/create")}>
              Create Trip
            </Button>
            <Button
              variant="secondary"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 sm:w-auto"
              onClick={() => nav("/trips")}
            >
              My Trips
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PhotoCard({ src, badge, className = "" }) {
  return (
    <div
      className={cx(
        "group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <img
        src={src}
        alt={badge}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
      <div className="absolute left-3 right-3 top-3 flex justify-between">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {badge}
        </span>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/95 backdrop-blur">
          Inspiring places, smarter planning
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, subtitle, badge }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        </div>
        <Badge>{badge}</Badge>
      </div>
    </div>
  );
}

function TrustItem({ title, text, icon }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-lg text-white shadow-sm">
        {icon}
      </div>
      <div className="text-lg font-black text-slate-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{text}</div>
    </div>
  );
}