import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { GameProvider } from './game/GameContext';
import ServerColdStartBanner from './components/ServerColdStartBanner';
import GameScreens from './components/game/GameScreens';

export default function App() {
  return (
    <ThemeProvider>
      <GameProvider>
        <ServerColdStartBanner />
        <GameScreens />
      </GameProvider>
    </ThemeProvider>
  );
}
