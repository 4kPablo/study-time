import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { Pause, Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatClock } from "@/features/core/stats";
import { useNow } from "@/hooks/use-now";
import { useTimerStore } from "./timer-store";

interface Props {
  activityName: string;
  onFinish: () => void;
}

export function FocusOverlay({ activityName, onFinish }: Props) {
  const now = useNow(1000);
  const paused = useTimerStore((s) => s.paused);
  const toggle = useTimerStore((s) => s.toggle);
  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const seconds = now === null ? 0 : Math.floor(elapsedMs(now) / 1000);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-focus-bg px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
          className="flex flex-col items-center gap-10 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {activityName}
          </p>

          <div
            className="font-mono text-[clamp(3.5rem,16vw,9rem)] font-light leading-none tracking-tight tabular-nums text-foreground"
            aria-live="off"
          >
            {formatClock(seconds)}
          </div>

          <p className="font-mono text-sm text-muted-foreground">
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

          <p className="text-xs text-muted-foreground">Espacio para pausar · Esc para finalizar</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
