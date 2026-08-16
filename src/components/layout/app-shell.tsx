import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Keyboard, Menu, Play, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useUiStore } from "@/features/focus/ui-store";
import { InstallButton } from "./install-button";
import { SettingsDialog } from "./settings-dialog";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/sesiones", label: "Sesiones" },
  { to: "/actividades", label: "Actividades" },
  { to: "/estadisticas", label: "Estadísticas" },
] as const;

function InstallMenuItem({ onPrompt }: { onPrompt: () => void }) {
  const { canInstall, ios, installed, prompt } = useInstallPrompt();
  const [showHint, setShowHint] = useState(false);

  if (installed) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        className="w-full justify-start gap-2"
        data-sfx="none"
        onClick={() => {
          if (canInstall) {
            onPrompt();
            void prompt();
          } else {
            setShowHint((v) => !v);
          }
        }}
      >
        <Download className="size-4" />
        Instalar app
      </Button>
      {ios && showHint && (
        <p className="px-3 text-xs leading-relaxed text-muted-foreground">
          Para instalar la app tocá <span className="text-foreground">Compartir</span> y elegí{" "}
          <span className="text-foreground">Añadir a pantalla de inicio</span>.
        </p>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const setStartOpen = useUiStore((s) => s.setStartOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img
              src="/logo.png"
              alt="Study Time"
              className="size-6 rounded-md object-contain"
              width={24}
              height={24}
            />
            <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
              Study Time
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex">
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

          <div className="hidden items-center gap-2 lg:flex">
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

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menú"
                className="ml-auto lg:hidden"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-72 flex-col p-0">
              <SheetHeader className="h-12 flex-row items-center border-b border-border/80 px-4 text-left">
                <SheetTitle className="text-base">Menú</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 pt-3">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    activeOptions={{ exact: item.to === "/" }}
                    activeProps={{ className: "bg-accent text-foreground" }}
                    inactiveProps={{
                      className: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    }}
                    className="rounded-md px-3 py-2 text-sm transition-colors duration-150"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-1 border-t border-border/80 px-2 py-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setStartOpen(true);
                    closeMenu();
                  }}
                >
                  <Play className="size-4" />
                  Comenzar sesión
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setSettingsOpen(true);
                    closeMenu();
                  }}
                >
                  <Settings className="size-4" />
                  Ajustes
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShortcutsOpen(true);
                    closeMenu();
                  }}
                >
                  <Keyboard className="size-4" />
                  Atajos de teclado
                </Button>
                <InstallMenuItem onPrompt={closeMenu} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6">{children}</main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
