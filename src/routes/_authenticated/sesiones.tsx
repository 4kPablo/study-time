import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { InlineEdit } from "@/components/common/inline-edit";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_DOT } from "@/features/core/category-styles";
import {
  useAddSession,
  useDeleteSession,
  useRestoreSession,
  useStudyData,
  useUpdateSession,
} from "@/features/core/queries";
import { formatMinutes } from "@/features/core/stats";
import {
  CATEGORIES,
  ENERGY_LABEL,
  MODES,
  MODE_LABEL,
  OUTCOMES,
  type CategoryId,
  type Session,
  type SessionMode,
  type SessionOutcome,
} from "@/features/core/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sesiones")({
  head: () => ({
    meta: [
      { title: "Sesiones — Study Time" },
      {
        name: "description",
        content: "Historial completo de sesiones, con alta manual y edición de cada detalle.",
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
  const restore = useRestoreSession();
  const add = useAddSession();

  const [category, setCategory] = useState<CategoryId | "todas">("todas");
  const [activityId, setActivityId] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);

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
              energy: values.energy,
              outcome: values.outcome,
              distractions: values.distractions,
              notes: values.notes,
              nextStep: values.nextStep,
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
            <div key={s.id} className="px-4 py-3 transition-colors duration-150 hover:bg-accent/40">
              <div className="flex items-center gap-3 text-sm">
                <span className={cn("size-2 shrink-0 rounded-full", CATEGORY_DOT[s.categoryId])} />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {activityName(s.activityId)}
                </span>
                <div className="w-16 shrink-0 text-right font-mono text-xs">
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
                  aria-label="Editar sesión"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  data-sfx="confirm"
                  onClick={() => setEditing(s)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar sesión"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  data-sfx="cancel"
                  onClick={() => {
                    remove.mutate(s.id);
                    toast.success(`Sesión de ${activityName(s.activityId)} eliminada`, {
                      action: {
                        label: "Deshacer",
                        onClick: () => restore.mutate(s),
                      },
                    });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="mt-1 flex items-center gap-1.5 pl-5 text-xs text-muted-foreground">
                <span className="truncate">{MODE_LABEL[s.mode]}</span>
                <span aria-hidden>·</span>
                <span className="shrink-0">
                  {format(parseISO(s.date), "d MMM yyyy", { locale: es })}
                </span>
                <span aria-hidden>·</span>
                <span className="shrink-0">{ENERGY_LABEL[s.energy]}</span>
              </div>
              {s.notes || s.nextStep ? (
                <div className="mt-1 space-y-0.5 pl-5 text-xs text-muted-foreground">
                  {s.notes ? (
                    <p className="truncate">
                      <span className="font-medium text-foreground/70">Nota:</span> {s.notes}
                    </p>
                  ) : null}
                  {s.nextStep ? (
                    <p className="truncate">
                      <span className="font-medium text-foreground/70">Próximo:</span> {s.nextStep}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay sesiones para este filtro.
            </p>
          ) : null}
        </div>
      </div>

      {editing ? (
        <EditSessionDialog
          session={editing}
          activities={activities}
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
          onSave={(values) => {
            const date = format(parseISO(editing.startedAt), "yyyy-MM-dd");
            const start = format(parseISO(editing.startedAt), "HH:mm");
            const unchanged =
              values.date === date &&
              values.start === start &&
              values.durationMin === editing.durationMin;
            const base = unchanged
              ? parseISO(editing.startedAt)
              : new Date(`${values.date}T${values.start}:00`);
            const startedAt = unchanged ? editing.startedAt : base.toISOString();
            const endedAt = unchanged
              ? editing.endedAt
              : new Date(base.getTime() + values.durationMin * 60_000).toISOString();
            const activity = activities.find((a) => a.id === values.activityId);
            update.mutate({
              id: editing.id,
              patch: {
                activityId: values.activityId,
                categoryId: activity?.categoryId ?? editing.categoryId,
                date: values.date,
                startedAt,
                endedAt,
                durationMin: values.durationMin,
                mode: values.mode,
                energy: values.energy,
                outcome: values.outcome,
                distractions: values.distractions,
                notes: values.notes,
                nextStep: values.nextStep,
              },
            });
            setEditing(null);
            toast.success("Sesión actualizada");
          }}
        />
      ) : null}
    </div>
  );
}

interface ManualValues {
  activityId: string;
  date: string;
  start: string;
  durationMin: number;
  mode: SessionMode;
  energy: number;
  outcome: SessionOutcome;
  distractions: number;
  notes: string;
  nextStep: string;
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
    mode: "autogestionada",
    energy: 3,
    outcome: "bien",
    distractions: 0,
    notes: "",
    nextStep: "",
  });

  const activityId = values.activityId || activities[0]?.id || "";
  const set = (patch: Partial<ManualValues>) => setValues((s) => ({ ...s, ...patch }));

  useEffect(() => {
    if (open) {
      setValues({
        activityId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        start: "09:00",
        durationMin: 45,
        mode: "autogestionada",
        energy: 3,
        outcome: "bien",
        distractions: 0,
        notes: "",
        nextStep: "",
      });
    }
  }, [open]);

  return (
    <>
      <Button
        size="sm"
        className="h-9 w-full gap-1.5 sm:w-auto"
        data-sfx="confirm"
        onClick={() => onOpenChange(true)}
      >
        <Plus className="size-4" />
        Añadir
      </Button>
      <ResponsiveDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-md">
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
                onChange={(e) => set({ date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Inicio</Label>
              <Input
                type="time"
                value={values.start}
                onChange={(e) => set({ start: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Minutos</Label>
              <Input
                type="number"
                value={values.durationMin}
                onChange={(e) => set({ durationMin: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <Select value={values.mode} onValueChange={(v) => set({ mode: v as SessionMode })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODE_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resultado</Label>
              <Select
                value={values.outcome}
                onValueChange={(v) => set({ outcome: v as SessionOutcome })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Energía inicial</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={values.energy === n ? "default" : "secondary"}
                  size="sm"
                  className="flex-1"
                  onClick={() => set({ energy: n })}
                >
                  {n}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{ENERGY_LABEL[values.energy]}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Distracciones</Label>
            <Input
              type="number"
              value={values.distractions}
              onChange={(e) => set({ distractions: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              rows={2}
              placeholder="¿Qué hiciste en esta sesión?"
              value={values.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Próximo paso</Label>
            <Input
              placeholder="¿Por dónde seguís mañana?"
              value={values.nextStep}
              onChange={(e) => set({ nextStep: e.target.value })}
            />
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
      </ResponsiveDialog>
    </>
  );
}

interface EditValues {
  activityId: string;
  date: string;
  start: string;
  durationMin: number;
  mode: SessionMode;
  energy: number;
  outcome: SessionOutcome;
  distractions: number;
  notes: string;
  nextStep: string;
}

function EditSessionDialog({
  session,
  activities,
  onOpenChange,
  onSave,
}: {
  session: Session;
  activities: { id: string; name: string; categoryId: CategoryId }[];
  onOpenChange: (open: boolean) => void;
  onSave: (values: EditValues) => void;
}) {
  const [values, setValues] = useState<EditValues>(() => ({
    activityId: session.activityId,
    date: format(parseISO(session.startedAt), "yyyy-MM-dd"),
    start: format(parseISO(session.startedAt), "HH:mm"),
    durationMin: session.durationMin,
    mode: session.mode,
    energy: session.energy,
    outcome: session.outcome ?? "bien",
    distractions: session.distractions,
    notes: session.notes,
    nextStep: session.nextStep,
  }));

  const set = (patch: Partial<EditValues>) => setValues((s) => ({ ...s, ...patch }));

  return (
    <ResponsiveDialog open onOpenChange={onOpenChange} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Editar sesión</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Actividad</Label>
          <Select value={values.activityId} onValueChange={(v) => set({ activityId: v })}>
            <SelectTrigger>
              <SelectValue />
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
              onChange={(e) => set({ date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Inicio</Label>
            <Input
              type="time"
              value={values.start}
              onChange={(e) => set({ start: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Minutos</Label>
            <Input
              type="number"
              value={values.durationMin}
              onChange={(e) => set({ durationMin: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Modalidad</Label>
            <Select value={values.mode} onValueChange={(v) => set({ mode: v as SessionMode })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {MODE_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Resultado</Label>
            <Select
              value={values.outcome}
              onValueChange={(v) => set({ outcome: v as SessionOutcome })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o} className="capitalize">
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Energía inicial</Label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                type="button"
                variant={values.energy === n ? "default" : "secondary"}
                size="sm"
                className="flex-1"
                onClick={() => set({ energy: n })}
              >
                {n}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{ENERGY_LABEL[values.energy]}</p>
        </div>
        <div className="space-y-1.5">
          <Label>Distracciones</Label>
          <Input
            type="number"
            value={values.distractions}
            onChange={(e) => set({ distractions: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Textarea
            rows={2}
            placeholder="¿Qué hiciste en esta sesión?"
            value={values.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Próximo paso</Label>
          <Input
            placeholder="¿Por dónde seguís mañana?"
            value={values.nextStep}
            onChange={(e) => set({ nextStep: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" data-sfx="cancel" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          data-sfx="confirm"
          disabled={!values.activityId || values.durationMin < 1}
          onClick={() => onSave(values)}
        >
          Guardar
        </Button>
      </DialogFooter>
    </ResponsiveDialog>
  );
}
