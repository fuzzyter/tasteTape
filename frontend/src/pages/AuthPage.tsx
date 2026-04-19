import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

const FILM_TOKENS = [
  "🎬 CINEMA",
  "🎞️ REEL",
  "📚 BOOKS",
  "📺 SERIES",
  "★ TASTE",
  "🎥 RECAP",
  "🍿 SHARE",
  "♪ MIXTAPE",
];

function FilmStrip({ reverse = false }: { reverse?: boolean }) {
  const items = [...FILM_TOKENS, ...FILM_TOKENS];
  return (
    <div
      className={`film-strip ${reverse ? "film-strip-reverse" : ""}`}
      aria-hidden="true"
    >
      {items.map((t, i) => (
        <span key={i} className="film-frame">
          {t}
        </span>
      ))}
    </div>
  );
}

const BULLETS = [
  "Rate and log the films, books, animation, and shows you've watched.",
  "Analyze your taste and share it as a downloadable image.",
  "Get AI picks tuned to your ratings, notes, and genre patterns.",
  "Drop a friend code to compare tastes and analyze together.",
  "See taste similarity, shared favorites, and picks from each other's lists.",
  "Team up with up to 4 people — how strong is our group synergy?",
];

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const nav = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password);
      setSession(res.token, res.user);
      nav("/", { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute -left-40 top-[12%] rotate-[-7deg] opacity-30">
          <FilmStrip />
        </div>
        <div className="absolute -right-48 top-[52%] rotate-[5deg] opacity-25">
          <FilmStrip reverse />
        </div>
        <div className="absolute -left-44 bottom-[-2%] rotate-[-3deg] opacity-20">
          <FilmStrip />
        </div>
      </div>

      <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-[1.15fr_minmax(0,420px)] md:py-16">
        <section className="space-y-6">
          <span className="inline-block rounded-md bg-[var(--color-tape-lime)] px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-black shadow-[3px_3px_0_0_#000]">
            TasteTape
          </span>
          <h1 className="text-3xl font-extrabold leading-[1.05] tracking-tight text-black sm:text-4xl md:text-5xl">
            Create your own{" "}
            <span className="bg-[var(--color-tape-lime)] px-2 ring-2 ring-black">
              RECAP
            </span>{" "}
            and discover your taste!
          </h1>
          <p className="text-base font-bold text-[var(--color-tape-muted)] sm:text-lg">
            Create and share your own Taste Tape!
          </p>
          <ul className="space-y-3 pt-1">
            {BULLETS.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-sm font-semibold text-black sm:text-[15px]"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 inline-block h-3 w-3 shrink-0 rotate-45 bg-[var(--color-tape-lime)] ring-2 ring-black"
                />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="w-full rounded-2xl border-[3px] border-black bg-[var(--color-tape-card)] p-8 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)] md:justify-self-end">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-tape-ink)]">
            {mode === "login" ? "Welcome back" : "Start your tape"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--color-tape-muted)]">
            {mode === "login" ? "Sign in to continue" : "Create an account"}
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-black">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-xl border-2 border-black/15 bg-white px-3 py-2 text-sm font-medium text-black outline-none ring-[var(--color-tape-lime)] focus:border-black focus:ring-2"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wide text-black">
                Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border-2 border-black/15 bg-white px-3 py-2 text-sm font-medium text-black outline-none ring-[var(--color-tape-lime)] focus:border-black focus:ring-2"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            {err && (
              <p className="text-sm font-semibold text-red-600" role="alert">
                {err}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--color-tape-lime)] px-4 py-2.5 text-sm font-extrabold text-black shadow-[4px_4px_0_0_#000] transition hover:brightness-95 disabled:opacity-60"
            >
              {loading
                ? "Working…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm font-semibold text-[var(--color-tape-muted)]">
            {mode === "login" ? (
              <>
                No account?{" "}
                <Link
                  className="font-extrabold text-black underline decoration-[var(--color-tape-lime)] decoration-2 underline-offset-2"
                  to="/register"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  className="font-extrabold text-black underline decoration-[var(--color-tape-lime)] decoration-2 underline-offset-2"
                  to="/login"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
