import { CRITERES, type Scores } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { SITE } from "@/lib/site";
import { CRITERE_ICONS } from "@/components/ui";

export function ScoreRing({ value, size = 128 }: { value: number; size?: number }) {
  const r = 52;
  const circonference = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-success-soft)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-3xl leading-none font-bold text-ink">
            {formatScore(value)}
            <span className="text-base">%</span>
          </p>
          <p className="mt-1 text-[11px] text-muted">Note globale</p>
        </div>
      </div>
    </div>
  );
}

export function ScoreBars({ scores }: { scores: Scores }) {
  return (
    <ul className="space-y-3.5">
      {CRITERES.map((c) => {
        const Icon = CRITERE_ICONS[c.key];
        const value = scores[c.key];
        return (
          <li key={c.key}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-ink">
                <Icon className="size-4 text-primary" aria-hidden />
                {c.label}
                <span className="text-xs font-normal text-muted">({c.poids} %)</span>
              </span>
              <span className="font-semibold text-success-dark">{formatScore(value)} %</span>
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-surface">
              <div className="h-full rounded-full bg-success" style={{ width: `${value}%` }} />
              <div
                className="absolute -top-0.5 h-3 w-0.5 rounded bg-primary/40"
                style={{ left: `${SITE.seuil}%` }}
                title={`Seuil d'admission : ${SITE.seuil} %`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
