export default function ResultCard({ result }) {
  if (!result) return null;

  const isSafe = result.result === "SAFE";
  const cardClass = isSafe ? "result-card safe" : "result-card unsafe";
  const toxicityScore = typeof result.toxicityScore === "number" ? result.toxicityScore : 0;
  const toxicityPercent = Math.max(0, Math.min(100, toxicityScore * 100));
  const confidencePct = (Number(result.confidence) || 0) * 100;

  return (
    <section className={cardClass}>
      <div className="result-header">
        <h3>{result.result}</h3>
        <span className="result-badge">{isSafe ? "Child Safe" : "Needs Filtering"}</span>
      </div>

      <div className="result-meta-grid">
        {isSafe ? (
          <p className="result-meta-full">
            <strong>Safety confidence:</strong> {confidencePct.toFixed(1)}%
            <span className="result-meta-hint"> — how sure the filter is that this is okay for kids</span>
          </p>
        ) : (
          <>
            <p>
              <strong>Harm confidence:</strong> {confidencePct.toFixed(2)}%
            </p>
            <p>
              <strong>Threshold used:</strong> {(Number(result.thresholdUsed || 0.5) * 100).toFixed(0)}%
            </p>
          </>
        )}
      </div>

      {isSafe ? (
        <p className="result-safe-summary">Nothing harmful detected — safe for kids to read.</p>
      ) : (
        <div className="toxicity-meter">
          <div className="toxicity-meter-row">
            <strong>Harm risk (model):</strong>
            <span>{toxicityPercent.toFixed(1)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${toxicityPercent}%` }} />
          </div>
        </div>
      )}

      <div className="result-text-panels single">
        <article className="result-text-box highlighted">
          <h4>{isSafe ? "Your text" : "Safe version"}</h4>
          <p>{result.maskedText}</p>
        </article>
      </div>
    </section>
  );
}
