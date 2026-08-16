import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen,
  FileText,
  Folder,
  Github,
  GraduationCap,
  Link2,
  Pencil,
  Plus,
  Star,
  Trash2,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";

import { InlineEdit } from "@/components/common/inline-edit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_DOT, CATEGORY_SOFT } from "@/features/core/category-styles";
import {
  useAddActivity,
  useAddDeadline,
  useAddResource,
  useDeleteActivity,
  useDeleteDeadline,
  useDeleteResource,
  useRestoreActivity,
  useStudyData,
  useUpdateActivity,
  useUpdateResource,
} from "@/features/core/queries";
import { daysUntil } from "@/features/core/stats";
import {
  CATEGORIES,
  DEADLINE_LABEL,
  type Activity,
  type CategoryId,
  type Deadline,
  type DeadlineKind,
  type Resource,
  type ResourceKind,
} from "@/features/core/types";
import { urgencyClass } from "@/features/dashboard/next-deadline-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/actividades")({
  head: () => ({
    meta: [
      { title: "Actividades — Study Time" },
      {
        name: "description",
        content:
          "Organizá materias y proyectos por categoría, con recursos rápidos y fechas de entrega.",
      },
      { property: "og:title", content: "Actividades — Study Time" },
      {
        property: "og:description",
        content: "Materias, recursos rápidos y deadlines en un solo lugar.",
      },
    ],
  }),
  component: ActivitiesPage,
});

const RESOURCE_ICON: Record<ResourceKind, typeof Link2> = {
  pdf: FileText,
  youtube: Youtube,
  campus: GraduationCap,
  github: Github,
  drive: Folder,
  apuntes: BookOpen,
  link: Link2,
};

const RESOURCE_KINDS: ResourceKind[] = [
  "pdf",
  "youtube",
  "campus",
  "github",
  "drive",
  "apuntes",
  "link",
];

function ActivitiesPage() {
  const { data } = useStudyData();
  const addActivity = useAddActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const restoreActivity = useRestoreActivity();
  const addResource = useAddResource();
  const deleteResource = useDeleteResource();
  const updateResource = useUpdateResource();
  const addDeadline = useAddDeadline();
  const deleteDeadline = useDeleteDeadline();

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<CategoryId>("estudio");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activities = data?.activities ?? [];
  const selected = activities.find((a) => a.id === selectedId) ?? activities[0];
  const resources = (data?.resources ?? []).filter((r) => r.activityId === selected?.id);
  const deadlines = (data?.deadlines ?? [])
    .filter((d) => d.activityId === selected?.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="panel h-fit p-4">
        <h1 className="mb-3 text-sm font-medium">Actividades</h1>

        <div className="mb-3 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                addActivity.mutate({ name: newName, categoryId: newCategory });
                setNewName("");
              }
            }}
            placeholder="Nueva actividad"
            className="h-9"
          />
          <Button
            size="icon"
            className="size-9 shrink-0"
            aria-label="Añadir actividad"
            data-sfx="confirm"
            onClick={() => {
              if (!newName.trim()) return;
              addActivity.mutate({ name: newName, categoryId: newCategory });
              setNewName("");
            }}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <Select value={newCategory} onValueChange={(v) => setNewCategory(v as CategoryId)}>
          <SelectTrigger className="mb-4 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-4">
          {CATEGORIES.map((c) => {
            const items = activities.filter((a) => a.categoryId === c.id);
            if (items.length === 0) return null;
            return (
              <div key={c.id}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {c.name}
                </p>
                <ul className="space-y-0.5">
                  {items.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(a.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-150 hover:bg-accent",
                          selected?.id === a.id && "bg-accent",
                        )}
                      >
                        <span className={cn("size-2 rounded-full", CATEGORY_DOT[a.categoryId])} />
                        <span className="flex-1 truncate">{a.name}</span>
                        {a.favorite ? <Star className="size-3 text-muted-foreground" /> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="space-y-4">
          <div className="panel flex flex-wrap items-center gap-3 p-4">
            <span className={cn("size-2.5 rounded-full", CATEGORY_DOT[selected.categoryId])} />
            <InlineEdit
              value={selected.name}
              className="text-lg font-semibold tracking-tight"
              onSave={(name) => updateActivity.mutate({ id: selected.id, patch: { name } })}
            />
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs",
                CATEGORY_SOFT[selected.categoryId],
              )}
            >
              {CATEGORIES.find((c) => c.id === selected.categoryId)?.name}
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                variant={selected.favorite ? "default" : "secondary"}
                size="sm"
                className="gap-1.5"
                data-sfx="toggle"
                onClick={() =>
                  updateActivity.mutate({
                    id: selected.id,
                    patch: { favorite: !selected.favorite },
                  })
                }
              >
                <Star className="size-3.5" />
                {selected.favorite ? "Favorita" : "Marcar favorita"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Eliminar actividad"
                className="text-muted-foreground hover:text-destructive"
                data-sfx="cancel"
                onClick={() => {
                  if (!selected) return;
                  const snapshot = {
                    activity: selected,
                    resources,
                    deadlines,
                  };
                  deleteActivity.mutate(selected.id);
                  toast.success(`"${selected.name}" eliminada`, {
                    action: {
                      label: "Deshacer",
                      onClick: () => {
                        restoreActivity.mutate(snapshot);
                        setSelectedId(selected.id);
                      },
                    },
                  });
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <ResourcesPanel
            resources={resources}
            onAdd={(label, url, kind) =>
              addResource.mutate({ activityId: selected.id, label, url, kind })
            }
            onUpdate={(id, label, url, kind) =>
              updateResource.mutate({ id, patch: { label, url, kind } })
            }
            onDelete={(id) => deleteResource.mutate(id)}
          />

          <DeadlinesPanel
            deadlines={deadlines}
            onAdd={(title, date, kind) =>
              addDeadline.mutate({ activityId: selected.id, title, date, kind })
            }
            onDelete={(id) => deleteDeadline.mutate(id)}
          />
        </div>
      ) : (
        <div className="panel flex items-center justify-center p-10 text-sm text-muted-foreground">
          Creá tu primera actividad para empezar.
        </div>
      )}
    </div>
  );
}

function ResourcesPanel({
  resources,
  onAdd,
  onUpdate,
  onDelete,
}: {
  resources: { id: string; label: string; url: string; kind: ResourceKind }[];
  onAdd: (label: string, url: string, kind: ResourceKind) => void;
  onUpdate: (id: string, label: string, url: string, kind: ResourceKind) => void;
  onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<ResourceKind>("link");
  const [editingId, setEditingId] = useState<string | null>(null);

  const startEdit = (r: { id: string; label: string; url: string; kind: ResourceKind }) => {
    setEditingId(r.id);
    setLabel(r.label);
    setUrl(r.url);
    setKind(r.kind);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setLabel("");
    setUrl("");
    setKind("link");
  };

  const save = () => {
    if (!label.trim() || !url.trim()) return;
    if (editingId) onUpdate(editingId, label.trim(), url.trim(), kind);
    else onAdd(label.trim(), url.trim(), kind);
    setEditingId(null);
    setLabel("");
    setUrl("");
    setKind("link");
  };

  return (
    <div className="panel p-4">
      <h2 className="mb-3 text-sm font-medium">Recursos rápidos</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {resources.map((r) => {
          const Icon = RESOURCE_ICON[r.kind];
          return (
            <div key={r.id} className="group relative">
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-20 flex-col justify-between rounded-xl border border-border bg-surface-2 p-3 transition-colors duration-150 hover:border-ring/50 hover:bg-accent"
              >
                <Icon className="size-4 text-muted-foreground" />
                <span className="truncate text-sm">{r.label}</span>
              </a>
              <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Editar recurso"
                  onClick={() => startEdit(r)}
                  className="rounded-md bg-background/80 p-1"
                >
                  <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
                </button>
                <button
                  type="button"
                  aria-label="Eliminar recurso"
                  data-sfx="cancel"
                  onClick={() => onDelete(r.id)}
                  className="rounded-md bg-background/80 p-1"
                >
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
        {resources.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">
            Sin recursos todavía. Añadí el PDF, el campus o el repo que usás siempre.
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nombre"
          className="h-9 w-40"
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="h-9 w-56"
        />
        <Select value={kind} onValueChange={(v) => setKind(v as ResourceKind)}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_KINDS.map((k) => (
              <SelectItem key={k} value={k} className="capitalize">
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-9"
          disabled={!label.trim() || !url.trim()}
          data-sfx="confirm"
          onClick={save}
        >
          {editingId ? "Guardar" : "Añadir recurso"}
        </Button>
        {editingId ? (
          <Button size="sm" variant="ghost" className="h-9" data-sfx="cancel" onClick={cancelEdit}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DeadlinesPanel({
  deadlines,
  onAdd,
  onDelete,
}: {
  deadlines: { id: string; title: string; date: string; kind: DeadlineKind }[];
  onAdd: (title: string, date: string, kind: DeadlineKind) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [kind, setKind] = useState<DeadlineKind>("tp");

  return (
    <div className="panel p-4">
      <h2 className="mb-3 text-sm font-medium">Entregas y exámenes</h2>
      <ul className="divide-y divide-border/70">
        {deadlines.map((d) => {
          const days = daysUntil(d.date);
          return (
            <li key={d.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                {DEADLINE_LABEL[d.kind]}
              </span>
              <span className="flex-1 truncate">{d.title}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {format(parseISO(d.date), "d MMM yyyy", { locale: es })}
              </span>
              <span className={cn("w-20 text-right font-mono text-xs", urgencyClass(days))}>
                {days < 0 ? "pasada" : days === 0 ? "hoy" : `${days} días`}
              </span>
              <button
                type="button"
                aria-label="Eliminar"
                data-sfx="cancel"
                onClick={() => onDelete(d.id)}
              >
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </li>
          );
        })}
        {deadlines.length === 0 ? (
          <li className="py-2 text-sm text-muted-foreground">Sin fechas cargadas.</li>
        ) : null}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="h-9 w-48"
        />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 w-40"
        />
        <Select value={kind} onValueChange={(v) => setKind(v as DeadlineKind)}>
          <SelectTrigger className="h-9 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(DEADLINE_LABEL) as DeadlineKind[]).map((k) => (
              <SelectItem key={k} value={k}>
                {DEADLINE_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-9"
          disabled={!title.trim()}
          data-sfx="confirm"
          onClick={() => {
            onAdd(title.trim(), date, kind);
            setTitle("");
          }}
        >
          Añadir fecha
        </Button>
      </div>
    </div>
  );
}
