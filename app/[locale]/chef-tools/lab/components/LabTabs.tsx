"use client";

import { cn } from "@/lib/utils";
import { MODES, MODE_ICONS, type Mode } from "./types";

interface LabTabsProps {
  activeMode: Mode;
  onModeChange: (mode: Mode) => void;
  t: any;
}

export function LabTabs({ activeMode, onModeChange, t }: LabTabsProps) {
  return (
    <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/20">
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-muted/30 border border-border/40 overflow-x-auto scrollbar-none no-scrollbar max-w-full">
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m];
            const active = activeMode === m;
            return (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                  active
                    ? "bg-background text-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground/60")} />
                <span>{t(`modes.${m}`)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
