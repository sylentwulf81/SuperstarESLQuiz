import React, { createContext, useContext } from 'react';
import { GameTheme } from '@/shared/types';

const GameThemeContext = createContext<GameTheme>('summer');

export function GameThemeProvider({
  theme,
  children,
}: {
  theme: GameTheme;
  children: React.ReactNode;
}) {
  return <GameThemeContext.Provider value={theme}>{children}</GameThemeContext.Provider>;
}

export function useGameTheme(): GameTheme {
  return useContext(GameThemeContext);
}
