import { useMemo, useState, type FocusEvent, type MouseEvent } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Flame } from "lucide-react";

import { LEVEL_BG } from "@/features/core/category-styles";
import {
  buildMonthlyHeat,
  buildWeek,
  currentStreak,
  formatMinutes,
  todayKey,
  type CalendarDay,
  type CalendarRange,
  type WeekDay,
} from "@/features/core/stats";
import type { Session } from "@/features/core/types";
import { cn } from "@/lib/utils";

interface Props {
  sessions: Session[];
  range: CalendarRange;
  activityName: (id: string) => string;
  className?: string;
  cellSize?: "sm" | "md";
  align?: "center" | "right";
}

interface HoverState {
  day: CalendarDay;
  x: number;
  y: number;
}

export function ContributionGrid({
  sessions,
  range,
  activityName,
  className,
  align = "center",
}: Props) {
  if (range === "1w") {
    return (
      <WeekStreak
        sessions={sessions}
        activityName={activityName}
        className={className}
        align={align}
      />
    );
  }
  return (
    <GridCalendar
      sessions={sessions}
      range={range}
      activityName={activityName}
      className={className}
    />
  );
}

function GridCalendar({
  sessions,
  range,
  activityName,
  className,
}: {
  sessions: Session[];
  range: CalendarRange;
  activityName: (id: string) => string;
  className?: string | undefined;
}) {
  const months = useMemo(() => buildMonthlyHeat(sessions, range), [sessions, range]);
  const [hover, setHover] = useState<HoverState | null>(null);
  const today = todayKey();

  const hoverProps = (day: CalendarDay) => ({
    onMouseEnter: (e: MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHover({ day, x: rect.left + rect.width / 2, y: rect.top });
    },
    onMouseLeave: () => setHover(null),
    onFocus: (e: FocusEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHover({ day, x: rect.left + rect.width / 2, y: rect.top });
    },
    onBlur: () => setHover(null),
  });

  return (
    <div className={cn("relative", className)}>
      <div className="space-y-2">
        {months.map((month) => (
          <div key={month.key} className="flex items-center gap-2 sm:gap-3">
            <span
              className="w-16 shrink-0 truncate text-[11px] text-muted-foreground sm:w-24 sm:text-xs"
              title={month.label}
            >
              {month.label}
            </span>
            <div className="grid flex-1 grid-cols-[repeat(31,minmax(0,1fr))] gap-[3px]">
              {month.days.map((day, i) =>
                day ? (
                  <button
                    key={day.key}
                    type="button"
                    aria-label={`${format(day.date, "d 'de' MMMM", { locale: es })}: ${formatMinutes(day.minutes)}`}
                    className={cn(
                      "aspect-square w-full rounded-[3px] transition-colors duration-150",
                      day.future
                        ? "border border-dashed border-border bg-surface-2/50"
                        : "hover:ring-1 hover:ring-ring/60",
                      !day.future && day.level > 0 && LEVEL_BG[day.level],
                      !day.future && day.level === 0 && "bg-surface-2",
                      day.key === today &&
                        "ring-1 ring-primary ring-offset-1 ring-offset-background",
                    )}
                    {...hoverProps(day)}
                  />
                ) : (
                  <div key={`${month.key}-${i}`} />
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground/70">
        <span>Menos</span>
        {LEVEL_BG.map((bg) => (
          <span key={bg} className={cn("size-2 rounded-[3px]", bg)} />
        ))}
        <span>Más</span>
      </div>

      <DayTooltip hover={hover} activityName={activityName} />
    </div>
  );
}

/** Current week (Monday→Sunday) rendered as big streak circles. */
function WeekStreak({
  sessions,
  activityName,
  className,
  align = "center",
}: {
  sessions: Session[];
  activityName: (id: string) => string;
  className?: string | undefined;
  align?: "center" | "right";
}) {
  const week = useMemo(() => buildWeek(sessions), [sessions]);
  const streak = useMemo(() => currentStreak(sessions), [sessions]);
  const [hover, setHover] = useState<HoverState | null>(null);
  const today = todayKey();

  return (
    <div className={cn("relative", className)}>
      {streak > 0 && (
        <div className="mb-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-cat-estudio animate-pulse" />
          <span>
            Racha de {streak} {streak === 1 ? "día" : "días"}
          </span>
        </div>
      )}

      <div
        className={cn("flex gap-2 sm:gap-3", align === "right" ? "justify-end" : "justify-center")}
      >
        {week.map((day) => (
          <div key={day.key} className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              aria-label={`${format(day.date, "d 'de' MMMM", { locale: es })}: ${formatMinutes(day.minutes)}`}
              className={cn(
                "flex size-11 items-center justify-center rounded-full font-mono text-sm transition-colors duration-150",
                day.future && "border border-dashed border-border opacity-40",
                !day.future && day.level > 0 && LEVEL_BG[day.level],
                !day.future &&
                  day.level === 0 &&
                  "border border-border bg-surface-2 text-muted-foreground",
                !day.future &&
                  day.key === today &&
                  "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHover({ day, x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setHover(null)}
              onFocus={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHover({ day, x: rect.left + rect.width / 2, y: rect.top });
              }}
              onBlur={() => setHover(null)}
            >
              {format(day.date, "d")}
            </button>
            <span
              className={cn(
                "text-[11px]",
                day.key === today ? "font-medium text-foreground" : "text-muted-foreground/70",
              )}
            >
              {format(day.date, "EEE", { locale: es })}
            </span>
          </div>
        ))}
      </div>

      <DayTooltip hover={hover} activityName={activityName} />
    </div>
  );
}

function DayTooltip({
  hover,
  activityName,
}: {
  hover: HoverState | null;
  activityName: (id: string) => string;
}) {
  if (!hover) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-soft"
      style={{ left: hover.x, top: hover.y - 8 }}
    >
      <div className="font-medium capitalize text-popover-foreground">
        {format(hover.day.date, "EEEE d 'de' MMM", { locale: es })}
      </div>
      <div className="mt-1 font-mono text-sm text-foreground">
        {hover.day.minutes > 0 ? formatMinutes(hover.day.minutes) : "Sin actividad"}
      </div>
      {hover.day.sessions.length > 0 ? (
        <div className="mt-1 space-y-0.5 text-muted-foreground">
          {[...new Set(hover.day.sessions.map((s) => activityName(s.activityId)))].map((n) => (
            <div key={n}>{n}</div>
          ))}
          <div className="pt-0.5">
            {hover.day.sessions.length} {hover.day.sessions.length === 1 ? "sesión" : "sesiones"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
