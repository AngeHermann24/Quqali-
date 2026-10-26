import { cn } from "@/lib/site";

/** Logo usager : image officielle « V+ » (public/V+.png). */
export function LogoApp({ className, imgClassName }: { className?: string; imgClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/V+.png" alt="Qualité+" className={cn("h-9 w-auto", imgClassName)} />
    </span>
  );
}
