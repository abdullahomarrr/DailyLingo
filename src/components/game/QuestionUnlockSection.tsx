'use client';

import React, { useState } from 'react';
import { ClueQuestionResponse } from '@/types';

interface QuestionUnlockSectionProps {
  unlocked: boolean;
  onAskQuestion: (question: string) => Promise<ClueQuestionResponse>;
  onSkip?: () => void;
  isLoading?: boolean;
}

export const QuestionUnlockSection: React.FC<QuestionUnlockSectionProps> = ({
  unlocked,
  onAskQuestion,
  onSkip,
  isLoading = false,
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [feedback, setFeedback] = useState<ClueQuestionResponse | null>(null);

  if (!unlocked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = inputQuestion.trim();
    if (!question || isLoading) return;
    const response = await onAskQuestion(question);
    setFeedback(response.category === 'SAFE_CLUE' ? null : response);
    if (response.category === 'SAFE_CLUE') setInputQuestion('');
  };

  return (
    <section className="relative my-4 w-full animate-in fade-in slide-in-from-bottom-2 border-y border-neutral-300 bg-neutral-100/60 px-1 py-4 dark:border-neutral-800 dark:bg-neutral-900/35">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-normal uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          One clue available
        </p>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 text-[11px] font-bold text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 dark:decoration-neutral-700 dark:hover:text-white"
          >
            Back to guesses
          </button>
        )}
      </div>

      <div className="mb-3 border-l-2 border-emerald-600 pl-3 dark:border-emerald-500">
        <h2 className="text-base font-black tracking-[-0.01em] text-neutral-950 dark:text-white sm:text-lg">
          Ask about the mystery voice
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          Ask about sports, history, culture, geography or the language. Short questions work too.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-stretch gap-2" aria-label="Ask for a clue">
        <label htmlFor="clue-question" className="sr-only">Your clue question</label>
        <input
          id="clue-question"
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="e.g. Has it ever been in the World Cup?"
          disabled={isLoading}
          className="h-[52px] min-w-0 flex-1 rounded-md border-2 border-neutral-300 bg-white px-4 text-base font-medium text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-[#0b1016] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-emerald-500"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isLoading}
          className="h-[52px] shrink-0 rounded-md bg-neutral-950 px-4 text-xs font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-white dark:text-neutral-950 dark:hover:bg-emerald-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-600 sm:px-5"
        >
          {isLoading ? 'Checking…' : 'Ask'}
        </button>
      </form>

      {feedback && (
        <div role="alert" className="mt-3 border-l-2 border-neutral-400 bg-white/70 py-2.5 pl-3 pr-2 text-xs leading-relaxed text-neutral-700 dark:border-neutral-600 dark:bg-black/20 dark:text-neutral-200">
          <p className="font-bold text-neutral-950 dark:text-white">Try another question — your clue is still available.</p>
          <p className="mt-1">{feedback.answer}</p>
          {feedback.suggestedTopics && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {feedback.suggestedTopics.slice(0, 3).map((topic) => (
                <button key={topic} type="button" onClick={() => { setInputQuestion(topic); setFeedback(null); }} className="rounded-[3px] border border-neutral-300 bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-700 hover:border-emerald-600 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400">
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-2.5 text-[10px] text-neutral-400 dark:text-neutral-500">
        Unanswered questions won’t use your clue. Direct country or language guesses belong in guesses.
      </p>
    </section>
  );
};
