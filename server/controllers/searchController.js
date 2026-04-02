import axios from "axios";
import { SearchLog } from "../models/SearchLog.js";
import {
  isDomainBlocked,
  isKeywordUnsafe,
  isTrustedEducationalDomain,
  flattenDuckDuckGoTopics
} from "../utils/searchSafety.js";

function stripHtml(input) {
  return String(input || "").replace(/<[^>]*>/g, "").trim();
}

async function fetchWikipediaFallback(query) {
  const wikiUrl =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&utf8=1&format=json&srlimit=12&srsearch=" +
    encodeURIComponent(query);
  const wikiResponse = await axios.get(wikiUrl, {
    timeout: 10000,
    headers: {
      "User-Agent": "ChildSafe-AI-Filter/1.0 (safe educational search)"
    }
  });
  const wikiResults = wikiResponse.data?.query?.search || [];

  return wikiResults.map((entry) => ({
    title: entry.title,
    snippet: stripHtml(entry.snippet),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(entry.title.replace(/\s+/g, "_"))}`
  }));
}

export async function safeSearch(req, res) {
  try {
    const query = String(req.query.q || "").trim();
    const includeBlocked = String(req.query.includeBlocked || "false") === "true";
    // Search: stricter than child-checker — small toxic model over-fires on long encyclopedic text.
    const threshold = Math.min(1, Math.max(0.88, Number(req.query.threshold) || 0.93));

    if (!query) {
      return res.status(400).json({ message: "Query parameter q is required." });
    }

    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const searchResponse = await axios.get(ddgUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "ChildSafe-AI-Filter/1.0 (safe educational search)"
      }
    });
    const data = searchResponse.data || {};

    const rawResults = flattenDuckDuckGoTopics(data.RelatedTopics || []);
    if (data.AbstractText && data.AbstractURL) {
      rawResults.unshift({
        title: data.Heading || "DuckDuckGo Instant Result",
        snippet: data.AbstractText,
        url: data.AbstractURL
      });
    }

    let candidateResults = rawResults.slice(0, 12);
    if (candidateResults.length === 0) {
      candidateResults = await fetchWikipediaFallback(query);
    }

    const limited = candidateResults.slice(0, 12);
    const nlpServiceUrl = process.env.NLP_SERVICE_URL || "http://127.0.0.1:8000";

    const evaluated = await Promise.all(
      limited.map(async (item) => {
        const text = `${item.title}. ${item.snippet}`;

        if (isDomainBlocked(item.url)) {
          return { ...item, blocked: true, reason: "blocked_domain", confidence: 1 };
        }

        if (isKeywordUnsafe(text)) {
          return { ...item, blocked: true, reason: "keyword_filter", confidence: 1 };
        }

        // Wikipedia / DDG topics / known edu sites: trust after keyword pass (avoids ML false positives).
        if (isTrustedEducationalDomain(item.url)) {
          return {
            ...item,
            blocked: false,
            reason: null,
            confidence: 0,
            trustedSource: true
          };
        }

        try {
          const nlp = await axios.post(`${nlpServiceUrl}/predict`, { text, threshold }, { timeout: 8000 });
          const unsafeProbability = Number(nlp.data.unsafe_probability ?? 0);
          const unsafe = unsafeProbability >= threshold;
          return {
            ...item,
            blocked: unsafe,
            reason: unsafe ? "nlp_filter" : null,
            confidence: unsafeProbability
          };
        } catch (error) {
          // Fail closed for safety when NLP service is unavailable.
          return { ...item, blocked: true, reason: "nlp_unavailable", confidence: 1 };
        }
      })
    );

    const safeResults = evaluated.filter((r) => !r.blocked);
    const blockedResults = evaluated.filter((r) => r.blocked);

    const finalResults = includeBlocked
      ? evaluated.map((r) =>
          r.blocked
            ? {
                blocked: true,
                title: "Result blocked for child safety",
                snippet: `This result was filtered by ${r.reason}.`,
                url: null,
                confidence: r.confidence
              }
            : r
        )
      : safeResults;

    await SearchLog.create({
      query,
      totalResults: evaluated.length,
      safeResults: safeResults.length,
      blockedResults: blockedResults.length,
      includeBlocked,
      checkedBy: req.user?.id || null
    });

    return res.status(200).json({
      query,
      totalFetched: evaluated.length,
      safeCount: safeResults.length,
      blockedCount: blockedResults.length,
      results: finalResults
    });
  } catch (error) {
    return res.status(500).json({
      message: "Safe search failed.",
      error: error.response?.data?.message || error.message
    });
  }
}
