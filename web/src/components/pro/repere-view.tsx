"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ABIDJAN: [number, number] = [5.345, -4.024];

export default function RepereView({ coords, onChange }: { coords: [number, number] | undefined; onChange: (c: [number, number]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView(coords ?? ABIDJAN, coords ? 15 : 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => onChangeRef.current([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = null;
    if (coords) {
      markerRef.current = L.marker(coords, {
        icon: L.divIcon({ className: "", html: '<div class="map-pin is-active" style="width:26px;text-align:center">●</div>', iconSize: [26, 28], iconAnchor: [13, 26] }),
      }).addTo(map);
      map.panTo(coords);
    }
  }, [coords]);

  return <div ref={ref} className="h-44 w-full" role="application" aria-label="Carte : touchez pour placer le repère de l'établissement" />;
}
