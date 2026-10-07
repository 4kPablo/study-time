export type CategoryId = "estudio" | "desarrollo" | "entrenamiento" | "personal";

export interface Category {
  id: CategoryId;
  name: string;
  /** Tailwind token suffix, e.g. `cat-estudio` */
  token: string;
}

export type ResourceKind = "pdf" | "youtube" | "campus" | "github" | "drive" | "apuntes" | "link";

export interface Resource {
  id: string;
  activityId: string;
  label: string;
  url: string;
  kind: ResourceKind;
}

export type DeadlineKind = "tp" | "parcial" | "final" | "recuperatorio";

export interface Deadline {
  id: string;
  activityId: string;
  kind: DeadlineKind;
  title: string;
  /** yyyy-MM-dd */
  date: string;
}

export interface Activity {
  id: string;
  categoryId: CategoryId;
  name: string;
  favorite: boolean;
  /** When false, sessions in this activity don't count toward the weekly goal. */
  countsTowardGoal: boolean;
  createdAt: string;
}

export type SessionMode = "autogestionada" | "grupo" | "rescate" | "repaso";
export type SessionOutcome = "excelente" | "bien" | "regular" | "disperso";

export interface Session {
  id: string;
  activityId: string;
  categoryId: CategoryId;
  /** yyyy-MM-dd */
  date: string;
  /** ISO timestamps */
  startedAt: string;
  endedAt: string;
  durationMin: number;
  mode: SessionMode;
  energy: number; // 1..5
  outcome: SessionOutcome | null;
  distractions: number;
  notes: string;
  nextStep: string;
}

export interface Settings {
  weeklyGoalMin: number;
}

export interface StudyData {
  activities: Activity[];
  sessions: Session[];
  resources: Resource[];
  /** Resources not tied to any activity (ambient sounds, calendars, todo lists…). */
  generalResources: Resource[];
  deadlines: Deadline[];
  settings: Settings;
}

export const CATEGORIES: Category[] = [
  { id: "estudio", name: "Estudio", token: "cat-estudio" },
  { id: "desarrollo", name: "Desarrollo", token: "cat-desarrollo" },
  { id: "entrenamiento", name: "Entrenamiento", token: "cat-entrenamiento" },
  { id: "personal", name: "Personal", token: "cat-personal" },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

export const MODES: SessionMode[] = ["autogestionada", "grupo", "rescate", "repaso"];
export const OUTCOMES: SessionOutcome[] = ["excelente", "bien", "regular", "disperso"];

export const MODE_LABEL: Record<SessionMode, string> = {
  autogestionada: "Autogestionada",
  grupo: "Grupo",
  rescate: "Rescate",
  repaso: "Repaso ligero",
};

export const ENERGY_LABEL: Record<number, string> = {
  1: "Casi dormido/a",
  2: "Cansado/a",
  3: "Normal",
  4: "Bien despierto/a",
  5: "Muy despejado/a y activo/a",
};

export const DEADLINE_LABEL: Record<DeadlineKind, string> = {
  tp: "TP",
  parcial: "Parcial",
  final: "Final",
  recuperatorio: "Recuperatorio",
};

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  pdf: "PDF",
  youtube: "YouTube",
  campus: "Campus virtual",
  github: "GitHub",
  drive: "Drive",
  apuntes: "Apuntes",
  link: "Link",
};
