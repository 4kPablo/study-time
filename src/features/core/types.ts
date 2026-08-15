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

export type DeadlineKind = "tp" | "parcial" | "final";

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
  createdAt: string;
}

export type SessionMode = "solo" | "grupo" | "clase" | "online";
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

export const MODES: SessionMode[] = ["solo", "grupo", "clase", "online"];
export const OUTCOMES: SessionOutcome[] = ["excelente", "bien", "regular", "disperso"];
export const DEADLINE_LABEL: Record<DeadlineKind, string> = {
  tp: "TP",
  parcial: "Parcial",
  final: "Final",
};
