import { useEffect, useRef, useState } from "react";

import { sfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  type?: "text" | "number" | "date" | "time";
}

/** Click to edit, Enter to save, Esc to cancel. */
export function InlineEdit({
  value,
  onSave,
  placeholder = "—",
  className,
  inputClassName,
  type = "text",
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "truncate rounded-md px-1.5 py-0.5 text-left transition-colors duration-150 hover:bg-accent",
          !value && "text-muted-foreground",
          className,
        )}
      >
        {value || placeholder}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft !== value) {
          onSave(draft);
          sfx.confirm();
        }
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          setEditing(false);
          if (draft !== value) {
            onSave(draft);
            sfx.confirm();
          }
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setDraft(value);
          setEditing(false);
        }
      }}
      className={cn(
        "w-full rounded-md border border-input bg-background px-1.5 py-0.5 text-sm outline-none focus:border-ring",
        inputClassName,
      )}
    />
  );
}
