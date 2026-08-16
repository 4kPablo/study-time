import { get, set } from "idb-keyval";

import type { StudyData } from "./types";
import { seedData } from "./seed";

const KEY = "study-time:data:v2";

let memory: StudyData | null = null;

const isBrowser = () => typeof window !== "undefined" && typeof indexedDB !== "undefined";

async function read(): Promise<StudyData> {
  if (memory) return memory;
  if (!isBrowser()) return seedData();
  let stored: StudyData | undefined;
  try {
    stored = await get<StudyData>(KEY);
  } catch {
    stored = undefined;
  }
  if (!stored) {
    stored = seedData();
    try {
      await set(KEY, stored);
    } catch {
      /* storage unavailable: keep in memory */
    }
  }
  memory = stored;
  return stored;
}

async function write(next: StudyData): Promise<StudyData> {
  memory = next;
  if (isBrowser()) {
    try {
      await set(KEY, next);
    } catch {
      /* ignore */
    }
  }
  return next;
}

export const repository = {
  async load(): Promise<StudyData> {
    return read();
  },
  async update(mutate: (data: StudyData) => StudyData): Promise<StudyData> {
    const current = await read();
    return write(mutate(structuredClone(current)));
  },
  async reset(): Promise<StudyData> {
    return write(seedData());
  },
};

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
