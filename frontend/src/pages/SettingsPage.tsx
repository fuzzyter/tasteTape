import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Layout } from "../components/Layout";

export function SettingsPage() {
  const { token, user, logout, setSession } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [comparePublic, setComparePublic] = useState(user?.comparePublic ?? true);

  useEffect(() => {
    setNickname(user?.nickname ?? "");
    setComparePublic(user?.comparePublic ?? true);
  }, [user]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErr(null);
    setMsg(null);
    try {
      const u = await api.patchMe(token, {
        nickname: nickname.trim() || null,
        comparePublic,
      });
      setSession(token, u);
      setMsg("Saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-extrabold text-black">Account</h1>
        <form
          onSubmit={save}
          className="space-y-4 rounded-2xl border-2 border-black/10 bg-[var(--color-tape-card)] p-6 shadow-[4px_4px_0_0_rgba(0,0,0,0.08)]"
        >
          <div>
            <label className="text-xs font-extrabold uppercase text-black">
              Nickname (shown in compare, etc.)
            </label>
            <input
              className="mt-1 w-full rounded-xl border-2 border-black/15 bg-white px-3 py-2 text-sm font-semibold text-black"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              placeholder="Leave empty to use last digits of your code"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-black">
            <input
              type="checkbox"
              checked={comparePublic}
              onChange={(e) => setComparePublic(e.target.checked)}
            />
            Allow others to find & compare with me by friend code
          </label>
          <p className="text-xs font-semibold text-[var(--color-tape-muted)]">
            If off, entering your friend code will not start a compare.
          </p>
          {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
          {msg && <p className="text-sm font-bold text-emerald-800">{msg}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--color-tape-lime)] py-2.5 text-sm font-extrabold text-black shadow-[3px_3px_0_0_#000] hover:brightness-95"
          >
            Save
          </button>
        </form>
        <div className="rounded-xl border-2 border-black/10 bg-white p-4 text-sm font-semibold text-[var(--color-tape-muted)] shadow-sm">
          <p>
            Your friend code:{" "}
            <code className="rounded bg-[var(--color-tape-lime-soft)] px-1.5 font-mono text-xs font-bold text-black">
              {user?.friendCode}
            </code>
          </p>
          <button
            type="button"
            className="mt-3 font-bold text-black underline decoration-[var(--color-tape-lime)] decoration-2"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      </div>
    </Layout>
  );
}
