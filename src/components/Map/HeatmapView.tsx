import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Activity, 
  AlertTriangle, 
  Zap, 
  MapPin, 
  Layers, 
  Building2, 
  TrendingUp, 
  Car, 
  CheckCircle2,
  Sparkles,
  Navigation,
  Crosshair
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HeatmapZone } from '../../types';

interface HeatmapViewProps {
  onOpenFranchise?: () => void;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({ onOpenFranchise }) => {
  const { chargers, userCoords, setUserCoords, onlineDrivers, heatmapZones, formatCurrency } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Layer toggles
  const [showDriverDensity, setShowDriverDensity] = useState(true);
  const [showChargingDeserts, setShowChargingDeserts] = useState(true);
  const [showStationCoverage, setShowStationCoverage] = useState(true);

  const densityLayersRef = useRef<L.LayerGroup>(L.layerGroup());
  const desertLayersRef = useRef<L.LayerGroup>(L.layerGroup());
  const coverageLayersRef = useRef<L.LayerGroup>(L.layerGroup());

  // Locate Me handler
  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCoords(next);
          setIsLocating(false);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(next, 14, { animate: true, duration: 1.2 });
          }
        },
        err => {
          setIsLocating(false);
          alert('Could not acquire GPS coordinates. Please ensure location permissions are enabled in your browser.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: userCoords,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add layer groups
    densityLayersRef.current.addTo(map);
    desertLayersRef.current.addTo(map);
    coverageLayersRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fly to and update user location marker on Heatmap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo(userCoords, 14, { animate: true, duration: 1.0 });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userCoords);
    } else {
      const userIcon = L.divIcon({
        className: 'heatmap-user-pin',
        html: `
          <div class="flex flex-col items-center cursor-pointer -translate-y-2">
            <div style="background-color: #0284C7; color: #FFFFFF;" 
                 class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap mb-1 border border-white shadow-md flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>My Location</span>
            </div>
            <div class="relative flex items-center justify-center">
              <div class="w-7 h-7 rounded-full bg-[#0284C7]/30 animate-ping absolute"></div>
              <div class="w-4 h-4 rounded-full bg-[#0284C7] border-2 border-white shadow-lg"></div>
            </div>
          </div>
        `,
        iconSize: [90, 48],
        iconAnchor: [45, 46],
      });
      userMarkerRef.current = L.marker(userCoords, { icon: userIcon, zIndexOffset: 2000 })
        .bindPopup(`<strong>Your Location</strong><br/>${userCoords[0].toFixed(4)}, ${userCoords[1].toFixed(4)}`)
        .addTo(map);
    }
  }, [userCoords]);

  // Update Heatmap Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. DENSITY LAYER (High EV Driver Traffic Heatmap)
    densityLayersRef.current.clearLayers();
    if (showDriverDensity) {
      heatmapZones
        .filter(z => z.type === 'high_ev_density')
        .forEach(zone => {
          // Heat gradient outer ring
          L.circle(zone.center, {
            radius: zone.radiusMeters,
            color: '#F43F5E',
            weight: 1,
            fillColor: '#F43F5E',
            fillOpacity: 0.15,
          }).addTo(densityLayersRef.current);

          // Heat gradient intense core
          L.circle(zone.center, {
            radius: zone.radiusMeters * 0.5,
            color: '#E11D48',
            weight: 2,
            fillColor: '#E11D48',
            fillOpacity: 0.35,
          }).addTo(densityLayersRef.current);

          // Cluster badge marker
          const clusterIcon = L.divIcon({
            className: 'density-cluster-badge',
            html: `
              <div class="flex flex-col items-center">
                <div style="background-color: #E11D48; color: white;" class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold whitespace-nowrap mb-1 shadow-lg border border-white flex items-center gap-1.5 animate-pulse">
                  <span class="w-2 h-2 rounded-full bg-white"></span>
                  <span>${zone.evDriverCount || 35} Active EVs</span>
                </div>
              </div>
            `,
            iconSize: [120, 36],
            iconAnchor: [60, 18],
          });

          L.marker(zone.center, { icon: clusterIcon })
            .bindPopup(`
              <div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 3px;">
                <strong style="color: #E11D48; display: block; font-size: 12px;">${zone.label}</strong>
                <p style="color: #475569; margin: 3px 0;">${zone.description}</p>
                <div style="font-mono; font-size: 10px; color: #0284C7; font-weight: bold;">
                  Fleet Density: ${(zone.intensity * 100).toFixed(0)}% • High Commuter Corridor
                </div>
              </div>
            `)
            .addTo(densityLayersRef.current);
        });

      // Also render individual live active drivers
      onlineDrivers.forEach(driver => {
        L.circleMarker([driver.lat, driver.lng], {
          radius: 5,
          color: '#0284C7',
          fillColor: '#38BDF8',
          fillOpacity: 0.9,
          weight: 1.5,
        })
          .bindPopup(`
            <div style="font-family: 'Inter', sans-serif; font-size: 11px;">
              <strong style="color: #0F172A;">${driver.name}</strong>
              <div style="color: #64748B;">${driver.vehicle} (${driver.batterySoc}%)</div>
              <div style="color: #16A34A; font-size: 10px; font-mono;">Live App Session Active</div>
            </div>
          `)
          .addTo(densityLayersRef.current);
      });
    }

    // 2. CHARGING DESERTS (No Charging Station Zones / Dark Zones)
    desertLayersRef.current.clearLayers();
    if (showChargingDeserts) {
      heatmapZones
        .filter(z => z.type === 'charging_desert')
        .forEach(zone => {
          // Warning dashed zone circle
          L.circle(zone.center, {
            radius: zone.radiusMeters,
            color: '#D97706',
            weight: 2,
            dashArray: '6, 8',
            fillColor: '#F59E0B',
            fillOpacity: 0.12,
          }).addTo(desertLayersRef.current);

          const desertIcon = L.divIcon({
            className: 'desert-warning-badge',
            html: `
              <div class="flex flex-col items-center">
                <div style="background-color: #D97706; color: white;" class="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold whitespace-nowrap mb-1 shadow-lg border border-white flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>CHARGING DESERT (${zone.unservedKm || 18} km Gap)</span>
                </div>
              </div>
            `,
            iconSize: [160, 40],
            iconAnchor: [80, 20],
          });

          L.marker(zone.center, { icon: desertIcon })
            .bindPopup(`
              <div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 4px; width: 230px;">
                <div style="color: #D97706; font-weight: bold; font-size: 12px; margin-bottom: 2px;">
                  ⚠️ ZERO CHARGING STATIONS
                </div>
                <strong style="color: #0F172A; display: block;">${zone.label}</strong>
                <p style="color: #475569; margin: 4px 0; font-size: 10.5px;">${zone.description}</p>
                <div style="padding: 4px; background: #FEF3C7; border-radius: 6px; font-size: 10px; font-mono; color: #92400E; margin-top: 4px;">
                  ★ Prime Franchise Opportunity: Subsidized hardware available with 40% wholesale discount.
                </div>
              </div>
            `)
            .addTo(desertLayersRef.current);
        });
    }

    // 3. STATION COVERAGE RINGS
    coverageLayersRef.current.clearLayers();
    if (showStationCoverage) {
      chargers.forEach(charger => {
        const isPublic = Boolean(charger.isPublicStation);
        const radius = isPublic ? 3500 : 2500;
        const color = isPublic ? '#7C3AED' : '#0284C7';

        L.circle([charger.lat, charger.lng], {
          radius,
          color,
          weight: 1,
          dashArray: '3, 6',
          fillColor: color,
          fillOpacity: 0.05,
        }).addTo(coverageLayersRef.current);
      });
    }

  }, [heatmapZones, onlineDrivers, chargers, showDriverDensity, showChargingDeserts, showStationCoverage]);

  return (
    <div className="space-y-4">
      
      {/* Top Telemetry KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-[#BAE6FD] shadow-xs">
          <div className="flex items-center justify-between text-[#E11D48] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Active EV Density</span>
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold font-mono text-[#0F172A]">80+ EVs</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#FDE68A] shadow-xs">
          <div className="flex items-center justify-between text-[#D97706] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Charging Deserts</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold font-mono text-[#D97706]">2 Dark Zones</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#BAE6FD] shadow-xs">
          <div className="flex items-center justify-between text-[#0284C7] mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Network Stations</span>
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold font-mono text-[#0F172A]">{chargers.length} Active</span>
        </div>

        <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#86EFAC] shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#16A34A] uppercase block">Franchise Hotspot</span>
            <span className="text-xs font-bold font-mono text-[#0F172A] truncate block">Lonavala Gap</span>
          </div>
          {onOpenFranchise && (
            <button
              onClick={onOpenFranchise}
              className="mt-1 text-[11px] font-mono font-bold text-[#16A34A] hover:underline flex items-center gap-1"
            >
              <span>Setup Hub &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Heatmap Container */}
      <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-[#BAE6FD] shadow-sm bg-white z-0 isolate">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Locate Me Button (Top Left) */}
        <div className="absolute top-4 left-4 z-10">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white/95 hover:bg-white text-[#0F172A] font-mono font-bold text-xs rounded-xl shadow-md border border-[#BAE6FD] transition-all active:scale-95 hover:border-[#0284C7] hover:text-[#0284C7]"
          >
            <Crosshair className={`w-4 h-4 text-[#0284C7] ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
          </button>
        </div>

        {/* Floating Layer Controls (Top Right) */}
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md border border-[#BAE6FD] rounded-xl p-3 shadow-lg font-mono text-xs space-y-2 max-w-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-1.5">
            <Layers className="w-4 h-4 text-[#0284C7]" />
            <span>Heatmap Layers</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer hover:text-[#0284C7]">
            <input 
              type="checkbox"
              checked={showDriverDensity}
              onChange={e => setShowDriverDensity(e.target.checked)}
              className="accent-[#E11D48] rounded"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]"></span>
              <span>Active EV Driver Density</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-[#0284C7]">
            <input 
              type="checkbox"
              checked={showChargingDeserts}
              onChange={e => setShowChargingDeserts(e.target.checked)}
              className="accent-[#D97706] rounded"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
              <span>Charging Deserts (0 Stations)</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-[#0284C7]">
            <input 
              type="checkbox"
              checked={showStationCoverage}
              onChange={e => setShowStationCoverage(e.target.checked)}
              className="accent-[#0284C7] rounded"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]"></span>
              <span>Station Coverage Radii</span>
            </span>
          </label>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md border border-[#BAE6FD] rounded-xl px-3.5 py-2 flex items-center gap-4 text-[11px] font-mono shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E11D48]/40 border border-[#E11D48]"></span>
            <span className="text-[#0F172A]">High EV Traffic Density</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D97706]/40 border border-[#D97706] border-dashed"></span>
            <span className="text-[#D97706] font-bold">Unserved Dark Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#0284C7]/20 border border-[#0284C7]"></span>
            <span className="text-[#0284C7]">Hub Coverage</span>
          </div>
        </div>

      </div>
    </div>
  );
};
