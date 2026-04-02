import re
import unicodedata
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


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


def clean_text(text: str) -> str:
    cleaned = str(text).strip().lower()
    cleaned = unicodedata.normalize("NFKC", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)

    # Starter transliteration hooks for Hindi/Telugu words in Latin script.
    for source, target in {**HINDI_HOOKS, **TELUGU_HOOKS}.items():
        cleaned = re.sub(rf"\b{re.escape(source)}\b", target, cleaned)
    return cleaned


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    data_path = base_dir / "data" / "sample_dataset.csv"
    model_dir = base_dir / "models"
    model_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)
    df["text"] = df["text"].apply(clean_text)

    x_train, x_test, y_train, y_test = train_test_split(
        df["text"], df["label"], test_size=0.2, random_state=42
    )

    pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )

    pipeline.fit(x_train, y_train)
    score = pipeline.score(x_test, y_test)
    print(f"Validation accuracy: {score:.2f}")

    vectorizer = pipeline.named_steps["tfidf"]
    classifier = pipeline.named_steps["clf"]

    joblib.dump(vectorizer, model_dir / "vectorizer.joblib")
    joblib.dump(classifier, model_dir / "classifier.joblib")
    print("Model artifacts saved in nlp-service/models/")


if __name__ == "__main__":
    main()
