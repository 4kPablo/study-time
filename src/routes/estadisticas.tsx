import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ContributionGrid } from "@/components/common/contribution-grid";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { CATEGORY_HEX } from "@/features/core/category-styles";
import { useStudyData } from "@/features/core/queries";
import {
  formatMinutes,
  minutesByCategory,
  RANGE_LABEL,
  summaryStats,
  weeklySeries,
  type CalendarRange,
} from "@/features/core/stats";
import { CATEGORY_BY_ID, type CategoryId } from "@/features/core/types";

const STATS_RANGES: CalendarRange[] = ["1m", "3m", "6m", "all"];

export const Route = createFileRoute("/estadisticas")({
  head: () => ({
    meta: [
      { title: "Estadísticas — Study Time" },
      {
        name: "description",
        content:
          "Tiempo por semana y por categoría, racha, promedios y horas acumuladas de estudio.",
      },
      { property: "og:title", content: "Estadísticas — Study Time" },
      {
        property: "og:description",
        content: "Pocas métricas, todas útiles: tu progreso real de estudio.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { data } = useStudyData();
  const [range, setRange] = useState<CalendarRange>("1m");

  const sessions = data?.sessions ?? [];
  const activities = data?.activities ?? [];
  const activityName = (id: string) => activities.find((a) => a.id === id)?.name ?? "Actividad";

  const stats = useMemo(() => summaryStats(sessions), [sessions]);
  const weekly = useMemo(() => weeklySeries(sessions), [sessions]);
  const byCategory = useMemo(() => {
    const map = minutesByCategory(sessions);
    return [...map.entries()].map(([id, minutes]) => ({
      id,
      name: CATEGORY_BY_ID[id as CategoryId].name,
      minutes,
    }));
  }, [sessions]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">Estadísticas</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Horas acumuladas" value={`${Math.round(stats.totalMinutes / 60)}h`} />
        <StatCard label="Racha" value={`${stats.streak} ${stats.streak === 1 ? "día" : "días"}`} />
        <StatCard
          label="Promedio diario"
          value={formatMinutes(stats.dailyAverage)}
          hint="En días con actividad"
        />
        <StatCard label="Promedio semanal" value={formatMinutes(stats.weeklyAverage)} />
        <StatCard label="Sesión más larga" value={formatMinutes(stats.longestSession)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium">Horas por semana</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => [`${v} h`, "Tiempo"]}
                />
                <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="mb-4 text-sm font-medium">Tiempo por categoría</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="minutes"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  stroke="none"
                >
                  {byCategory.map((entry) => (
                    <Cell key={entry.id} fill={CATEGORY_HEX[entry.id as CategoryId]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number, n) => [formatMinutes(v), n as string]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {byCategory.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: CATEGORY_HEX[c.id as CategoryId] }}
                />
                <span className="flex-1 text-muted-foreground">{c.name}</span>
                <span className="font-mono">{formatMinutes(c.minutes)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Calendario</h2>
          <div className="flex gap-1">
            {STATS_RANGES.map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "secondary" : "ghost"}
                className="h-7 px-2 text-xs"
                onClick={() => setRange(r)}
              >
                {RANGE_LABEL[r]}
              </Button>
            ))}
          </div>
        </div>
        <ContributionGrid sessions={sessions} range={range} activityName={activityName} />
      </div>
    </div>
  );
}
