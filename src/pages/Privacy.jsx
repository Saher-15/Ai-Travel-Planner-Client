import { Link } from "react-router-dom";
import { useEffect } from "react";

function Section({ title, children }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">{children}</div>
        </section>
    );
}

export default function Privacy() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    return (
        <section className="mx-auto max-w-5xl">
            <div className="rounded-[2rem] border border-sky-100 bg-white/90 p-6 shadow-[0_20px_60px_-30px_rgba(2,132,199,0.35)] sm:p-8">
                <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">
                    Privacy & Security
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    Privacy Policy
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    This Privacy Policy explains how Travel Planner collects, uses, and
                    protects your information when you use the platform.
                </p>

                <div className="mt-8 grid gap-4">
                    <Section title="1. Information We Collect">
                        <p>
                            We may collect information such as your name, email address, account
                            details, trip preferences, saved itineraries, and messages sent through
                            the contact form.
                        </p>
                        <p>
                            We may also collect technical data such as browser type, device
                            information, and general usage activity to improve the platform.
                        </p>
                    </Section>

                    <Section title="2. How We Use Your Information">
                        <p>We use your information to:</p>
                        <ul className="list-disc space-y-2 pl-5">
                            <li>Create and manage your account</li>
                            <li>Generate and save personalized travel plans</li>
                            <li>Improve product features and user experience</li>
                            <li>Respond to support messages and user requests</li>
                            <li>Maintain platform security and reliability</li>
                        </ul>
                    </Section>

                    <Section title="3. Data Protection">
                        <p>
                            We take reasonable steps to protect your personal information using
                            secure authentication, controlled access, and standard security
                            practices.
                        </p>
                        <p>
                            However, no online service can guarantee absolute security, so users
                            should also protect their account credentials carefully.
                        </p>
                    </Section>

                    <Section title="4. Sharing of Information">
                        <p>
                            We do not sell your personal information. Information may only be
                            shared when necessary to operate the platform, comply with legal
                            obligations, or protect the security and integrity of the service.
                        </p>
                    </Section>

                    <Section title="5. Cookies and Analytics">
                        <p>
                            Travel Planner may use cookies or analytics tools to understand
                            platform usage, improve performance, and deliver a better experience.
                        </p>
                    </Section>

                    <Section title="6. Your Rights">
                        <p>
                            You may request access to your account information or ask for updates
                            or deletion of certain personal data, subject to operational and legal
                            requirements.
                        </p>
                    </Section>

                    <Section title="7. Policy Updates">
                        <p>
                            This Privacy Policy may be updated from time to time. Continued use of
                            the platform after updates means you accept the revised policy.
                        </p>
                    </Section>
                </div>

                <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="text-sm font-bold text-slate-900">Questions about privacy?</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        For questions regarding your information or privacy concerns, please use
                        the contact page.
                    </p>
                    <div className="mt-4">
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}