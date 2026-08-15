import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { useAddSession, useStudyData } from "@/features/core/queries";
import { sfx } from "@/lib/sfx";
import { useTimerStore } from "./timer-store";
import { useUiStore } from "./ui-store";
import { FocusOverlay } from "./focus-overlay";
import { StartSessionDialog } from "./start-session-dialog";
import { WrapUpDialog, type WrapUpValues } from "./wrap-up-dialog";
import { ShortcutsDialog } from "./shortcuts-dialog";

interface PendingSession {
  activityId: string;
  activityName: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
}

/**
 * Global session layer: start picker, focus mode, wrap-up and keyboard shortcuts.
 * Mounted once in the root route so it works from any page.
 */
export function SessionLayer() {
  const { data } = useStudyData();
  const addSession = useAddSession();

  const startOpen = useUiStore((s) => s.startOpen);
  const setStartOpen = useUiStore((s) => s.setStartOpen);
  const shortcutsOpen = useUiStore((s) => s.shortcutsOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  const activityId = useTimerStore((s) => s.activityId);
  const startTimer = useTimerStore((s) => s.start);
  const resetTimer = useTimerStore((s) => s.reset);
  const toggleTimer = useTimerStore((s) => s.toggle);

  const [pending, setPending] = useState<PendingSession | null>(null);

  useEffect(() => {
    void useTimerStore.persist.rehydrate();
  }, []);

  const activities = data?.activities ?? [];
  const activeActivity = activities.find((a) => a.id === activityId);

  const finish = useCallback(() => {
    const state = useTimerStore.getState();
    if (!state.activityId) return;
    const activity = activities.find((a) => a.id === state.activityId);
    const elapsed = state.elapsedMs(Date.now());
    const durationMin = Math.max(1, Math.round(elapsed / 60_000));
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - elapsed);
    setPending({
      activityId: state.activityId,
      activityName: activity?.name ?? "Sesión",
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMin,
    });
    resetTimer();
  }, [activities, resetTimer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.getAttribute("role") === "combobox");

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (!useTimerStore.getState().activityId) {
          setStartOpen(true);
          sfx.confirm();
        }
        return;
      }
      if (typing) return;
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (!useTimerStore.getState().activityId) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggleTimer();
        sfx.toggle();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        sfx.cancel();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, setShortcutsOpen, setStartOpen, toggleTimer]);

  const handleSave = (values: WrapUpValues) => {
    if (!pending) return;
    const activity = activities.find((a) => a.id === pending.activityId);
    if (!activity) return;
    addSession.mutate({
      activityId: pending.activityId,
      categoryId: activity.categoryId,
      date: format(new Date(pending.startedAt), "yyyy-MM-dd"),
      startedAt: pending.startedAt,
      endedAt: pending.endedAt,
      durationMin: values.durationMin,
      mode: values.mode,
      energy: values.energy,
      outcome: values.outcome,
      distractions: values.distractions,
      notes: values.notes,
      nextStep: values.nextStep,
    });
    setPending(null);
    toast.success("Sesión registrada. Buen trabajo.");
    sfx.success();
  };

  return (
    <>
      <StartSessionDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        activities={activities}
        onSelect={(id) => {
          startTimer(id);
          setStartOpen(false);
        }}
      />

      {activeActivity ? (
        <FocusOverlay activityName={activeActivity.name} onFinish={finish} />
      ) : null}

      {pending ? (
        <WrapUpDialog
          open
          activityName={pending.activityName}
          durationMin={pending.durationMin}
          onCancel={() => setPending(null)}
          onSave={handleSave}
        />
      ) : null}

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
