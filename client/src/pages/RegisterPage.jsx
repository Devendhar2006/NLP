import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/register", formData);
      setSuccess("✅ Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "450px", margin: "0 auto" }}>
      <section className="card">
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>👋 Create Your Account</h2>
          <p style={{ margin: "0.5rem 0 0", color: "var(--gray-600)", fontSize: "1rem" }}>
            Register to start protecting your child online
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
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              required
              minLength={6}
            />
            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", margin: "0.5rem 0 0" }}>
              Must be at least 6 characters long
            </p>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}

        <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--gray-200)", textAlign: "center" }}>
          <p style={{ margin: "0.5rem 0", color: "var(--gray-600)", fontSize: "0.95rem" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "var(--primary-color)", fontWeight: "600", textDecoration: "none" }}>
              Sign in
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
