/** Screenshots of the program (public/media, made from the window of Monge 0.15.20, 27.10.2026). */
export const shots: Record<'suspension' | 'wheel' | 'disc' | 'render', { src: string; w: number; h: number }> = {
  suspension: { src: '/media/monge-suspension.webp', w: 1600, h: 963 },
  wheel: { src: '/media/monge-wheel.webp', w: 1600, h: 963 },
  disc: { src: '/media/monge-brake-disc.webp', w: 1600, h: 963 },
  render: { src: '/media/monge-render.webp', w: 1200, h: 900 },
};

export type ShotId = keyof typeof shots;
