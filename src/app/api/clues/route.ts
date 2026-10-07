import { NextResponse } from 'next/server';
import { getChallengeForDate } from '@/data/mockChallenges';
import { PLAYABLE_LANGUAGES } from '@/data/playableLanguages';
import { answerCountryClue, classifyDeterministically, safetyResponse } from '@/services/countryClueEngine';
import { answerWithGemini } from '@/services/geminiClueClassifier';

export const runtime = 'nodejs';

const requestWindows = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (!withinRateLimit(forwardedFor)) return NextResponse.json({ error: 'Too many clue requests.' }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const challengeId = typeof body === 'object' && body !== null && 'challengeId' in body ? String(body.challengeId) : '';
  const question = typeof body === 'object' && body !== null && 'question' in body ? String(body.question).trim() : '';
  if (!/^challenge_\d{4}-\d{2}-\d{2}$/.test(challengeId) || !question || question.length > 240) {
    return NextResponse.json({ error: 'Invalid clue request.' }, { status: 400 });
  }

  const date = challengeId.slice('challenge_'.length);
  const challenge = getChallengeForDate(date);
  const language = PLAYABLE_LANGUAGES.find((candidate) => candidate.id === challenge.languageId);
  if (!language) return NextResponse.json({ error: 'Challenge metadata is unavailable.' }, { status: 404 });

  const deterministic = classifyDeterministically(question);
  if (deterministic.category !== 'UNRELATED' && deterministic.category !== 'SAFE_CLUE') {
    return NextResponse.json(safetyResponse(deterministic.category));
  }

  // Answer the actual question, including yes/no wording and follow-up details.
  // Local facts remain a fallback when AI is unavailable or not confident.
  const generatedAnswer = await answerWithGemini(language, question);
  if (generatedAnswer) return NextResponse.json(generatedAnswer);
  if (deterministic.category === 'SAFE_CLUE' && deterministic.topic) {
    const localAnswer = answerCountryClue(language, deterministic.topic);
    if (localAnswer.category === 'SAFE_CLUE') return NextResponse.json(localAnswer);
  }
  return NextResponse.json(safetyResponse('UNRELATED'));
}

function withinRateLimit(key: string): boolean {
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || current.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  current.count += 1;
  return current.count <= 12;
}
