import fs from 'node:fs';

const svg = fs.readFileSync('.pptx-invade-usa/usa.svg', 'utf8');
const re = /<path\s+id="([a-z]{2})"\s+name="([^"]+)"\s+d="([^"]+)"/g;
const states = [];
let match;
while ((match = re.exec(svg))) {
  if (match[1] === 'dc') continue;
  states.push({ id: match[1].toUpperCase(), name: match[2], d: match[1] === 'ak' || match[1] === 'hi' ? match[3] : match[3] });
  states[states.length - 1].d = match[3];
}
states.sort((a, b) => a.id.localeCompare(b.id));

const out = `/** CC0 US state paths, derived from Heitordp / @svg-maps/usa. */
export const US_MAP_VIEWBOX = '192 9 1028 746';

export interface UsStatePath {
  id: string;
  name: string;
  d: string;
}

export const US_STATE_PATHS: UsStatePath[] = ${JSON.stringify(states, null, 2)};
`;

fs.mkdirSync('src/games/alien-invasion/data', { recursive: true });
fs.writeFileSync('src/games/alien-invasion/data/usStatePaths.ts', out);
console.log('states', states.length, 'bytes', out.length);
console.log(states.map(s => s.id).join(','));
