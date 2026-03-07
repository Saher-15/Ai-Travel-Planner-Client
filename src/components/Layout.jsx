import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/UI.jsx";

const cx = (...c) => c.filter(Boolean).join(" ");

function NavItem({ to, onClick, children, mobile = false }) {
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
        {children}
      </button>
    );
  }

  return (
    <NavLink to={to} className={({ isActive }) => cx(base, isActive ? active : idle)}>
      {children}
    </NavLink>
  );
}

function Brand() {
  return (
    <Link to="/" className="group flex min-w-0 items-center gap-3">
      <div
        className={cx(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
          "bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white",
          "shadow-[0_10px_30px_-12px_rgba(37,99,235,0.45)] ring-1 ring-sky-900/10",
          "transition duration-300 group-hover:scale-[1.03]"
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
      <span className="max-w-[140px] truncate">
        Welcome, {user?.name || "Traveler"}
      </span>
    </div>
  );
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  const onLogout = async () => {
    closeMobileMenu();
    await logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-100">
      {/* GLOBAL HEADER */}
      <header className="sticky top-0 z-[200] border-b border-slate-200/70 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Brand />

            {/* DESKTOP NAV */}
            <div className="hidden items-center gap-3 md:flex">
              <nav className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm">
                {isLoggedIn ? (
                  <>
                    <NavItem to="/">Home</NavItem>
                    <NavItem to="/create">Create Trip</NavItem>
                    <NavItem to="/trips">My Trips</NavItem>
                    <NavItem to="/contact">Contact</NavItem>
                    <NavItem to="/profile">Profile</NavItem>
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

            {/* MOBILE TOGGLE */}
            <MobileMenuButton
              open={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            />
          </div>
        </div>

        {/* MOBILE MENU */}
        <div
          className={cx(
            "overflow-hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl transition-all duration-300 md:hidden",
            mobileOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
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
                  <NavItem to="/profile" mobile>
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
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* EMAIL VERIFICATION BANNER */}
      {isLoggedIn && user && !user.verified && (
        <div className="relative z-[190] border-b border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
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

      {/* PAGE WRAPPER */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}