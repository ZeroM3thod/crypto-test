"use client";

import { ArrowUp } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface ChatInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  leadingAction?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Write a message…",
  minRows = 1,
  maxRows = 4,
  leadingAction,
  disabled = false,
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const measure = measureRef.current;
    if (!textarea || !measure) return;
    const lineHeight = 22;
    const next = Math.min(
      Math.max(measure.scrollHeight, minRows * lineHeight),
      maxRows * lineHeight,
    );
    textarea.style.height = `${next}px`;
  }, [value, minRows, maxRows]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const canSubmit = Boolean(value.trim()) && !disabled;

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative flex w-full items-end gap-2 rounded-3xl border border-border bg-muted px-3 py-2",
        disabled && "opacity-60",
        className,
      )}
    >
      {leadingAction}

      <div className="relative min-w-0 flex-1">
        <div
          ref={measureRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute inset-x-0 top-0 whitespace-pre-wrap break-words px-1 text-sm leading-[22px]"
        >
          {`${value}\u200b`}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          rows={minRows}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="block w-full resize-none overflow-y-auto bg-transparent px-1 py-1 text-sm leading-[22px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Send message"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground outline-none transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowUp className="size-4" />
      </button>
    </form>
  );
}
