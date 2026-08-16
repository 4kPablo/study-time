import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

/** Shows an install button when the browser supports installing (Chromium), or
 *  a short iOS hint (Safari has no `beforeinstallprompt`). Hidden once installed. */
export function InstallButton() {
  const { canInstall, ios, installed, prompt } = useInstallPrompt();
  const [iosOpen, setIosOpen] = useState(false);

  if (installed) return null;

  if (canInstall) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Instalar app"
        data-sfx="none"
        onClick={() => void prompt()}
      >
        <Download className="size-4" />
      </Button>
    );
  }

  if (ios) {
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
