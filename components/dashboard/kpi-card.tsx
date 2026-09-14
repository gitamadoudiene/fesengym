import { cn } from "@/lib/utils";

const ACCENTS = {
  primary: "border-l-primary",
  secondary: "border-l-secondary",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-destructive",
  info: "border-l-info",
} as const;

export function KpiCard({
  label,
  value,
  accent = "primary",
  suffix,
}: {
  label: string;
  value: string | number;
  accent?: keyof typeof ACCENTS;
  suffix?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 border-border bg-card p-4",
        ACCENTS[accent],
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums text-foreground">
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}
