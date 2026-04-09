'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Typewriter hook — reveals text character-by-character like ChatGPT.
 *
 * @param text       Full text to reveal
 * @param speed      Milliseconds per character (default: 18 — fast & natural)
 * @param enabled    Whether to animate (false = show instantly)
 * @returns { displayed, isTyping, skip }
 */
export function useTypewriter(
  text: string,
  speed = 18,
  enabled = true,
) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);
  const [isTyping, setIsTyping] = useState(enabled && text.length > 0);
  const indexRef = useRef(0);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayed(text);
      setIsTyping(false);
      return;
    }

    indexRef.current = 0;
    setDisplayed('');
    setIsTyping(true);

    const tick = () => {
      indexRef.current++;
      const next = text.slice(0, indexRef.current);
      setDisplayed(next);

      if (indexRef.current >= text.length) {
        setIsTyping(false);
        return;
      }

      // Speed boost for spaces and punctuation
      const char = text[indexRef.current];
      const delay = char === ' ' ? speed * 0.4
        : char === '\n' ? speed * 3
        : speed;

      rafRef.current = setTimeout(tick, delay);
    };

    rafRef.current = setTimeout(tick, speed);

    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [text, speed, enabled]);

  const skip = () => {
    if (rafRef.current) clearTimeout(rafRef.current);
    setDisplayed(text);
    setIsTyping(false);
  };

  return { displayed, isTyping, skip };
}
