import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Keyboard, RotateCcw, Cpu, Terminal } from 'lucide-react';
import { ScreenState, Controls } from '../types';
import { playSound } from '../lib/sound';

interface OptionsMenuProps {
  key?: React.Key;
  setScreen: (screen: ScreenState) => void;
  controls: Controls;
  setControls: (controls: Controls) => void;
}

const defaultControls: Controls = {
  up: 'W',
  down: 'S',
  left: 'A',
  right: 'D',
  action: 'F',
  ultimate: 'G',
};

export function OptionsMenu({ setScreen, controls, setControls }: OptionsMenuProps) {
  const [listeningKey, setListeningKey] = useState<keyof Controls | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!listeningKey) return;
      e.preventDefault();
      
      let key = e.key;
      if (key === ' ') key = 'Space';
      if (key.length === 1) key = key.toUpperCase();
      
      playSound('click');
      setControls({ ...controls, [listeningKey]: key });
      setListeningKey(null);
    };

    if (listeningKey) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningKey, controls, setControls]);

  const handleReset = () => {
    playSound('click');
    setControls(defaultControls);
    setListeningKey(null);
  };

  const handleBack = () => {
    playSound('click');
    setScreen('menu');
  };

  const handleStartListening = (action: keyof Controls) => {
    playSound('hover');
    setListeningKey(action);
  };

  const handleHover = () => {
    playSound('hover');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="relative flex flex-col items-center justify-center min-h-screen bg-[#03030d] text-slate-100 p-8 overflow-hidden select-none"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-black pointer-events-none" />

      {/* Retro laser grid backdrop */}
      <div 
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #6366f1 1px, transparent 1px),
            linear-gradient(to bottom, #6366f1 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2.0)',
          transformOrigin: 'top center',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl bg-slate-950/70 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden">
        {/* Hologram glowing top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-violet-600" />

        {/* Decorative elements */}
        <div className="absolute top-3 right-4 flex items-center space-x-1.5 text-[8px] font-mono text-indigo-400 opacity-50">
          <Cpu size={10} />
          <span>MAPPING_SYSTEM_READY</span>
        </div>

        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-indigo-950/80 gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              onMouseEnter={handleHover}
              className="p-2.5 bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 rounded-lg transition-all text-slate-400 hover:text-white cursor-pointer active:scale-95"
              title="Back to menu"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center space-x-2.5 text-white">
                <Keyboard className="text-indigo-400" />
                <span>KEY BINDINGS</span>
              </h2>
              <p className="text-[10px] font-mono text-slate-400 mt-1 tracking-wider uppercase">[ ปรับแต่งการควบคุมตัวละคร ]</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            onMouseEnter={handleHover}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-mono font-black text-pink-400 hover:text-white bg-pink-950/20 hover:bg-pink-600/30 border border-pink-900/40 hover:border-pink-500 rounded-lg transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw size={14} />
            <span>RESET DEFAULTS</span>
          </button>
        </div>

        {/* Bindings grid */}
        <div className="space-y-3">
          {(Object.keys(controls) as Array<keyof Controls>).map((action) => (
            <div
              key={action}
              className="flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl border border-indigo-950/60 hover:border-indigo-500/30 transition-all duration-200"
            >
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-200 tracking-wider uppercase">
                  {action === 'action' 
                    ? 'Normal Attack / ปล่อยพลัง' 
                    : action === 'ultimate' 
                      ? 'Ultimate Spell / มหาเวทอเวจี' 
                      : `Move ${action}`}
                </span>
                <span className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase">
                  {action === 'action' 
                    ? 'Releases active fire bolt / energy beam' 
                    : action === 'ultimate' 
                      ? 'Casts a massive devastating ring of absolute flame' 
                      : `Character navigation direction`}
                </span>
              </div>
              <button
                onClick={() => handleStartListening(action)}
                className={`min-w-[130px] px-5 py-3 rounded-lg font-mono font-black text-sm text-center transition-all cursor-pointer ${
                  listeningKey === action
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-pink-400 scale-102'
                    : 'bg-slate-950 border border-slate-850 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/50 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                }`}
              >
                {listeningKey === action ? 'PRESS KEY...' : controls[action]}
              </button>
            </div>
          ))}
        </div>
        
        {/* Instruction sub-bar */}
        <AnimatePresence>
          {listeningKey ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 text-center text-xs text-pink-400 font-mono font-bold tracking-wider uppercase flex items-center justify-center space-x-2 animate-pulse"
            >
              <Terminal size={14} className="text-pink-500" />
              <span>Waiting for keyboard input. Press any key to bind to "{listeningKey}"</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="mt-6 text-center text-[10px] font-mono text-slate-500 tracking-wide uppercase"
            >
              Tip: Standard movement keys are W, A, S, D. Punching spell is mapped to P and Special Skill to O.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
