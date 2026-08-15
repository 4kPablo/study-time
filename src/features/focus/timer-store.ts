import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TimerState {
  activityId: string | null;
  startedAtMs: number | null;
  accumulatedMs: number;
  paused: boolean;
  /** Set when the session ends and the wrap-up panel should be shown. */
  start: (activityId: string) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  reset: () => void;
  elapsedMs: (now: number) => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activityId: null,
      startedAtMs: null,
      accumulatedMs: 0,
      paused: false,
      start: (activityId) =>
        set({ activityId, startedAtMs: Date.now(), accumulatedMs: 0, paused: false }),
      pause: () => {
        const { startedAtMs, accumulatedMs, paused } = get();
        if (paused || startedAtMs === null) return;
        set({
          paused: true,
          startedAtMs: null,
          accumulatedMs: accumulatedMs + (Date.now() - startedAtMs),
        });
      },
      resume: () => {
        if (!get().paused) return;
        set({ paused: false, startedAtMs: Date.now() });
      },
      toggle: () => (get().paused ? get().resume() : get().pause()),
      reset: () => set({ activityId: null, startedAtMs: null, accumulatedMs: 0, paused: false }),
      elapsedMs: (now) => {
        const { startedAtMs, accumulatedMs } = get();
        return accumulatedMs + (startedAtMs === null ? 0 : now - startedAtMs);
      },
    }),
    {
      name: "study-time:timer:v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        activityId: s.activityId,
        startedAtMs: s.startedAtMs,
        accumulatedMs: s.accumulatedMs,
        paused: s.paused,
      }),
    },
  ),
);
