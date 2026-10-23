"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { formatScore } from "@/lib/format";

export interface MapPoint {
  slug: string;
  nom: string;
  coords: [number, number];
  score: number;
  sousTitre: string;
  secteur?: string;
}

export interface MapViewProps {
  points: MapPoint[];
  activeSlug?: string | null;
  onSelect?: (slug: string) => void;
  interactive?: boolean;
}

function pinIcon(score: number, active: boolean) {
  const label = formatScore(score);
  const width = label.length * 8 + 22;
  return L.divIcon({
    className: "",
    html: `<div class="map-pin${active ? " is-active" : ""}" style="width:${width}px">${label}</div>`,
    iconSize: [width, 28],
    iconAnchor: [width / 2, 28],
    popupAnchor: [0, -28],
  });
}

function popupContent(p: MapPoint, navigate: (href: string) => void) {
  const div = document.createElement("div");
  div.className = "min-w-40";
  const nom = document.createElement("p");
  nom.className = "font-semibold text-ink";
  nom.textContent = p.nom;
  const sousTitre = document.createElement("p");
  sousTitre.className = "text-xs text-muted";
  sousTitre.textContent = p.sousTitre;
  const lien = document.createElement("a");
  const href = `/etablissements/${p.slug}`;
  lien.href = href;
  lien.className = "mt-1 inline-block text-xs font-semibold text-primary";
  lien.textContent = "Voir la fiche →";
  lien.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(href);
  });
  div.append(nom, sousTitre, lien);
  return div;
}

export default function MapView({ points, activeSlug, onSelect, interactive = true }: MapViewProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, { marker: L.Marker; score: number }>());
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const map = L.map(container, { center: [5.33, -4.02], zoom: 12, scrollWheelZoom: interactive, dragging: interactive });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    const markers = markersRef.current;
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markers.clear();
    };
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    for (const p of points) {
      const marker = L.marker(p.coords, { icon: pinIcon(p.score, false) })
        .on("click", () => onSelectRef.current?.(p.slug))
        .bindPopup(popupContent(p, (href) => router.push(href)))
        .addTo(layer);
      markersRef.current.set(p.slug, { marker, score: p.score });
    }
    if (points.length) map.fitBounds(L.latLngBounds(points.map((p) => p.coords)), { padding: [48, 48], maxZoom: 15 });
  }, [points, router, interactive]);

  useEffect(() => {
    markersRef.current.forEach(({ marker, score }, slug) => {
      marker.setIcon(pinIcon(score, slug === activeSlug));
      marker.setZIndexOffset(slug === activeSlug ? 1000 : 0);
    });
  }, [activeSlug, points, interactive]);

  return <div ref={containerRef} className="size-full" />;
}
