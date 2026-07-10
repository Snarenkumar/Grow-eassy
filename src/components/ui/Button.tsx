import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]",
        size === "md" ? "px-5 py-2.5 text-sm" : "px-3.5 py-1.5 text-[13px]",
        variant === "primary" &&
          "bg-accent text-accent-ink shadow-[0_1px_2px_rgba(9,9,11,0.1),0_6px_16px_-6px_rgba(250,204,21,0.4)] hover:opacity-90",
        variant === "secondary" &&
          "bg-surface text-ink border border-border-strong hover:border-ink-faint hover:bg-paper",
        variant === "ghost" &&
          "text-ink-muted hover:text-ink hover:bg-paper",
        className
      )}
      {...props}
    />
  );
}
