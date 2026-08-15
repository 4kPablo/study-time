import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SHORTCUTS: Array<[string, string]> = [
  ["Ctrl / ⌘ + N", "Nueva sesión"],
  ["Espacio", "Pausar o reanudar"],
  ["Enter", "Guardar"],
  ["Esc", "Cancelar o finalizar"],
  ["?", "Ver atajos"],
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Atajos de teclado</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map(([keys, label]) => (
            <li key={keys} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{label}</span>
              <kbd className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs text-foreground">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
