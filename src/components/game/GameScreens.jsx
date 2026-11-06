import React from 'react';
import { WifiOff } from 'lucide-react';
import { useGame } from '../../game/GameContext';
import { useVisualViewport } from '../../game/useVisualViewport';
import HomeScreen from '../HomeScreen';
import Lobby from './Lobby';
import Round from './Round';
import Results from './Results';

function ReconnectingBanner() {
  return (
    <div
      role="status"
      className="flex shrink-0 items-center justify-center gap-2 bg-stone-900 px-4 py-2 text-center text-sm text-stone-50 dark:bg-stone-100 dark:text-stone-900"
    >
      <WifiOff size={16} aria-hidden="true" />
      Connection lost. Reconnecting; your seat is kept for 30 seconds.
    </div>
  );
}

// Picks the screen for the room's phase. Everything shown comes from the server's room:state.
export default function GameScreens() {
  const { room, connected, resuming } = useGame();
  const viewport = useVisualViewport();

  if (!room) {
    // A saved seat is being reclaimed after a reload: don't flash the home screen.
    if (resuming && connected) return <div className="min-h-dvh ambient-bg" aria-busy="true" />;
    return <HomeScreen />;
  }

  const screen =
    room.phase === 'lobby' ? <Lobby /> : room.phase === 'results' ? <Results /> : <Round />;

  // Pinned to the visible viewport (keyboard-aware); the banner sits in the
  // flow above the screen, so it never covers the header.
  return (
    <div
      className="group/app fixed inset-x-0 flex flex-col"
      style={{ top: viewport.top, height: viewport.height }}
      data-keyboard={viewport.keyboardOpen ? 'open' : 'closed'}
    >
      {!connected && <ReconnectingBanner />}
      <div className="min-h-0 flex-1 overflow-y-auto">{screen}</div>
    </div>
  );
}
