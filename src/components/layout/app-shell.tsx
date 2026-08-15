import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Keyboard, Settings, Timer, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSfx } from "@/hooks/use-sfx";
import { useSfxStore } from "@/lib/sfx-store";
import { useUiStore } from "@/features/focus/ui-store";
import { InstallButton } from "./install-button";
import { SettingsDialog } from "./settings-dialog";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/sesiones", label: "Sesiones" },
  { to: "/actividades", label: "Actividades" },
  { to: "/estadisticas", label: "Estadísticas" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const setStartOpen = useUiStore((s) => s.setStartOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const sfxEnabled = useSfxStore((s) => s.enabled);
  const setSfxEnabled = useSfxStore((s) => s.setEnabled);
  const { confirm } = useSfx();

  const toggleSound = () => {
    const next = !useSfxStore.getState().enabled;
    setSfxEnabled(next);
    if (next) confirm();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/15">
              <Timer className="size-3.5 text-primary" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Study Time</span>
          </Link>

          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-accent text-foreground" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                className="rounded-md px-3 py-1.5 text-sm transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={sfxEnabled ? "Silenciar sonidos" : "Activar sonidos"}
              data-sfx="none"
              onClick={toggleSound}
            >
              {sfxEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </Button>
            <InstallButton />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ajustes"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Atajos de teclado"
              onClick={() => setShortcutsOpen(true)}
            >
              <Keyboard className="size-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setStartOpen(true)}>
              Comenzar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6">{children}</main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
