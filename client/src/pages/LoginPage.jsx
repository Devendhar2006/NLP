import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("parentEmail", response.data.email);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "450px", margin: "0 auto" }}>
      <section className="card">
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>👨‍👩‍👧‍👦 Parent Login</h2>
          <p style={{ margin: "0.5rem 0 0", color: "var(--gray-600)", fontSize: "1rem" }}>
            Sign in to access your child's safety dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "var(--gray-700)" }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="parent@example.com"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "0.5rem", color: "var(--gray-700)" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}

        <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--gray-200)", textAlign: "center" }}>
          <p style={{ margin: "0.5rem 0", color: "var(--gray-600)", fontSize: "0.95rem" }}>
            Don't have an account?{" "}
            <a href="/register" style={{ color: "var(--primary-color)", fontWeight: "600", textDecoration: "none" }}>
              Register here
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
