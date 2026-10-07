import { motion } from "framer-motion";

const COLORS = [
  "var(--cat-estudio)",
  "var(--cat-desarrollo)",
  "var(--cat-entrenamiento)",
  "var(--cat-personal)",
  "var(--primary)",
];

interface CelebrateProps {
  /** 0..1+ — scales the number of particles. */
  intensity: number;
}

/** Short, subtle confetti burst shown when a session is saved. */
export function Celebrate({ intensity }: CelebrateProps) {
  const count = Math.min(56, 14 + Math.round(intensity * 40));
  const parts = Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 190;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 60,
      rotate: (Math.random() - 0.5) * 720,
      size: 6 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.08,
      duration: 0.7 + Math.random() * 0.6,
    };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {parts.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{ width: p.size, height: p.size, background: p.color }}
        />
      ))}
    </div>
  );
}
