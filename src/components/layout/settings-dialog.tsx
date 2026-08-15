import { useRef } from "react";
import { Download, Github, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useImportData, useStudyData } from "@/features/core/queries";
import type { StudyData } from "@/features/core/types";

interface Backup {
  app?: string;
  version?: number;
  exportedAt?: string;
  data?: StudyData;
}

function unwrapBackup(value: unknown): StudyData | null {
  if (!value || typeof value !== "object") return null;
  const backup = value as Backup;
  const data = backup.data ?? value;
  if (!data || typeof data !== "object") return null;
  const { activities, sessions, resources, deadlines, settings } = data as StudyData;
  if (!Array.isArray(activities) || !Array.isArray(sessions)) return null;
  if (!Array.isArray(resources) || !Array.isArray(deadlines)) return null;
  if (!settings || typeof settings !== "object") return null;
  return { activities, sessions, resources, deadlines, settings } as StudyData;
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data } = useStudyData();
  const importData = useImportData();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    if (!data) return;
    const backup = {
      app: "study-time",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-time-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Datos exportados");
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const next = unwrapBackup(parsed);
      if (!next) throw new Error("invalid");
      importData.mutate(next);
      toast.success("Datos importados correctamente");
      onOpenChange(false);
    } catch {
      toast.error("El archivo no parece un respaldo de Study Time");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustes</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full justify-start gap-2"
            disabled={!data}
            data-sfx="confirm"
            onClick={exportData}
          >
            <Download className="size-4" />
            Exportar datos
          </Button>
          <Button
            variant="secondary"
            className="w-full justify-start gap-2"
            data-sfx="confirm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            Importar datos
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />

        <div className="border-t border-border pt-4 text-xs text-muted-foreground">
          Desarrollado por{" "}
          <a
            href="https://github.com/4kPablo"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            <Github className="mr-1 inline-block size-3.5 -translate-y-px align-middle" />
            Pablo Estigarribia
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
