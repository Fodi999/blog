'use client';

import { useState } from 'react';
import { ChevronDown, Briefcase, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Experience {
    title: string;
    role: string;
    period: string;
    responsibilities?: string[];
}

interface ExperienceAccordionProps {
    experiences: Experience[];
}

export function ExperienceAccordion({ experiences }: ExperienceAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="space-y-3 sm:space-y-4">
            {experiences.map((exp, index) => (
                <div
                    key={index}
                    style={{ zIndex: openIndex === index ? 20 : 10 }}
                    className={cn(
                        "rounded-2xl sm:rounded-3xl border border-border/40 bg-card transition-all duration-300 relative shadow-lg",
                        openIndex === index ? "ring-1 ring-primary/20 shadow-2xl" : "hover:bg-muted/20"
                    )}
                >
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="flex w-full items-center justify-between p-4 sm:p-6 text-left"
                    >
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                            <div className="mt-1 rounded-full bg-primary/10 p-1.5 sm:p-2 text-primary shrink-0">
                                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-xl font-black tracking-tight text-foreground uppercase italic leading-tight">
                                    {exp.title}
                                </h3>
                                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary">
                                    {exp.role}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    {exp.period}
                                </div>
                            </div>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-300 shrink-0 ml-2",
                                openIndex === index && "rotate-180 text-primary"
                            )}
                        />
                    </button>

                    {openIndex === index && exp.responsibilities && (
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 animate-in fade-in slide-in-from-top-2">
                            <div className="mb-3 sm:mb-4 h-px w-full bg-border/50" />
                            <ul className="space-y-2 sm:space-y-3">
                                {exp.responsibilities.map((item, idx) => (
                                    <li key={idx} className="flex gap-2 sm:gap-3 text-sm sm:text-base leading-relaxed text-foreground/80 font-medium">
                                        <span className="text-primary font-black mt-0.5 shrink-0">/</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
