'use client';

import type { QuickFill } from './ConverterClient';

type Item = { label: string; value: string; from: string; to: string };

interface Props {
  title: string;
  items: Item[];
}

export function QuickExamplesClient({ title, items }: Props) {
  const fill = (qf: QuickFill) => {
    const fn = (window as Window & { __converterFill?: (qf: QuickFill) => void }).__converterFill;
    if (fn) {
      fn(qf);
      // Scroll up to converter smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="mt-10 sm:mt-14">
      <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic mb-5">
        {title}<span className="text-primary">.</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {items.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => fill({ value: ex.value, from: ex.from, to: ex.to })}
            className="border-2 border-border/60 rounded-2xl px-3 py-3 sm:px-5 sm:py-4 font-black text-xs sm:text-sm text-foreground tracking-tight text-center hover:border-primary/60 hover:bg-primary/5 hover:text-primary active:scale-95 transition-all cursor-pointer w-full"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </section>
  );
}
