import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/site";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl",
          light ? "bg-white text-primary" : "bg-primary text-white",
        )}
      >
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <span className={cn("font-display text-lg font-bold tracking-tight", light ? "text-white" : "text-primary")}>
        Quali<span className="text-success">CI</span>
      </span>
    </span>
  );
}
