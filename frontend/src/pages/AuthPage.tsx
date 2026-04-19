import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border-[3px] border-black bg-[var(--color-tape-card)] p-8 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)]">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-tape-ink)]">
          TasteTape
        </h1>
        <p className="mt-1 text-sm font-semibold text-[var(--color-tape-muted)]">
          {mode === "login" ? "Sign in" : "Create account"}
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
  );
}
