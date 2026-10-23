import type { Metadata } from "next";
import { FavorisUsager } from "@/components/app/favoris-page";

export const metadata: Metadata = { title: "Mes favoris" };

export default function FavorisPage() {
  return <FavorisUsager />;
}
