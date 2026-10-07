export type GeoHintType = 'ORIGIN_POINT' | 'ORIGIN_REGION' | 'MULTI_REGION' | 'DISABLED';

export type ProximityBand = 'HOT' | 'WARM' | 'COLD';

export interface GeoAnchor {
  latitude: number;
  longitude: number;
  continent: string;
  countryCode?: string;
  countryName?: string;
  regionName?: string;
  polygonId?: string;
  explanation?: string;
}

export interface SourceMetadata {
  name: string;
  url?: string;
  license: string;
  version?: string;
  attribution?: string;
}

export interface LanguageGeography {
  hintType: GeoHintType;
  anchors: GeoAnchor[];
  notes?: string;
}

export interface LanguageVariant {
  id: string;
  name: string;
  region?: string;
  description?: string;
}

export interface ClueProfile {
  food?: string;
  music?: string;
  alphabetOrScript?: string;
  tonal?: boolean;
  relatedLanguages?: string[];
  famousMovieOrWork?: string;
  culturalCelebration?: string;
  interestingFact?: string;
  historicalEra?: string;
}

export interface Language {
  id: string;
  glottocode?: string;
  level?: 'language' | 'dialect';
  parentId?: string;
  name: string;
  nativeName: string;
  aliases: string[];
  iso6391?: string;
  iso6393?: string;
  family: string;
  branch?: string;
  scripts: string[];
  continents: string[];
  primaryRegions: string[];
  countries: string[];
  variants?: LanguageVariant[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  geoHintType: GeoHintType;
  /** Primary development anchor. Production catalogs may expose multiple anchors. */
  geoAnchor: GeoAnchor;
  geography?: LanguageGeography;
  geographicNotes?: string;
  estimatedSpeakers?: string;
  clueProfile: ClueProfile;
  sourceMetadata?: SourceMetadata;
  enabled: boolean;
}

export type AudioReviewStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface AudioVerification {
  languageVerified: boolean;
  dialectVerified: boolean;
  transcriptVerified: boolean;
  translationVerified: boolean;
  directGiveawayChecked: boolean;
  approvedForGame: boolean;
  reviewStatus: AudioReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export interface CountryGuess {
  id: string;
  name: string;
  aliases: string[];
  geoAnchor: GeoAnchor;
}

export interface AudioClip {
  id: string;
  languageId: string;
  variantId?: string;
  audioUrl: string;
  durationSeconds: number;
  transcriptOriginal: string;
  translationEnglish: string;
  transcriptLicense?: string;
  translationLicense?: string;
  speakerLabel?: string;
  speakerRegion?: string;
  sourceName: string;
  sourceUrl?: string;
  license: string;
  creator?: string;
  attribution?: string;
  attributionUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  storageKey?: string;
  recordingDate?: string;
  qualityStatus: 'VERIFIED' | 'COMMUNITY' | 'PROVISIONAL';
  moderationStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  containsDirectGiveaway: boolean;
  verification?: AudioVerification;
  /** Development-only playback bypass; never eligible in production builds. */
  previewOnly?: boolean;
  enabled: boolean;
}

export type AudioReviewProficiency = 'NATIVE' | 'FLUENT' | 'LEARNING' | 'NOT_SPEAKER';

export type AudioReviewIssue =
  | 'WRONG_LANGUAGE_OR_DIALECT'
  | 'TRANSCRIPT_OR_TRANSLATION'
  | 'BACKGROUND_NOISE'
  | 'SYNTHETIC_OR_EDITED'
  | 'CONTAINS_GIVEAWAY';

export interface AudioCommunityReview {
  challengeId: string;
  audioClipId: string;
  languageId: string;
  languageProficiency: AudioReviewProficiency;
  ratings: {
    pronunciation: number;
    fluency: number;
    audioQuality: number;
    naturalness: number;
  };
  issues: AudioReviewIssue[];
  notes?: string;
  submittedAt: string;
  /** Community feedback always enters a review queue; it never approves a clip directly. */
  submissionStatus: 'PENDING';
}

export type AppFeedbackArea =
  | 'AUDIO'
  | 'DIFFICULTY'
  | 'MAP'
  | 'CLUES'
  | 'DESIGN'
  | 'PERFORMANCE';

export interface AppFeedbackSurvey {
  overallRating: number;
  puzzleFairness: 'FAIR' | 'MOSTLY_FAIR' | 'UNFAIR';
  returnIntent: 'YES' | 'MAYBE' | 'NO';
  improvementAreas: AppFeedbackArea[];
  suggestion?: string;
  challengeId: string;
  appVersion: string;
  submittedAt: string;
}

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  challengeNumber: number;
  languageId: string;
  audioClipId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  aiQuestionLimit: number;
  proximityHintStartsAtGuess: number;
  active: boolean;
  answerMode?: 'LANGUAGE' | 'SPEAKER_COUNTRY';
  /** The challenge-level answer geography; never infer this from language identity in production. */
  answerGeoAnchor?: GeoAnchor;
  resultMetadata?: {
    sponsor?: string;
    curatorNote?: string;
  };
}

export interface GuessResult {
  attemptNumber: number;
  guessedLanguageId: string;
  guessedLanguageName: string;
  guessedCountryName: string;
  isCorrect: boolean;
  continentMatch: boolean;
  guessedContinent: string;
  targetContinent: string;
  proximityBand?: ProximityBand;
  distanceKm?: number;
  geoAnchor: GeoAnchor;
}

export type ClueSafetyCategory =
  | 'SAFE_CLUE'
  | 'TOO_REVEALING'
  | 'PROMPT_INJECTION'
  | 'UNRELATED'
  | 'ABUSIVE';

export interface ClueQuestionResponse {
  category: ClueSafetyCategory;
  answer: string;
  warning?: string;
  suggestedTopics?: string[];
  topic?: string;
  source?: 'DETERMINISTIC' | 'GEMINI_ROUTED' | 'GEMINI_ANSWERED';
}

export type GameStatus = 'PLAYING' | 'WON' | 'LOST';

export interface DailyGameState {
  challengeId: string;
  date: string;
  challengeNumber: number;
  languageId: string;
  audioClipId: string;
  guesses: GuessResult[];
  status: GameStatus;
  questionAsked?: {
    question: string;
    response: ClueQuestionResponse;
  };
  completedAt?: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalQuestionsUsed: number;
  gamesSolvedWithoutAI: number;
  lastPlayedDate?: string;
  history: Array<{
    date: string;
    challengeNumber: number;
    won: boolean;
    guessesCount: number;
    usedAI: boolean;
    languageName: string;
  }>;
}
