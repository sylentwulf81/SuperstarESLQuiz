import type { InvasionFactionId } from './factions';

const ASSET = '/assets/alien-invasion';

export interface CinematicLayer {
  src: string;
  left: string;
  top: string;
  width: string;
  height?: string;
  blend?: 'screen' | 'normal';
  z?: number;
}

export interface CinematicScene {
  id: string;
  bg: string;
  audio: string;
  durationMs: number;
  layers: CinematicLayer[];
  headline?: string;
  subhead?: string;
}

function layer(
  file: string,
  left: number,
  top: number,
  width: number,
  height?: number,
  blend: 'screen' | 'normal' = 'screen',
  z = 1
): CinematicLayer {
  return {
    src: `${ASSET}/${file}`,
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: height != null ? `${height}%` : undefined,
    blend,
    z,
  };
}

export const INTRO_SCENES: CinematicScene[] = [
  {
    id: 'invade',
    bg: `${ASSET}/image1.png`,
    audio: `${ASSET}/media1.mp3`,
    durationMs: 9000,
    layers: [
      layer('image2.gif', 21.4, 13.9, 40.5, 51.1),
      layer('image3.gif', 65.4, 4.1, 46.7, 83.1, 'screen', 2),
      layer('image4.gif', 18.4, 32.7, 22.7, 40.3, 'screen', 3),
      layer('image4.gif', 25.1, 18.1, 18.8, 33.3, 'screen', 3),
      layer('image6.gif', 5.5, 72.5, 8.3, 14.7),
      layer('image7.gif', 9.6, 0, 12, 18),
      layer('image8.gif', 0, 76, 10, 22),
      layer('image9.png', 23.5, 7.3, 53.3, 23.3, 'screen', 8),
      layer('image10.png', 35.3, 32.5, 27.9, 23.3, 'screen', 8),
      layer('image11.png', 36.5, 56, 26.6, 28.1, 'screen', 8),
    ],
  },
  {
    id: 'broadcast',
    bg: `${ASSET}/image14.png`,
    audio: `${ASSET}/media1.mp3`,
    durationMs: 8000,
    headline: 'UNDER ATTACK',
    subhead: 'WHO WILL WIN?',
    layers: [
      layer('image28.jpeg', 51.7, 9.9, 46, 47.5, 'normal', 2),
      layer('image29.png', 49.4, 6.1, 50.6, 55.3, 'normal', 3),
      layer('image15.gif', 0, 38, 42, 54, 'screen', 4),
      layer('image27.png', 0, 42.1, 51.7, 57.9, 'normal', 5),
      layer('image19.gif', 53.7, 18.9, 17.9, 36.9, 'screen', 6),
      layer('image20.gif', 64, 20, 20, 28, 'screen', 6),
      layer('image23.gif', 72, 16, 18, 32, 'screen', 6),
      layer('image25.gif', 84.8, 12, 14, 18, 'screen', 6),
      layer('image18.gif', 58.9, 28.4, 5, 10, 'screen', 7),
      layer('image18.gif', 71.8, 23.6, 5, 10, 'screen', 7),
      layer('image18.gif', 83.3, 44.3, 5, 10, 'screen', 7),
    ],
  },
];

const WHITE_HOUSE_FIRE: CinematicLayer[] = [
  layer('image3.gif', 16, -8, 37.9, 67.3, 'screen', 2),
  layer('image3.gif', 45.2, 3.6, 25.8, 45.9, 'screen', 2),
  layer('image3.gif', 62.3, 6.8, 28.9, 51.3, 'screen', 2),
  layer('image4.gif', 21.1, 29.6, 18.8, 33.3, 'screen', 3),
  layer('image4.gif', 60.3, 41.7, 18.8, 35.3, 'screen', 3),
];

export const ENDING_SCENES: Record<InvasionFactionId, CinematicScene[]> = {
  anime: [
    {
      id: 'win-anime',
      bg: `${ASSET}/image86.png`,
      audio: `${ASSET}/media2.mp3`,
      durationMs: 14000,
      layers: [
        ...WHITE_HOUSE_FIRE,
        layer('image87.gif', 60.9, 0, 22.9, 68.4, 'screen', 4),
        layer('image88.gif', 33.1, 3.7, 25.8, 36.9, 'screen', 4),
        layer('image90.gif', 2.9, 61.5, 17.2, 38.5, 'screen', 5),
        layer('image91.gif', 77.8, 61.1, 21.8, 38.7, 'screen', 5),
        layer('image92.gif', 30.8, 72.3, 7.1, 12.7, 'screen', 5),
        layer('image95.gif', 42.3, 71.7, 21.8, 28.9, 'screen', 5),
        layer('image93.png', 30.3, 28.9, 44.9, 54.7, 'screen', 10),
      ],
    },
  ],
  robots: [
    {
      id: 'win-robots',
      bg: `${ASSET}/image86.png`,
      audio: `${ASSET}/media3.mp3`,
      durationMs: 14000,
      layers: [
        ...WHITE_HOUSE_FIRE,
        layer('image97.gif', 28.4, 0.5, 45.7, 58.8, 'screen', 4),
        layer('image96.gif', 69.8, 12.5, 32, 69.1, 'screen', 4),
        layer('image98.gif', 69.3, 56.1, 26.1, 46.4, 'screen', 5),
        layer('image99.gif', 4, 58.8, 12.2, 21.6, 'screen', 5),
        layer('image100.gif', 20.5, 69.6, 11, 27.7, 'screen', 5),
        layer('image101.png', 31.4, 41.2, 41.5, 44.1, 'normal', 10),
      ],
    },
  ],
  zombies: [
    {
      id: 'win-zombies',
      bg: `${ASSET}/image86.png`,
      audio: `${ASSET}/media4.mp3`,
      durationMs: 14000,
      layers: [
        ...WHITE_HOUSE_FIRE,
        layer('image103.gif', 1.4, 71.1, 13.7, 28.3, 'screen', 5),
        layer('image103.gif', 14.3, 69.7, 13.7, 28.3, 'screen', 5),
        layer('image104.gif', 31.7, 66.3, 13.7, 35.9, 'screen', 5),
        layer('image108.gif', 41, 64.5, 23.5, 41.7, 'screen', 5),
        layer('image105.gif', 54.4, 61.1, 20, 35.6, 'screen', 5),
        layer('image106.gif', 80.3, 69.7, 20.2, 35.9, 'screen', 5),
        layer('image32.gif', 74.2, 36.3, 8, 18, 'screen', 6),
        layer('image107.png', 26.6, 4, 43.4, 72, 'screen', 10),
      ],
    },
  ],
  aliens: [
    {
      id: 'win-aliens',
      bg: `${ASSET}/image86.png`,
      audio: `${ASSET}/media5.mp3`,
      durationMs: 14000,
      layers: [
        ...WHITE_HOUSE_FIRE,
        layer('image109.gif', 15.3, -2.3, 22.9, 32.5, 'screen', 4),
        layer('image110.gif', 41.8, 1.2, 22, 30.8, 'screen', 4),
        layer('image111.gif', 74.6, 4.8, 25.8, 45.9, 'screen', 4),
        layer('image112.gif', 2.8, 57.1, 13.4, 23.6, 'screen', 5),
        layer('image112.gif', 87.5, 59.3, 12.8, 22.5, 'screen', 5),
        layer('image114.gif', 12, 48.9, 27.7, 59.3, 'screen', 5),
        layer('image113.gif', 66.1, 57.1, 21.3, 37.9, 'screen', 5),
        layer('image115.png', 36.3, 40, 34.8, 42, 'screen', 10),
      ],
    },
  ],
  monsters: [
    {
      id: 'win-monsters',
      bg: `${ASSET}/image86.png`,
      audio: `${ASSET}/media1.mp3`,
      durationMs: 14000,
      headline: 'MONSTERS WIN!',
      layers: [
        ...WHITE_HOUSE_FIRE,
        layer('image2.gif', 28, 8, 42, 58, 'screen', 4),
        layer('image7.gif', 6, 4, 16, 22, 'screen', 5),
        layer('image8.gif', 4, 68, 14, 28, 'screen', 5),
        layer('image6.gif', 82, 70, 14, 24, 'screen', 5),
      ],
    },
  ],
};
