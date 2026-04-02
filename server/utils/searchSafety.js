const bannedWords = [
  "adult",
  "porn",
  "xxx",
  "explicit",
  "nude",
  "sex",
  "violence",
  "escort"
];

const blockedDomains = [
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "redtube.com",
  "youporn.com"
];

export function isKeywordUnsafe(text) {
  const normalized = text.toLowerCase();
  return bannedWords.some((word) => new RegExp(`\\b${word}\\b`, "i").test(normalized));
}

export function isDomainBlocked(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return blockedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
}

/**
 * Known educational / encyclopedic sources — skip ML false positives on long neutral text.
 * Still subject to keyword + hard domain block lists above.
 */
const trustedEducationalHosts = [
  "wikipedia.org",
  "wikimedia.org",
  "wiktionary.org",
  "khanacademy.org",
  "pbskids.org",
  "nationalgeographic.com",
  "kids.nationalgeographic.com",
  "duckduckgo.com"
];

export function isTrustedEducationalDomain(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return trustedEducationalHosts.some((d) => host === d || host.endsWith(`.${d}`));
  } catch (error) {
    return false;
  }
}

export function flattenDuckDuckGoTopics(items) {
  const output = [];

  function walk(entryList) {
    for (const entry of entryList || []) {
      if (entry?.Topics?.length) {
        walk(entry.Topics);
      } else if (entry?.Text && entry?.FirstURL) {
        output.push({
          title: entry.Text.split(" - ")[0]?.trim() || "Untitled",
          snippet: entry.Text,
          url: entry.FirstURL
        });
      }
    }
  }

  walk(items);
  return output;
}
