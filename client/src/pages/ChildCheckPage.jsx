import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import ResultCard from "../components/ResultCard";

export default function ChildCheckPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typingStatus, setTypingStatus] = useState("idle");

  async function checkContent({ persistLog }) {
    setError("");

    if (!text.trim()) {
      setResult(null);
      setTypingStatus("idle");
      return;
    }

    setLoading(true);
    setTypingStatus("analyzing");
    try {
      const threshold = Number(localStorage.getItem("toxicityThreshold") || 0.5);
      const response = await api.post("/content/check-text", {
        text,
        saveLog: persistLog,
        threshold
      });
      setResult(response.data);
      setTypingStatus("synced");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to check content.");
      setTypingStatus("error");
    } finally {
      setLoading(false);
    }
  }

  function handleCheckContent() {
    checkContent({ persistLog: true });
  }

  const trimmedText = useMemo(() => text.trim(), [text]);

  useEffect(() => {
    if (!trimmedText) {
      setResult(null);
      return;
    }

    // Debounce to avoid firing request on each key stroke.
    const timer = setTimeout(() => {
      checkContent({ persistLog: false });
    }, 450);

    return () => clearTimeout(timer);
  }, [trimmedText]);

  return (
    <section className="card child-checker-card">
      <div className="child-checker-head">
        <h2>👶 Child Content Checker</h2>
        <p>Type or paste content to instantly analyze safety. Real-time checking enabled.</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <label style={{ display: "block", fontWeight: "700", marginBottom: "0.75rem", color: "var(--gray-800)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.3px" }}>
          📝 Enter Content to Check
        </label>
        <textarea
          rows={10}
          placeholder="Paste or type text here... Content will be analyzed in real-time."
          value={text}
          onChange={(event) => setText(event.target.value)}
          style={{ 
            width: "100%",
            padding: "1rem 1.5rem",
            border: "2.5px solid var(--gray-200)",
            borderRadius: "0.85rem",
            fontSize: "1rem",
            fontFamily: "inherit",
            transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
            color: "var(--gray-800)",
            fontWeight: "500",
            resize: "vertical"
          }}
        />
      </div>

      <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ 
          fontSize: "0.85rem",
          fontWeight: "700",
          padding: "0.75rem 1.25rem",
          borderRadius: "0.65rem",
          transition: "all 0.3s ease",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem"
        }} className={`typing-status ${typingStatus}`}>
          {typingStatus === "idle" && "⏳ Waiting for input..."}
          {typingStatus === "analyzing" && "🔍 Analyzing..."}
          {typingStatus === "synced" && "✅ Synced"}
          {typingStatus === "error" && "❌ Sync error"}
        </span>
      </div>

      <div className="check-actions">
        <button 
          onClick={handleCheckContent} 
          disabled={loading}
          style={{
            padding: "1.1rem 2rem",
            border: "none",
            borderRadius: "0.85rem",
            fontSize: "1.05rem",
            fontWeight: "700",
            cursor: loading ? "wait" : "pointer",
            background: loading ? "rgba(37, 99, 235, 0.6)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            boxShadow: "0 8px 25px rgba(239, 68, 68, 0.35)",
            transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            opacity: loading ? 0.65 : 1,
            transform: loading ? "none" : "translateY(0)"
          }}
          onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-3px)", e.target.style.boxShadow = "0 12px 40px rgba(239, 68, 68, 0.5)")}
          onMouseLeave={(e) => !loading && (e.target.style.transform = "translateY(0)", e.target.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.35)")}
        >
          {loading ? "🔄 Analyzing Content..." : "🔍 Check Content & Save Log"}
        </button>
      </div>

      {error && <p className="error-text">⚠️ {error}</p>}
      
      <ResultCard result={result} />
    </section>
  );
}
