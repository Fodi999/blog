import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Dima Fomin', short_name: 'Dima Fomin', start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#050505' };
}
