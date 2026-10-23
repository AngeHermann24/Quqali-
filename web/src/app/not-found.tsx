import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <section className="container-page flex flex-col items-center py-20 text-center">
      <SearchX className="size-12 text-muted" aria-hidden />
      <h1 className="mt-4 font-display text-2xl font-bold text-primary">Page introuvable</h1>
      <p className="mt-2 max-w-md text-muted">
        Cette page n&apos;existe pas, ou l&apos;établissement n&apos;est plus certifié.
      </p>
      <Link href="/etablissements" className="btn btn-primary mt-6">
        Voir les établissements certifiés
      </Link>
    </section>
  );
}
