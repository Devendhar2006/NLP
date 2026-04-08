import { Link, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ChildCheckPage from "./pages/ChildCheckPage";
import LoginPage from "./pages/LoginPage";
import ParentDashboardPage from "./pages/ParentDashboardPage";
import RegisterPage from "./pages/RegisterPage";
import SafeSearchPage from "./pages/SafeSearchPage";

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
          🛡️ ChildSafe AI Filter
        </h1>
        <nav>
          <Link to="/login">🔐 Parent Login</Link>
          <Link to="/register">📝 Register</Link>
          <Link to="/safe-search">🔍 SafeSearch AI</Link>
          <Link to="/child-checker">👶 Child Checker</Link>
          <Link to="/dashboard">📊 Dashboard</Link>
        </nav>
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/safe-search" element={<SafeSearchPage />} />
          <Route path="/child-checker" element={<ChildCheckPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ParentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}
