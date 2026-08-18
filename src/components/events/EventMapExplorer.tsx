"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Navigation,
  Plus,
  Minus,
  RotateCcw,
  Ticket,
  ChevronRight,
  X,
  Compass,
} from "lucide-react";

interface TicketTier {
  id: string;
  name: string;
  price: string | number;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  city?: string;
  venue_name?: string;
  start_date: string;
  cover_image_url?: string;
  logo_url?: string;
  event_type?: string;
  saas_ticket_tiers?: TicketTier[];
  latitude?: number;
  longitude?: number;
}

interface EventMapExplorerProps {
  events: EventItem[];
  title?: string;
  subtitle?: string;
}

// Default City Coordinates in Karnataka / India
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mangaluru: { lat: 12.9141, lng: 74.8560 },
  mangalore: { lat: 12.9141, lng: 74.8560 },
  hubballi: { lat: 15.3647, lng: 75.1240 },
  hubli: { lat: 15.3647, lng: 75.1240 },
  belagavi: { lat: 15.8497, lng: 74.4977 },
  tumakuru: { lat: 13.3409, lng: 77.1006 },
  shivamogga: { lat: 13.9299, lng: 75.5681 },
  davangere: { lat: 14.4644, lng: 75.9218 },
  ballari: { lat: 15.1394, lng: 76.9214 },
};

function getMinPrice(tiers?: TicketTier[]): string {
  if (!tiers || tiers.length === 0) return "Free";
  const prices = tiers.map((t) => parseFloat(String(t.price)) || 0);
  const min = Math.min(...prices);
  return min === 0 ? "Free" : `₹${min.toFixed(2)}`;
}

export function EventMapExplorer({
  events,
  title = "Interactive Event Map & Venue Discovery",
  subtitle = "Explore verified Rotaract events across Karnataka and District 3192 on the interactive map.",
}: EventMapExplorerProps) {
  // Fix X button: Start with null so card is closed unless user selects an event or explicitly clicks
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCityFilter, setActiveCityFilter] = useState<string>("ALL");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  // Fix X button logic: ONLY return event if selectedEventId is truthy
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Filter events by active city tab
  const filteredEvents = useMemo(() => {
    if (activeCityFilter === "ALL") return events;
    return events.filter((e) => e.city?.toLowerCase().includes(activeCityFilter.toLowerCase()));
  }, [events, activeCityFilter]);

  // Unique cities list
  const cities = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.city) set.add(e.city.trim());
    });
    return Array.from(set);
  }, [events]);

  // ── LOAD LEAFLET MAP & TILE LAYER ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Inject Leaflet CSS dynamically if not present
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Prevent duplicate map initialization
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [12.9716, 77.5946],
          zoom: 8,
          zoomControl: false,
          attributionControl: false,
        });

        // High Performance CartoDB Dark Matter tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      // Add pins for filtered events
      const bounds: [number, number][] = [];

      filteredEvents.forEach((evt) => {
        const cityKey = (evt.city || "bengaluru").toLowerCase().trim();
        const coords =
          evt.latitude && evt.longitude
            ? { lat: evt.latitude, lng: evt.longitude }
            : CITY_COORDINATES[cityKey] || CITY_COORDINATES["bengaluru"];

        bounds.push([coords.lat, coords.lng]);

        const isSelected = selectedEventId === evt.id;

        const customIcon = L.divIcon({
          className: "custom-map-pin-container",
          html: `
            <div class="relative cursor-pointer group">
              ${isSelected ? '<span class="absolute -inset-2 rounded-full bg-[#0758fc]/40 animate-ping"></span>' : ''}
              <div className="px-3 py-1.5 rounded-full border text-xs font-black transition-all flex items-center gap-1.5 shadow-xl ${
                isSelected
                  ? 'bg-[#0758fc] border-white text-white scale-110 shadow-[#0758fc]/60'
                  : 'bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800'
              }" style="background-color: ${isSelected ? '#0758fc' : '#0f172a'}; color: #ffffff; padding: 6px 12px; border-radius: 9999px; border: 1.5px solid ${isSelected ? '#ffffff' : '#334155'}; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: ${isSelected ? '#ffffff' : '#0758fc'};"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${evt.city || 'Venue'}</span>
              </div>
            </div>
          `,
          iconSize: [110, 36],
          iconAnchor: [55, 18],
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);

        marker.on("click", () => {
          setSelectedEventId(evt.id);
          map.setView([coords.lat, coords.lng], 12, { animate: true });
        });

        markersRef.current[evt.id] = marker;
      });

      // Auto-fit map bounds if markers exist
      if (bounds.length > 0 && activeCityFilter !== "ALL") {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [filteredEvents, selectedEventId, activeCityFilter]);

  function handleZoomIn() {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  }

  function handleZoomOut() {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  }

  function handleResetZoom() {
    setActiveCityFilter("ALL");
    setSelectedEventId(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([12.9716, 77.5946], 8, { animate: true });
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#0758fc] flex items-center gap-1.5 mb-1">
            <Compass size={14} /> District 3192 Location Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">{subtitle}</p>
        </div>

        {/* City Filter Tabs */}
        {cities.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCityFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCityFilter === "ALL"
                  ? "bg-[#0758fc] text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Cities ({events.length})
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setActiveCityFilter(city)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCityFilter === city
                    ? "bg-[#0758fc] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MAP & FILTERED RESULTS SPLIT-SCREEN CONTAINER ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-xl overflow-hidden">
        
        {/* ── LEFT CANVAS: REAL LEAFLET INTERACTIVE MAP (7 COLS ON DESKTOP) ── */}
        <div className="lg:col-span-7 relative bg-slate-900 rounded-2xl overflow-hidden min-h-[440px] sm:min-h-[520px] border border-slate-800 shadow-inner">
          
          {/* Leaflet Map Div Container */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[440px] sm:min-h-[520px] z-10" />

          {/* Top Status Badge Overlay */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border border-slate-700 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Showing {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
          </div>

          {/* Map Controls (+, -, Reset) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              className="w-8 h-8 rounded-xl bg-slate-950/90 border border-slate-700 hover:bg-slate-800 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="w-8 h-8 rounded-xl bg-slate-950/90 border border-slate-700 hover:bg-slate-800 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset View"
              className="w-8 h-8 rounded-xl bg-slate-950/90 border border-slate-700 hover:bg-slate-800 text-amber-400 flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Bottom-Left Interactive Event Preview Overlay Card */}
          {selectedEvent && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-30 p-4 sm:p-5 max-w-[340px] w-full bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl text-white space-y-3 pointer-events-auto shadow-[#0758fc]/20 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start gap-3">
                {selectedEvent.cover_image_url && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700">
                    <Image
                      src={selectedEvent.cover_image_url}
                      alt={selectedEvent.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0758fc]">
                      {selectedEvent.city || "Karnataka"}
                    </span>
                    
                    {/* CLOSE (X) BUTTON FIX: Sets selectedEventId to null so popup card closes */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventId(null);
                      }}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Close preview"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate mt-0.5" title={selectedEvent.title}>
                    {selectedEvent.title}
                  </h4>
                  
                  <div className="space-y-0.5 mt-1 text-[11px] text-slate-300">
                    <p className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-amber-400 shrink-0" />
                      <span>{new Date(selectedEvent.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#0758fc] shrink-0" />
                      <span className="truncate">{selectedEvent.venue_name || selectedEvent.city || "Venue TBD"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Get Directions Link */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedEvent.venue_name || ""} ${selectedEvent.city || "Bengaluru"}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#0758fc] hover:underline flex items-center gap-1"
                >
                  <Navigation size={13} />
                  <span>Get Directions</span>
                </a>

                <span className="font-extrabold text-emerald-400 text-sm">
                  {getMinPrice(selectedEvent.saas_ticket_tiers)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={`/events/${selectedEvent.slug}`}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors text-center flex items-center justify-center gap-1"
                >
                  <span>Details</span>
                  <ChevronRight size={13} />
                </Link>

                <Link
                  href={`/events/${selectedEvent.slug}`}
                  className="w-full bg-[#0758fc] hover:bg-[#054fe0] text-white font-black text-xs py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-md"
                >
                  <Ticket size={13} />
                  <span>Book Tickets</span>
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT PANEL: FILTERED RESULTS LIST (5 COLS ON DESKTOP) ──────── */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-gray-900 tracking-wider uppercase">
                FILTERED RESULTS ({filteredEvents.length})
              </h3>
              <span className="text-xs text-gray-500 font-semibold">
                Click event to inspect on map
              </span>
            </div>

            {/* Event List Items */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-500">
                  No events found for the selected city filter.
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;

                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        if (mapInstanceRef.current) {
                          const cityKey = (evt.city || "bengaluru").toLowerCase().trim();
                          const coords =
                            evt.latitude && evt.longitude
                              ? { lat: evt.latitude, lng: evt.longitude }
                              : CITY_COORDINATES[cityKey] || CITY_COORDINATES["bengaluru"];
                          mapInstanceRef.current.setView([coords.lat, coords.lng], 12, { animate: true });
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-blue-50/70 border-[#0758fc] shadow-xs"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {evt.cover_image_url ? (
                            <Image
                              src={evt.cover_image_url}
                              alt={evt.title}
                              width={44}
                              height={44}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <MapPin size={18} className="text-[#0758fc]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{evt.title}</h4>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {evt.city || "Bengaluru"} · {new Date(evt.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-gray-900 block">
                          {getMinPrice(evt.saas_ticket_tiers)}
                        </span>
                        <Link
                          href={`/events/${evt.slug}`}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#0758fc] hover:underline"
                        >
                          <span>Book</span>
                          <ChevronRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Bar Controls */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Showing current map bounds</span>
            <button
              type="button"
              onClick={handleResetZoom}
              className="text-[#0758fc] hover:underline font-bold text-xs cursor-pointer"
            >
              RESET MAP ZOOM
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
