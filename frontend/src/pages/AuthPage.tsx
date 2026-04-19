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
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-8 shadow-xl shadow-stone-900/5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-tape-ink)]">
          TasteTape
        </h1>
        <p className="mt-1 text-sm text-[var(--color-tape-muted)]">
          {mode === "login" ? "로그인" : "회원가입"}
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              이메일
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-[var(--color-tape-accent)] focus:ring-2"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              비밀번호
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-[var(--color-tape-accent)] focus:ring-2"
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
            <p className="text-sm text-red-600" role="alert">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-tape-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-tape-muted)]">
          {mode === "login" ? (
            <>
              계정이 없나요?{" "}
              <Link
                className="font-semibold text-[var(--color-tape-accent)]"
                to="/register"
              >
                회원가입
              </Link>
            </>
          ) : (
            <>
              이미 계정이 있나요?{" "}
              <Link
                className="font-semibold text-[var(--color-tape-accent)]"
                to="/login"
              >
                로그인
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
