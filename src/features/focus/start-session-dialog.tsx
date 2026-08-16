import { useMemo, useState } from "react";
import { Play, Star } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { CATEGORY_DOT } from "@/features/core/category-styles";
import { CATEGORIES, type Activity } from "@/features/core/types";
import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  onSelect: (activityId: string) => void;
}

export function StartSessionDialog({ open, onOpenChange, activities, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const grouped = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        category: c,
        items: activities.filter((a) => a.categoryId === c.id),
      })).filter((g) => g.items.length > 0),
    [activities],
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      className="overflow-hidden p-0 sm:max-w-lg"
    >
      <DialogHeader className="sr-only">
        <DialogTitle>Comenzar sesión</DialogTitle>
      </DialogHeader>
      <Command className="bg-popover">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="¿Qué vas a hacer ahora?"
        />
        <CommandList className="max-h-80">
          <CommandEmpty>
            {activities.length === 0
              ? "Todavía no creaste actividades. Andá a Actividades para crear la primera."
              : "No hay actividades con ese nombre."}
          </CommandEmpty>
          {grouped.map(({ category, items }) => (
            <CommandGroup key={category.id} heading={category.name}>
              {items.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.name} ${category.name}`}
                  onSelect={() => {
                    sfx.confirm();
                    onSelect(a.id);
                  }}
                  className="gap-2"
                >
                  <span className={cn("size-2 rounded-full", CATEGORY_DOT[a.categoryId])} />
                  <span className="flex-1">{a.name}</span>
                  {a.favorite ? (
                    <Star className="size-3.5 text-muted-foreground" strokeWidth={2} />
                  ) : null}
                  <Play className="size-3.5 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </ResponsiveDialog>
  );
}
