import axios from "axios";
import { Log } from "../models/Log.js";
import { maskUnsafeWords } from "../utils/maskText.js";

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
    let isUnsafe = unsafeProbability >= parsedThreshold;
    // Toxic-comment model often false-flags long neutral educational text (e.g. Wikipedia-style paragraphs).
    if (isUnsafe && text.trim().length >= 250 && unsafeProbability < 0.82) {
      isUnsafe = false;
    }
    const maskedText = isUnsafe ? maskUnsafeWords(text) : text;

    // Display values must match the final SAFE/UNSAFE decision (no scary "toxicity" on safe text).
    const toxicityScore = isUnsafe ? unsafeProbability : 0;
    // For SAFE, avoid showing a tiny "safety %" when the model was noisy but we cleared the text.
    const confidenceDisplay = isUnsafe
      ? unsafeProbability
      : Math.max(0.88, 1 - unsafeProbability);

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
      logId
    });
  } catch (error) {
    return res.status(500).json({
      message: "Content check failed.",
      error: error.response?.data?.message || error.message
    });
  }
}
