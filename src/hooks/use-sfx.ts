import { useCallback } from "react";

import { sfx } from "@/lib/sfx";
import { useSfxStore } from "@/lib/sfx-store";

/** Convenience hook: sound helpers plus the persisted on/off preference. */
export function useSfx() {
  const enabled = useSfxStore((s) => s.enabled);
  const setEnabled = useSfxStore((s) => s.setEnabled);
  const toggleEnabled = useSfxStore((s) => s.toggleEnabled);

  const click = useCallback(() => sfx.click(), []);
  const toggle = useCallback(() => sfx.toggle(), []);
  const confirm = useCallback(() => sfx.confirm(), []);
  const success = useCallback(() => sfx.success(), []);
  const cancel = useCallback(() => sfx.cancel(), []);

  return { enabled, setEnabled, toggleEnabled, click, toggle, confirm, success, cancel };
}
