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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_HEX } from "@/features/core/category-styles";
import { useStudyData } from "@/features/core/queries";
import {
  formatMinutes,
  minutesByCategory,
  RANGE_LABEL,
  summaryStats,
  weeklySeriesByCategory,
  type CalendarRange,
} from "@/features/core/stats";
import { CATEGORIES, CATEGORY_BY_ID, type CategoryId } from "@/features/core/types";

const STATS_RANGES: CalendarRange[] = ["1m", "3m", "6m", "all"];

export const Route = createFileRoute("/_authenticated/estadisticas")({
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
  const [category, setCategory] = useState<CategoryId | "todas">("todas");

  const allSessions = data?.sessions ?? [];
  const sessions = allSessions.filter((s) =>
    category === "todas" ? true : s.categoryId === category,
  );
  const activities = data?.activities ?? [];
  const activityName = (id: string) => activities.find((a) => a.id === id)?.name ?? "Actividad";

  const stats = useMemo(() => summaryStats(sessions), [sessions]);
  const weekly = useMemo(() => weeklySeriesByCategory(sessions), [sessions]);
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold tracking-tight">Estadísticas</h1>
        <Select value={category} onValueChange={(v) => setCategory(v as CategoryId | "todas")}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                  formatter={(value, name) => [
                    `${typeof value === "number" ? value : Number(value ?? 0)} h`,
                    CATEGORY_BY_ID[name as CategoryId]?.name ?? name ?? "",
                  ]}
                />
                {CATEGORIES.filter((c) => byCategory.some((bc) => bc.id === c.id)).map(
                  (c, i, arr) => (
                    <Bar
                      key={c.id}
                      dataKey={c.id}
                      stackId="weekly"
                      fill={CATEGORY_HEX[c.id]}
                      radius={i === arr.length - 1 ? [4, 4, 0, 0] : 0}
                    />
                  ),
                )}
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
                  formatter={(value, name) => [
                    formatMinutes(typeof value === "number" ? value : Number(value ?? 0)),
                    String(name ?? ""),
                  ]}
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
