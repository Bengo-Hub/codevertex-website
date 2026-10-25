'use client';

import { useEffect, useState } from 'react';

/**
 * Types each word, holds it, deletes it and moves on, ending on the last word, which stays.
 * Screen readers get `finalText` only (the animation is aria-hidden), and reduced-motion users
 * see the last word straight away.
 */
export function TypedWords({ words, className }: { words: string[]; className?: string }) {
  const final = words[words.length - 1];
  const [text, setText] = useState(final);
  const [done, setDone] = useState(true);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || words.length < 2) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      setDone(false);
      setText('');
      for (let w = 0; w < words.length && !cancelled; w++) {
        const word = words[w];
        for (let i = 1; i <= word.length && !cancelled; i++) {
          setText(word.slice(0, i));
          await wait(70);
        }
        if (w === words.length - 1) break;
        await wait(1100);
        for (let i = word.length; i >= 0 && !cancelled; i--) {
          setText(word.slice(0, i));
          await wait(35);
        }
        await wait(200);
      }
      if (!cancelled) setDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [words]);

  return (
    <>
      <span className="sr-only">{final}</span>
      <span aria-hidden className={className}>
        {text}
        <span className={`ml-0.5 inline-block w-[3px] translate-y-[0.08em] bg-primary align-baseline ${done ? 'animate-[caret_1.1s_steps(1)_3]' : ''}`} style={{ height: '0.85em' }} />
      </span>
    </>
  );
}
