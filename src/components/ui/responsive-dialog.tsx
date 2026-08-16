"use client";

import type { ReactNode } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  preventAutoFocus?: boolean;
  children: ReactNode;
}

/** Centered dialog on sm+, bottom sheet on mobile. */
export function ResponsiveDialog({
  open,
  onOpenChange,
  className,
  preventAutoFocus = false,
  children,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const handleOpenAutoFocus = (e: Event) => {
    if (preventAutoFocus) e.preventDefault();
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={className} onOpenAutoFocus={handleOpenAutoFocus}>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn("flex max-h-[90dvh] flex-col overflow-y-auto rounded-t-xl", className)}
        onOpenAutoFocus={handleOpenAutoFocus}
      >
        <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden="true" />
        {children}
      </SheetContent>
    </Sheet>
  );
}
