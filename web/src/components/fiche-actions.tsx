"use client";

import { useState } from "react";
import { CalendarCheck, MessageCircle, Navigation, Phone, Rotate3d } from "lucide-react";
import { type Etablissement, SECTEURS } from "@/lib/data";
import { itineraire } from "@/lib/format";
import { cn } from "@/lib/site";
import { Modal } from "@/components/modal";
import { WidgetReservation } from "@/components/reservation/widget-reservation";

type Props = Pick<Etablissement, "slug" | "nom" | "secteur" | "pack" | "telephone" | "whatsapp" | "coords" | "visite3d">;

export function FicheActions({ slug, nom, secteur, pack, telephone, whatsapp, coords, visite3d }: Props) {
  const [reserver, setReserver] = useState(false);
  const premium = pack === "premium";
  const tel = `tel:${telephone.replace(/\s/g, "")}`;
  const wa = `https://wa.me/${whatsapp}`;

  const contacts = [
    { href: tel, label: "Appeler", Icon: Phone },
    { href: wa, label: "WhatsApp", Icon: MessageCircle, external: true },
    { href: itineraire(coords), label: "Itinéraire", Icon: Navigation, external: true },
  ];

  return (
    <>
      <div className="space-y-3">
        {premium && (
          <div className={cn("grid gap-3", visite3d ? "grid-cols-2" : "grid-cols-1")}>
            {visite3d && (
              <a href="#visite-3d" className="btn btn-outline py-3">
                <Rotate3d className="size-5" aria-hidden /> Visite 3D
              </a>
            )}
            <button type="button" onClick={() => setReserver(true)} className="btn btn-success py-3">
              <CalendarCheck className="size-5" aria-hidden /> Réserver
            </button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {contacts.map(({ href, label, Icon, external }, i) => (
            <a
              key={label}
              href={href}
              {...(external && { target: "_blank", rel: "noopener noreferrer" })}
              className={cn("btn flex-col gap-1 px-2 py-2.5 text-xs", !premium && i === 0 ? "btn-primary" : "btn-outline")}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <a href={tel} aria-label="Appeler" className="btn btn-outline size-12 shrink-0 p-0">
            <Phone className="size-5" />
          </a>
          <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="btn btn-outline size-12 shrink-0 p-0">
            <MessageCircle className="size-5" />
          </a>
          {premium ? (
            <>
              {visite3d && (
                <a href="#visite-3d" aria-label="Visite 3D" className="btn btn-outline size-12 shrink-0 p-0">
                  <Rotate3d className="size-5" />
                </a>
              )}
              <button type="button" onClick={() => setReserver(true)} className="btn btn-success h-12 flex-1 text-base">
                <CalendarCheck className="size-5" aria-hidden /> Réserver
              </button>
            </>
          ) : (
            <a href={itineraire(coords)} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-12 flex-1 text-base">
              <Navigation className="size-5" aria-hidden /> Itinéraire
            </a>
          )}
        </div>
      </div>

      {premium && (
        <Modal open={reserver} onClose={() => setReserver(false)} title={`${SECTEURS[secteur].reservation} — ${nom}`}>
          <WidgetReservation etablissementId={slug} nom={nom} secteur={secteur} onFermer={() => setReserver(false)} />
        </Modal>
      )}
    </>
  );
}

