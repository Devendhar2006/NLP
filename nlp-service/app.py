from pathlib import Path
import re
import unicodedata

import joblib
from flask import Flask, jsonify, request

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
VECTORIZER_PATH = BASE_DIR / "models" / "vectorizer.joblib"
CLASSIFIER_PATH = BASE_DIR / "models" / "classifier.joblib"

if not VECTORIZER_PATH.exists() or not CLASSIFIER_PATH.exists():
    raise FileNotFoundError(
        "Model files are missing. Run `python train_model.py` in nlp-service first."
    )

vectorizer = joblib.load(VECTORIZER_PATH)
classifier = joblib.load(CLASSIFIER_PATH)

HINDI_HOOKS = {
    "bewakoof": "idiot",
    "bakwas": "stupid",
    "ganda": "dirty",
}

TELUGU_HOOKS = {
    "vedhava": "idiot",
    "chetta": "stupid",
    "asahyam": "hate",
}


def preprocess_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text.strip().lower())
    normalized = re.sub(r"\s+", " ", normalized)

    # Hooks map common romanized Hindi/Telugu forms to shared toxic tokens.
    for source, target in {**HINDI_HOOKS, **TELUGU_HOOKS}.items():
        normalized = re.sub(rf"\b{re.escape(source)}\b", target, normalized)
    return normalized


@app.get("/health")
def health():
    return jsonify({"message": "NLP service is healthy"}), 200


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "")
    threshold = payload.get("threshold", 0.5)
    if not isinstance(text, str) or not text.strip():
        return jsonify({"message": "Text is required."}), 400
    try:
        threshold = float(threshold)
    except (TypeError, ValueError):
        threshold = 0.5
    threshold = max(0.0, min(1.0, threshold))

    cleaned = preprocess_text(text)
    vector = vectorizer.transform([cleaned])
    prob = classifier.predict_proba(vector)[0]
    unsafe_probability = float(prob[1])
    label = "unsafe" if unsafe_probability >= threshold else "safe"
    confidence = unsafe_probability if label == "unsafe" else 1 - unsafe_probability

    return (
        jsonify(
            {
                "label": label,
                "confidence": round(confidence, 4),
                "unsafe_probability": round(unsafe_probability, 4),
                "threshold_used": round(threshold, 4),
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
