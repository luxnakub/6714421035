import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, HelpCircle, Heart, Trophy, AlertTriangle, Sparkles, Award } from 'lucide-react';
import { ScreenState, Controls } from '../types';
import { GameScene } from './GameScene';
import { EndingDialogue } from './EndingDialogue';
import { playSound } from '../lib/sound';

interface GameScreenProps {
  key?: React.Key;
  setScreen: (screen: ScreenState) => void;
  controls: Controls;
}

export function GameScreen({ setScreen, controls }: GameScreenProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(5);
  const [score, setScore] = useState(0);
  const [gameKey, setGameKey] = useState(0); // Key used to force recreate GameScene on restart

  // Boss and progression states
  const [bossActive, setBossActive] = useState(false);
  const [bossHealth, setBossHealth] = useState(15);
  const [normalKills, setNormalKills] = useState(0);
  const [warpPortalActive, setWarpPortalActive] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Sound triggering locks
  const playDefeatRef = useRef(false);
  const playVictoryRef = useRef(false);

  useEffect(() => {
    if (playerHealth <= 0) {
      if (!playDefeatRef.current) {
        playSound('defeat');
        playDefeatRef.current = true;
      }
    } else {
      playDefeatRef.current = false;
    }
  }, [playerHealth]);

  useEffect(() => {
    if (gameCompleted) {
      if (!playVictoryRef.current) {
        playSound('victory');
        playVictoryRef.current = true;
      }
    } else {
      playVictoryRef.current = false;
    }
  }, [gameCompleted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (playerHealth <= 0 || gameCompleted) return; // disable pause menu on game over or victory
      if (e.key === 'Escape') {
        playSound('click');
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerHealth, gameCompleted]);

  const handleRestart = () => {
    playSound('click');
    playDefeatRef.current = false;
    playVictoryRef.current = false;
    setPlayerHealth(5);
    setScore(0);
    setIsPaused(false);
    setBossActive(false);
    setBossHealth(15);
    setNormalKills(0);
    setWarpPortalActive(false);
    setGameCompleted(false);
    setGameKey((prev) => prev + 1); // trigger component recreation to reset spawn positions
  };

  const handleQuitMenu = () => {
    playSound('click');
    setScreen('menu');
  };

  const isGameOver = playerHealth <= 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-black overflow-hidden select-none"
    >
      {/* 3D Game Canvas Area */}
      <GameScene
        key={gameKey}
        isPaused={isPaused || isGameOver || gameCompleted}
        playerHealth={playerHealth}
        setPlayerHealth={setPlayerHealth}
        setScore={setScore}
        onGameComplete={() => setGameCompleted(true)}
        bossActive={bossActive}
        setBossActive={setBossActive}
        bossHealth={bossHealth}
        setBossHealth={setBossHealth}
        normalKills={normalKills}
        setNormalKills={setNormalKills}
        warpPortalActive={warpPortalActive}
        setWarpPortalActive={setWarpPortalActive}
        controls={controls}
      />
      
      {/* HUD Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        
        {/* Left HUD: Life & Pause Button */}
        <div className="flex flex-col space-y-2 pointer-events-auto">
          <button
            onClick={() => {
              if (!isGameOver && !gameCompleted) setIsPaused(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-950/80 text-white hover:bg-slate-900 backdrop-blur-md transition-all border border-slate-800 shadow-xl"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isGameOver ? 'bg-red-500' : gameCompleted ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-sm font-bold tracking-wider uppercase">Menu (ESC)</span>
          </button>

          {/* Hearts Display HUD */}
          <div className="flex items-center space-x-2 bg-slate-950/80 px-4 py-2.5 rounded-xl backdrop-blur-md border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-bold tracking-wider uppercase mr-2">Life:</span>
            <div className="flex space-x-1.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={idx < playerHealth ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    size={18}
                    className={`transition-colors ${
                      idx < playerHealth
                        ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                        : 'text-slate-700 fill-slate-950'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right HUD: Current Score / Kills */}
        <div className="flex flex-col space-y-2 items-end pointer-events-auto">
          <div className="flex items-center space-x-2 bg-slate-950/80 px-5 py-2.5 rounded-xl backdrop-blur-md border border-slate-800 shadow-xl">
            <Trophy size={18} className="text-amber-400 fill-amber-400/20" />
            <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Score:</span>
            <span className="text-lg font-black font-mono text-amber-400 leading-none">
              {String(score).padStart(5, '0')}
            </span>
          </div>

          <div className="text-slate-500 text-[10px] bg-slate-950/80 px-3 py-1 rounded-md backdrop-blur-md border border-slate-900 font-mono">
            FPS: 60 | WEBGL2
          </div>
        </div>
      </div>

      {/* Floating summons objective HUD for normal kills */}
      {!bossActive && !warpPortalActive && normalKills < 10 && (
        <div className="absolute top-20 left-4 z-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-indigo-950/60 backdrop-blur-md text-slate-200 text-xs font-semibold flex items-center space-x-2.5 shadow-xl"
          >
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <span>Defeat normal enemies to summon Guardian:</span>
            <span className="font-bold text-indigo-400 font-mono text-sm">{normalKills}/10</span>
          </motion.div>
        </div>
      )}

      {/* Majestic Epic Boss Fight Health Bar */}
      {bossActive && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-lg px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-950/95 border border-red-950 p-4 rounded-xl backdrop-blur-md shadow-[0_12px_40px_rgba(239,68,68,0.2)] space-y-2 text-center"
          >
            <div className="flex justify-between items-baseline">
              <span className="text-red-500 font-black text-sm tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Ragnarok (Elite Guardian)
              </span>
              <span className="text-slate-400 font-bold font-mono text-xs">
                {bossHealth} / 15 HP
              </span>
            </div>
            {/* Health Bar progress container */}
            <div className="w-full h-3.5 bg-red-950/60 rounded-full overflow-hidden border border-red-900/40 p-[2px]">
              <motion.div
                animate={{ width: `${(bossHealth / 15) * 100}%` }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-500 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Warp Portal Unlocked Overlay Banner */}
      {warpPortalActive && !gameCompleted && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: [0.9, 1.05, 1] }}
            transition={{ duration: 0.5 }}
            className="bg-slate-950/95 border border-blue-900 p-4 rounded-xl backdrop-blur-md shadow-[0_12px_40px_rgba(59,130,246,0.35)] text-center space-y-1.5"
          >
            <h3 className="text-blue-400 font-black tracking-widest text-sm uppercase flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-blue-400 animate-spin" />
              Warp Portal Unlocked
              <Sparkles size={16} className="text-blue-400 animate-spin" />
            </h3>
            <p className="text-slate-300 text-xs font-medium leading-relaxed">
              Step into the glowing warp portal at the center of the battlefield to escape and claim your victory!
            </p>
          </motion.div>
        </div>
      )}

      {/* Control Instruction Overlay */}
      {!isPaused && !isGameOver && !gameCompleted && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 z-10 text-white/80 text-sm bg-slate-950/80 px-5 py-3.5 rounded-xl backdrop-blur-md border border-slate-800 shadow-xl space-y-1.5"
        >
          <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Keybindings</div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono border border-slate-700 text-slate-200">{controls.up.toUpperCase()}</kbd>
            <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono border border-slate-700 text-slate-200">{controls.left.toUpperCase()}</kbd>
            <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono border border-slate-700 text-slate-200">{controls.down.toUpperCase()}</kbd>
            <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono border border-slate-700 text-slate-200">{controls.right.toUpperCase()}</kbd>
            <span className="text-slate-400 text-xs">/ Arrows to Move</span>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono border border-slate-700 text-slate-200">{controls.action.toUpperCase()}</kbd>
            <span className="text-indigo-300 font-semibold text-xs">Attack / ปล่อยพลัง</span>
            <span className="text-slate-700">|</span>
            <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono border border-slate-700 text-slate-200">{controls.ultimate.toUpperCase()}</kbd>
            <span className="text-pink-400 font-black text-xs animate-pulse">ULTIMATE / อัลติเมท 🌌</span>
          </div>
        </motion.div>
      )}

      {/* Pause Menu Overlay */}
      <AnimatePresence>
        {isPaused && !isGameOver && !gameCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative gradient top border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-black tracking-widest text-white uppercase bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300">
                  Game Paused
                </h2>
                <p className="text-slate-400 text-sm">Take a breath, champion.</p>
              </div>

              {/* Menu Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => { playSound('click'); setIsPaused(false); }}
                  className="group relative flex items-center justify-center space-x-3 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200 cursor-pointer"
                >
                  <Play size={20} className="group-hover:scale-110 transition-transform" />
                  <span>RESUME GAME</span>
                </button>

                <button
                  onClick={handleRestart}
                  className="group relative flex items-center justify-center space-x-3 w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-lg rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200 cursor-pointer"
                >
                  <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span>RESTART MATCH</span>
                </button>

                <button
                  onClick={handleQuitMenu}
                  className="group relative flex items-center justify-center space-x-3 w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-lg rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  <span>QUIT TO MENU</span>
                </button>
              </div>

              {/* Quick Help Section inside Pause Menu */}
              <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <HelpCircle size={16} />
                  <span>Key bindings reference</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 font-mono">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Movements</div>
                    <div>W A S D / Arrow keys</div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Combat</div>
                    <div>{controls.action.toUpperCase()} : Attack / ปล่อยพลัง</div>
                    <div>{controls.ultimate.toUpperCase()} : Ultimate / อัลติเมท</div>
                  </div>
                </div>
              </div>

              {/* Interactive prompt to unpause */}
              <div className="mt-6 text-center">
                <span className="text-[10px] text-slate-500 tracking-widest uppercase animate-pulse">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono">ESC</kbd> to return to game
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Popup Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 120 }}
              className="w-full max-w-md bg-slate-950 border border-red-950 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
              {/* Decorative red alert bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-600" />

              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500 animate-pulse">
                  <AlertTriangle size={36} />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-4xl font-black tracking-wider text-rose-500 uppercase">
                    GAME OVER
                  </h2>
                  <p className="text-slate-400 text-sm">Your health points have been fully depleted.</p>
                </div>

                <div className="flex items-center space-x-3 bg-slate-900/80 px-6 py-3 rounded-xl border border-slate-800 w-full justify-center">
                  <Trophy size={20} className="text-amber-400" />
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Final Score:</span>
                  <span className="text-2xl font-black font-mono text-amber-400">{score}</span>
                </div>
              </div>

              {/* Game Over Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleRestart}
                  className="group relative flex items-center justify-center space-x-3 w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-rose-600/25 transition-all duration-200 cursor-pointer"
                >
                  <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span>PLAY AGAIN</span>
                </button>

                <button
                  onClick={handleQuitMenu}
                  className="group relative flex items-center justify-center space-x-3 w-full py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-lg rounded-xl border border-slate-800 transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  <span>MAIN MENU</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Victory / Ending Popup Overlay */}
      <AnimatePresence>
        {gameCompleted && (
          <EndingDialogue
            score={score}
            onRestart={handleRestart}
            onGoToMenu={() => setScreen('menu')}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

