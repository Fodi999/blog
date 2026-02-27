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
        <div className="space-y-4">
            {experiences.map((exp, index) => (
                <div
                    key={index}
                    className={cn(
                        "rounded-3xl border border-border/40 bg-card transition-all duration-300 relative z-10 shadow-lg",
                        openIndex === index ? "ring-1 ring-primary/20 shadow-2xl" : "hover:bg-muted/20"
                    )}
                >
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="flex w-full items-center justify-between p-6 text-left"
                    >
                        <div className="flex items-start gap-4">
                            <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                                <Briefcase className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight text-foreground uppercase italic">
                                    {exp.title}
                                </h3>
                                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                                    {exp.role}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    <Calendar className="h-3 w-3" />
                                    {exp.period}
                                </div>
                            </div>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-5 w-5 text-muted-foreground transition-transform duration-300",
                                openIndex === index && "rotate-180 text-primary"
                            )}
                        />
                    </button>

                    {openIndex === index && exp.responsibilities && (
                        <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2">
                            <div className="mb-4 h-px w-full bg-border/50" />
                            <ul className="space-y-3">
                                {exp.responsibilities.map((item, idx) => (
                                    <li key={idx} className="flex gap-3 text-base leading-relaxed text-foreground/80 font-medium">
                                        <span className="text-primary font-black mt-0.5">/</span>
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
