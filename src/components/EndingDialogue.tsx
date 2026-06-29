import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, RotateCcw, Home, Sparkles, Star } from 'lucide-react';

interface EndingDialogueProps {
  score: number;
  onRestart: () => void;
  onGoToMenu: () => void;
}

interface DialogueLine {
  speaker: 'hero' | 'npc';
  name: string;
  text: string;
}

export function EndingDialogue({ score, onRestart, onGoToMenu }: EndingDialogueProps) {
  const [stage, setStage] = useState<'walkin' | 'dialogue' | 'finish'>('walkin');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  // NPC walk-in coordinates state for animation
  const [npcX, setNpcX] = useState(100); // start offscreen right (%)
  const [npcFrame, setNpcFrame] = useState(0);

  const dialogueList: DialogueLine[] = [
    {
      speaker: 'npc',
      name: 'ผู้ใหญ่บ้าน ลุงเคน (Ken)',
      text: 'โอ้ผู้กล้าแสนสง่า! ในที่สุดท่านก็ปราบอสูรกายโลกันตร์ Ragnarok ลงได้สำเร็จแล้ว!',
    },
    {
      speaker: 'hero',
      name: 'ผู้กล้า (You)',
      text: 'มันเป็นหน้าที่ของข้าอยู่แล้วล่ะลุง ข้าสัญญาไว้ว่าจะไม่ยอมให้ความชั่วร้ายรังควานผู้บริสุทธิ์เด็ดขาด',
    },
    {
      speaker: 'npc',
      name: 'ผู้ใหญ่บ้าน ลุงเคน (Ken)',
      text: 'ความกล้าหาญและวิทยายุทธ์ลูกวงกลมเวทมนตร์ของท่าน ช่างเป็นปรากฏการณ์อัศจรรย์ยิ่งนัก!',
    },
    {
      speaker: 'hero',
      name: 'ผู้กล้า (You)',
      text: 'จริง ๆ แล้วลำแสงเวทย์วงแหวน cyan นั้นทรงอานุภาพมาก แต่ถ้าไม่มีฟื้นฟูพลังจาก Potion ข้าคงล้มไปแล้ว',
    },
    {
      speaker: 'npc',
      name: 'ผู้ใหญ่บ้าน ลุงเคน (Ken)',
      text: 'ฮ่า ๆ ทั้งฝีมือเก่งกาจและถ่อมตัวเช่นนี้ สมแล้วที่เป็นผู้ปลดปล่อยแผ่นดินที่พวกเราเฝ้ารอคอยมาชั่วชีวิต',
    },
    {
      speaker: 'hero',
      name: 'ผู้กล้า (You)',
      text: 'นับจากนี้เป็นต้นไป ขอให้ผืนแผ่นดินและหมู่บ้านแห่งนี้สงบสุขร่มเย็น ไม่มีอสูรกายใดรบกวนอีก',
    },
    {
      speaker: 'npc',
      name: 'ผู้ใหญ่บ้าน ลุงเคน (Ken)',
      text: 'พวกเราจะจารึกนามของท่านไว้บนแผ่นศิลาทองคำที่ใจกลางหมู่บ้าน ตราบนานเท่านาน ขอบคุณเหลือเกิน!',
    },
    {
      speaker: 'hero',
      name: 'ผู้กล้า (You)',
      text: 'ยินดีช่วยเหลือเสมอ... เอาล่ะ ท้องฟ้าเบื้องหน้าเริ่มสว่างแล้ว ข้าคงต้องออกเดินทางผจญภัยต่อไป!',
    }
  ];

  // Synth typewriter audio bleeps
  const playDialogueBleep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650 + Math.random() * 150, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Ignored if browser blocks audio
    }
  };

  // 1. Walk in animation logic
  useEffect(() => {
    if (stage !== 'walkin') return;

    // NPC frame animation while walking
    const frameInterval = setInterval(() => {
      setNpcFrame((f) => (f + 1) % 4);
    }, 150);

    // Position movement
    const moveInterval = setInterval(() => {
      setNpcX((x) => {
        if (x <= 62) {
          clearInterval(moveInterval);
          clearInterval(frameInterval);
          setStage('dialogue'); // Start conversation!
          return 62;
        }
        return x - 1.2;
      });
    }, 30);

    return () => {
      clearInterval(frameInterval);
      clearInterval(moveInterval);
    };
  }, [stage]);

  // 2. Typewriter text display logic
  useEffect(() => {
    if (stage !== 'dialogue') return;

    setIsTyping(true);
    setDisplayedText('');
    const fullText = dialogueList[currentLineIndex].text;
    let index = 0;

    if (typingTimer.current) clearInterval(typingTimer.current);

    typingTimer.current = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText((prev) => prev + fullText.charAt(index));
        if (index % 2 === 0) {
          playDialogueBleep();
        }
        index++;
      } else {
        if (typingTimer.current) clearInterval(typingTimer.current);
        setIsTyping(false);
      }
    }, 45);

    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
    };
  }, [currentLineIndex, stage]);

  const handleNext = () => {
    if (isTyping) {
      // Instantly finish writing
      if (typingTimer.current) clearInterval(typingTimer.current);
      setDisplayedText(dialogueList[currentLineIndex].text);
      setIsTyping(false);
    } else {
      // Advance to next dialogue or ending screen
      if (currentLineIndex < dialogueList.length - 1) {
        setCurrentLineIndex((prev) => prev + 1);
      } else {
        setStage('finish');
      }
    }
  };

  const currentLine = dialogueList[currentLineIndex];

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-between p-6 select-none overflow-hidden font-sans">
      
      {/* Decorative stars / magical ambiance */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <Star size={16} className="absolute top-[20%] left-[15%] text-yellow-400 animate-pulse" />
        <Star size={24} className="absolute top-[12%] right-[25%] text-amber-300 animate-ping duration-1000" />
        <Star size={14} className="absolute bottom-[40%] left-[30%] text-sky-400 animate-pulse" />
        <Star size={18} className="absolute top-[50%] right-[10%] text-pink-400 animate-pulse" />
      </div>

      {/* Title Header */}
      <div className="text-center pt-4 relative z-10">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 0.8 }}
          className="text-xs font-black tracking-[0.25em] text-red-500 uppercase"
        >
          - Epilogue: Return of Peace -
        </motion.span>
      </div>

      {/* Visual RPG Sprite Display Stage */}
      {stage !== 'finish' && (
        <div className="flex-1 w-full max-w-4xl mx-auto flex items-end justify-between px-10 pb-16 relative">
          
          {/* Left Speaker: Player Hero Sprite wrapper */}
          <div className="flex flex-col items-center space-y-3 transition-transform duration-300">
            <motion.div
              animate={{ 
                scale: currentLine?.speaker === 'hero' ? 1.15 : 1.0,
                y: currentLine?.speaker === 'hero' ? [0, -6, 0] : 0
              }}
              transition={{
                scale: { duration: 0.2 },
                y: { repeat: currentLine?.speaker === 'hero' ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }
              }}
              className={`w-36 h-36 border-4 ${
                currentLine?.speaker === 'hero' ? 'border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.5)]' : 'border-slate-800 opacity-60'
              } bg-slate-900/90 overflow-hidden relative flex items-center justify-center transition-all`}
            >
              {/* Cropped Sprite Sheet of Player */}
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundImage: `url('https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/player.png')`,
                  backgroundSize: '256px 256px',
                  backgroundPosition: '0px 0px', // standard idle facing right
                  transform: 'scale(2.2)',
                  imageRendering: 'pixelated'
                }}
              />
            </motion.div>
            <span className={`text-xs font-black tracking-widest px-3 py-1 uppercase rounded ${
              currentLine?.speaker === 'hero' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400'
            }`}>
              HERO
            </span>
          </div>

          {/* Golden Center Warp/Portal glowing backdrop */}
          <div className="absolute left-1/2 bottom-8 -translate-x-1/2 w-48 h-8 bg-blue-500/20 rounded-full blur-xl animate-pulse" />

          {/* Right Speaker: NPC Sprite wrapper */}
          <div className="flex flex-col items-center space-y-3 transition-transform duration-300 relative">
            <motion.div
              style={{
                left: stage === 'walkin' ? `${npcX}%` : 'auto'
              }}
              animate={{ 
                scale: currentLine?.speaker === 'npc' ? 1.15 : 1.0,
                y: currentLine?.speaker === 'npc' ? [0, -6, 0] : 0
              }}
              transition={{
                scale: { duration: 0.2 },
                y: { repeat: currentLine?.speaker === 'npc' ? Infinity : 0, duration: 1.5, ease: 'easeInOut' }
              }}
              className={`w-36 h-36 border-4 ${
                currentLine?.speaker === 'npc' ? 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]' : 'border-slate-800 opacity-60'
              } bg-slate-900/90 overflow-hidden relative flex items-center justify-center transition-all`}
            >
              {/* NPC Sprite with frame movement based on state */}
              <div 
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundImage: `url('https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/npc1_pdraha.png')`,
                  backgroundSize: '256px 256px',
                  // Row 0 (offset Y 0) for walk/idle, Row 1 (offset Y -64px) for excited/talking
                  backgroundPosition: `-${(stage === 'walkin' ? npcFrame : currentLine?.speaker === 'npc' ? (Math.floor(Date.now() / 200) % 4) : 0) * 64}px -${currentLine?.speaker === 'npc' ? 64 : 0}px`,
                  transform: 'scale(2.2) scaleX(-1)', // Flipping to face the hero on the left!
                  imageRendering: 'pixelated'
                }}
              />
            </motion.div>
            <span className={`text-xs font-black tracking-widest px-3 py-1 uppercase rounded ${
              currentLine?.speaker === 'npc' ? 'bg-red-500 text-white font-black animate-pulse' : 'bg-slate-900 text-slate-400'
            }`}>
              KEN (NPC)
            </span>
          </div>

        </div>
      )}

      {/* RPG Dialogue Box overlay */}
      {stage !== 'finish' && (
        <div 
          onClick={handleNext}
          className="w-full max-w-4xl mx-auto mb-6 bg-slate-950/95 border-2 border-red-600 rounded-none p-5 relative min-h-[140px] flex flex-col justify-between hover:border-red-500 cursor-pointer shadow-[0_4px_30px_rgba(220,38,38,0.25)] transition-all"
        >
          <div className="space-y-2">
            {/* Speaker Name Tag */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-black tracking-wider uppercase px-2.5 py-0.5 ${
                currentLine?.speaker === 'hero' ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-800/60' : 'text-red-400 bg-red-950/80 border border-red-800/60'
              }`}>
                {currentLine?.name}
              </span>
            </div>

            {/* Typewriter message */}
            <p className="text-white text-base md:text-lg font-semibold tracking-wide leading-relaxed pl-1">
              {displayedText}
              {isTyping && <span className="w-2.5 h-4 bg-white inline-block ml-1 animate-pulse" />}
            </p>
          </div>

          {/* Action indicator */}
          <div className="flex justify-end items-center text-[10px] font-black tracking-[0.2em] text-red-500 uppercase animate-pulse pt-2">
            <span>{isTyping ? 'CLICK TO SKIP' : 'CLICK TO CONTINUE'}</span>
            <ArrowRight size={12} className="ml-1" />
          </div>
        </div>
      )}

      {/* Finish Victory Screen Panel */}
      {stage === 'finish' && (
        <div className="flex-1 flex items-center justify-center p-6 relative">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="w-full max-w-xl bg-slate-900/95 border-2 border-red-600 p-8 text-center relative overflow-hidden shadow-[0_0_80px_rgba(239,68,68,0.3)]"
          >
            {/* Glowing top border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

            {/* Golden particles decorative layer */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <Sparkles size={16} className="absolute top-[10%] left-[20%] text-yellow-400 animate-spin" />
              <Sparkles size={24} className="absolute bottom-[15%] right-[20%] text-amber-500 animate-pulse" />
            </div>

            <div className="flex flex-col items-center space-y-6">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="p-5 bg-gradient-to-b from-red-500 to-red-700 text-white rounded-none border-2 border-red-400 shadow-xl shadow-red-500/20"
              >
                <Trophy size={48} className="fill-white/10" />
              </motion.div>

              <div className="space-y-3">
                <h2 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-500 uppercase drop-shadow-md">
                  FINISH!
                </h2>
                <h3 className="text-white font-black text-xl tracking-wider">
                  ขอบคุณที่ร่วมผจญภัยจนภารกิจเสร็จสิ้น!
                </h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                  คุณได้กอบกู้แผ่นดินลึกลับนี้ คืนรอยยิ้มให้กับหมู่บ้าน Ken และชื่อของคุณจะถูกเล่าขานตราบชั่วลูกชั่วหลาน
                </p>
              </div>

              {/* Total Score display board */}
              <div className="bg-slate-950 border border-red-950 p-4 w-full max-w-xs">
                <span className="text-[10px] font-black text-slate-500 tracking-[0.25em] uppercase">Victory Score</span>
                <div className="text-3xl font-black font-mono text-amber-400 mt-1">{score} pts</div>
              </div>

              {/* Return & Retry controllers */}
              <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                <button
                  onClick={onRestart}
                  className="group flex-1 flex items-center justify-center space-x-2 py-4 bg-transparent border-2 border-red-600 hover:border-red-500 hover:bg-red-600/20 text-white font-black text-base uppercase rounded-none transition-all duration-200 cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="tracking-widest">Retry Game</span>
                </button>

                <button
                  onClick={onGoToMenu}
                  className="group flex-1 flex items-center justify-center space-x-2 py-4 bg-transparent border-2 border-red-600 hover:border-red-500 hover:bg-red-600 text-white font-black text-base uppercase rounded-none transition-all duration-200 cursor-pointer hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                >
                  <Home size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="tracking-widest">Back to Title</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
