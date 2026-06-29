import React from 'react';
import { motion } from 'motion/react';
import { Settings, Play, ShieldAlert, Cpu, Terminal, Radio } from 'lucide-react';
import { ScreenState } from '../types';
import { playSound } from '../lib/sound';

interface MainMenuProps {
  key?: React.Key;
  setScreen: (screen: ScreenState) => void;
}

export function MainMenu({ setScreen }: MainMenuProps) {
  const handleStart = () => {
    playSound('click');
    setScreen('game');
  };

  const handleOptions = () => {
    playSound('click');
    setScreen('options');
  };

  const handleHover = () => {
    playSound('hover');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex flex-col items-center justify-center min-h-screen bg-[#03030d] text-slate-100 p-8 overflow-hidden select-none"
    >
      {/* Cinematic Cyber Ambient Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-black pointer-events-none" />

      {/* Retro-Futuristic Laser Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-15 pointer-events-none"
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
          animation: 'gridScroll 20s linear infinite',
        }}
      />

      {/* Futuristic Scanline and Static Noise Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-scanlines opacity-[0.03]" />

      {/* Cybernetic Accent Ornaments */}
      <div className="absolute top-6 left-6 flex items-center space-x-2 text-[10px] font-mono tracking-widest text-indigo-400 opacity-60">
        <Cpu size={12} className="animate-spin duration-3000" />
        <span>SYS_STATUS: ACTIVE</span>
        <span className="text-emerald-400 animate-pulse">●</span>
      </div>

      <div className="absolute top-6 right-6 flex items-center space-x-2 text-[10px] font-mono tracking-widest text-pink-500 opacity-60">
        <Radio size={12} className="animate-pulse" />
        <span>CYBER_NET_STREAM // SECURE</span>
      </div>

      <div className="absolute bottom-6 left-6 text-[9px] font-mono tracking-widest text-slate-500 max-w-xs leading-normal hidden md:block">
        <div>[DESIGN MODEL: ZX-99 // BANYAPON]</div>
        <div>[LOCATED AT PORT: 3000 // EMULATOR: WEBGL2]</div>
      </div>

      <div className="absolute bottom-6 right-6 text-[9px] font-mono tracking-widest text-right text-indigo-400 hidden md:block">
        <div>VERSION 4.2.0 // PRODUCTION BUILD</div>
        <div className="text-slate-500">Press WASD to Move, P to Punch, O for Spell</div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full space-y-10">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center w-full text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ 
              scale: [1, 1.02, 1], 
              opacity: 1, 
              y: [0, -8, 0] 
            }}
            transition={{ 
              scale: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
              y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
              opacity: { duration: 0.8, ease: 'easeOut' }
            }}
            className="relative"
          >
            {/* Soft pink neon shadow behind the logo */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 opacity-20 blur-2xl animate-pulse" />
            
            <img
              src="https://res.cloudinary.com/dsucg33fv/image/upload/v1782709347/logo_i8827v.png"
              alt="Game Logo"
              className="w-full max-w-[340px] object-contain drop-shadow-[0_0_25px_rgba(239,68,68,0.35)] relative z-10"
            />
          </motion.div>

          {/* Glowing Subtitle Panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex flex-col items-center px-4 py-1.5 bg-slate-900/40 backdrop-blur-md border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
          >
            <span className="text-[11px] font-mono font-black tracking-[0.3em] text-cyan-400 uppercase">
              RAGNAROK'S ESCAPE // อสูรทมิฬเวท
            </span>
            <span className="text-[9px] font-sans text-slate-400 tracking-wider mt-0.5">
              THE ULTRA NEON CHRONICLES
            </span>
          </motion.div>
        </div>

        {/* Action Buttons Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col space-y-4 w-full px-4"
        >
          {/* Start Game Button */}
          <button
            onClick={handleStart}
            onMouseEnter={handleHover}
            className="group relative flex items-center justify-between w-full px-6 py-4.5 bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] hover:from-[#f43f5e] hover:to-[#ec4899] text-white transition-all duration-300 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_35px_rgba(244,63,94,0.6)] cursor-pointer border border-white/20 active:scale-98"
          >
            {/* Futuristic light sweep */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sweep" />

            <div className="flex items-center space-x-4 relative z-10">
              <div className="p-2 bg-black/20 rounded-md">
                <Play size={18} className="text-white fill-white group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="font-black text-lg tracking-[0.15em] uppercase text-white leading-none">START GAME</div>
                <div className="text-[9px] font-mono text-white/75 mt-1 tracking-widest">[เข้าสู่โลกจำลองการรบ]</div>
              </div>
            </div>

            {/* Futuristic decorative bracket */}
            <div className="text-[11px] font-mono text-white/50 opacity-60 group-hover:opacity-100 transition-opacity">
              &lt; ENTER // SEC01 &gt;
            </div>
          </button>

          {/* Options Button */}
          <button
            onClick={handleOptions}
            onMouseEnter={handleHover}
            className="group relative flex items-center justify-between w-full px-6 py-4 bg-slate-900/80 hover:bg-indigo-950/40 text-slate-200 hover:text-white transition-all duration-300 rounded-lg overflow-hidden border border-slate-800 hover:border-indigo-500/50 shadow-inner cursor-pointer active:scale-98"
          >
            <div className="flex items-center space-x-4 relative z-10">
              <div className="p-2 bg-slate-950 rounded-md border border-slate-800/80 group-hover:border-indigo-500/30">
                <Settings size={18} className="text-indigo-400 group-hover:rotate-90 transition-transform duration-700" />
              </div>
              <div className="text-left">
                <div className="font-black text-base tracking-[0.15em] uppercase leading-none">OPTIONS</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1 tracking-widest">[ปรับแต่งปุ่มคีย์บอร์ด]</div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500">
              [ SETTINGS ]
            </div>
          </button>
        </motion.div>

        {/* High-tech Footer Terminal Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-sm bg-black/60 border border-slate-900/60 p-3 rounded-lg flex items-start space-x-3 text-[10px] font-mono text-slate-400 leading-relaxed"
        >
          <Terminal size={14} className="text-indigo-400 mt-0.5 flex-shrink-0 animate-pulse" />
          <div className="space-y-0.5">
            <div>&gt; CHRONOS NETWORK EMULATOR: OK</div>
            <div className="text-cyan-400">&gt; DEFEAT 10 MINIONS TO CALL THE OVERLORD</div>
            <div>&gt; DEFEND YOUR HEART AND GRAB POTIONS TO RESTORE</div>
          </div>
        </motion.div>
      </div>

      {/* Styled Grid scroll animations directly injected */}
      <style>{`
        @keyframes gridScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 800px; }
        }
        .bg-scanlines {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%, 
            rgba(0, 0, 0, 0.25) 50%
          );
          background-size: 100% 4px;
        }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-sweep {
          animation: sweep 1.5s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
}

