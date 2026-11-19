import { cn } from "@/lib/site";

/** Logo usager : image officielle sans fond (public/logo-sans-fond-qplus.png). */
export function LogoApp({ className, imgClassName }: { className?: string; imgClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-sans-fond-qplus.png" alt="Qualité+" className={cn("h-12 w-auto", imgClassName)} />
    </span>
  );
}
