import axios from "axios";
import { Log } from "../models/Log.js";
import { detectUnsafeWords, maskUnsafeWords } from "../utils/maskText.js";

export async function checkText(req, res) {
  try {
    const { text, saveLog = true, threshold = 0.5 } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ message: "Text input is required." });
    }
    const parsedThreshold = Math.min(1, Math.max(0, Number(threshold) || 0.5));

    const nlpServiceUrl = process.env.NLP_SERVICE_URL || "http://127.0.0.1:8000";
    const nlpResponse = await axios.post(`${nlpServiceUrl}/predict`, {
      text,
      threshold: parsedThreshold
    });

    const { unsafe_probability: unsafeProbability = 0.5 } = nlpResponse.data;
    const matchedUnsafeWords = detectUnsafeWords(text);
    const hasRuleBasedUnsafeWord = matchedUnsafeWords.length > 0;
    const tokenCount = (text.match(/[A-Za-z0-9_]+/g) || []).length;
    const keywordHits = matchedUnsafeWords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    let isUnsafe = unsafeProbability >= parsedThreshold;
    // Toxic-comment model often false-flags long neutral educational text (e.g. Wikipedia-style paragraphs).
    if (isUnsafe && text.trim().length >= 250 && unsafeProbability < 0.82) {
      isUnsafe = false;
    }
    // Always fail closed when explicit blocked words are present.
    if (hasRuleBasedUnsafeWord) {
      isUnsafe = true;
    }

    const maskedText = isUnsafe
      ? maskUnsafeWords(text, { forceMaskAllIfNoMatch: !hasRuleBasedUnsafeWord })
      : text;

    // Policy score reflects keyword density, not model overreaction on long neutral paragraphs.
    const keywordDensity = tokenCount > 0 ? keywordHits / tokenCount : 0;
    const policyRiskScore = Math.max(0.08, Math.min(0.35, keywordDensity * 12));

    // Display values must match the final SAFE/UNSAFE decision.
    const toxicityScore = isUnsafe
      ? hasRuleBasedUnsafeWord
        ? policyRiskScore
        : unsafeProbability
      : 0;

    const confidenceDisplay = isUnsafe
      ? hasRuleBasedUnsafeWord
        ? policyRiskScore
        : Math.max(unsafeProbability, parsedThreshold)
      : Math.max(0.88, 1 - unsafeProbability);

    const moderationReason = hasRuleBasedUnsafeWord
      ? "keyword_rule"
      : isUnsafe
        ? "ml_model"
        : "none";

    let logId = null;
    if (saveLog) {
      const log = await Log.create({
        text,
        result: isUnsafe ? "unsafe" : "safe",
        maskedText,
        confidence: confidenceDisplay,
        checkedBy: req.user?.id || null
      });
      logId = log._id;
    }

    return res.status(200).json({
      result: isUnsafe ? "UNSAFE" : "SAFE",
      originalText: text,
      maskedText,
      confidence: confidenceDisplay,
      toxicityScore,
      thresholdUsed: parsedThreshold,
      moderationReason,
      matchedUnsafeWords,
      mlUnsafeProbability: unsafeProbability,
      policyRiskScore: hasRuleBasedUnsafeWord ? policyRiskScore : null,
      logId
    });
  } catch (error) {
    return res.status(500).json({
      message: "Content check failed.",
      error: error.response?.data?.message || error.message
    });
  }
}
