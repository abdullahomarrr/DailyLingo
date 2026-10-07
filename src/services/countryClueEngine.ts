import countryFactsJson from '@/data/countryClueFacts.json';
import famousPeopleJson from '@/data/countryFamousPeople.json';
import worldCupFacts from '@/data/countryWorldCupFacts.json';
import { ClueQuestionResponse, ClueSafetyCategory, Language } from '@/types';

export type CountryClueTopic =
  | 'dish' | 'religion' | 'languages' | 'population' | 'currency' | 'capital'
  | 'region' | 'celebrity' | 'borders' | 'area' | 'landlocked' | 'driving_side' | 'calling_code'
  | 'domain' | 'demonym' | 'script' | 'tonal' | 'family'
  | 'world_cup' | 'world_cup_winner' | 'world_cup_host';

interface CountryFactProfile {
  countryCode: string;
  countryName: string;
  aliases: string[];
  capital: string | null;
  currencies: Array<{ code: string; name: string; symbol: string | null }>;
  languages: string[];
  languageDetail: string | null;
  population: { value: number; year: number | null };
  religions: string | null;
  associatedDishes: string[];
  region: string;
  subregion: string;
  borders: string[];
  areaKm2: number;
  landlocked: boolean;
  drivingSide: string | null;
  callingCode: string | null;
  topLevelDomains: string[];
  demonym: string | null;
}

const countryFacts = countryFactsJson as CountryFactProfile[];
const famousPeople: Record<string, { name: string; knownFor: string; source: string }> = famousPeopleJson;

const TOPIC_PATTERNS: Array<[CountryClueTopic, RegExp[]]> = [
  ['dish', [/\b(national\s+)?dish(?:es)?\b/i, /\bfood\b/i, /\bcuisine\b/i, /\bmeal\b/i, /\bwhat\s+(?:do|would)\s+(?:they|people)\s+eat\b/i, /\bfamous\s+food\b/i]],
  ['religion', [/\breligio(?:n|ns|us)\b/i, /\bfaiths?\b/i, /\bworship\b/i, /\bwhat\s+do\s+they\s+believe\b/i, /\bbeliefs?\b/i]],
  ['languages', [/\blanguages?\s+(?:are\s+)?spoken\b/i, /\bofficial\s+languages?\b/i, /\bwhat\s+do\s+they\s+speak\b/i]],
  ['population', [/\bpopulation\b/i, /\bhow\s+many\s+(?:people|live)\b/i, /\bpeople\s+live\s+there\b/i, /\bpop\b/i]],
  ['currency', [/\bcurrenc(?:y|ies)\b/i, /\bwhat\s+money\b/i, /\bmoney\s+(?:do|does)\b/i, /\bpay\s+with\b/i]],
  ['capital', [/\bcapital(?:\s+city)?\b/i, /\bmain\s+city\b/i, /\bseat\s+of\s+government\b/i]],
  ['celebrity', [/\bceleb(?:rity|rities|s)?\b/i, /\bfamous\s+(?:people|person|figure|someone)\b/i, /\bwell[ -]known\s+(?:people|person|figure)\b/i, /\b(?:actors?|actress(?:es)?|singers?|rappers?|musicians?|athletes?|footballers?|comedians?|composers?|authors?|writers?|directors?|models?|sports\s+stars?)\b/i, /\bwho(?:'s|\s+is)\s+famous\b/i, /\banyone\s+famous\b/i]],
  ['region', [/\bcontinent\b/i, /\bregion\b/i, /\bwhere\s+(?:is|in the world)\b/i, /\bpart\s+of\s+(?:the\s+)?(?:world|africa|asia|europe|americas?|oceania)\b/i, /\b(?:africa|asia|europe|americas?|oceania)\b/i, /\b(?:north|south|east|west)(?:ern)?\b/i, /\bgeograph/i]],
  ['borders', [/\bborders?\b/i, /\bneighbou?rs?\b/i, /\bnext\s+to\b/i, /\badjacent\b/i]],
  ['area', [/\barea\b/i, /\bhow\s+(?:big|large)\b/i, /\bsize\s+of\s+the\s+country\b/i]],
  ['landlocked', [/\blandlocked\b/i, /\bcoast(?:line|al)?\b/i, /\baccess\s+to\s+(?:the\s+)?sea\b/i, /\bocean\b/i]],
  ['driving_side', [/\bdrive\b/i, /\bdriving\s+side\b/i, /\bleft\s+side\b/i, /\bright\s+side\b/i]],
  ['calling_code', [/\bcalling\s+code\b/i, /\bphone\s+code\b/i, /\bdial(?:ing)?\s+code\b/i]],
  ['domain', [/\btop.level\s+domain\b/i, /\binternet\s+domain\b/i, /\bwebsite\s+ending\b/i, /\btld\b/i]],
  ['demonym', [/\bdemonym\b/i, /\bpeople\s+from\s+there\s+called\b/i, /\bwhat\s+are\s+the\s+people\s+called\b/i]],
  ['script', [/\bscript\b/i, /\balphabet\b/i, /\bwriting\s+system\b/i, /\bwritten\b/i, /\bletters\b/i]],
  ['tonal', [/\btonal\b/i, /\btone\s+language\b/i, /\bpitch\b/i]],
  ['family', [/\blanguage\s+family\b/i, /\blinguistic\s+family\b/i, /\brelated\s+languages?\b/i, /\bbranch\b/i]],
];

const INJECTION_PATTERNS = [/ignore\s+(?:all\s+)?(?:previous|above)/i, /system\s+prompt/i, /developer\s+(?:message|mode)/i, /jailbreak/i, /reveal\s+your\s+instructions/i, /print\s+(?:the\s+)?prompt/i];
const GIVEAWAY_PATTERNS = [/\bwhat\s+(?:is|country|language)\b.*\banswer\b/i, /^(?:what|which)\s+(?:country|language)(?:\s+is\s+(?:it|this|that)|\s+are\s+they\s+speaking)?\s*[?!.]*$/i, /\bwhere\s+is\s+the\s+speaker\s+from\s*[?!.]*$/i, /\btell\s+me\s+the\s+answer\b/i, /\b(?:name|reveal)\s+(?:the\s+)?(?:country|language|answer)\b/i, /\bspell\s+(?:the\s+)?(?:country|language|answer|it)\b/i, /\biso\s*(?:code|639)\b/i, /\bglottocode\b/i];

export function classifyDeterministically(question: string): { category: ClueSafetyCategory; topic?: CountryClueTopic } {
  const normalized = question.trim().replace(/\s+/g, ' ');
  if (!normalized) return { category: 'UNRELATED' };
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(normalized))) return { category: 'PROMPT_INJECTION' };
  if (GIVEAWAY_PATTERNS.some((pattern) => pattern.test(normalized))) return { category: 'TOO_REVEALING' };

  const lower = normalized.toLowerCase().replace(/[?!.,]/g, '').trim();
  const guessedPlace = lower.match(/^(?:is\s+(?:it|this|the\s+answer)|could\s+it\s+be|maybe|i\s+think(?:\s+it\s+is)?)\s+(?:from\s+|in\s+)?(.+)$/)?.[1];
  // ISO codes such as IN are ordinary words too; substring checks also mistook
  // country aliases inside unrelated words for direct country guesses.
  if (guessedPlace && countryFacts.some((profile) => [profile.countryName, ...profile.aliases]
    .filter((name) => name.toUpperCase() !== profile.countryCode)
    .some((name) => guessedPlace === name.toLowerCase() || guessedPlace === `the ${name.toLowerCase()}`))) return { category: 'TOO_REVEALING' };

  if (/\bworld\s*cup\b/i.test(normalized)) {
    // Keep other sports, women's tournaments and detailed statistics available
    // to the general answerer instead of returning the wrong football fact.
    if (/\b(?:cricket|rugby|women|women's|womens|female|when|how many|years?|last|202\d)\b/i.test(normalized)) return { category: 'UNRELATED' };
    const topic = /\b(?:won|win|winner|champion)\b/i.test(normalized) ? 'world_cup_winner'
      : /\bhost(?:ed|s|ing)?\b/i.test(normalized) ? 'world_cup_host' : 'world_cup';
    return { category: 'SAFE_CLUE', topic };
  }

  for (const [topic, patterns] of TOPIC_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(normalized))) return { category: 'SAFE_CLUE', topic };
  }
  return { category: 'UNRELATED' };
}

export function getSupportedTopics(): CountryClueTopic[] {
  return [...TOPIC_PATTERNS.map(([topic]) => topic), 'world_cup', 'world_cup_winner', 'world_cup_host'];
}

export function getCountryClueContext(language: Language) {
  const facts = countryFacts.find((profile) => profile.countryCode === language.geoAnchor.countryCode
    || profile.countryName === (language.geoAnchor.countryName === 'Turkey' ? 'Türkiye' : language.geoAnchor.countryName));
  return facts ? {
    country: facts,
    language: { name: language.name, aliases: language.aliases, family: language.family, scripts: language.scripts, clueProfile: language.clueProfile },
    famousPerson: famousPeople[facts.countryCode],
    worldCup: {
      competition: worldCupFacts.competition,
      throughYear: worldCupFacts.throughYear,
      hasAppeared: worldCupFacts.participants.includes(facts.countryCode),
      hasWon: worldCupFacts.winners.includes(facts.countryCode),
      hasHosted: worldCupFacts.hosts.includes(facts.countryCode),
      note: (worldCupFacts.notes as Record<string, string>)[facts.countryCode],
    },
  } : null;
}

export function sanitizeGeneratedClue(language: Language, answer: string): string | null {
  const context = getCountryClueContext(language);
  if (!context || !answer.trim() || answer.length > 1200) return null;
  let sanitized = removeCountryReferences(answer, context.country).replace(/^local\b/i, 'This country');
  for (const name of [language.name, language.nativeName, ...(language.aliases || [])].filter((name) => name && name.length > 2)) {
    sanitized = sanitized.replace(new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi'), 'this language');
  }
  // URLs and code blocks can hide an answer name or identifying code.
  if (/https?:\/\/|www\.|```|\[[^\]]*\]\(/i.test(sanitized)) return null;
  return sanitized;
}

export function answerCountryClue(language: Language, topic: CountryClueTopic, source: 'DETERMINISTIC' | 'GEMINI_ROUTED' = 'DETERMINISTIC'): ClueQuestionResponse {
  const targetName = language.geoAnchor.countryName === 'Turkey' ? 'Türkiye' : language.geoAnchor.countryName;
  const facts = countryFacts.find((profile) => profile.countryName === targetName || profile.countryCode === language.geoAnchor.countryCode);
  if (!facts) return unsupported();

  let answer = '';
  switch (topic) {
    case 'world_cup': {
      const participated = worldCupFacts.participants.includes(facts.countryCode);
      const note = (worldCupFacts.notes as Record<string, string>)[facts.countryCode];
      answer = participated
        ? `Yes — it has been represented at the ${worldCupFacts.competition}.${note ? ` ${note}` : ''}`
        : `No — through ${worldCupFacts.throughYear}, it has not appeared at the ${worldCupFacts.competition}.`;
      break;
    }
    case 'world_cup_winner': answer = `${worldCupFacts.winners.includes(facts.countryCode) ? 'Yes' : 'No'} — ${worldCupFacts.winners.includes(facts.countryCode) ? 'it has' : `through ${worldCupFacts.throughYear}, it has not`} won the men's FIFA World Cup.`; break;
    case 'world_cup_host': answer = `${worldCupFacts.hosts.includes(facts.countryCode) ? 'Yes' : 'No'} — ${worldCupFacts.hosts.includes(facts.countryCode) ? 'it has' : `through ${worldCupFacts.throughYear}, it has not`} hosted the men's FIFA World Cup.`; break;
    case 'dish': if (facts.associatedDishes.length) answer = `A dish strongly associated with this country is ${joinList(facts.associatedDishes)}.`; break;
    case 'religion': if (facts.religions) answer = `Its religious landscape is: ${facts.religions}`; break;
    case 'languages': answer = facts.languageDetail || (facts.languages.length ? `Languages used there include ${joinList(facts.languages)}.` : ''); break;
    case 'population': if (facts.population.value) answer = `Its population is about ${formatPopulation(facts.population.value)}${facts.population.year ? ` (${facts.population.year})` : ''}.`; break;
    case 'currency': if (facts.currencies.length) answer = describeCurrencies(facts.currencies); break;
    case 'capital': if (facts.capital) answer = `Its capital is ${facts.capital}.`; break;
    case 'region': {
      // Some subregion labels contain the answer itself (e.g. New Zealand).
      const subregionNamesCountry = [facts.countryName, ...facts.aliases]
        .filter((name) => name.length > 2)
        .some((name) => new RegExp(`\\b${escapeRegex(name)}\\b`, 'i').test(facts.subregion));
      const region = subregionNamesCountry ? facts.region : facts.subregion || facts.region;
      answer = `It is in ${region}${region !== facts.region ? `, within ${facts.region}` : ''}.`;
      break;
    }
    case 'celebrity': {
      const person = famousPeople[facts.countryCode];
      if (person) answer = `A well-known person associated with this country is ${person.name}, ${person.knownFor}.`;
      break;
    }
    case 'borders': answer = facts.borders.length ? `It shares land borders with ${joinList(facts.borders)}.` : 'It has no land borders.'; break;
    case 'area': answer = `It covers about ${Math.round(facts.areaKm2).toLocaleString('en-US')} square kilometres.`; break;
    case 'landlocked': answer = facts.landlocked ? 'It is landlocked.' : 'It is not landlocked and has access to the sea or ocean.'; break;
    case 'driving_side': if (facts.drivingSide) answer = `Traffic drives on the ${facts.drivingSide} side of the road.`; break;
    case 'calling_code': if (facts.callingCode) answer = `Its international calling code is ${facts.callingCode}.`; break;
    case 'domain': if (facts.topLevelDomains.length) answer = `Its country-code internet domain is ${joinList(facts.topLevelDomains)}.`; break;
    // A demonym is usually just the country name in adjectival form, so it is
    // not a useful clue once answer-leak protection is applied.
    case 'demonym': break;
    case 'script': answer = language.clueProfile.alphabetOrScript || (language.scripts.length ? `The language is written using ${joinList(language.scripts)}.` : ''); break;
    case 'tonal':
      if (language.clueProfile.tonal === true) answer = 'Yes. This is a tonal language, so pitch can distinguish word meanings.';
      if (language.clueProfile.tonal === false) answer = 'No. It is not generally classified as a tonal language.';
      break;
    case 'family': {
      const reviewedFamily = language.family && language.family !== 'Catalogued language';
      if (reviewedFamily) answer = `It belongs to the ${language.family} language family${language.branch && language.branch !== 'Provider-reviewed variety' ? `, in the ${language.branch} branch` : ''}.`;
      break;
    }
  }

  if (!answer) return unsupported();
  const safeAnswer = removeCountryReferences(answer, facts);
  if (!safeAnswer) return unsupported();
  return { category: 'SAFE_CLUE', answer: safeAnswer, topic, source };
}

export function safetyResponse(category: ClueSafetyCategory): ClueQuestionResponse {
  if (category === 'TOO_REVEALING') return { category, answer: 'That would give away the answer too directly. Ask about a characteristic of the country or language instead.', warning: 'Direct giveaway prevented', suggestedTopics: suggestions() };
  if (category === 'PROMPT_INJECTION' || category === 'ABUSIVE') return { category, answer: 'That question cannot be used for a clue. Ask about the country or language instead.', warning: 'Invalid clue question', suggestedTopics: suggestions() };
  return unsupported();
}

function unsupported(): ClueQuestionResponse {
  return { category: 'UNRELATED', answer: 'I could not confidently answer that question. Your clue is still available — try rephrasing it or asking another question.', warning: 'No confident answer available', suggestedTopics: suggestions() };
}

function suggestions(): string[] {
  return ['Has it ever been in the World Cup?', 'Famous celebrity?', 'What region is it in?', 'What is a national dish?'];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function joinList(items: string[]): string {
  if (items.length < 2) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function formatPopulation(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} billion people`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 100_000_000 ? 0 : 1).replace(/\.0$/, '')} million people`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} thousand people`;
  return `${value.toLocaleString('en-US')} people`;
}

function describeCurrencies(currencies: CountryFactProfile['currencies']): string {
  const units = [...new Set(currencies.map((currency) => currencyUnit(currency.name)).filter(Boolean))];
  if (!units.length) return '';
  return `It uses ${units.length === 1 ? `a form of the ${units[0]}` : `forms of the ${joinList(units)}`}.`;
}

function currencyUnit(name: string): string {
  const normalized = name.toLowerCase();
  const knownUnits = [
    'dollar', 'euro', 'pound', 'franc', 'shilling', 'peso', 'dinar', 'dirham',
    'riyal', 'rial', 'rupee', 'rupiah', 'krone', 'krona', 'koruna', 'leu', 'lira',
    'yen', 'yuan', 'won', 'ruble', 'rouble', 'rand', 'real', 'quetzal', 'guarani',
    'boliviano', 'sol', 'hryvnia', 'zloty', 'forint', 'lek', 'kwanza', 'birr',
    'cedi', 'naira', 'metical', 'pula', 'loti', 'lilangeni', 'dalasi', 'ouguiya',
    'ariary', 'vatu', 'tala', 'paanga', 'kina', 'riel', 'kip', 'taka', 'ngultrum',
    'som', 'manat', 'lari', 'dram', 'denar', 'mark', 'lev', 'kuna', 'gourde',
    'cordoba', 'balboa', 'colon', 'florin', 'guilder', 'pataca', 'shekel', 'baht',
  ];
  const unit = knownUnits.find((candidate) => new RegExp(`\\b${candidate}s?\\b`, 'i').test(normalized));
  return unit || normalized.split(/\s+/).at(-1)?.replace(/s$/, '') || '';
}

function removeCountryReferences(answer: string, facts: CountryFactProfile): string {
  const sensitiveTerms = [facts.countryName, ...facts.aliases, facts.demonym]
    .filter((term): term is string => Boolean(term && term.length > 2))
    .sort((a, b) => b.length - a.length);

  let sanitized = answer;
  for (const term of sensitiveTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sanitized = sanitized.replace(new RegExp(`\\bChurch\\s+of\\s+${escaped}\\b`, 'gi'), 'the established church');
    sanitized = sanitized.replace(new RegExp(`\\b${escaped}(?:['’]s)?\\b`, 'gi'), 'local');
  }

  return sanitized
    .replace(/\blocal\s+local\b/gi, 'local')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
