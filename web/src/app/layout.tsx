import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { NavBas } from "@/components/app/nav-bas";
import { CadreApp } from "@/components/app/cadre-app";
import { FournisseurCatalogue } from "@/components/catalogue";
import { FournisseurSession } from "@/components/session";
import { espaceDe } from "@/lib/sous-domaines";
import { SITE } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = { themeColor: "#1E3A8A" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Domaine nu → vitrine plein écran (sans header/nav/cadre applicatif).
  const vitrine = espaceDe((await headers()).get("host")) === "vitrine";
  if (vitrine)
    return (
      <html lang="fr" data-scroll-behavior="smooth" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
        <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
          {children}
        </body>
      </html>
    );

  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        <SiteHeader />
        <main className="flex-1 pb-20 lg:pb-0">
          <FournisseurSession>
            <FournisseurCatalogue>
              <CadreApp>{children}</CadreApp>
            </FournisseurCatalogue>
          </FournisseurSession>
        </main>
        <NavBas />
      </body>
    </html>
  );
}
