import { useMemo } from "react";

import { cn } from "@/lib/utils";

const COLORS = [
  "var(--cat-estudio)",
  "var(--cat-desarrollo)",
  "var(--cat-entrenamiento)",
  "var(--cat-personal)",
  "var(--primary)",
];

interface Props {
  paused: boolean;
}

/** Subtle rising dots behind the focus overlay; frozen while paused. */
export function AmbientParticles({ paused }: Props) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: 3 + Math.random() * 94,
        size: 2 + Math.random() * 4,
        opacity: 0.12 + Math.random() * 0.22,
        duration: 16 + Math.random() * 18,
        delay: -Math.random() * 32,
        sway: (Math.random() - 0.5) * 90,
        color: COLORS[i % COLORS.length],
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn(
            "ambient-particle absolute bottom-0 rounded-full",
            paused && "[animation-play-state:paused]",
          )}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--sway" as string]: `${p.sway}px`,
            ["--particle-opacity" as string]: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
