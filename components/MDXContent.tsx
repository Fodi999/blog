import { MDXRemote } from 'next-mdx-remote/rsc';
import { ReactNode } from 'react';
import Image from 'next/image';
import { Callout, ChefTip } from './MDXComponents';

interface MDXContentProps {
  source: string;
}

const components = {
  // Headings
  h1: ({ children }: { children: ReactNode }) => (
    <h1 className="text-4xl font-bold mt-12 mb-6 text-foreground">{children}</h1>
  ),
  h2: ({ children }: { children: ReactNode }) => (
    <h2 className="text-3xl font-bold mt-16 mb-6 text-foreground pt-12 border-t border-border/30">{children}</h2>
  ),
  h3: ({ children }: { children: ReactNode }) => (
    <h3 className="text-2xl font-bold mt-12 mb-5 text-foreground">{children}</h3>
  ),
  
  // Paragraphs & Text
  p: ({ children }: { children: ReactNode }) => (
    <p className="text-lg leading-relaxed mb-6 text-foreground">{children}</p>
  ),
  strong: ({ children }: { children: ReactNode }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children: ReactNode }) => (
    <em className="italic text-muted">{children}</em>
  ),
  
  // Lists
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="list-disc list-inside mb-6 space-y-3 text-foreground pl-4">{children}</ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="list-decimal list-inside mb-6 space-y-3 text-foreground pl-4">{children}</ol>
  ),
  li: ({ children }: { children: ReactNode }) => (
    <li className="text-lg ml-2 leading-relaxed">{children}</li>
  ),
  
  // Links
  a: ({ href, children }: { href?: string; children: ReactNode }) => (
    <a 
      href={href} 
      className="text-primary link-hover underline transition-colors"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  
  // Blockquotes
  blockquote: ({ children }: { children: ReactNode }) => (
    <blockquote className="border-l-4 pl-6 py-4 italic my-8 bg-card rounded-r-xl text-muted text-xl" style={{
      borderColor: 'rgb(var(--primary))'
    }}>
      {children}
    </blockquote>
  ),
  
  // Code
  code: ({ children }: { children: ReactNode }) => (
    <code className="bg-card px-2 py-1 rounded text-sm font-mono text-primary">
      {children}
    </code>
  ),
  pre: ({ children }: { children: ReactNode }) => (
    <pre className="bg-card p-4 rounded-lg overflow-x-auto mb-4 border border-border">
      <code className="text-sm font-mono text-foreground">{children}</code>
    </pre>
  ),
  
  // Horizontal Rule
  hr: () => (
    <div className="my-12 flex items-center justify-center">
      <div className="w-16 h-1 rounded-full" style={{
        background: `linear-gradient(90deg, transparent, rgb(var(--primary)), transparent)`
      }} />
    </div>
  ),
  
  // Table
  table: ({ children }: { children: ReactNode }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children: ReactNode }) => (
    <th className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </th>
  ),
  td: ({ children }: { children: ReactNode }) => (
    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-800">
      {children}
    </td>
  ),
  
  // Custom Components
  Callout,
  ChefTip,
  
  // Next.js Image (optimized)
  img: ({ src, alt }: { src?: string; alt?: string }) => {
    if (!src) return null;
    
    // External images
    if (src.startsWith('http')) {
      return (
        <div className="relative w-full h-[400px] my-6 rounded-lg overflow-hidden">
          <Image
            src={src}
            alt={alt || ''}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      );
    }
    
    // Local images
    return (
      <img 
        src={src} 
        alt={alt || ''} 
        className="w-full h-auto rounded-lg my-6 shadow-lg"
      />
    );
  },
};

export function MDXContent({ source }: MDXContentProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <MDXRemote source={source} components={components} />
    </div>
  );
}
