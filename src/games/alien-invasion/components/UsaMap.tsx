import React, { useLayoutEffect, useRef, useState } from 'react';
import { InvasionTeam, factionOf } from '../data/factions';
import { US_STATE_PATHS } from '../data/usStatePaths';
import { BOARD_VIEWBOX, CHIP_STATE_IDS, STATE_HIT_CHIPS, STATE_LABEL_NUDGE } from '../data/stateHitChips';

interface UsaMapProps {
  teams: InvasionTeam[];
  owners: Record<string, string | null>;
  selectedId: string | null;
  pulseId: string | null;
  onSelect: (stateId: string) => void;
}

const UNCLAIMED = '#e2e8f0';

function teamColor(teams: InvasionTeam[], teamId: string | null | undefined): string {
  if (!teamId) return UNCLAIMED;
  const team = teams.find(t => t.id === teamId);
  if (!team) return UNCLAIMED;
  return factionOf(team).accentColor;
}

export const UsaMap: React.FC<UsaMapProps> = ({
  teams,
  owners,
  selectedId,
  pulseId,
  onSelect,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [labelPos, setLabelPos] = useState<Record<string, { x: number; y: number }>>({});

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const next: Record<string, { x: number; y: number }> = {};
    for (const state of US_STATE_PATHS) {
      if (CHIP_STATE_IDS.has(state.id)) continue;
      const el = svg.querySelector(`[data-state="${state.id}"]`) as SVGGraphicsElement | null;
      if (!el) continue;
      const box = el.getBBox();
      const nudge = STATE_LABEL_NUDGE[state.id];
      next[state.id] = {
        x: nudge?.x ?? box.x + box.width / 2 + (nudge?.dx ?? 0),
        y: nudge?.y ?? box.y + box.height / 2 + (nudge?.dy ?? 0),
      };
    }
    setLabelPos(next);
  }, []);

  const focusId = hoveredId || selectedId;
  const focusState = focusId ? US_STATE_PATHS.find(state => state.id === focusId) : undefined;

  return (
    <div
      className="relative w-full h-full"
      onMouseLeave={() => setHoveredId(null)}
    >
      {focusState && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="inline-flex items-baseline gap-3 px-4 py-2 rounded-2xl bg-slate-950/85 border-2 border-yellow-300/70 shadow-[0_0_24px_rgba(253,224,71,0.35)]">
            <span className="font-mario text-2xl sm:text-4xl text-cyan-300">{focusState.id}</span>
            <span className="font-mario text-3xl sm:text-5xl text-yellow-300 drop-shadow-[0_2px_0_#0f172a]">
              {focusState.name}
            </span>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={BOARD_VIEWBOX}
        className="w-full h-full select-none"
        role="img"
        aria-label="United States map"
      >
        <rect x="180" y="0" width="1100" height="760" fill="transparent" />
        {US_STATE_PATHS.map(state => {
          const fill = teamColor(teams, owners[state.id]);
          const active = hoveredId === state.id || selectedId === state.id;
          const pulse = pulseId === state.id;
          return (
            <path
              key={state.id}
              data-state={state.id}
              d={state.d}
              fill={fill}
              stroke={active ? '#fde047' : '#0f172a'}
              strokeWidth={active ? 2.4 : 1.15}
              role="button"
              tabIndex={0}
              aria-label={state.name}
              className="cursor-pointer transition-[filter] duration-150"
              style={{
                filter: pulse
                  ? 'drop-shadow(0 0 10px #fde047)'
                  : active
                    ? 'brightness(1.15)'
                    : undefined,
              }}
              onMouseEnter={() => setHoveredId(state.id)}
              onMouseLeave={() => setHoveredId(current => (current === state.id ? null : current))}
              onClick={() => onSelect(state.id)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(state.id);
                }
              }}
            />
          );
        })}

        {US_STATE_PATHS.map(state => {
          if (CHIP_STATE_IDS.has(state.id)) return null;
          const pos = labelPos[state.id];
          if (!pos) return null;
          const fill = teamColor(teams, owners[state.id]);
          const claimed = fill !== UNCLAIMED;
          return (
            <text
              key={`label-${state.id}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight="800"
              fill={claimed ? '#fff' : '#0f172a'}
              stroke={claimed ? '#0f172a' : '#f8fafc'}
              strokeWidth="3"
              paintOrder="stroke"
              style={{ pointerEvents: 'none' }}
            >
              {state.id}
            </text>
          );
        })}

        {STATE_HIT_CHIPS.map(chip => {
          const fill = teamColor(teams, owners[chip.id]);
          const active = hoveredId === chip.id || selectedId === chip.id;
          return (
            <g
              key={`chip-${chip.id}`}
              role="button"
              tabIndex={0}
              aria-label={`${chip.id} chip`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredId(chip.id)}
              onMouseLeave={() => setHoveredId(current => (current === chip.id ? null : current))}
              onClick={() => onSelect(chip.id)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(chip.id);
                }
              }}
            >
              <line
                x1={chip.tx}
                y1={chip.ty}
                x2={chip.x}
                y2={chip.y}
                stroke={active ? '#fde047' : '#94a3b8'}
                strokeWidth={1.6}
              />
              <circle
                cx={chip.x}
                cy={chip.y}
                r={16}
                fill={fill}
                stroke={active ? '#fde047' : '#f8fafc'}
                strokeWidth={2.4}
              />
              <text
                x={chip.x}
                y={chip.y + 4.5}
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill={fill === UNCLAIMED ? '#0f172a' : '#fff'}
                style={{ pointerEvents: 'none' }}
              >
                {chip.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
