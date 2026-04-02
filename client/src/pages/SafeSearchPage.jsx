import { useState } from "react";
import { api } from "../api";

const categories = [
  {
    label: "Science",
    query: "science facts for kids",
    desc: "Explore the wonders of science!",
    theme: "science",
    icon: "🔭"
  },
  {
    label: "Math",
    query: "fun math for kids",
    desc: "Fun with numbers and shapes!",
    theme: "math",
    icon: "🔢"
  },
  {
    label: "Arts",
    query: "art projects for kids",
    desc: "Create and imagine!",
    theme: "arts",
    icon: "🎨"
  },
  {
    label: "Animals",
    query: "amazing animals for kids",
    desc: "Discover amazing creatures!",
    theme: "animals",
    icon: "🐾"
  }
];

export default function SafeSearchPage() {
  const [query, setQuery] = useState("");
  const [includeBlocked, setIncludeBlocked] = useState(false);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(searchQuery) {
    const trimmed = String(searchQuery || "").trim();
    if (!trimmed) {
      setError("Please enter a search query.");
      return;
    }

    setError("");
    setResults([]);
    setMeta(null);
    setLoading(true);

    try {
      // Search uses a high bar so the small toxic model does not block safe encyclopedic results.
      const parent = Number(localStorage.getItem("toxicityThreshold") || 0.93);
      const threshold = Math.max(0.88, Math.min(0.98, parent));
      const response = await api.get("/search", {
        params: { q: trimmed, includeBlocked, threshold }
      });
      setResults(response.data.results || []);
      setMeta({
        query: response.data.query,
        safeCount: response.data.safeCount,
        blockedCount: response.data.blockedCount
      });
    } catch (err) {
      setError(err.response?.data?.message || "Search request failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    runSearch(query);
  }

  function handleCategoryClick(searchText) {
    setQuery(searchText);
    runSearch(searchText);
  }

  return (
    <section className="safe-search-page">
      <div className="safe-search-inner">
        <header className="safe-search-hero">
          <h1 className="safe-search-brand">SafeSearch AI</h1>
          <p className="safe-search-tagline">A safe search engine for kids!</p>
          <div className="safe-search-badge" role="status">
            <span className="safe-search-badge-icon" aria-hidden>
              🛡️
            </span>
            Safe Search ON
          </div>
        </header>

        <form className="safe-search-form-kiddle" onSubmit={handleSearch}>
          <div className="safe-search-bar">
            <span className="safe-search-magnify" aria-hidden>
              🔍
            </span>
            <input
              className="safe-search-field"
              type="search"
              enterKeyHint="search"
              placeholder="What do you want to learn about?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <button className="safe-search-submit" type="submit" disabled={loading}>
              {loading ? "…" : "Search"}
            </button>
          </div>
        </form>

        <section className="explore-categories" aria-labelledby="explore-heading">
          <h2 id="explore-heading" className="explore-title">
            Explore by Category
          </h2>
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat.label}
                type="button"
                className={`category-card category-${cat.theme}`}
                onClick={() => handleCategoryClick(cat.query)}
                disabled={loading}
              >
                <span className="category-icon" aria-hidden>
                  {cat.icon}
                </span>
                <span className="category-name">{cat.label}</span>
                <span className="category-desc">{cat.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <label className="safe-search-options">
          <input
            type="checkbox"
            checked={includeBlocked}
            onChange={(event) => setIncludeBlocked(event.target.checked)}
          />
          Show placeholders for blocked results
        </label>

        {error ? <p className="safe-search-error">{error}</p> : null}

        {meta ? (
          <p className="safe-search-meta">
            Query: <strong>{meta.query}</strong> · Safe: <strong>{meta.safeCount}</strong> · Blocked:{" "}
            <strong>{meta.blockedCount}</strong>
          </p>
        ) : null}

        <div className="search-results-kiddle">
          {results.map((item, index) => (
            <article
              key={`${item.url || "blocked"}-${index}`}
              className={`search-card-kiddle ${item.blocked ? "blocked" : "safe"}`}
            >
              <h3>{item.title}</h3>
              <p>{item.snippet}</p>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.url}
                </a>
              ) : (
                <span className="blocked-pill-kiddle">Blocked for safety</span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
