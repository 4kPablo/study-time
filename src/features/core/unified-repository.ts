import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { get, set } from "idb-keyval";
import type { SessionMode, StudyData } from "./types";
import { seedData } from "./seed";
import { supabaseRepository } from "@/lib/supabase/repository";

const KEY = "study-time:data:v2";
const MIGRATED_KEY = "study-time:migrated:v1";

let memory: StudyData | null = null;

const isBrowser = () => typeof window !== "undefined" && typeof indexedDB !== "undefined";

const OLD_MODES: Record<string, SessionMode> = {
  solo: "autogestionada",
  grupo: "grupo",
  clase: "grupo",
  online: "autogestionada",
};

function migrate(data: StudyData): StudyData {
  if (!Array.isArray(data.generalResources)) data.generalResources = [];
  for (const a of data.activities) {
    if (typeof a.countsTowardGoal !== "boolean") a.countsTowardGoal = true;
  }
  for (const s of data.sessions) {
    const mapped = OLD_MODES[s.mode];
    if (mapped) s.mode = mapped;
  }
  return data;
}

async function readLocal(): Promise<StudyData> {
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
  } else {
    stored = migrate(stored);
  }
  memory = stored;
  return stored;
}

async function writeLocal(next: StudyData): Promise<StudyData> {
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

async function checkSupabaseAuth(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return !!session?.user;
}

async function hasMigrated(): Promise<boolean> {
  if (!isBrowser()) return true;
  try {
    return (await get<string>(MIGRATED_KEY)) === "true";
  } catch {
    return false;
  }
}

async function setMigrated(): Promise<void> {
  if (isBrowser()) {
    try {
      await set(MIGRATED_KEY, "true");
    } catch {
      /* ignore */
    }
  }
}

async function clearMigrated(): Promise<void> {
  if (isBrowser()) {
    try {
      await set(MIGRATED_KEY, "false");
    } catch {
      /* ignore */
    }
  }
}

export const unifiedRepository = {
  async load(): Promise<StudyData> {
    const useSupabase = await checkSupabaseAuth();
    if (useSupabase) {
      return supabaseRepository.load();
    }
    return readLocal();
  },

  async update(mutate: (data: StudyData) => StudyData): Promise<StudyData> {
    const useSupabase = await checkSupabaseAuth();
    if (useSupabase) {
      const current = await supabaseRepository.load();
      const next = mutate(structuredClone(current));
      return supabaseRepository.importData(next);
    }
    const current = await readLocal();
    return writeLocal(mutate(structuredClone(current)));
  },

  async reset(): Promise<StudyData> {
    const useSupabase = await checkSupabaseAuth();
    if (useSupabase) {
      const seed = seedData();
      await supabaseRepository.importData(seed);
      return seed;
    }
    return writeLocal(seedData());
  },

  async migrateIfNeeded(): Promise<{ migrated: boolean; localData: StudyData | null }> {
    const useSupabase = await checkSupabaseAuth();
    if (!useSupabase) return { migrated: false, localData: null };

    const alreadyMigrated = await hasMigrated();
    if (alreadyMigrated) return { migrated: false, localData: null };

    const localData = await readLocal();
    const hasLocalData =
      localData.activities.length > 0 ||
      localData.sessions.length > 0 ||
      localData.resources.length > 0 ||
      localData.generalResources.length > 0 ||
      localData.deadlines.length > 0;

    if (!hasLocalData) {
      await setMigrated();
      return { migrated: false, localData: null };
    }

    return { migrated: false, localData };
  },

  async performMigration(localData: StudyData): Promise<void> {
    await supabaseRepository.importData(localData);
    await setMigrated();
  },

  async clearMigrationFlag(): Promise<void> {
    await clearMigrated();
  },
};

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
