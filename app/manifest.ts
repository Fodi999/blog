import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Dima Fomin | Sushi Chef & Technologist',
    short_name: 'Dima Fomin',
    description: 'Professional sushi chef sharing secrets of Japanese cuisine and culinary technology.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ef4444',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
