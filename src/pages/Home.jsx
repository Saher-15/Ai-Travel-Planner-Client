import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Badge, Input, Select } from "../components/UI.jsx";

const cx = (...c) => c.filter(Boolean).join(" ");

const STOCK = {
  hero: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1518684079-4c3b23f1f3f4?auto=format&fit=crop&w=1600&q=80",
  ],
  map: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=80",
};

const SEARCH_TABS = ["Flights", "Hotels", "Stays", "Activities"];

const features = [
  {
    title: "AI day-by-day planning",
    text: "Generate balanced itineraries with morning, afternoon, and evening blocks that feel practical and real.",
    icon: "✨",
  },
  {
    title: "Smart trip pacing",
    text: "Choose relaxed, moderate, or packed travel style and let your trip structure adapt automatically.",
    icon: "⚡",
  },
  {
    title: "Save and manage trips",
    text: "Keep your trips in one place, revisit them anytime, and build your own personal travel library.",
    icon: "📁",
  },
  {
    title: "Visual trip experience",
    text: "Create a planning flow that feels interactive, premium, and closer to a real-world travel platform.",
    icon: "🗺️",
  },
];

const stats = [
  { label: "Fast generation", value: "10–30s", sub: "average itinerary build time" },
  { label: "Daily structure", value: "3 blocks", sub: "morning / afternoon / evening" },
  { label: "Trip library", value: "Unlimited", sub: "save as many trips as you want" },
  { label: "Planning feel", value: "Premium", sub: "clean modern product experience" },
];

const highlights = [
  "Premium travel-planner UI",
  "Smart Create Trip integration",
  "Portfolio-ready visual design",
];

const steps = [
  {
    title: "Choose destination",
    text: "Enter where you want to go and define your dates.",
    number: "01",
  },
  {
    title: "Set your travel style",
    text: "Pick your trip type, travelers, and planning focus.",
    number: "02",
  },
  {
    title: "Generate your itinerary",
    text: "Jump to Create Trip and let AI build the full plan.",
    number: "03",
  },
];

const POPULAR_DESTINATIONS = [
  {
    name: "Paris, France",
    tag: "Romantic escapes",
    priceFrom: "$320",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    badge: "Trending",
  },
  {
    name: "Tokyo, Japan",
    tag: "City & culture",
    priceFrom: "$540",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    badge: "Top pick",
  },
  {
    name: "Bali, Indonesia",
    tag: "Beach & nature",
    priceFrom: "$410",
    image:
      "https://images.unsplash.com/photo-1500534314211-0a24cd03f2c0?auto=format&fit=crop&w=1200&q=80",
    badge: "Great value",
  },
  {
    name: "New York, USA",
    tag: "Urban adventures",
    priceFrom: "$280",
    image:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80",
    badge: "Popular",
  },
];

const DEALS = [
  {
    title: "Weekend city breaks",
    desc: "Short getaways with optimized plans and quick day-by-day structure.",
    discount: "Up to 25% off",
    tag: "Limited time",
    preset: { tripType: "round", sourceTab: "Flights" },
  },
  {
    title: "Long-stay workations",
    desc: "Longer stays with a slower pace and more balanced daily flow.",
    discount: "Save on stays",
    tag: "Remote-friendly",
    preset: { tripType: "standard", sourceTab: "Stays" },
  },
  {
    title: "Multi-city adventures",
    desc: "Create stronger journeys with flexible routing and a richer travel story.",
    discount: "Smart routing",
    tag: "Advanced",
    preset: { tripType: "multi", sourceTab: "Flights" },
  },
];

export default function Home() {
  const nav = useNavigate();
  const [a, b, c] = useMemo(() => STOCK.hero, []);
  const [activeTab, setActiveTab] = useState("Flights");

  const [search, setSearch] = useState({
    from: "",
    to: "",
    checkIn: "",
    checkOut: "",
    travelers: "2",
    tripType: "round",
  });

  const onSearchChange = (field, value) => {
    setSearch((prev) => ({ ...prev, [field]: value }));
  };

  const buildCreateTripUrl = ({
    destination = "",
    startDate = "",
    endDate = "",
    travelers = "2",
    sourceTab = "Flights",
    tripType = "",
    from = "",
  } = {}) => {
    const params = new URLSearchParams();

    if (destination) params.set("destination", destination);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (travelers) params.set("travelers", travelers);
    if (sourceTab) params.set("sourceTab", sourceTab);
    if (tripType) params.set("tripType", tripType);
    if (from) params.set("from", from);

    return `/create?${params.toString()}`;
  };

  const goToCreate = (payload = {}) => {
    nav(buildCreateTripUrl(payload));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const isStaySearch = activeTab === "Hotels" || activeTab === "Stays";
    const destinationValue = isStaySearch ? search.from.trim() : search.to.trim();

    goToCreate({
      destination: destinationValue,
      startDate: search.checkIn,
      endDate: search.checkOut,
      travelers: search.travelers,
      sourceTab: activeTab,
      tripType: search.tripType,
      from: !isStaySearch ? search.from.trim() : "",
    });
  };

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-30px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-blue-50" />
          <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute right-0 top-8 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),transparent_36%)]" />
        </div>

        <div className="relative grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-12 lg:px-10 lg:py-14">
          {/* LEFT */}
          <div className="lg:col-span-6 lg:pr-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              AI-powered itinerary planner
            </div>

            <div className="mt-6 max-w-2xl">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Plan smarter.
                <span className="mt-1 block bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-500 bg-clip-text text-transparent">
                  Travel better.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Turn simple travel ideas into polished itineraries with a premium
                planning experience. Pick your destination, travel dates, and trip
                style, then jump straight into your Create Trip page with the details
                already prepared.
              </p>
            </div>

            

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

            <div className="mt-6 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"
                >
                  <span className="text-emerald-600">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{item.value}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <PhotoCard
                src={a}
                className="min-h-[240px] sm:row-span-2 sm:min-h-full"
                badge="Top destinations"
              />
              <PhotoCard src={b} className="min-h-[170px]" badge="Food & culture" />
              <PhotoCard src={c} className="min-h-[170px]" badge="Nature & escape" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Trip setup</div>
                    <div className="mt-1 text-xs text-slate-500">
                      destination • dates • trip type • travelers
                    </div>
                  </div>
                  <Badge>Smart inputs</Badge>
                </div>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-600 to-blue-700 p-4 text-white shadow-sm">
                <div className="text-sm font-bold">Stronger portfolio feel</div>
                <div className="mt-1 text-xs text-white/80">
                  Cleaner visuals, better UX, stronger first impression
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="grid gap-4 md:grid-cols-3">
        <TrustItem
          title="Secure experience"
          text="Protected routes and account-based trip management make your app feel more complete and real."
          icon="🔐"
        />
        <TrustItem
          title="Modern product design"
          text="Reusable UI, cleaner spacing, strong cards, and premium visual hierarchy across the page."
          icon="🎨"
        />
        <TrustItem
          title="Built to impress"
          text="A stronger homepage gives your project more impact for demos, recruiters, and GitHub visitors."
          icon="🚀"
        />
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            How it works
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            A simple flow with a premium planning feel
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Your homepage should guide users naturally toward Create Trip instead of
            feeling like a static landing page.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <Card
              key={step.number}
              className="rounded-[1.75rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.28)]"
            >
              <CardBody className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-sm font-black text-white shadow-sm">
                  {step.number}
                </div>
                <div className="text-lg font-black text-slate-900">{step.title}</div>
                <div className="text-sm leading-6 text-slate-600">{step.text}</div>
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
              Popular destinations
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Browse a destination, then jump straight into planning
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Each card can send the user directly to Create Trip with the destination
              already filled in.
            </p>
          </div>

          <Button variant="secondary" className="text-xs sm:text-sm" onClick={() => nav("/create")}>
            Start from blank trip
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {POPULAR_DESTINATIONS.map((d) => (
            <Card
              key={d.name}
              className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.28)]"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={d.image}
                  alt={d.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    {d.badge}
                  </span>
                  <span className="rounded-full bg-black/40 px-2 py-1 text-[11px] font-medium text-white">
                    From {d.priceFrom}
                  </span>
                </div>
              </div>

              <CardBody className="space-y-2">
                <div className="text-sm font-bold text-slate-900">{d.name}</div>
                <div className="text-xs text-slate-500">{d.tag}</div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button
                    className="px-3 py-2 text-xs"
                    onClick={() =>
                      goToCreate({
                        destination: d.name,
                        sourceTab: "Flights",
                        travelers: "2",
                        tripType: "round",
                      })
                    }
                  >
                    Plan trip here
                  </Button>

                  <span className="text-[11px] text-slate-500">
                    Destination pre-filled
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* DEALS / TEMPLATES */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            Templates & offers
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            Add more travel-platform energy to your homepage
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            These blocks make the project feel richer and also give users faster
            entry points into the Create Trip flow.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {DEALS.map((deal) => (
            <Card
              key={deal.title}
              className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.28)]"
            >
              <CardBody className="relative space-y-3">
                <div className="absolute right-4 top-4">
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {deal.tag}
                  </Badge>
                </div>

                <div className="text-sm font-black text-slate-900">{deal.title}</div>
                <div className="text-xs leading-6 text-slate-600">{deal.desc}</div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-emerald-700">
                    {deal.discount}
                  </span>
                  <Button
                    variant="secondary"
                    className="px-3 py-2 text-xs"
                    onClick={() =>
                      goToCreate({
                        sourceTab: deal.preset.sourceTab,
                        tripType: deal.preset.tripType,
                        travelers: "2",
                      })
                    }
                  >
                    Use template
                  </Button>
                </div>
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
            Everything you need for a stronger planner
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Designed to make your travel app feel more complete, polished, and useful.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.28)]"
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
          <Card className="h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <CardBody className="flex h-full flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex rounded-full border border-slate-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Product-style homepage
                </div>

                <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                  Make your app feel like a serious SaaS product
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A stronger homepage improves your first impression instantly. It
                  makes your app feel more complete, more premium, and more ready for
                  demos or interviews.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "Better visual hierarchy",
                  "Stronger CTA flow into Create Trip",
                  "More premium card layout",
                  "Cleaner recruiter-ready presentation",
                ].map((item) => (
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
          <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_-30px_rgba(15,23,42,0.35)]">
            <img
              src={STOCK.map}
              alt="Destination preview"
              className="h-[420px] w-full object-cover transition duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />

            <div className="absolute left-5 right-5 top-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Destination preview
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                Strong visual planning
              </span>
            </div>

            <div className="absolute bottom-5 left-5 right-5">
              <div className="max-w-xl rounded-3xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-md">
                <div className="text-sm font-semibold uppercase tracking-wide text-white/80">
                  Visual experience
                </div>
                <div className="mt-2 text-2xl font-black">
                  See the destination feeling before the itinerary is even created
                </div>
                <div className="mt-2 text-sm leading-6 text-white/85">
                  Strong visuals plus AI planning create a homepage that feels much
                  closer to a real travel platform.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-sky-700 via-blue-700 to-indigo-800 p-8 text-white shadow-[0_20px_80px_-30px_rgba(15,23,42,0.5)] sm:p-10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -right-5 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              Ready to begin?
            </div>
            <h3 className="mt-4 text-3xl font-black tracking-tight">
              Start building your next unforgettable trip
            </h3>
            <p className="mt-2 text-sm leading-7 text-white/80 sm:text-base">
              Choose your destination, set your dates, and move directly into the
              Create Trip page with a cleaner and smarter flow.
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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