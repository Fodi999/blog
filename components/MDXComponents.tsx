import { ReactNode } from 'react';
import { AlertCircle, Lightbulb, Info } from 'lucide-react';
import Image from 'next/image';

interface CalloutProps {
  children: ReactNode;
  type?: 'info' | 'warning' | 'tip';
}

export function Callout({ children, type = 'info' }: CalloutProps) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100',
    warning: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900 text-yellow-900 dark:text-yellow-100',
    tip: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-900 dark:text-green-100',
  };

  const icons = {
    info: <Info className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    tip: <Lightbulb className="h-5 w-5" />,
  };

  return (
    <div className={`border-l-4 p-4 my-4 rounded-r-lg ${styles[type]}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

interface ChefTipProps {
  children: ReactNode;
}

export function ChefTip({ children }: ChefTipProps) {
  return (
    <div className="my-8 p-6 rounded-xl border-2 relative overflow-hidden" style={{
      backgroundColor: 'rgb(var(--primary) / 0.05)',
      borderColor: 'rgb(var(--primary) / 0.3)'
    }}>
      <div className="absolute top-0 left-0 w-1 h-full" style={{
        backgroundColor: 'rgb(var(--primary))'
      }} />
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{
            borderColor: 'rgb(var(--primary))'
          }}>
            <Image
              src="https://i.postimg.cc/fWKbJXrD/Snimok-ekrana-2026-02-04-v-20-56-27.png"
              alt="Chef Dima Fomin"
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="font-bold text-foreground mb-2 text-lg">Rada od Szefa</div>
          <div className="text-foreground leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
