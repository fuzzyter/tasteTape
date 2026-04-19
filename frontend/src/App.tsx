import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { AnalyzePage } from "./pages/AnalyzePage";
import { AuthPage } from "./pages/AuthPage";
import { ComparePage } from "./pages/ComparePage";
import { LibraryPage } from "./pages/LibraryPage";
import { SettingsPage } from "./pages/SettingsPage";

function Protected({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/"
        element={
          <Protected>
            <LibraryPage />
          </Protected>
        }
      />
      <Route
        path="/analyze"
        element={
          <Protected>
            <AnalyzePage />
          </Protected>
        }
      />
      <Route
        path="/compare"
        element={
          <Protected>
            <ComparePage />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <SettingsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
