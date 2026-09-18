import React from 'react';
import { GameTheme } from '../types';

interface AmbientParticlesProps {
  theme: GameTheme;
}

/**
 * Performance-optimized atmospheric ambient overlay:
 * Replaces heavy continuous DOM particle loops (which caused frame drops and GPU memory spikes)
 * with a high-performance, static radial lighting vignette. 0% CPU, 0 continuous repaints.
 */
export const AmbientParticles: React.FC<AmbientParticlesProps> = ({ theme }) => {
  if (theme === 'summer') {
    return (
      <div 
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
        style={{ contain: 'strict' }}
      >
        {/* Soft upper-right sunbeam warmth */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        {/* Subtle cyan shore breeze reflection */}
        <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-cyan-400/5 blur-3xl pointer-events-none" />
      </div>
    );
  }

  // Winter / Christmas edition: Crisp moonlit glow
  return (
    <div 
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      style={{ contain: 'strict' }}
    >
      {/* Moonlit upper-right cool blue halo */}
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-cyan-300/10 blur-3xl pointer-events-none" />
      {/* Cozy hearth amber warmth on bottom left */}
      <div className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
    </div>
  );
};

