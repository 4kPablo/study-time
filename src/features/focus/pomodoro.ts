export interface PomodoroState {
  phase: "work" | "rest";
  /** Seconds left in the current phase. */
  phaseRemainingSec: number;
  /** Total elapsed seconds. */
  totalSec: number;
  /** Seconds spent working (breaks excluded). */
  workSec: number;
}

/**
 * Deterministic pomodoro phase from the running stopwatch: work and rest
 * alternate every `workMin + restMin` minutes. Because it derives the phase
 * from elapsed time, the countdown freezes naturally when the timer pauses.
 */
export function pomodoroAt(elapsedMs: number, workMin: number, restMin: number): PomodoroState {
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const work = workMin * 60;
  const rest = restMin * 60;
  const cycle = work + rest;
  if (cycle <= 0) {
    return { phase: "work", phaseRemainingSec: work, totalSec, workSec: totalSec };
  }
  const completed = Math.floor(totalSec / cycle);
  const inCycle = totalSec % cycle;
  const restSec = completed * rest + Math.max(0, inCycle - work);
  const workSec = totalSec - restSec;
  if (inCycle < work) {
    return { phase: "work", phaseRemainingSec: work - inCycle, totalSec, workSec };
  }
  return {
    phase: "rest",
    phaseRemainingSec: rest - (inCycle - work),
    totalSec,
    workSec,
  };
}
