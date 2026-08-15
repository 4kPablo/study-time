import { useEffect } from "react";

import { sfx, type SfxName } from "@/lib/sfx";
import { useSfxStore } from "@/lib/sfx-store";

const INTERACTIVE = "button, a, [role='button']";

/**
 * Delegated UI sounds. Mounted once in the root route.
 *
 * A `data-sfx` attribute overrides the generic click (e.g. `data-sfx="toggle"`);
 * `data-sfx="none"` opts an element out (used when a handler plays its own sound).
 */
export function SfxLayer() {
  useEffect(() => {
    void useSfxStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      // No sound while typing or picking through a native control.
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;

      const labelled = target.closest<HTMLElement>("[data-sfx]");
      const name = labelled?.dataset["sfx"];
      if (name) {
        if (name !== "none") sfx.play(name as SfxName);
        return;
      }

      const el = target.closest<HTMLElement>(INTERACTIVE);
      if (!el) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      sfx.click();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
