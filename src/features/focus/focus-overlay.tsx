import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { Pause, Play, Square } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { formatClock } from "@/features/core/stats";
import { useNow } from "@/hooks/use-now";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";
import { AmbientParticles } from "./ambient-particles";
import { pomodoroAt } from "./pomodoro";
import { useTimerStore } from "./timer-store";

interface Props {
  activityName: string;
  onFinish: () => void;
}

export function FocusOverlay({ activityName, onFinish }: Props) {
  const now = useNow(1000);
  const paused = useTimerStore((s) => s.paused);
  const pauseStartedAtMs = useTimerStore((s) => s.pauseStartedAtMs);
  const toggle = useTimerStore((s) => s.toggle);
  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const mode = useTimerStore((s) => s.mode);
  const workMin = useTimerStore((s) => s.workMin);
  const restMin = useTimerStore((s) => s.restMin);

  const seconds = now === null ? 0 : Math.floor(elapsedMs(now) / 1000);
  const pomo = mode === "pomodoro" ? pomodoroAt(elapsedMs(now ?? 0), workMin, restMin) : null;
  const phase = pomo?.phase ?? null;
  const displaySeconds = pomo ? pomo.phaseRemainingSec : seconds;
  const pauseSeconds =
    paused && pauseStartedAtMs !== null && now !== null
      ? Math.max(0, Math.floor((now - pauseStartedAtMs) / 1000))
      : 0;

  const prevPhase = useRef(phase);
  useEffect(() => {
    if (phase && prevPhase.current && phase !== prevPhase.current) {
      if (phase === "rest") sfx.success();
      else sfx.confirm();
    }
    prevPhase.current = phase;
  }, [phase]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-focus-bg px-6"
      >
        <AmbientParticles paused={paused} />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
          className="relative flex flex-col items-center gap-6 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {activityName}
          </p>

          {phase ? (
            <p
              className={cn(
                "-mt-2 text-xs font-medium uppercase tracking-[0.2em]",
                phase === "work" ? "text-foreground" : "text-cat-entrenamiento",
              )}
            >
              {phase === "work" ? "Foco" : "Descanso"}
            </p>
          ) : null}

          <div
            className="font-mono text-[clamp(3.5rem,16vw,9rem)] font-light leading-none tracking-tight tabular-nums text-foreground"
            aria-live="off"
          >
            {formatClock(displaySeconds)}
          </div>

          <p className="-mt-3 font-mono text-sm text-muted-foreground">
            {now === null ? "--:--" : format(now, "HH:mm")}
          </p>

          <div className="flex items-center justify-center gap-3 max-[380px]:w-full max-[380px]:flex-col max-[380px]:items-stretch">
            <Button
              variant="secondary"
              size="lg"
              onClick={toggle}
              data-sfx="toggle"
              className="min-w-32 gap-2 max-[380px]:w-full sm:min-w-36"
            >
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {paused ? "Reanudar" : "Pausar"}
            </Button>
            <Button
              size="lg"
              onClick={onFinish}
              data-sfx="cancel"
              className="min-w-32 gap-2 max-[380px]:w-full sm:min-w-36"
            >
              <Square className="size-4" />
              Finalizar
            </Button>
          </div>

          {paused ? (
            <p className="-mt-1 font-mono text-xs text-muted-foreground">
              En pausa: {formatClock(pauseSeconds)}
            </p>
          ) : null}

          <p className="-mt-1 text-xs text-muted-foreground">
            Espacio para pausar · Esc para finalizar
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
