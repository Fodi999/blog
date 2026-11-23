/** Production answers at dima-fomin.pl through the Worker's own workers.dev name (Vercel rewrites to it); tests use
    preview addresses (`<alias>-blog.fodi85999.workers.dev`, `<version>-blog…`) and localhost. */
export function isProductionHost(hostname: string) {
  return hostname === 'blog.fodi85999.workers.dev' || hostname === 'dima-fomin.pl' || hostname.endsWith('.dima-fomin.pl');
}
