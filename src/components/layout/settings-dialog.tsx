import { useEffect, useRef, useState } from "react";
import { Download, Github, Minus, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImportData, useStudyData, useUpdateSettings } from "@/features/core/queries";
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

function WeeklyGoalField() {
  const { data } = useStudyData();
  const updateSettings = useUpdateSettings();
  const goalMin = data?.settings.weeklyGoalMin ?? 600;
  const [value, setValue] = useState(String(goalMin / 60));

  useEffect(() => {
    setValue(String(goalMin / 60));
  }, [goalMin]);

  const commit = () => {
    const hours = Math.max(0, Number(value) || 0);
    updateSettings.mutate({ weeklyGoalMin: Math.round(hours * 60) });
  };

  const bump = (delta: number) => {
    const current = Number(value) || 0;
    const next = Math.max(0, Math.round((current + delta) * 2) / 2);
    setValue(String(next));
    updateSettings.mutate({ weeklyGoalMin: Math.round(next * 60) });
  };

  return (
    <div className="space-y-2.5">
      <Label htmlFor="weekly-goal">Objetivo semanal</Label>
      <div className="flex items-center gap-2">
        <Input
          id="weekly-goal"
          type="number"
          min={0}
          step={0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="h-9 w-20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <div className="flex h-9 overflow-hidden rounded-md border border-border">
          <button
            type="button"
            aria-label="Reducir horas"
            onClick={() => bump(-0.5)}
            className="flex w-8 items-center justify-center text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Aumentar horas"
            onClick={() => bump(0.5)}
            className="flex w-8 items-center justify-center border-l border-border text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <span className="text-sm text-muted-foreground">horas por semana</span>
      </div>
    </div>
  );
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

        <WeeklyGoalField />

        <div className="space-y-2 pt-3">
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
