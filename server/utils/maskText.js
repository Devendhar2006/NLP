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

export function detectUnsafeWords(text) {
  const input = String(text || "");
  const matchedWords = [];

  for (const word of harmfulWords) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(input)) {
      matchedWords.push(word);
    }
  }

  return matchedWords;
}

export function maskUnsafeWords(text, options = {}) {
  const input = String(text || "");
  const { forceMaskAllIfNoMatch = false } = options;
  let masked = input;

  for (const word of harmfulWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    masked = masked.replace(regex, "***");
  }

  // If the model marks text unsafe but no exact token match is found,
  // mask all tokens as a safety fallback.
  if (forceMaskAllIfNoMatch && masked === input) {
    masked = input.replace(/[A-Za-z0-9_]+/g, "***");
  }

  return masked;
}
