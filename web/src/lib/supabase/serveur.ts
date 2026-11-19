import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/** Client Supabase côté serveur lié à la session de l'usager (cookies). */
export async function supabaseServeur() {
  const magasin = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return magasin.getAll();
      },
      setAll(liste) {
        try {
          for (const { name, value, options } of liste) magasin.set(name, value, options);
        } catch {
          // Appelé depuis un Server Component : ignorer (le middleware rafraîchit la session).
        }
      },
    },
  });
}

/** Client Supabase avec la clé service — réservé aux opérations admin côté serveur. Jamais exposé au navigateur. */
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
