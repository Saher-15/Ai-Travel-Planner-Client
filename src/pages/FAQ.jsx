import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const faqs = [
    {
        q: "What is Travel Planner?",
        a: "Travel Planner is an AI-powered web application that helps you create organized and personalized travel itineraries based on your destination, dates, and preferences.",
    },
    {
        q: "Do I need an account to create a trip?",
        a: "You can explore the app without an account, but creating an account gives you a better experience, including saving and managing your trips.",
    },
    {
        q: "Can I plan trips for multiple cities?",
        a: "Yes. Travel Planner supports multi-city trip planning so you can organize more complex journeys in one place.",
    },
    {
        q: "Does the planner include weather information?",
        a: "Yes. The planner can display weather insights for upcoming travel dates to help you prepare better.",
    },
    {
        q: "Can I download my trip plan?",
        a: "Yes. You can export your trip plan as a PDF for easier access and sharing.",
    },
    {
        q: "Is my personal data secure?",
        a: "We aim to protect user data using secure authentication and responsible data handling practices. You should also keep your login credentials private.",
    },
    {
        q: "Can I edit my itinerary after creating it?",
        a: "Depending on your current feature setup, you can manage and update your saved trips from your account area.",
    },
    {
        q: "How can I contact support?",
        a: "You can use the Contact page to send a message and receive support regarding your account or trip planning experience.",
    },
];

function FAQItem({ q, a, open, onToggle }) {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
            >
                <span className="text-sm font-bold text-slate-900 sm:text-base">{q}</span>
                <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition ${open ? "rotate-45" : ""
                        }`}
                >
                    +
                </span>
            </button>

            <div
                className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600 sm:px-6">
                        {a}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <section className="mx-auto max-w-5xl">
            <div className="rounded-[2rem] border border-sky-100 bg-white/90 p-6 shadow-[0_20px_60px_-30px_rgba(2,132,199,0.35)] sm:p-8">
                <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">
                    Support Center
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    Frequently Asked Questions
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    Find quick answers about Travel Planner, trip creation, account usage,
                    exported plans, and support.
                </p>

                <div className="mt-8 grid gap-4">
                    {faqs.map((item, index) => (
                        <FAQItem
                            key={item.q}
                            q={item.q}
                            a={item.a}
                            open={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                        />
                    ))}
                </div>

                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="text-sm font-bold text-slate-900">
                        Still need help?
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Visit the contact page and send your question. We’ll be happy to help.
                    </p>
                    <div className="mt-4">
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}