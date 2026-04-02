import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function ParentDashboardPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [threshold, setThreshold] = useState(
    Number(localStorage.getItem("toxicityThreshold") || 0.5)
  );
  const navigate = useNavigate();
  const parentEmail = localStorage.getItem("parentEmail") || "Parent";

  async function fetchLogs({ silent = false } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get("/logs");
      setLogs(response.data);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchLogs();

    // Auto-refresh dashboard so new child checks appear live.
    const intervalId = setInterval(() => {
      fetchLogs({ silent: true });
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("parentEmail");
    navigate("/login");
  }

  function handleThresholdChange(event) {
    const value = Number(event.target.value);
    setThreshold(value);
    localStorage.setItem("toxicityThreshold", String(value));
  }

  return (
    <section className="card">
      <div className="row-between">
        <h2>Parent Dashboard</h2>
        <div className="dashboard-actions">
          <button className="small-btn" onClick={() => fetchLogs({ silent: true })} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh Logs"}
          </button>
          <button className="small-btn" onClick={logout}>Logout</button>
        </div>
      </div>
      <p>Signed in as: {parentEmail}</p>
      {lastUpdated ? <p>Last updated: {lastUpdated.toLocaleTimeString()}</p> : null}
      <div className="threshold-box">
        <label htmlFor="threshold-slider">
          Strictness Threshold: {(threshold * 100).toFixed(0)}%
        </label>
        <input
          id="threshold-slider"
          type="range"
          min="0.3"
          max="0.9"
          step="0.05"
          value={threshold}
          onChange={handleThresholdChange}
        />
        <small>
          Higher value = less sensitive; lower value = stricter unsafe detection.
        </small>
      </div>

      {loading ? <p>Loading logs...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Text</th>
                <th>Result</th>
                <th>Masked Text</th>
                <th>Confidence</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{log.text}</td>
                  <td className={log.result === "safe" ? "safe-text" : "unsafe-text"}>
                    {log.result.toUpperCase()}
                  </td>
                  <td>{log.maskedText}</td>
                  <td>{(log.confidence * 100).toFixed(2)}%</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5}>No logs yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
