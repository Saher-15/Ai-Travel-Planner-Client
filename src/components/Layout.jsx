import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/UI.jsx";
import { api } from "../api/client.js";

const cx = (...c) => c.filter(Boolean).join(" ");

const DEVELOPER_LINKEDIN =
  "https://www.linkedin.com/in/saher-saadi-a637b11b5/";

function NavBadge({ count, mobile = false, active = false }) {
  if (!count || count < 1) return null;

  return (
    <span
      className={cx(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold",
        mobile
          ? "ml-auto bg-red-500 text-white"
          : active
          ? "bg-white text-sky-700"
          : "bg-red-500 text-white"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavItem({
  to,
  onClick,
  children,
  mobile = false,
  badgeCount = 0,
}) {
  const base = mobile
    ? "flex w-full items-center rounded-2xl px-4 py-3 text-sm font-semibold transition"
    : "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition";

  const idle = "text-slate-700 hover:bg-sky-50 hover:text-sky-700";
  const active = mobile
    ? "bg-sky-600 text-white shadow-sm"
    : "bg-sky-600 text-white shadow-sm hover:bg-sky-600";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cx(base, idle)}>
        <span>{children}</span>
        <NavBadge count={badgeCount} mobile={mobile} />
      </button>
    );
  }

  return (
    <NavLink to={to} className={({ isActive }) => cx(base, isActive ? active : idle)}>
      {({ isActive }) => (
        <>
          <span>{children}</span>
          <NavBadge count={badgeCount} mobile={mobile} active={isActive} />
        </>
      )}
    </NavLink>
  );
}

function Brand() {
  return (
    <Link to="/" className="group flex min-w-0 items-center gap-3">
      <div
        className={cx(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
          "bg-linear-to-br from-sky-500 via-blue-600 to-indigo-700 text-white",
          "shadow-[0_12px_35px_-12px_rgba(37,99,235,0.55)] ring-1 ring-sky-900/10",
          "transition duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_18px_40px_-16px_rgba(37,99,235,0.55)]"
        )}
      >
        <span className="text-sm font-extrabold tracking-tight">TP</span>
      </div>

      <div className="min-w-0 leading-tight">
        <div className="truncate text-base font-black tracking-tight text-slate-900">
          Travel Planner
        </div>
        <div className="truncate text-xs text-slate-500">
          Smart trip planning made easy
        </div>
      </div>
    </Link>
  );
}

function MobileMenuButton({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
    >
      <div className="relative h-5 w-5">
        <span
          className={cx(
            "absolute left-0 top-1 h-0.5 w-5 rounded-full bg-current transition",
            open && "top-2.5 rotate-45"
          )}
        />
        <span
          className={cx(
            "absolute left-0 top-2.5 h-0.5 w-5 rounded-full bg-current transition",
            open && "opacity-0"
          )}
        />
        <span
          className={cx(
            "absolute left-0 top-4 h-0.5 w-5 rounded-full bg-current transition",
            open && "top-2.5 -rotate-45"
          )}
        />
      </div>
    </button>
  );
}

function UserPill({ user }) {
  return (
    <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
        {(user?.name || "T").trim().charAt(0).toUpperCase()}
      </span>
      <span className="max-w-35 truncate">
        Welcome, {user?.name || "Traveler"}
      </span>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm text-slate-500 transition hover:text-sky-700"
    >
      {children}
    </Link>
  );
}

function FooterExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-slate-500 transition hover:text-sky-700"
    >
      {children}
    </a>
  );
}


function Footer({ isLoggedIn, isAdmin }) {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-sky-500 via-blue-600 to-indigo-700 text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.45)]">
                <span className="text-sm font-extrabold tracking-tight">TP</span>
              </div>

              <div>
                <div className="text-base font-black tracking-tight text-slate-900">
                  Travel Planner
                </div>
                <div className="text-xs text-slate-500">
                  Smart trip planning made easy
                </div>
              </div>
            </Link>

            <p className="max-w-sm text-sm leading-6 text-slate-600">
              Create smart travel itineraries, organize your journeys, and enjoy a
              clean premium planning experience focused on inspiration, structure,
              and ease of use.
            </p>

            <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                Website Developer
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-800">
                Developed by Saher Saadi
              </div>
              <div className="mt-2">
                <a
                  href={DEVELOPER_LINKEDIN}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-500"
                >
                  View LinkedIn
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
              Navigation
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/create">Create Trip</FooterLink>
              {isLoggedIn ? <FooterLink to="/trips">My Trips</FooterLink> : null}
              <FooterLink to="/contact">Contact</FooterLink>
              {isLoggedIn ? <FooterLink to="/profile">Profile</FooterLink> : null}
              {isAdmin ? <FooterLink to="/admin/contacts">Admin</FooterLink> : null}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
              Planner Features
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>AI itinerary generation</p>
              <p>Smart daily trip structure</p>
              <p>Clean destination-first planning</p>
              <p>Saved personal trip library</p>
              <p>Responsive premium experience</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
              Start your next journey
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Turn your destination idea into a structured and inspiring travel plan
              in a stronger and more professional interface.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                to="/create"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
              >
                Create a Trip
              </Link>

              <FooterExternalLink href={DEVELOPER_LINKEDIN}>
                Developer LinkedIn
              </FooterExternalLink>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Travel Planner. All rights reserved.</p>
          <p>
            Designed and developed by{" "}
            <a
              href={DEVELOPER_LINKEDIN}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-700 hover:text-sky-600"
            >
              Saher Saadi
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadReplyCount, setUnreadReplyCount] = useState(0);

  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  const loadUnreadReplyCount = async () => {
    if (!isLoggedIn) {
      setUnreadReplyCount(0);
      return;
    }

    try {
      const { data } = await api.get("/contact/my/messages/unread-count");
      setUnreadReplyCount(Number(data?.count || 0));
    } catch {
      setUnreadReplyCount(0);
    }
  };

  useEffect(() => {
    loadUnreadReplyCount();

    if (!isLoggedIn) return;

    const timer = setInterval(() => {
      loadUnreadReplyCount();
    }, 20000);

    return () => clearInterval(timer);
  }, [isLoggedIn, location.pathname]);

  const onLogout = async () => {
    closeMobileMenu();
    await logout();
    setUnreadReplyCount(0);
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 via-white to-slate-100">
      <header className="sticky top-0 z-200 border-b border-slate-200/70 bg-white/85 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl supports-backdrop-filter:bg-white/75">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Brand />

            <div className="hidden items-center gap-3 md:flex">
              <nav className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm">
                {isLoggedIn ? (
                  <>
                    <NavItem to="/">Home</NavItem>
                    <NavItem to="/create">Create Trip</NavItem>
                    <NavItem to="/trips">My Trips</NavItem>
                    <NavItem to="/contact">Contact</NavItem>
                    <NavItem to="/profile" badgeCount={unreadReplyCount}>
                      Profile
                    </NavItem>
                    {isAdmin ? <NavItem to="/admin/contacts">Admin</NavItem> : null}
                  </>
                ) : (
                  <>
                    <NavItem to="/">Home</NavItem>
                    <NavItem to="/contact">Contact</NavItem>
                    <NavItem to="/login">Login</NavItem>
                    <NavItem to="/register">Register</NavItem>
                  </>
                )}
              </nav>

              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <UserPill user={user} />
                  <Button variant="secondary" onClick={onLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <Link
                  to="/create"
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500 hover:shadow-md"
                >
                  Plan a Trip
                </Link>
              )}
            </div>

            <MobileMenuButton
              open={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            />
          </div>
        </div>

        <div
          className={cx(
            "overflow-hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl transition-all duration-300 md:hidden",
            mobileOpen ? "max-h-175 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-4 sm:px-6">
            {isLoggedIn && (
              <div className="rounded-3xl border border-sky-100 bg-sky-50 px-4 py-3 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Signed in
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  Welcome, {user?.name || "Traveler"} 👋
                </div>
                {user?.email ? (
                  <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                ) : null}
                {isAdmin ? (
                  <div className="mt-2 inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                    Admin
                  </div>
                ) : null}
              </div>
            )}

            <nav className="grid gap-2">
              {isLoggedIn ? (
                <>
                  <NavItem to="/" mobile>
                    Home
                  </NavItem>
                  <NavItem to="/create" mobile>
                    Create Trip
                  </NavItem>
                  <NavItem to="/trips" mobile>
                    My Trips
                  </NavItem>
                  <NavItem to="/contact" mobile>
                    Contact
                  </NavItem>
                  <NavItem to="/profile" mobile badgeCount={unreadReplyCount}>
                    Profile
                  </NavItem>
                  {isAdmin ? (
                    <NavItem to="/admin/contacts" mobile>
                      Admin Contacts
                    </NavItem>
                  ) : null}
                  <NavItem onClick={onLogout} mobile>
                    Logout
                  </NavItem>
                </>
              ) : (
                <>
                  <NavItem to="/" mobile>
                    Home
                  </NavItem>
                  <NavItem to="/contact" mobile>
                    Contact
                  </NavItem>
                  <NavItem to="/login" mobile>
                    Login
                  </NavItem>
                  <NavItem to="/register" mobile>
                    Register
                  </NavItem>

                  <div className="pt-2">
                    <Link
                      to="/create"
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                    >
                      Plan a Trip
                    </Link>
                  </div>

                  <a
                    href={DEVELOPER_LINKEDIN}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Website Developer
                  </a>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {isLoggedIn && user && !user.verified && (
        <div className="relative z-190 border-b border-amber-300 bg-linear-to-r from-amber-50 to-yellow-50">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-3 text-center text-sm font-semibold text-amber-800 sm:px-6">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs">
              !
            </span>
            <span>
              Your email is not verified.{" "}
              <Link to="/profile" className="font-bold underline underline-offset-2">
                Verify now →
              </Link>
            </span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</main>

      <Footer isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
    </div>
  );
}