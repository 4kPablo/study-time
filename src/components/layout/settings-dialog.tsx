import { useEffect, useRef, useState } from "react";
import { CodeXml, Download, LogOut, Minus, Plus, Upload, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSfx } from "@/hooks/use-sfx";
import { useSfxStore } from "@/lib/sfx-store";
import { useImportData, useStudyData, useUpdateSettings } from "@/features/core/queries";
import { useTimerStore } from "@/features/focus/timer-store";
import { useAuth } from "@/features/auth/auth-provider";
import type { StudyData } from "@/features/core/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

function TimerSettings() {
  const mode = useTimerStore((s) => s.mode);
  const setMode = useTimerStore((s) => s.setMode);
  const workMin = useTimerStore((s) => s.workMin);
  const setWorkMin = useTimerStore((s) => s.setWorkMin);
  const restMin = useTimerStore((s) => s.restMin);
  const setRestMin = useTimerStore((s) => s.setRestMin);

  return (
    <div className="space-y-2.5">
      <Label>Cronómetro</Label>
      <div className="flex items-center gap-1 rounded-md border border-input bg-background p-1">
        {(["continuo", "pomodoro"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors duration-150",
              mode === m
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "continuo" ? "Continuo" : "Pomodoro"}
          </button>
        ))}
      </div>
      {mode === "pomodoro" ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Foco</Label>
            <Select value={String(workMin)} onValueChange={(v) => setWorkMin(Number(v))}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[25, 45, 60].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Descanso</Label>
            <Select value={String(restMin)} onValueChange={(v) => setRestMin(Number(v))}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15].map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}
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
  const { user, loading: authLoading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
      toast.error("El inicio de sesión requiere configurar Supabase.");
      return;
    }

    setSigningIn(true);
    try {
      const redirectTo = new URL("/auth/callback", window.location.origin).toString();
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google.");
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Sesión cerrada");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar sesión");
    } finally {
      setSigningOut(false);
    }
  };

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

      <TimerSettings />

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

      <div className="border-t border-border pt-4 space-y-2">
        {authLoading ? (
          <Button variant="secondary" className="w-full justify-start gap-2" disabled>
            Verificando sesión...
          </Button>
        ) : user ? (
          <Button
            variant="destructive"
            className="w-full justify-start gap-2"
            data-sfx="cancel"
            disabled={signingOut}
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full justify-start gap-2"
            data-sfx="confirm"
            disabled={signingIn}
            onClick={handleGoogleSignIn}
          >
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {signingIn ? "Conectando con Google..." : "Iniciar sesión con Google"}
          </Button>
        )}
      </div>

      <div className="border-t border-border pt-4 text-xs text-muted-foreground">
        Desarrollado por{" "}
        <a
          href="https://github.com/4kPablo"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          <CodeXml className="mr-1 inline-block size-3.5 -translate-y-px align-middle" />
          Pablo Estigarribia
        </a>
      </div>
    </ResponsiveDialog>
  );
}
