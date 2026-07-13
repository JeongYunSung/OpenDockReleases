const CATEGORY_RULES = [
  {
    id: "poultry",
    label: "poultry",
    minimum: { C: 74, F: 165 },
    pattern: /\b(?:raw|uncooked)?\s*(?:chicken|turkey|duck|goose|poultry)(?:\s+(?:breast|thigh|wing|drumstick|cutlet))?\b|생닭|닭고기|칠면조|오리고기|거위고기/i,
    exclusion: /\b(?:broth|stock|bouillon)\b|육수/i,
    explicit: /\b(?:raw|uncooked|breast|thigh|wing|drumstick|cutlet)\b|생닭|닭고기/i,
  },
  {
    id: "ground-meat",
    label: "ground meat",
    minimum: { C: 71, F: 160 },
    pattern: /\b(?:ground|minced)\s+(?:beef|pork|lamb|meat|veal)\b|\b(?:beef|pork|lamb)\s+(?:burger|patty)\b|다짐육|간\s*(?:소고기|쇠고기|돼지고기|양고기)|분쇄육/i,
  },
  {
    id: "whole-cut",
    label: "whole beef, pork, or lamb cut",
    minimum: { C: 63, F: 145 },
    pattern: /\b(?:raw|uncooked)\s+(?:beef|pork|lamb)\b|\b(?:beef|pork|lamb)\s+(?:steak|roast|chop|loin|tenderloin|rib|cutlet)\b|\b(?:pork|lamb)\s+chops?\b|\bsteak\b|생(?:소고기|쇠고기|돼지고기|양고기)|(?:소고기|쇠고기|돼지고기|양고기).{0,8}(?:스테이크|로스트|찹|갈비|등심|안심|목살|삼겹살|통고기)/i,
  },
  {
    id: "egg-dish",
    label: "egg dish",
    minimum: { C: 71, F: 160 },
    pattern: /\begg\s+(?:dish|casserole|frittata|mixture)\b|\b(?:frittata|quiche|omelet|omelette|scrambled eggs?)\b|계란찜|달걀찜|계란\s*요리|달걀\s*요리|오믈렛|스크램블(?:드)?\s*(?:에그|계란|달걀)/i,
  },
  {
    id: "fish-seafood",
    label: "fish or seafood",
    minimum: { C: 63, F: 145 },
    pattern: /\b(?:fish|salmon|tuna|cod|tilapia|trout|halibut|shrimp|prawn|scallop|lobster|crab|shellfish|seafood)(?:\s+fillet)?\b|생선|연어|참치|대구|송어|새우|가리비|랍스터|게살|꽃게|대게|홍게|킹크랩|조개|해산물/i,
    exclusion: /\b(?:fish|seafood)\s+(?:sauce|stock|broth)\b|어장|액젓|육수/i,
    explicit: /\b(?:fillet|salmon|tuna|cod|tilapia|trout|halibut|shrimp|prawn|scallop|lobster|crab|shellfish)\b|생선|연어|참치|대구|송어|새우|가리비|랍스터|게살|꽃게|대게|홍게|킹크랩|조개/i,
  },
];

const internalTemperature = /internal\s+(?:temperature|temp)|내부\s*온도|중심\s*온도|속\s*온도/i;
const temperatureValue = /(-?\d+(?:\.\d+)?)\s*(?:°\s*)?([CF])\b/gi;
const officialHealthDomains = [
  "cdc.gov",
  "fda.gov",
  "foodsafety.gov",
  "fsis.usda.gov",
  "usda.gov",
  "foodsafetykorea.go.kr",
  "mfds.go.kr",
  "food.gov.uk",
  "canada.ca",
  "health.gov.au",
  "mpi.govt.nz",
  "who.int",
  "efsa.europa.eu",
  "ec.europa.eu",
];

function lineHasCategory(line, rule) {
  if (!rule.pattern.test(line)) return false;
  if (rule.exclusion?.test(line) && !rule.explicit?.test(line)) return false;
  if (rule.id === "poultry" && /\b(?:fully cooked|pre-cooked|precooked|rotisserie)\b|완전\s*조리|조리된\s*닭/i.test(line)) {
    return /\b(?:raw|uncooked)\b|생닭/i.test(line);
  }
  return true;
}

function categoriesIn(text) {
  const found = new Set();
  for (const line of text.split(/\r?\n/)) {
    for (const rule of CATEGORY_RULES) {
      if (lineHasCategory(line, rule)) found.add(rule.id);
    }
  }
  return [...found];
}

export function extractInternalTemperatureClaims(text) {
  const claims = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const previous = lines[index - 1] ?? "";
    if (!internalTemperature.test(line) && !internalTemperature.test(previous)) continue;
    temperatureValue.lastIndex = 0;
    for (const match of line.matchAll(temperatureValue)) {
      claims.push({
        value: Number(match[1]),
        unit: match[2].toUpperCase(),
        display: match[0],
        categories: categoriesIn(line),
      });
    }
  }
  return claims;
}

function relevantClaims(category, detectedCategories, claims) {
  const scoped = claims.filter((claim) => claim.categories.includes(category));
  if (scoped.length) return scoped;
  if (detectedCategories.length === 1) return claims.filter((claim) => claim.categories.length === 0);
  return [];
}

function hasThreeMinuteRest(text) {
  return /\brest(?:ing)?\s+(?:the\s+\w+\s+)?(?:for\s+)?(?:at\s+least\s+)?3\s*(?:minutes?|mins?)\b|\b3\s*(?:minutes?|mins?)\s+(?:of\s+)?rest(?:ing)?\b|3\s*분(?:간)?\s*(?:휴지|레스팅|쉬|둔|두)/i.test(text);
}

function validAccessDate(sourceEvidence) {
  const matches = sourceEvidence.matchAll(/(?:accessed|retrieved|조회일|접속일)\s*:?[\s-]*(20\d{2})-(\d{2})-(\d{2})/gi);
  for (const match of matches) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) return true;
  }
  return false;
}

function officialHttpsSource(sourceEvidence) {
  const matches = sourceEvidence.matchAll(/https:\/\/[^\s<>()\[\]`"']+/gi);
  for (const match of matches) {
    try {
      const url = new URL(match[0].replace(/[.,;:]+$/, ""));
      const host = url.hostname.toLowerCase();
      if (officialHealthDomains.some((domain) => host === domain || host.endsWith(`.${domain}`))) return true;
    } catch {
      // Ignore malformed source candidates.
    }
  }
  return false;
}

function hasScopeOrLimitation(sourceEvidence) {
  return /\b(?:scope|limitations?|applies?\s+to|applicability|jurisdiction|product labels?|local (?:guidance|rules?))\b|적용\s*범위|한계|제품\s*(?:표시|라벨)|현지\s*지침|국가별/i.test(sourceEvidence);
}

export function validateFoodSafety({ text, sourceEvidence, file, addFailure }) {
  const detectedCategories = categoriesIn(text);
  const claims = extractInternalTemperatureClaims(text);

  for (const rule of CATEGORY_RULES.filter((item) => detectedCategories.includes(item.id))) {
    const relevant = relevantClaims(rule.id, detectedCategories, claims);
    if (relevant.length === 0) {
      addFailure(
        "raw-protein-temperature",
        file,
        `${rule.label} guidance needs a labeled internal-temperature claim of at least ${rule.minimum.C}C/${rule.minimum.F}F.`,
      );
      continue;
    }
    const unsafe = relevant.filter((claim) => claim.value < rule.minimum[claim.unit]);
    if (unsafe.length) {
      addFailure(
        "raw-protein-temperature",
        file,
        `${rule.label} claim ${unsafe.map((claim) => claim.display).join(", ")} is below ${rule.minimum.C}C/${rule.minimum.F}F.`,
      );
    }
  }

  if (detectedCategories.includes("whole-cut") && !hasThreeMinuteRest(text)) {
    addFailure("whole-cut-rest", file, "Whole beef, pork, and lamb cuts need a 3-minute rest after reaching 63C/145F.");
  }

  if (claims.length > 0) {
    const missing = [];
    if (!officialHttpsSource(sourceEvidence)) missing.push("a recognized official public-health HTTPS URL");
    if (!validAccessDate(sourceEvidence)) missing.push("an access date in YYYY-MM-DD format");
    if (missing.length) {
      addFailure("food-safety-source", file, `Internal-temperature claims need ${missing.join(" and ")} in Sources And Uncertainty.`);
    }
    if (!hasScopeOrLimitation(sourceEvidence)) {
      addFailure("food-safety-source-scope", file, "Sources And Uncertainty must state the guidance scope or limitations.");
    }
  }
}
