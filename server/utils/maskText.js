// Keep a simple word list to explain the masking concept.
const harmfulWords = [
  "idiot",
  "idot",
  "stupid",
  "dumb",
  "hate",
  "kill",
  "sex",
  "nude",
  "porn"
];

export function maskUnsafeWords(text) {
  let masked = text;
  for (const word of harmfulWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    masked = masked.replace(regex, "***");
  }

  // Fallback: if nothing changed but the sentence is unsafe,
  // mask every word token so no harmful text is shown.
  if (masked === text) {
    masked = text.replace(/[A-Za-z0-9_]+/g, "***");
  }

  return masked;
}
