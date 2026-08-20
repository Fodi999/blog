import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Dima Fomin', short_name: 'Dima Fomin', start_url: '/', display: 'standalone', background_color: '#f1ece1', theme_color: '#0c0a08' };
}
