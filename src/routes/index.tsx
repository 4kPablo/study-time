import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Play } from "lucide-react";

import { ContributionGrid } from "@/components/common/contribution-grid";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudyData } from "@/features/core/queries";
import {
  formatMinutes,
  minutesThisWeek,
  minutesToday,
  RANGE_LABEL,
  type CalendarRange,
} from "@/features/core/stats";
import { useUiStore } from "@/features/focus/ui-store";

const DASHBOARD_RANGES: CalendarRange[] = ["1w", "1m", "3m", "all"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Time — Empezá a estudiar en 10 segundos" },
      {
        name: "description",
        content:
          "Un espacio tranquilo para estudiar: empezá una sesión, seguí tu objetivo semanal y mirá tu progreso sin ruido.",
      },
      { property: "og:title", content: "Study Time — Empezá a estudiar en 10 segundos" },
      {
        property: "og:description",
        content: "Registrá sesiones, seguí tu objetivo semanal y mirá tu progreso real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isPending } = useStudyData();
  const setStartOpen = useUiStore((s) => s.setStartOpen);
  const [range, setRange] = useState<CalendarRange>("1w");

  const sessions = data?.sessions ?? [];
  const activities = data?.activities ?? [];
  const goal = data?.settings.weeklyGoalMin ?? 600;

  const activityName = (id: string) => activities.find((a) => a.id === id)?.name ?? "Actividad";

  const today = minutesToday(sessions);
  const week = minutesThisWeek(sessions);
  const recent = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 5);
  const goalPct = Math.min(100, Math.round((week / Math.max(1, goal)) * 100));

  if (isPending) {
    return <div className="h-[60vh] animate-pulse rounded-xl bg-surface" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-6">
      {/* Start */}
      <section className="flex flex-col items-center gap-5 text-center">
        <p className="text-sm text-muted-foreground">
          {today > 0 ? `Hoy llevás ${formatMinutes(today)}` : "Todavía no estudiaste hoy"}
        </p>
        <Button
          size="lg"
          onClick={() => setStartOpen(true)}
          data-sfx="confirm"
          className="h-14 gap-2.5 rounded-full px-9 text-base"
        >
          <Play className="size-4" />
          Comenzar sesión
        </Button>
        <p className="text-xs text-muted-foreground">Ctrl + N</p>
      </section>

      {/* Weekly goal */}
      <section className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Objetivo semanal</h2>
          <span className="font-mono text-xs text-muted-foreground">
            {formatMinutes(week)} / {formatMinutes(goal)}
          </span>
        </div>
        <Progress value={goalPct} className="h-1.5" />
        <p className="text-xs text-muted-foreground">
          {goalPct >= 100 ? "Objetivo cumplido" : `${goalPct}% del objetivo`}
        </p>
      </section>

      {/* Calendar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Calendario de esfuerzo</h2>
          <div className="flex gap-1">
            {DASHBOARD_RANGES.map((r) => (
              <Button
                key={r}
                size="sm"
                variant="ghost"
                className={
                  range === r
                    ? "h-7 px-2 text-xs text-foreground"
                    : "h-7 px-2 text-xs text-muted-foreground"
                }
                onClick={() => setRange(r)}
              >
                {RANGE_LABEL[r]}
              </Button>
            ))}
          </div>
        </div>
        <ContributionGrid sessions={sessions} range={range} activityName={activityName} />
      </section>

      {/* Recent */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Últimas sesiones</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay sesiones. La primera empieza con un click.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="flex-1 truncate">{activityName(s.activityId)}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {format(parseISO(s.date), "EEE d MMM", { locale: es })}
                </span>
                <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                  {formatMinutes(s.durationMin)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
