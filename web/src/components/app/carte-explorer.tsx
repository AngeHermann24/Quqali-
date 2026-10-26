"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import type { Secteur } from "@/lib/data";
import { SECTEUR_COULEURS } from "@/components/app/ui-app";

export interface PointExplorer {
  slug: string;
  nom: string;
  coords: [number, number];
  secteur: Secteur;
}

interface Props {
  points: PointExplorer[];
  activeSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  onPosition?: (c: [number, number]) => void;
  onErreur?: () => void;
}

const ABIDJAN: [number, number] = [5.345, -4.005];
const ZOOM_DEFAUT = 12;
const ZOOM_PINS = 13; // en dessous, les marqueurs proches se regroupent en pastilles

/* Chemins Lucide 24×24 (stroke) par secteur — mêmes icônes que l'app. */
const ICONES: Record<Secteur, string> = {
  restauration:
    '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>',
  hotellerie:
    '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  sante:
    '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
  services:
    '<path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  education:
    '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  commerce:
    '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
  transport:
    '<path d="M4 6 2 7"/><path d="M10 6h4"/><path d="m22 7-2-1"/><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 21v-2"/>',
};

const GOUTTE = "M17 1C8.7 1 2 7.7 2 16c0 11 15 25 15 25s15-14 15-25C32 7.7 25.3 1 17 1z";

const reduit = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function iconePin(p: PointExplorer, actif: boolean, delai: number) {
  const c = SECTEUR_COULEURS[p.secteur] ?? "#1E3A8A";
  const delaiCss = reduit() || actif ? "0ms" : `${Math.min(delai, 600)}ms`;
  return L.divIcon({
    className: "pin-explorer",
    html: `<svg viewBox="0 0 34 42" class="pin-svg${actif ? " on" : ""}" role="button" aria-label="${p.nom.replaceAll('"', "'")}" style="animation-delay:${delaiCss}">
      <path d="${GOUTTE}" fill="${c}" stroke="#fff" stroke-width="2.4"/>
      <g transform="translate(8.7 8) scale(0.72)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${ICONES[p.secteur]}</g>
    </svg>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
  });
}

function iconeCluster(n: number, c: string) {
  return L.divIcon({
    className: "pin-explorer",
    html: `<span class="cluster-bulle" style="--c:${c}" aria-label="${n} établissements">${n}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

const iconeMoi = () =>
  L.divIcon({
    className: "pin-explorer",
    html: `<span class="me-dot" aria-label="Votre position"><i></i></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export default function CarteExplorer({ points, activeSlug, onSelect, onPosition, onErreur }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const moiRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  const onPositionRef = useRef(onPosition);
  const onErreurRef = useRef(onErreur);
  const [info, setInfo] = useState<string | null>(null);
  const [pret, setPret] = useState(false);
  const infoTimer = useRef<number | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onPositionRef.current = onPosition;
    onErreurRef.current = onErreur;
  });

  /* ---------- Création de la carte ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let ko = false;
    const map = L.map(container, {
      center: ABIDJAN,
      zoom: ZOOM_DEFAUT,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: "tuiles-douces",
    })
      .on("tileerror", () => {
        if (ko) return;
        ko = true;
        onErreurRef.current?.();
      })
      .addTo(map);
    map.on("click", () => onSelectRef.current?.(null));
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    map.whenReady(() => setPret(true));
    return () => {
      observer.disconnect();
      if (infoTimer.current) clearTimeout(infoTimer.current);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      moiRef.current = null;
    };
  }, []);

  /* ---------- Marqueurs + regroupement ---------- */
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    const rafraichir = () => {
      layer.clearLayers();
      const zoom = map.getZoom();
      if (zoom >= ZOOM_PINS) {
        points.forEach((p, i) => {
          L.marker(p.coords, { icon: iconePin(p, p.slug === activeSlug, i * 60) })
            .on("click", (ev) => {
              L.DomEvent.stopPropagation(ev);
              onSelectRef.current?.(p.slug);
              navigator.vibrate?.(10);
            })
            .addTo(layer);
        });
        return;
      }
      // Regroupement en pastilles sous le seuil de zoom
      const cellules = new Map<string, PointExplorer[]>();
      for (const p of points) {
        const pt = map.latLngToContainerPoint(p.coords);
        const cle = `${Math.floor(pt.x / 84)}-${Math.floor(pt.y / 84)}`;
        (cellules.get(cle) ?? cellules.set(cle, []).get(cle)!).push(p);
      }
      for (const groupe of cellules.values()) {
        if (groupe.length === 1) {
          const p = groupe[0];
          L.marker(p.coords, { icon: iconePin(p, p.slug === activeSlug, 0) })
            .on("click", (ev) => {
              L.DomEvent.stopPropagation(ev);
              onSelectRef.current?.(p.slug);
              navigator.vibrate?.(10);
            })
            .addTo(layer);
        } else {
          const centre: [number, number] = [
            groupe.reduce((s, p) => s + p.coords[0], 0) / groupe.length,
            groupe.reduce((s, p) => s + p.coords[1], 0) / groupe.length,
          ];
          const c = SECTEUR_COULEURS[groupe[0].secteur] ?? "#1E3A8A";
          L.marker(centre, { icon: iconeCluster(groupe.length, c) })
            .on("click", (ev) => {
              L.DomEvent.stopPropagation(ev);
              map.flyToBounds(L.latLngBounds(groupe.map((p) => p.coords)).pad(0.35), { duration: 0.5 });
            })
            .addTo(layer);
        }
      }
    };

    rafraichir();
    map.on("zoomend moveend", rafraichir);
    return () => {
      map.off("zoomend moveend", rafraichir);
    };
  }, [points, activeSlug]);

  /* ---------- Sélection : centrer doucement ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeSlug) return;
    const p = points.find((x) => x.slug === activeSlug);
    if (!p) return;
    const cible = map.project(p.coords, map.getZoom()).subtract([0, map.getSize().y * 0.18]);
    map.panTo(map.unproject(cible, map.getZoom()), { animate: !reduit() });
  }, [activeSlug, points]);

  /* ---------- Position de l'usager ---------- */
  const poserMoi = (coords: [number, number]) => {
    const layer = layerRef.current;
    if (!layer) return;
    if (moiRef.current) moiRef.current.setLatLng(coords);
    else moiRef.current = L.marker(coords, { icon: iconeMoi(), interactive: false }).addTo(layer);
  };

  const afficherInfo = (msg: string | null) => {
    setInfo(msg);
    if (infoTimer.current) clearTimeout(infoTimer.current);
    if (msg) infoTimer.current = window.setTimeout(() => setInfo(null), 4000);
  };

  const localiser = (centrer: boolean, discret = false) => {
    if (!navigator.geolocation) {
      if (!discret) afficherInfo("Position indisponible sur cet appareil — centrée sur Abidjan.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        poserMoi(c);
        onPositionRef.current?.(c);
        afficherInfo(null);
        if (centrer && mapRef.current) mapRef.current.flyTo(c, 15, { duration: reduit() ? 0 : 0.8 });
      },
      () => {
        if (!discret) afficherInfo("Position refusée — la carte reste centrée sur Abidjan.");
      },
      { timeout: 6000 },
    );
  };

  // Géolocalisation discrète au chargement (sans déplacer la carte, sans message en cas de refus).
  useEffect(() => {
    if (!pret) return;
    const t = window.setTimeout(() => localiser(false, true), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret]);

  return (
    <div className="relative size-full">
      <div ref={containerRef} className="size-full" role="application" aria-label="Carte des établissements certifiés à Abidjan" />
      <button
        type="button"
        onClick={() => localiser(true)}
        aria-label="Recentrer sur ma position"
        className="absolute right-4 bottom-[9.5rem] z-[500] grid size-11 place-items-center rounded-full bg-white text-ink shadow-flottant transition active:scale-90"
      >
        <Crosshair className="size-5" aria-hidden />
      </button>
      {info && (
        <p className="absolute right-4 bottom-[13.5rem] left-16 z-[500] rounded-2xl bg-ink/85 px-3.5 py-2 text-center text-xs font-semibold text-white shadow-flottant" role="status">
          {info}
        </p>
      )}
    </div>
  );
}
