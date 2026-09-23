import React from 'react';
import { GameTheme } from '@/shared/types';

interface AmbientParticlesProps {
  theme: GameTheme;
}

const WASH: Record<GameTheme, string> = {
  classic:
    'radial-gradient(ellipse 55% 50% at 35% 0%, rgba(251,113,133,0.14), transparent 70%), radial-gradient(ellipse 45% 45% at 100% 100%, rgba(251,191,36,0.12), transparent 70%), radial-gradient(ellipse 40% 40% at 0% 55%, rgba(34,211,238,0.08), transparent 70%)',
  summer:
    'radial-gradient(ellipse 55% 50% at 100% 0%, rgba(251,191,36,0.14), transparent 70%), radial-gradient(ellipse 45% 45% at 0% 100%, rgba(34,211,238,0.08), transparent 70%)',
  christmas:
    'radial-gradient(ellipse 55% 50% at 100% 0%, rgba(103,232,249,0.12), transparent 70%), radial-gradient(ellipse 45% 45% at 0% 100%, rgba(99,102,241,0.12), transparent 70%)',
};

/**
 * Cheap atmospheric wash. Filter blurs on large layers force the compositor
 * to re-raster every vsync and were dropping Classic to ~22 fps on 144 Hz.
 */
export const AmbientParticles = React.memo(function AmbientParticles({ theme }: AmbientParticlesProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{ background: WASH[theme], contain: 'strict' }}
    />
  );
});
