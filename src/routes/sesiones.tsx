import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";

import { InlineEdit } from "@/components/common/inline-edit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_DOT } from "@/features/core/category-styles";
import {
  useAddSession,
  useDeleteSession,
  useStudyData,
  useUpdateSession,
} from "@/features/core/queries";
import { formatMinutes } from "@/features/core/stats";
import { CATEGORIES, MODES, type CategoryId, type SessionMode } from "@/features/core/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sesiones")({
  head: () => ({
    meta: [
      { title: "Sesiones — Study Time" },
      {
        name: "description",
        content:
          "Historial completo de sesiones con edición inline de duración, notas y próximos pasos.",
      },
      { property: "og:title", content: "Sesiones — Study Time" },
      {
        property: "og:description",
        content: "Revisá y editá cada sesión de estudio en segundos.",
      },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const { data } = useStudyData();
  const update = useUpdateSession();
  const remove = useDeleteSession();
  const add = useAddSession();

  const [category, setCategory] = useState<CategoryId | "todas">("todas");
  const [activityId, setActivityId] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const activities = data?.activities ?? [];
  const sessions = data?.sessions ?? [];
  const activityName = (id: string) => activities.find((a) => a.id === id)?.name ?? "—";

  const filtered = useMemo(
    () =>
      sessions
        .filter((s) => (category === "todas" ? true : s.categoryId === category))
        .filter((s) => (activityId === "todas" ? true : s.activityId === activityId))
        .filter((s) =>
          query.trim()
            ? `${activityName(s.activityId)} ${s.notes} ${s.nextStep}`
                .toLowerCase()
                .includes(query.toLowerCase())
            : true,
        )
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, category, activityId, query, activities],
  );

  const total = filtered.reduce((acc, s) => acc + s.durationMin, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold tracking-tight">Sesiones</h1>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar…"
          className="h-9 w-44"
        />
        <Select value={category} onValueChange={(v) => setCategory(v as CategoryId | "todas")}>
          <SelectTrigger className="h-9 w-40">
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
        <Select value={activityId} onValueChange={setActivityId}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las actividades</SelectItem>
            {activities.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ManualSessionDialog
          open={open}
          onOpenChange={setOpen}
          activities={activities}
          onSubmit={(values) => {
            const activity = activities.find((a) => a.id === values.activityId);
            if (!activity) return;
            const startedAt = new Date(`${values.date}T${values.start}:00`);
            const endedAt = new Date(startedAt.getTime() + values.durationMin * 60_000);
            add.mutate({
              activityId: values.activityId,
              categoryId: activity.categoryId,
              date: values.date,
              startedAt: startedAt.toISOString(),
              endedAt: endedAt.toISOString(),
              durationMin: values.durationMin,
              mode: values.mode,
              energy: 3,
              outcome: "bien",
              distractions: 0,
              notes: "",
              nextStep: "",
            });
            setOpen(false);
          }}
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <span>
            {filtered.length} {filtered.length === 1 ? "sesión" : "sesiones"}
          </span>
          <span className="font-mono">{formatMinutes(total)}</span>
        </div>

        <div className="divide-y divide-border/70">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[auto_1.4fr_1fr_auto_auto_auto] items-center gap-3 px-4 py-2 text-sm transition-colors duration-150 hover:bg-accent/40"
            >
              <span className={cn("size-2 rounded-full", CATEGORY_DOT[s.categoryId])} />
              <span className="truncate">{activityName(s.activityId)}</span>
              <InlineEdit
                value={s.notes}
                placeholder="Añadir nota"
                className="truncate text-xs text-muted-foreground"
                onSave={(notes) => update.mutate({ id: s.id, patch: { notes } })}
              />
              <span className="hidden w-24 text-xs text-muted-foreground sm:block">
                {format(parseISO(s.date), "d MMM yyyy", { locale: es })}
              </span>
              <div className="w-20 text-right font-mono text-xs">
                <InlineEdit
                  type="number"
                  value={String(s.durationMin)}
                  className="w-full text-right"
                  onSave={(v) => {
                    const durationMin = Math.max(1, Number(v) || s.durationMin);
                    update.mutate({ id: s.id, patch: { durationMin } });
                  }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Eliminar sesión"
                className="size-7 text-muted-foreground hover:text-destructive"
                data-sfx="cancel"
                onClick={() => remove.mutate(s.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay sesiones para este filtro.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface ManualValues {
  activityId: string;
  date: string;
  start: string;
  durationMin: number;
  mode: SessionMode;
}

function ManualSessionDialog({
  open,
  onOpenChange,
  activities,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: { id: string; name: string }[];
  onSubmit: (values: ManualValues) => void;
}) {
  const [values, setValues] = useState<ManualValues>({
    activityId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start: "09:00",
    durationMin: 45,
    mode: "solo",
  });

  const activityId = values.activityId || activities[0]?.id || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5" data-sfx="confirm">
          <Plus className="size-4" />
          Añadir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Añadir sesión</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Actividad</Label>
            <Select
              value={activityId}
              onValueChange={(v) => setValues((s) => ({ ...s, activityId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegí una actividad" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={values.date}
                onChange={(e) => setValues((s) => ({ ...s, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Inicio</Label>
              <Input
                type="time"
                value={values.start}
                onChange={(e) => setValues((s) => ({ ...s, start: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Minutos</Label>
              <Input
                type="number"
                value={values.durationMin}
                onChange={(e) =>
                  setValues((s) => ({ ...s, durationMin: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Modalidad</Label>
            <Select
              value={values.mode}
              onValueChange={(v) => setValues((s) => ({ ...s, mode: v as SessionMode }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            data-sfx="confirm"
            onClick={() => onSubmit({ ...values, activityId })}
            disabled={!activityId || values.durationMin < 1}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
