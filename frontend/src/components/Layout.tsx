import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const link =
    "font-bold text-[var(--color-tape-ink)] hover:text-[#1a1a1a] transition-colors";
  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-black/90 bg-white/95 backdrop-blur-md shadow-[0_4px_0_0_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[var(--color-tape-ink)]"
          >
            <img
              src="/tape_pavicon.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
            />
            TasteTape
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className={link}>
              My list
            </Link>
            <Link to="/analyze" className={link}>
              Taste analysis
            </Link>
            <Link to="/compare" className={link}>
              Compare friends
            </Link>
            {user && (
              <Link
                to="/settings"
                className="hidden max-w-[140px] truncate font-semibold text-[var(--color-tape-muted)] hover:text-black sm:inline"
                title={user.email}
              >
                {user.nickname?.trim() || user.email.split("@")[0]}
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-2 py-1 font-bold text-[var(--color-tape-muted)] hover:bg-[var(--color-tape-lime-soft)] hover:text-black"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
