"use client";

import { motion, useReducedMotion } from "motion/react";
import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChatMessageFrom = "user" | "other";

interface ChatMessageContextValue {
  from: ChatMessageFrom;
}

const ChatMessageContext = createContext<ChatMessageContextValue>({
  from: "other",
});

export interface ChatMessageProps {
  from: ChatMessageFrom;
  animateIn?: boolean;
  className?: string;
  children: ReactNode;
}

const POP_UP = {
  type: "spring",
  stiffness: 480,
  damping: 32,
  mass: 0.6,
} as const;

export function ChatMessage({
  from,
  animateIn = false,
  className,
  children,
}: ChatMessageProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <ChatMessageContext.Provider value={{ from }}>
      <motion.div
        data-from={from}
        initial={
          animateIn && !reduce
            ? { opacity: 0, y: 8, scale: 0.96 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduce ? { duration: 0.1 } : POP_UP}
        className={cn(
          "flex w-full items-start gap-2",
          from === "user" ? "flex-row-reverse" : "flex-row",
          className,
        )}
      >
        {children}
      </motion.div>
    </ChatMessageContext.Provider>
  );
}

export function ChatMessageAvatar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChatMessageContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { from } = useContext(ChatMessageContext);
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1",
        from === "user" ? "items-end" : "items-start",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChatMessageHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { from } = useContext(ChatMessageContext);
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-1 text-[11px] leading-none text-muted-foreground",
        from === "user" ? "justify-end" : "justify-start",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type ChatBubbleVariant = "solid" | "soft";

export function ChatBubble({
  variant = "soft",
  className,
  children,
}: {
  variant?: ChatBubbleVariant;
  className?: string;
  children: ReactNode;
}) {
  const { from } = useContext(ChatMessageContext);
  const align = from === "user" ? "items-end" : "items-start";

  return (
    <div className={cn("flex w-full flex-col", align)}>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
          variant === "solid"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
