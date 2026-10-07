import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TimerMode = "continuo" | "pomodoro";

interface TimerState {
  activityId: string | null;
  startedAtMs: number | null;
  accumulatedMs: number;
  paused: boolean;
  /** Set when the session is paused; used to show the visual pause counter. */
  pauseStartedAtMs: number | null;
  mode: TimerMode;
  workMin: number;
  restMin: number;
  start: (activityId: string) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  reset: () => void;
  setMode: (mode: TimerMode) => void;
  setWorkMin: (min: number) => void;
  setRestMin: (min: number) => void;
  elapsedMs: (now: number) => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activityId: null,
      startedAtMs: null,
      accumulatedMs: 0,
      paused: false,
      pauseStartedAtMs: null,
      mode: "continuo",
      workMin: 25,
      restMin: 5,
      start: (activityId) =>
        set({
          activityId,
          startedAtMs: Date.now(),
          accumulatedMs: 0,
          paused: false,
          pauseStartedAtMs: null,
        }),
      pause: () => {
        const { startedAtMs, accumulatedMs, paused } = get();
        if (paused || startedAtMs === null) return;
        set({
          paused: true,
          startedAtMs: null,
          accumulatedMs: accumulatedMs + (Date.now() - startedAtMs),
          pauseStartedAtMs: Date.now(),
        });
      },
      resume: () => {
        if (!get().paused) return;
        set({ paused: false, startedAtMs: Date.now(), pauseStartedAtMs: null });
      },
      toggle: () => (get().paused ? get().resume() : get().pause()),
      reset: () =>
        set({
          activityId: null,
          startedAtMs: null,
          accumulatedMs: 0,
          paused: false,
          pauseStartedAtMs: null,
        }),
      setMode: (mode) => {
        if (get().mode === mode) return;
        set({ mode });
      },
      setWorkMin: (workMin) => {
        const min = Math.max(1, Math.min(180, Math.round(workMin) || 25));
        set({ workMin: min });
      },
      setRestMin: (restMin) => {
        const min = Math.max(0, Math.min(60, Math.round(restMin) || 5));
        set({ restMin: min });
      },
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
        pauseStartedAtMs: s.pauseStartedAtMs,
        mode: s.mode,
        workMin: s.workMin,
        restMin: s.restMin,
      }),
    },
  ),
);
