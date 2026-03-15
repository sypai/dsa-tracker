import { motion } from "framer-motion";

export const BioMonitor = ({ status }: { status: 'alive' | 'idle' | 'decay' | 'dead' }) => {
  // A professional medical ECG waveform path
  const path = "M 0 50 L 15 50 L 20 40 L 25 60 L 30 10 L 38 90 L 44 50 L 52 50 L 58 45 L 64 50 L 80 50";

  // Dynamic settings based on your grind status
  const config = {
    alive: { color: "#4ade80", speed: 1.2, glow: "rgba(74,222,128,0.6)" },
    idle:  { color: "#94a3b8", speed: 3.0, glow: "rgba(148,163,184,0.2)" },
    decay: { color: "#f87171", speed: 0.8, glow: "rgba(248,113,113,0.8)" }, // Fast, panicked red beat
    dead:  { color: "#475569", speed: 8.0, glow: "transparent" }
  };

  const { color, speed, glow } = config[status];

  return (
    <div className="relative w-20 h-8 overflow-hidden">
      <svg viewBox="0 0 80 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Background Ghost Path */}
        <path d={path} fill="none" stroke="#2d2d2d" strokeWidth="2" />
        
        {/* The Animated Pulse */}
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1, 1],
            pathOffset: [0, 0, 1],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: speed,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
        />
      </svg>
    </div>
  );
};