import { useEffect, useRef, useState } from "react";
import { Download, Github, Minus, Plus, Upload, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Switch } from "@/components/ui/switch";
import { useSfx } from "@/hooks/use-sfx";
import { useSfxStore } from "@/lib/sfx-store";
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

function SoundToggle() {
  const enabled = useSfxStore((s) => s.enabled);
  const setEnabled = useSfxStore((s) => s.setEnabled);
  const { confirm } = useSfx();

  const toggle = (next: boolean) => {
    setEnabled(next);
    if (next) confirm();
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {enabled ? (
          <Volume2 className="size-4 text-muted-foreground" />
        ) : (
          <VolumeX className="size-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">Sonidos de interfaz</span>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        aria-label="Sonidos de interfaz"
        data-sfx="none"
      />
    </div>
  );
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
    const hours = Math.max(0, Math.round(Number(value) || 0));
    setValue(String(hours));
    updateSettings.mutate({ weeklyGoalMin: hours * 60 });
  };

  const bump = (delta: number) => {
    const current = Math.round(Number(value) || 0);
    const next = Math.max(0, current + delta);
    setValue(String(next));
    updateSettings.mutate({ weeklyGoalMin: next * 60 });
  };

  return (
    <div className="space-y-2.5">
      <Label htmlFor="weekly-goal">Objetivo semanal</Label>
      <div className="flex items-center gap-2">
        <div className="flex h-9 overflow-hidden rounded-md border border-input shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring">
          <Input
            id="weekly-goal"
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commit();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-16 rounded-none border-0 bg-transparent px-0 text-center shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="Reducir horas"
            onClick={() => bump(-1)}
            className="flex w-8 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Aumentar horas"
            onClick={() => bump(1)}
            className="flex w-8 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      preventAutoFocus
      className="sm:max-w-sm"
    >
      <DialogHeader>
        <DialogTitle>Ajustes</DialogTitle>
      </DialogHeader>

      <WeeklyGoalField />

      <SoundToggle />

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
    </ResponsiveDialog>
  );
}
