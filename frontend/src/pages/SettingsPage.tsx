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
      setMsg("저장했습니다.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-bold">계정 설정</h1>
        <form onSubmit={save} className="space-y-4 rounded-2xl border border-stone-200/80 bg-[var(--color-tape-card)] p-6">
          <div>
            <label className="text-xs font-semibold uppercase text-stone-500">
              닉네임 (친구 비교 등에 표시)
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              placeholder="비우면 코드 끝자리로 표시"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={comparePublic}
              onChange={(e) => setComparePublic(e.target.checked)}
            />
            친구 코드로 나를 검색·비교할 수 있게 허용
          </label>
          <p className="text-xs text-stone-500">
            끄면 다른 사람이 내 친구 코드를 입력해도 비교할 수 없습니다.
          </p>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-700">{msg}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--color-tape-accent)] py-2.5 text-sm font-semibold text-white"
          >
            저장
          </button>
        </form>
        <div className="rounded-xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-600">
          <p>
            내 친구 코드:{" "}
            <code className="rounded bg-stone-100 px-1 font-mono text-xs">
              {user?.friendCode}
            </code>
          </p>
          <button
            type="button"
            className="mt-3 text-stone-500 underline"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </Layout>
  );
}
