import { cn } from "@/lib/utils";

const STEPS = ["Upload", "Preview", "Extracting", "Results"] as const;

export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const state =
          stepNum < current ? "done" : stepNum === current ? "active" : "todo";
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium transition-colors",
                  state === "done" && "bg-accent text-white",
                  state === "active" &&
                    "bg-accent-soft text-accent-ink ring-1 ring-inset ring-accent-line",
                  state === "todo" && "bg-paper text-ink-faint border border-border"
                )}
              >
                {stepNum}
              </span>
              <span
                className={cn(
                  "hidden sm:inline text-sm font-medium",
                  state === "todo" ? "text-ink-faint" : "text-ink"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-4 sm:w-8",
                  state === "done" ? "bg-accent" : "bg-border-strong"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
