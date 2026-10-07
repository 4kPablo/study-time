"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Database, Download, Upload } from "lucide-react";
import { unifiedRepository } from "@/features/core/unified-repository";
import type { StudyData } from "@/features/core/types";
import { Button } from "@/components/ui/button";

interface MigrationPromptProps {
  children: React.ReactNode;
}

export function MigrationPrompt({ children }: MigrationPromptProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [localData, setLocalData] = useState<StudyData | null>(null);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    checkMigration();
  }, []);

  const checkMigration = async () => {
    const { migrated, localData: data } = await unifiedRepository.migrateIfNeeded();
    if (data && !migrated) {
      setLocalData(data);
      setShowDialog(true);
    }
  };

  const handleMigrate = async () => {
    if (!localData) return;
    setMigrating(true);
    try {
      await unifiedRepository.performMigration(localData);
      queryClient.invalidateQueries({ queryKey: ["study-data"] });
      setShowDialog(false);
    } catch (error) {
      console.error("Migration failed:", error);
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = async () => {
    await unifiedRepository.clearMigrationFlag();
    setShowDialog(false);
  };

  const hasLocalData =
    localData &&
    (localData.activities.length > 0 ||
      localData.sessions.length > 0 ||
      localData.resources.length > 0 ||
      localData.generalResources.length > 0 ||
      localData.deadlines.length > 0);

  if (!hasLocalData) return <>{children}</>;

  return (
    <>
      {children}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <Database className="mx-auto mb-4 size-12 text-primary" />
            <AlertDialogTitle className="text-center">Migrar datos a la nube</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Detectamos datos guardados localmente en tu navegador. ¿Querés migrarlos a tu cuenta
              de Supabase para acceder desde cualquier dispositivo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground mx-auto max-w-xs">
            <div className="flex justify-between">
              <span>Actividades</span>
              <span className="font-medium">{localData?.activities.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Sesiones</span>
              <span className="font-medium">{localData?.sessions.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Recursos</span>
              <span className="font-medium">{localData?.resources.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Entregas</span>
              <span className="font-medium">{localData?.deadlines.length ?? 0}</span>
            </div>
          </div>
          <AlertDialogFooter className="flex-col gap-2">
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={handleMigrate}
              disabled={migrating}
            >
              <Upload className="size-4" />
              {migrating ? "Migrando..." : "Migrar ahora"}
            </Button>
            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={handleSkip}
              disabled={migrating}
            >
              <Download className="size-4" />
              Mantener solo local (no migrar)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
