import type { CategoryId } from "@/features/core/types";

export const CATEGORY_TEXT: Record<CategoryId, string> = {
  estudio: "text-cat-estudio",
  desarrollo: "text-cat-desarrollo",
  entrenamiento: "text-cat-entrenamiento",
  personal: "text-cat-personal",
};

export const CATEGORY_DOT: Record<CategoryId, string> = {
  estudio: "bg-cat-estudio",
  desarrollo: "bg-cat-desarrollo",
  entrenamiento: "bg-cat-entrenamiento",
  personal: "bg-cat-personal",
};

export const CATEGORY_SOFT: Record<CategoryId, string> = {
  estudio: "bg-cat-estudio/10 text-cat-estudio border-cat-estudio/25",
  desarrollo: "bg-cat-desarrollo/10 text-cat-desarrollo border-cat-desarrollo/25",
  entrenamiento: "bg-cat-entrenamiento/10 text-cat-entrenamiento border-cat-entrenamiento/25",
  personal: "bg-cat-personal/10 text-cat-personal border-cat-personal/25",
};

export const CATEGORY_HEX: Record<CategoryId, string> = {
  estudio: "var(--cat-estudio)",
  desarrollo: "var(--cat-desarrollo)",
  entrenamiento: "var(--cat-entrenamiento)",
  personal: "var(--cat-personal)",
};

export const LEVEL_BG = ["bg-grid-0", "bg-grid-1", "bg-grid-2", "bg-grid-3", "bg-grid-4"] as const;
