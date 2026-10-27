import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ChargerListing } from '../../types';
import { useApp } from '../../context/AppContext';

interface LiveMapProps {
  chargers: ChargerListing[];
  selectedCharger: ChargerListing | null;
  onSelectCharger: (charger: ChargerListing) => void;
  onBookCharger?: (charger: ChargerListing) => void;
  userCoords: [number, number];
  radiusKm: number;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  chargers,
  selectedCharger,
  onSelectCharger,
  onBookCharger,
  userCoords,
  radiusKm,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const { formatCurrency } = useApp();

  // Initialize Map with Light CartoDB Positron tiles (White & Skyblue water)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: userCoords,
      zoom: 13,
      zoomControl: false,
    });

    // Standard OpenStreetMap tile layer - 100% free, reliable, no API key required
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User marker, Radius circle, and Fly To location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Pan / Fly map to user location
    map.flyTo(userCoords, 14, { animate: true, duration: 1.2 });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userCoords);
      userMarkerRef.current.setPopupContent(`
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: #0F172A; text-align: center; padding: 4px;">
          <div style="color: #0284C7; font-weight: bold; margin-bottom: 2px;">Your EV GPS Location</div>
          <div style="font-size: 10px; color: #64748B; font-family: monospace;">${userCoords[0].toFixed(4)}, ${userCoords[1].toFixed(4)}</div>
        </div>
      `);
    } else {
      const userIcon = L.divIcon({
        className: 'user-pin-custom',
        html: `
          <div class="flex flex-col items-center cursor-pointer -translate-y-2">
            <div style="background-color: #0284C7; color: #FFFFFF; box-shadow: 0 4px 12px rgba(2,132,199,0.35);" 
                 class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap mb-1 border border-white flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>My Location</span>
            </div>
            <div class="relative flex items-center justify-center">
              <div class="w-8 h-8 rounded-full bg-[#0284C7]/30 animate-ping absolute"></div>
              <div class="w-5 h-5 rounded-full bg-[#0284C7] border-2 border-white shadow-lg flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        `,
        iconSize: [90, 52],
        iconAnchor: [45, 50],
      });

      const userMarker = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      userMarker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: #0F172A; text-align: center; padding: 4px;">
          <div style="color: #0284C7; font-weight: bold; margin-bottom: 2px;">Your EV GPS Location</div>
          <div style="font-size: 10px; color: #64748B; font-family: monospace;">${userCoords[0].toFixed(4)}, ${userCoords[1].toFixed(4)}</div>
        </div>
      `);
      userMarkerRef.current = userMarker;
    }

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng(userCoords);
      radiusCircleRef.current.setRadius(radiusKm * 1000);
    } else {
      radiusCircleRef.current = L.circle(userCoords, {
        radius: radiusKm * 1000,
        color: '#0284C7',
        weight: 1.5,
        fillColor: '#0284C7',
        fillOpacity: 0.06,
        dashArray: '5, 8',
      }).addTo(map);
    }
  }, [userCoords, radiusKm]);

  // Update Charger Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    chargers.forEach(charger => {
      const isPublic = Boolean(charger.isPublicStation);
      
      // Pin styling based on whether it is an EVIO Hub or Public Third-Party Station
      let color = isPublic ? '#7C3AED' : '#16A34A'; // Purple for Public, Green for Hub Available
      let statusLabel = isPublic ? 'Public Station' : 'Available';
      let shadowColor = isPublic ? 'rgba(124, 58, 237, 0.35)' : 'rgba(22, 163, 74, 0.25)';

      if (!isPublic && charger.status === 'in-use') {
        color = '#D97706';
        statusLabel = 'In Use';
        shadowColor = 'rgba(217, 119, 6, 0.25)';
      } else if (!isPublic && charger.status === 'offline') {
        color = '#64748B';
        statusLabel = 'Offline';
        shadowColor = 'rgba(100, 116, 139, 0.2)';
      }

      const isSelected = selectedCharger?.id === charger.id;

      const badgeLabel = isPublic ? 'PUBLIC' : 'HUB';

      const customHtml = `
        <div class="group cursor-pointer transform transition-transform duration-200 hover:scale-110 ${isSelected ? 'scale-125 z-50' : ''}">
          <div style="background-color: #FFFFFF; border: 2px solid ${color}; box-shadow: 0 4px 14px ${shadowColor};" 
               class="px-2 py-1 rounded-full flex items-center gap-1 font-mono text-[11px] font-bold text-[#0F172A] whitespace-nowrap">
            <span style="background-color: ${color}; color: white;" class="px-1 py-0.2 rounded text-[9px] uppercase font-bold">
              ${badgeLabel}
            </span>
            <span>${charger.powerKw} kW</span>
          </div>
          <div style="border-top-color: ${color};" 
               class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] mx-auto"></div>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: 'custom-charger-pin',
        html: customHtml,
        iconSize: [75, 34],
        iconAnchor: [37, 34],
      });

      const marker = L.marker([charger.lat, charger.lng], { icon: markerIcon }).addTo(map);

      const distKm = (Math.hypot(charger.lat - userCoords[0], (charger.lng - userCoords[1]) * Math.cos(userCoords[0] * Math.PI / 180)) * 111).toFixed(1);

      const popupHtml = `
        <div style="width: 240px; font-family: 'Inter', sans-serif; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; font-family: monospace; padding: 2px 6px; border-radius: 4px; background: ${color}15; color: ${color};">
              ${isPublic ? (charger.operatorBrand || 'PUBLIC FAST STATION') : 'EVIO COMMUNITY HUB'}
            </span>
            <span style="font-size: 10px; font-family: monospace; color: #0284C7; font-weight: 700;">
              ${distKm} km away • ${charger.powerKw} kW
            </span>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 3px;">
            ${charger.title}
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">
            ${charger.approxAddress}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 8px;">
            <div>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: ${color};">
                ${formatCurrency(charger.priceRate)}
              </span>
              <span style="font-size: 10px; color: #64748B;">/kWh</span>
            </div>
            
            ${isPublic ? `
              <span style="font-size: 10px; padding: 3px 8px; border-radius: 6px; background: #F3E8FF; color: #7C3AED; font-weight: 700; font-family: monospace;">
                DRIVE-IN
              </span>
            ` : `
              <span style="font-size: 10px; padding: 3px 8px; border-radius: 6px; background: #E0F2FE; color: #0284C7; font-weight: 700; font-family: monospace;">
                BOOKABLE
              </span>
            `}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        onSelectCharger(charger);
      });

      markersRef.current[charger.id] = marker;
    });
  }, [chargers, selectedCharger, formatCurrency]);

  useEffect(() => {
    if (!selectedCharger || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo([selectedCharger.lat, selectedCharger.lng], { animate: true });
    
    const marker = markersRef.current[selectedCharger.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedCharger]);

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-[#BAE6FD] shadow-sm bg-white z-0 isolate">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Floating Status & Pin Type Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-[#BAE6FD] rounded-xl px-3 py-2 flex flex-wrap items-center gap-3 text-[11px] font-mono shadow-md">
        <div className="flex items-center gap-1.5 border-r border-[#E2E8F0] pr-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] border border-white shadow-xs"></span>
          <span className="text-[#0F172A] font-bold">EVIO Hub (Bookable)</span>
        </div>
        <div className="flex items-center gap-1.5 border-r border-[#E2E8F0] pr-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] border border-white shadow-xs"></span>
          <span className="text-[#7C3AED] font-bold">Public Station (Drive-in)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
          <span className="text-[#64748B]">In Use</span>
        </div>
      </div>
    </div>
  );
};
