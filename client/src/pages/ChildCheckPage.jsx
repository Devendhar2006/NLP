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
        <h2>Child Content Checker</h2>
        <p>Type in real-time or click check to save a parent log entry.</p>
      </div>
      <textarea
        rows={8}
        placeholder="Type or paste text here..."
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <p className={`typing-status ${typingStatus}`}>
        {typingStatus === "idle" ? "Waiting for input..." : null}
        {typingStatus === "analyzing" ? "Analyzing..." : null}
        {typingStatus === "synced" ? "Synced" : null}
        {typingStatus === "error" ? "Sync error" : null}
      </p>
      <div className="check-actions">
        <button onClick={handleCheckContent} disabled={loading}>
          {loading ? "Checking..." : "Check Content & Save Log"}
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <ResultCard result={result} />
    </section>
  );
}
