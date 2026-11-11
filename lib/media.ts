/** Screenshots of the program (public/media, made from the window of Monge 0.15.20, 27.10.2026) and frames of films
    computed by Monge Physics and shot in Monge Render (0.15.145, 10–11.11.2026). */
export const shots: Record<'suspension' | 'wheel' | 'disc' | 'render' | 'physics' | 'cloth' | 'brush', { src: string; w: number; h: number }> = {
  suspension: { src: '/media/monge-suspension.webp', w: 1600, h: 963 },
  wheel: { src: '/media/monge-wheel.webp', w: 1600, h: 963 },
  disc: { src: '/media/monge-brake-disc.webp', w: 1600, h: 963 },
  render: { src: '/media/monge-render.webp', w: 1200, h: 900 },
  physics: { src: '/media/monge-physics.webp', w: 1280, h: 720 },
  cloth: { src: '/media/monge-cloth.webp', w: 1280, h: 720 },
  brush: { src: '/media/monge-brush.webp', w: 1080, h: 675 },
};

export type ShotId = keyof typeof shots;
