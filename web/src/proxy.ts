import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Rafraîchit la session Supabase à chaque requête (cookies auth). */
export async function proxy(request: NextRequest) {
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
