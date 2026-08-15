import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AlarmClock, CalendarClock } from "lucide-react";

import { daysUntil } from "@/features/core/stats";
import { DEADLINE_LABEL, type Activity, type Deadline } from "@/features/core/types";
import { cn } from "@/lib/utils";

export function urgencyClass(days: number) {
  if (days <= 2) return "text-destructive";
  if (days <= 7) return "text-cat-entrenamiento";
  return "text-muted-foreground";
}

interface Props {
  title: string;
  deadline: (Deadline & { activity?: Activity | undefined }) | undefined;
  emptyLabel: string;
}

export function NextDeadlineCard({ title, deadline, emptyLabel }: Props) {
  const days = deadline ? daysUntil(deadline.date) : null;

  return (
    <div className="panel flex flex-col justify-between p-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{title}</span>
        {title.toLowerCase().includes("examen") ? (
          <AlarmClock className="size-3.5" />
        ) : (
          <CalendarClock className="size-3.5" />
        )}
      </div>

      {deadline ? (
        <>
          <div className="mt-2 truncate text-sm font-medium text-foreground">{deadline.title}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {deadline.activity?.name} · {DEADLINE_LABEL[deadline.kind]} ·{" "}
            {format(parseISO(deadline.date), "d MMM", { locale: es })}
          </div>
          <div className={cn("mt-2 font-mono text-xl leading-none", urgencyClass(days ?? 99))}>
            {days === 0 ? "hoy" : days === 1 ? "mañana" : `${days} días`}
          </div>
        </>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">{emptyLabel}</div>
      )}
    </div>
  );
}
