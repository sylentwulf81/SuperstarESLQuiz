/** Extra projector-sized hit targets for tiny East Coast states + Hawaii. */
export const BOARD_VIEWBOX = '180 0 1100 760';

export interface StateHitChip {
  id: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

export const STATE_HIT_CHIPS: StateHitChip[] = [
  { id: 'NH', x: 1248, y: 128, tx: 1159, ty: 130 },
  { id: 'VT', x: 1248, y: 104, tx: 1136, ty: 135 },
  { id: 'MA', x: 1248, y: 156, tx: 1165, ty: 165 },
  { id: 'RI', x: 1248, y: 182, tx: 1172, ty: 182 },
  { id: 'CT', x: 1248, y: 206, tx: 1151, ty: 188 },
  { id: 'NJ', x: 1248, y: 230, tx: 1128, ty: 225 },
  { id: 'DE', x: 1248, y: 254, tx: 1119, ty: 251 },
  { id: 'MD', x: 1248, y: 278, tx: 1105, ty: 255 },
  { id: 'HI', x: 548, y: 678, tx: 598, ty: 630 },
];

export const CHIP_STATE_IDS = new Set(STATE_HIT_CHIPS.map(chip => chip.id));

/** Optional label nudges from each state's SVG bounding-box center. */
export const STATE_LABEL_NUDGE: Record<string, { dx?: number; dy?: number; x?: number; y?: number }> = {
  AK: { x: 318, y: 648 },
  CA: { dx: -10, dy: 8 },
  FL: { dx: 52, dy: 38 },
  ID: { dx: -6, dy: 22 },
  LA: { dx: -10, dy: -10 },
  ME: { dx: 6, dy: 4 },
  MI: { dx: 16, dy: 26 },
  NY: { dx: -22, dy: 6 },
  OK: { dx: 14, dy: 6 },
  TX: { dx: 8, dy: 8 },
  VA: { dx: 12, dy: 6 },
  WA: { dx: 14, dy: 6 },
};
