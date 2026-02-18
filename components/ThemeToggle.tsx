'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/60 bg-background/50" disabled />
    );
  }

  const displayTheme = resolvedTheme || (theme === 'system' ? systemTheme : theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-border/60 bg-background/50 backdrop-blur-sm hover:border-primary/30 hover:bg-muted/30 transition-all active:scale-95"
          aria-label="Toggle theme"
        >
          {displayTheme === 'dark' ? (
            <Moon className="h-4.5 w-4.5 text-foreground/80 animate-in spin-in-180 duration-500" />
          ) : (
            <Sun className="h-4.5 w-4.5 text-foreground/80 animate-in spin-in-180 duration-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1 rounded-2xl border-2 border-border shadow-2xl animate-in zoom-in-95 duration-200">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors focus:bg-primary/5 focus:text-primary ${
            theme === 'light' ? 'bg-primary/5 font-bold text-primary' : 'font-medium text-foreground/70'
          }`}
        >
          <Sun className="h-4 w-4" />
          <span>Светлая</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors focus:bg-primary/5 focus:text-primary ${
            theme === 'dark' ? 'bg-primary/5 font-bold text-primary' : 'font-medium text-foreground/70'
          }`}
        >
          <Moon className="h-4 w-4" />
          <span>Тёмная</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors focus:bg-primary/5 focus:text-primary ${
            theme === 'system' ? 'bg-primary/5 font-bold text-primary' : 'font-medium text-foreground/70'
          }`}
        >
          <Monitor className="h-4 w-4" />
          <span>Системная</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
