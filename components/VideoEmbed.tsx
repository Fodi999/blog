'use client';

import { useState } from 'react';

type Props = {
  id: string;
  title: string;
  /** Short line under the title: kind, length, language. */
  meta: string;
  playLabel: string;
};

/**
 * A YouTube video that loads only when the person presses play: until then nothing is requested
 * from YouTube (the poster is drawn here); after the click — youtube-nocookie.com, the
 * privacy-enhanced player.
 */
export function VideoEmbed({ id, title, meta, playLabel }: Props) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden border border-hairline-ink-strong bg-ink-2">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${playLabel}: ${title}`}
          className="group absolute inset-0 flex size-full cursor-pointer flex-col justify-between p-5 text-left md:p-7"
        >
          <span className="blueprint absolute inset-0 opacity-70" aria-hidden="true" />
          <span className="relative text-[14px] text-on-ink-muted">{meta}</span>
          <span className="relative grid size-20 place-items-center self-center rounded-full bg-signal text-ink transition-transform duration-hover group-hover:scale-105 md:size-24">
            <svg viewBox="0 0 24 24" className="ml-1 size-9" fill="currentColor" aria-hidden="true">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          </span>
          <span className="relative max-w-[26ch] font-display text-[clamp(24px,3vw,38px)] leading-[1.05] font-semibold text-on-ink">{title}</span>
        </button>
      )}
    </div>
  );
}
