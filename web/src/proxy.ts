import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { espaceDe } from "@/lib/sous-domaines";

/** Routage sous-domaines + session Supabase. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hote = request.headers.get("host") ?? "";
  const espace = espaceDe(hote);

  // Fichiers PWA/TWA : jamais réécrits vers /pro ou /admin (requis à la racine du domaine).
  if (pathname === "/manifest.webmanifest" || pathname === "/sw.js" || pathname.startsWith("/.well-known/")) {
    return NextResponse.next({ request });
  }

  // Vitrine (domaine nu) : seules la page d'accueil et les assets publics sont servis.
  if (espace === "vitrine" && pathname !== "/" && !pathname.startsWith("/_next") && !pathname.startsWith("/api") && !pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|webmanifest|js)$/)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Espace Pro sur pro.* : la racine du sous-domaine = /pro, les sous-chemins = /pro/*.
  if (espace === "pro") {
    const cible = pathname === "/" ? "/pro" : pathname.startsWith("/pro") ? pathname : `/pro${pathname}`;
    return NextResponse.rewrite(new URL(cible, request.url));
  }

  // Espace Admin sur admin.* : idem vers /admin.
  if (espace === "admin") {
    const cible = pathname === "/" ? "/admin" : pathname.startsWith("/admin") ? pathname : `/admin${pathname}`;
    return NextResponse.rewrite(new URL(cible, request.url));
  }

  let reponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) return reponse; // Supabase non configuré : mode démo local.

  const supabase = createServerClient(url, cle, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(liste) {
        for (const { name, value } of liste) request.cookies.set(name, value);
        reponse = NextResponse.next({ request });
        for (const { name, value, options } of liste) reponse.cookies.set(name, value, options);
      },
    },
  });

  await supabase.auth.getUser();
  return reponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
