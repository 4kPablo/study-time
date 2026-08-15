import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SfxState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
}

/**
 * Global UI-sound preference. Ephemeral preference state (like timer-store):
 * persisted to localStorage, not part of the study data.
 */
export const useSfxStore = create<SfxState>()(
  persist(
    (set, get) => ({
      enabled: true,
      setEnabled: (enabled) => set({ enabled }),
      toggleEnabled: () => set({ enabled: !get().enabled }),
    }),
    {
      name: "study-time:sfx:v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ enabled: s.enabled }),
    },
  ),
);
