/** Screenshots of the window of Monge 0.15.196 (20.11.2026, test window, cropped to the parts): only parts of the Monge library. */
export const shots: Record<'fasteners' | 'rebar' | 'cage' | 'bearings' | 'joints' | 'shafts' | 'ribs', { src: string; w: number; h: number }> = {
  fasteners: { src: '/media/monge-fasteners.webp', w: 1600, h: 1000 },
  rebar: { src: '/media/monge-rebar.webp', w: 1600, h: 1000 },
  cage: { src: '/media/monge-cage.webp', w: 1600, h: 1000 },
  bearings: { src: '/media/monge-bearings.webp', w: 1600, h: 1000 },
  joints: { src: '/media/monge-joints.webp', w: 1600, h: 1000 },
  shafts: { src: '/media/monge-shafts.webp', w: 1600, h: 1000 },
  ribs: { src: '/media/monge-ribs.webp', w: 1100, h: 825 },
};

export type ShotId = keyof typeof shots;
