import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight">
            TasteTape
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/"
              className="text-stone-600 hover:text-stone-900"
            >
              내 리스트
            </Link>
            <Link
              to="/analyze"
              className="text-stone-600 hover:text-stone-900"
            >
              취향 분석
            </Link>
            <Link
              to="/compare"
              className="text-stone-600 hover:text-stone-900"
            >
              친구와 비교
            </Link>
            {user && (
              <span className="hidden text-stone-500 sm:inline">
                {user.email}
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100"
            >
              로그아웃
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
