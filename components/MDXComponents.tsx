import { ReactNode } from 'react';
import { AlertCircle, Lightbulb, Info } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CalloutProps {
  children: ReactNode;
  type?: 'info' | 'warning' | 'tip';
}

export function Callout({ children, type = 'info' }: CalloutProps) {
  const icons = {
    info: <Info className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4 text-destructive" />,
    tip: <Lightbulb className="h-4 w-4 text-primary" />,
  };

  const variants = {
    info: 'default' as const,
    warning: 'destructive' as const,
    tip: 'default' as const,
  };

  return (
    <Alert variant={variants[type]} className={`my-6 rounded-2xl border-2 ${
      type === 'tip' ? 'border-primary/20 bg-primary/5' : 
      type === 'info' ? 'border-border/50 bg-muted/30' : ''
    }`}>
      <div className="flex gap-4">
        <div className="mt-0.5">{icons[type]}</div>
        <div>
          <AlertDescription className="text-foreground/90 leading-relaxed italic">
            {children}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

interface ChefTipProps {
  children: ReactNode;
}

export function ChefTip({ children }: ChefTipProps) {
  return (
    <div className="my-10 p-8 rounded-[2rem] border-2 relative overflow-hidden bg-zinc-950/5 dark:bg-zinc-100/5 backdrop-blur-sm border-primary/20">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-primary/10 shadow-xl rotate-3 transform transition-transform hover:rotate-0 duration-500">
            <Image
              src="https://i.postimg.cc/W1KV4b43/logo1.webp"
              alt="Chef Dima Fomin"
              width={64}
              height={64}
              className="object-cover w-full h-full scale-110"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="font-black text-primary mb-3 text-xl tracking-tight uppercase italic flex items-center gap-2">
            Chef's Tip <span className="h-px bg-primary/20 flex-1 ml-2" />
          </div>
          <div className="text-foreground/80 leading-relaxed font-medium">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
