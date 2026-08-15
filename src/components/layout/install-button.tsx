import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

/** Shows an install button when the browser supports installing (Chromium), or
 *  a short iOS hint (Safari has no `beforeinstallprompt`). Hidden once installed. */
export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  if (deferred) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Instalar app"
        data-sfx="none"
        onClick={() => {
          void deferred.prompt();
        }}
      >
        <Download className="size-4" />
      </Button>
    );
  }

  if (isIos()) {
    return (
      <Popover open={iosOpen} onOpenChange={setIosOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Instalar app" data-sfx="none">
            <Download className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 text-xs text-muted-foreground">
          Para instalar la app tocá <span className="text-foreground">Compartir</span> y elegí{" "}
          <span className="text-foreground">Añadir a pantalla de inicio</span>.
        </PopoverContent>
      </Popover>
    );
  }

  return null;
}
