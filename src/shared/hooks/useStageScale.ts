import { useEffect } from 'react';

let stageCount = 0;

/**
 * Scale the page as a 1920×1080 presentation stage while a game screen is showing
 * (see `html.stage-scale` in index.css). Editors like the Question Studio pass
 * `active = false` so they keep normal desktop sizing.
 */
export function useStageScale(active = true) {
  useEffect(() => {
    if (!active) return;
    stageCount += 1;
    document.documentElement.classList.add('stage-scale');
    return () => {
      stageCount = Math.max(0, stageCount - 1);
      if (stageCount === 0) document.documentElement.classList.remove('stage-scale');
    };
  }, [active]);
}
