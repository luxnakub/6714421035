import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MainMenu } from './components/MainMenu';
import { OptionsMenu } from './components/OptionsMenu';
import { GameScreen } from './components/GameScreen';
import { ScreenState, Controls } from './types';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('menu');
  const [controls, setControls] = useState<Controls>({
    up: 'W',
    down: 'S',
    left: 'A',
    right: 'D',
    action: 'F',
    ultimate: 'G',
  });

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden font-sans select-none">
      <AnimatePresence mode="wait">
        {currentScreen === 'menu' && (
          <MainMenu key="menu" setScreen={setCurrentScreen} />
        )}
        {currentScreen === 'options' && (
          <OptionsMenu
            key="options"
            setScreen={setCurrentScreen}
            controls={controls}
            setControls={setControls}
          />
        )}
        {currentScreen === 'game' && (
          <GameScreen key="game" setScreen={setCurrentScreen} controls={controls} />
        )}
      </AnimatePresence>
    </div>
  );
}
