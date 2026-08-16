import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { formatMinutes } from "@/features/core/stats";
import { MODES, OUTCOMES, type SessionMode, type SessionOutcome } from "@/features/core/types";

const schema = z.object({
  durationMin: z.coerce.number().min(1).max(1440),
  mode: z.enum(["solo", "grupo", "clase", "online"]),
  energy: z.coerce.number().min(1).max(5),
  outcome: z.enum(["excelente", "bien", "regular", "disperso"]),
  distractions: z.coerce.number().min(0).max(99),
  notes: z.string().max(2000),
  nextStep: z.string().max(500),
});

export type WrapUpValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  activityName: string;
  durationMin: number;
  onCancel: () => void;
  onSave: (values: WrapUpValues) => void;
}

export function WrapUpDialog({ open, activityName, durationMin, onCancel, onSave }: Props) {
  const form = useForm<WrapUpValues>({
    resolver: zodResolver(schema),
    values: {
      durationMin,
      mode: "solo" as SessionMode,
      energy: 3,
      outcome: "bien" as SessionOutcome,
      distractions: 0,
      notes: "",
      nextStep: "",
    },
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => (o ? null : onCancel())}
      className="sm:max-w-md"
    >
      <DialogHeader>
        <DialogTitle>Sesión guardada de {activityName}</DialogTitle>
        <DialogDescription>
          {formatMinutes(durationMin)} registrados. Sumá contexto si querés, o guardá y seguí.
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSave)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) form.handleSubmit(onSave)();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="durationMin">Duración (min)</Label>
            <Input id="durationMin" type="number" {...form.register("durationMin")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distractions">Distracciones</Label>
            <Input id="distractions" type="number" {...form.register("distractions")} />
          </div>
          <div className="space-y-1.5">
            <Label>Modalidad</Label>
            <Select
              value={form.watch("mode")}
              onValueChange={(v) => form.setValue("mode", v as SessionMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Resultado</Label>
            <Select
              value={form.watch("outcome")}
              onValueChange={(v) => form.setValue("outcome", v as SessionOutcome)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o} className="capitalize">
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Energía inicial: {form.watch("energy")}/5</Label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                type="button"
                variant={form.watch("energy") === n ? "default" : "secondary"}
                size="sm"
                className="flex-1"
                onClick={() => form.setValue("energy", n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" rows={2} {...form.register("notes")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nextStep">Próximo paso</Label>
          <Input
            id="nextStep"
            placeholder="¿Por dónde seguís mañana?"
            {...form.register("nextStep")}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="ghost" data-sfx="cancel" onClick={onCancel}>
            Descartar
          </Button>
          <Button type="submit" data-sfx="none">
            Guardar sesión
          </Button>
        </DialogFooter>
      </form>
    </ResponsiveDialog>
  );
}
