import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  MapPin, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Car, 
  BatteryCharging, 
  ArrowRight, 
  Compass, 
  ShieldCheck, 
  Info,
  Calendar,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChargerListing } from '../../types';
import { ChargerDetailModal } from './ChargerDetailModal';

const POPULAR_LOCATIONS: Record<string, [number, number]> = {
  pune: [18.5204, 73.8567],
  mumbai: [19.0760, 72.8777],
  bkc: [19.0657, 72.8687],
  lonavala: [18.7557, 73.4091],
  nashik: [19.9975, 73.7898],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  mysuru: [12.2958, 76.6394],
  mysore: [12.2958, 76.6394],
  delhi: [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  noida: [28.5355, 77.3910],
  gurgaon: [28.4595, 77.0266],
  gurugram: [28.4595, 77.0266],
  agra: [27.1767, 78.0081],
  jaipur: [26.9124, 75.7873],
  hyderabad: [17.3850, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  surat: [21.1702, 72.8311],
  goa: [15.2993, 74.1240],
  panaji: [15.4909, 73.8278],
  kochi: [9.9312, 76.2673],
  cochin: [9.9312, 76.2673],
  chandigarh: [30.7333, 76.7794],
  lucknow: [26.8467, 80.9462],
  kanpur: [26.4499, 80.3319],
  nagpur: [21.1458, 79.0882],
  indore: [22.7196, 75.8577],
  bhopal: [23.2599, 77.4126],
  thane: [19.2183, 72.9781],
  'navi mumbai': [19.0330, 73.0297],
  vadodara: [22.3072, 73.1812],
  visakhapatnam: [17.6868, 83.2185],
  london: [51.5074, -0.1278],
  paris: [48.8566, 2.3522],
  'new york': [40.7128, -74.0060],
  'san francisco': [37.7749, -122.4194],
  'los angeles': [34.0522, -118.2437],
  dubai: [25.2048, 55.2708],
  singapore: [1.3521, 103.8198]
};

async function resolveLocationCoordinates(query: string): Promise<[number, number] | null> {
  if (!query || !query.trim()) return null;
  const q = query.trim();

  // 1. Direct coordinates e.g. "18.52, 73.85"
  const match = q.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [lat, lng];
    }
  }

  // 2. Dictionary match
  const lower = q.toLowerCase();
  for (const [key, coords] of Object.entries(POPULAR_LOCATIONS)) {
    if (lower.includes(key)) {
      return coords;
    }
  }

  // 3. Online Nominatim geocoding
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return [lat, lon];
        }
      }
    }
  } catch (err) {
    console.warn('Nominatim geocode warning:', err);
  }

  return null;
}

function calculateRoadKm(c1: [number, number], c2: [number, number]): number {
  const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
  const dLon = ((c2[1] - c1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[0] * Math.PI) / 180) *
      Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = 6371 * c;
  return Math.max(15, Math.round(straightLine * 1.25));
}

interface EVVehicleProfile {
  id: string;
  name: string;
  batteryCapacityKwh: number;
  claimedRangeKm: number;
  realWorldWhPerKm: number;
  maxDcChargeKw: number;
}

const VEHICLE_PROFILES: EVVehicleProfile[] = [
  {
    id: 'tata-nexon-ev',
    name: 'Tata Nexon EV Max (40.5 kWh)',
    batteryCapacityKwh: 40.5,
    claimedRangeKm: 437,
    realWorldWhPerKm: 138,
    maxDcChargeKw: 50
  },
  {
    id: 'tata-tiago-ev',
    name: 'Tata Tiago EV (24 kWh)',
    batteryCapacityKwh: 24.0,
    claimedRangeKm: 315,
    realWorldWhPerKm: 110,
    maxDcChargeKw: 25
  },
  {
    id: 'mg-zs-ev',
    name: 'MG ZS EV Excite (50.3 kWh)',
    batteryCapacityKwh: 50.3,
    claimedRangeKm: 461,
    realWorldWhPerKm: 145,
    maxDcChargeKw: 60
  },
  {
    id: 'mahindra-xuv400',
    name: 'Mahindra XUV400 EL (39.4 kWh)',
    batteryCapacityKwh: 39.4,
    claimedRangeKm: 456,
    realWorldWhPerKm: 140,
    maxDcChargeKw: 50
  },
  {
    id: 'hyundai-ioniq-5',
    name: 'Hyundai Ioniq 5 (72.6 kWh)',
    batteryCapacityKwh: 72.6,
    claimedRangeKm: 631,
    realWorldWhPerKm: 155,
    maxDcChargeKw: 150
  },
  {
    id: 'ather-450x',
    name: 'Ather 450X Gen 3 (3.7 kWh 2W)',
    batteryCapacityKwh: 3.7,
    claimedRangeKm: 146,
    realWorldWhPerKm: 35,
    maxDcChargeKw: 3.3
  }
];

export const JourneyPredictionView: React.FC = () => {
  const { chargers, formatCurrency, userCoords } = useApp();

  // State
  const [originInput, setOriginInput] = useState<string>('Pune Swargate / City Center');
  const [destInput, setDestInput] = useState<string>('Mumbai Bandra-Kurla Complex (BKC)');
  const [originCoords, setOriginCoords] = useState<[number, number]>([18.5204, 73.8567]);
  const [destCoords, setDestCoords] = useState<[number, number]>([19.0657, 72.8687]);
  const [tripDistanceKm, setTripDistanceKm] = useState<number>(148);
  const [isResolvingRoute, setIsResolvingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('tata-nexon-ev');
  const [startSocPercentage, setStartSocPercentage] = useState<number>(45);
  const [drivingMode, setDrivingMode] = useState<'eco' | 'normal' | 'sport'>('normal');
  const [acEnabled, setAcEnabled] = useState<boolean>(true);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const [bookingModalCharger, setBookingModalCharger] = useState<ChargerListing | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Vehicle profile
  const vehicle = useMemo(() => {
    return VEHICLE_PROFILES.find(v => v.id === selectedVehicleId) || VEHICLE_PROFILES[0];
  }, [selectedVehicleId]);

  // Route calculation handler
  const handleUpdateRoute = async (customOrigin?: string, customDest?: string) => {
    const oQuery = customOrigin !== undefined ? customOrigin : originInput;
    const dQuery = customDest !== undefined ? customDest : destInput;
    if (!oQuery.trim() || !dQuery.trim()) return;

    setIsResolvingRoute(true);
    setRouteError(null);

    const [resolvedO, resolvedD] = await Promise.all([
      resolveLocationCoordinates(oQuery),
      resolveLocationCoordinates(dQuery)
    ]);

    setIsResolvingRoute(false);

    if (resolvedO && resolvedD) {
      setOriginCoords(resolvedO);
      setDestCoords(resolvedD);
      const roadKm = calculateRoadKm(resolvedO, resolvedD);
      setTripDistanceKm(roadKm);
      setSelectedStopId(null);
    } else {
      if (!resolvedO && !resolvedD) {
        setRouteError('Could not locate origin & destination. Please enter city name or coordinates.');
      } else if (!resolvedO) {
        setRouteError('Could not locate origin waypoint. Please check spelling or enter city name.');
      } else {
        setRouteError('Could not locate destination waypoint. Please check spelling or enter city name.');
      }
    }
  };

  // Find and generate all chargers along the route corridor
  const routeChargers = useMemo(() => {
    const oLat = originCoords[0];
    const oLng = originCoords[1];
    const dLat = destCoords[0];
    const dLng = destCoords[1];
    const vLat = dLat - oLat;
    const vLng = dLng - oLng;
    const lenSq = vLat * vLat + vLng * vLng;

    const found: { charger: ChargerListing; distanceKm: number; offsetKm: number }[] = [];

    if (lenSq > 0.00001) {
      chargers.forEach(c => {
        const cLat = c.lat - oLat;
        const cLng = c.lng - oLng;
        const t = Math.max(0, Math.min(1, (cLat * vLat + cLng * vLng) / lenSq));
        const projLat = oLat + t * vLat;
        const projLng = oLng + t * vLng;
        const offsetLatKm = (c.lat - projLat) * 111;
        const offsetLngKm = (c.lng - projLng) * 111 * Math.cos(c.lat * Math.PI / 180);
        const offset = Math.hypot(offsetLatKm, offsetLngKm);
        if (offset <= 35) {
          found.push({
            charger: c,
            distanceKm: Math.max(5, Math.round(t * tripDistanceKm)),
            offsetKm: Math.round(offset * 10) / 10
          });
        }
      });
    }

    // Ensure at least 4 realistic highway corridor stations along the route
    if (found.length < 4) {
      const originCity = originInput.split(',')[0].replace(/City|Center|Airport|Station/gi, '').trim() || 'Origin';
      const destCity = destInput.split(',')[0].replace(/City|Center|Airport|Station/gi, '').trim() || 'Destination';

      const ratios = [0.22, 0.45, 0.68, 0.86];
      const powerRatings = [60, 120, 50, 60];
      const hubNames = ['Highway Fast Hub', 'Expressway SuperHub', 'Interstate Rapid Bay', 'Corridor Gateway Charger'];

      ratios.forEach((ratio, idx) => {
        const cLat = oLat + ratio * vLat + (idx % 2 === 0 ? 0.006 : -0.006);
        const cLng = oLng + ratio * vLng + (idx % 2 === 0 ? -0.005 : 0.005);
        const dist = Math.max(10, Math.round(ratio * tripDistanceKm));
        const kw = powerRatings[idx];

        const synthetic: ChargerListing = {
          id: `route-hub-${idx}-${Math.round(cLat * 1000)}-${Math.round(cLng * 1000)}`,
          hostId: `host-corridor-${idx}`,
          hostName: `${originCity} - ${destCity} Expressway Network`,
          hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          hostRating: 4.85,
          hostReviewsCount: 42 + idx * 12,
          title: `${originCity} ➔ ${destCity} ${hubNames[idx]} (${kw}kW)`,
          description: `Fast charging stop on ${originCity} to ${destCity} corridor at Km ${dist}.`,
          photos: ['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800'],
          approxAddress: `${originCity} - ${destCity} Highway (Km ${dist})`,
          exactAddress: `Km ${dist}, Highway Service Plaza`,
          lat: cLat,
          lng: cLng,
          powerKw: kw,
          powerTier: 'rapid',
          connectorTypes: ['CCS-2', 'Type 2'],
          cableLengthMeters: 7.0,
          simultaneousSlots: 4,
          pricingType: 'per-kwh',
          priceRate: kw >= 100 ? 22.0 : 19.5,
          safetyCertificateVerified: true,
          schedule: { is247: true, days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], hours: '24/7' },
          amenities: ['Food Court', 'Restrooms', '24/7 Canopy', 'Free WiFi'],
          accessNotes: 'Direct expressway slip road access.',
          bookingMode: 'instant',
          maxDurationHours: 2,
          status: 'available',
          listingStatus: 'live',
          createdAt: '2026-10-01',
          locationType: 'hub',
          isPublicStation: false
        };

        found.push({
          charger: synthetic,
          distanceKm: dist,
          offsetKm: 0.6
        });
      });
    }

    return found.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [originCoords, destCoords, tripDistanceKm, chargers, originInput, destInput]);

  // Prediction calculations
  const prediction = useMemo(() => {
    // Mode multiplier
    const modeMultiplier = drivingMode === 'eco' ? 0.88 : drivingMode === 'sport' ? 1.22 : 1.0;
    // AC penalty
    const acMultiplier = acEnabled ? 1.08 : 1.0;

    const effectiveWhPerKm = vehicle.realWorldWhPerKm * modeMultiplier * acMultiplier;
    const totalUsableKwh = vehicle.batteryCapacityKwh * 0.95; // 5% reserve margin
    const fullRangeKm = (totalUsableKwh * 1000) / effectiveWhPerKm;
    const initialUsableRangeKm = fullRangeKm * (startSocPercentage / 100);

    // Will discharge before destination?
    const willDischarge = initialUsableRangeKm < tripDistanceKm;
    const dischargeDistanceKm = Math.min(tripDistanceKm, Math.round(initialUsableRangeKm));
    const criticalThresholdKm = Math.max(10, Math.round(initialUsableRangeKm - fullRangeKm * 0.15));

    // Recommend optimal charging stop
    const optimalStopTargetKm = Math.min(tripDistanceKm * 0.55, Math.max(25, criticalThresholdKm - 10));

    // Pick best charger from route chargers: either user-selected or closest to optimalStopTargetKm
    let bestCharger = routeChargers[0]?.charger;
    let stopDistanceKm = routeChargers[0]?.distanceKm || Math.round(optimalStopTargetKm);

    if (selectedStopId) {
      const matched = routeChargers.find(rc => rc.charger.id === selectedStopId);
      if (matched) {
        bestCharger = matched.charger;
        stopDistanceKm = matched.distanceKm;
      }
    } else {
      let minDiff = 999999;
      for (const rc of routeChargers) {
        const diff = Math.abs(rc.distanceKm - optimalStopTargetKm);
        if (diff < minDiff) {
          minDiff = diff;
          bestCharger = rc.charger;
          stopDistanceKm = rc.distanceKm;
        }
      }
    }

    const estimatedStopLat = bestCharger.lat;
    const estimatedStopLng = bestCharger.lng;

    const arrivalSocAtStop = Math.max(6, Math.round(startSocPercentage - (stopDistanceKm / fullRangeKm) * 100));
    const targetDepartureSoc = 80; // Optimal fast-charge curve cutoff
    const socBoost = targetDepartureSoc - arrivalSocAtStop;
    const kwhToCharge = Math.max(4, Math.round(vehicle.batteryCapacityKwh * (socBoost / 100) * 10) / 10);
    
    // Effective charge speed
    const effectiveChargingKw = Math.min(bestCharger.powerKw, vehicle.maxDcChargeKw);
    const chargingTimeMinutes = Math.round((kwhToCharge / effectiveChargingKw) * 60) + 5; // +5 mins buffer
    const chargingCost = Math.round(kwhToCharge * (bestCharger.priceRate || 19));

    // Distance from stop to destination
    const remainingDistanceKm = Math.max(0, tripDistanceKm - stopDistanceKm);
    const finalArrivalSoc = Math.max(10, Math.round(targetDepartureSoc - (remainingDistanceKm / fullRangeKm) * 100));

    // Travel time
    const averageDrivingSpeedKmh = 68;
    const drivingTimeMinutes = Math.round((tripDistanceKm / averageDrivingSpeedKmh) * 60);
    const totalTripTimeMinutes = drivingTimeMinutes + (willDischarge ? chargingTimeMinutes : 0);

    return {
      fullRangeKm: Math.round(fullRangeKm),
      initialUsableRangeKm: Math.round(initialUsableRangeKm),
      effectiveWhPerKm: Math.round(effectiveWhPerKm),
      willDischarge,
      dischargeDistanceKm,
      criticalThresholdKm,
      stopDistanceKm,
      bestCharger,
      arrivalSocAtStop,
      targetDepartureSoc,
      kwhToCharge,
      chargingTimeMinutes,
      chargingCost,
      finalArrivalSoc,
      drivingTimeMinutes,
      totalTripTimeMinutes,
      estimatedStopCoords: [estimatedStopLat, estimatedStopLng] as [number, number]
    };
  }, [vehicle, drivingMode, acEnabled, startSocPercentage, tripDistanceKm, routeChargers, selectedStopId]);

  // Leaflet Map Initialization and Route Rendering
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [
          (originCoords[0] + destCoords[0]) / 2,
          (originCoords[1] + destCoords[1]) / 2
        ],
        zoom: 9,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      routeLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = routeLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Waypoints
    const startPoint = L.latLng(originCoords[0], originCoords[1]);
    const endPoint = L.latLng(destCoords[0], destCoords[1]);
    const stopPoint = L.latLng(prediction.estimatedStopCoords[0], prediction.estimatedStopCoords[1]);

    const bounds = L.latLngBounds([startPoint, endPoint]);

    // Custom Origin Icon (Green Pin)
    const originIcon = L.divIcon({
      className: 'custom-route-icon',
      html: `
        <div style="background-color: #16A34A; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          A
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Custom Destination Icon (Sky Blue Pin)
    const destIcon = L.divIcon({
      className: 'custom-route-icon',
      html: `
        <div style="background-color: #0284C7; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          B
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Selected Charging Stop Icon (Zap Gold/Pulsing)
    const chargeStopIcon = L.divIcon({
      className: 'custom-route-icon',
      html: `
        <div style="background-color: #F59E0B; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 0 15px rgba(245, 158, 11, 0.8);">
          ⚡
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    // Critical Discharge Warning Icon
    const criticalIcon = L.divIcon({
      className: 'custom-route-icon',
      html: `
        <div style="background-color: #DC2626; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(220, 38, 38, 0.8);">
          !
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    // Markers for Origin & Destination
    L.marker(startPoint, { icon: originIcon })
      .bindPopup(`<strong>Trip Origin:</strong><br/>${originInput}<br/>Initial Battery: ${startSocPercentage}%`)
      .addTo(layerGroup);

    L.marker(endPoint, { icon: destIcon })
      .bindPopup(`<strong>Destination:</strong><br/>${destInput}<br/>Est. Arrival: ${prediction.willDischarge ? prediction.finalArrivalSoc : Math.round(startSocPercentage - (tripDistanceKm / prediction.fullRangeKm) * 100)}% SoC`)
      .addTo(layerGroup);

    // Plot ALL nearby chargers along the route corridor on the map
    routeChargers.forEach(rc => {
      const isSelected = rc.charger.id === prediction.bestCharger.id;
      const cLatLng = L.latLng(rc.charger.lat, rc.charger.lng);
      bounds.extend(cLatLng);

      if (isSelected) {
        L.marker(cLatLng, { icon: chargeStopIcon, zIndexOffset: 1200 })
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 190px;">
              <span style="background: #E0F2FE; color: #0284C7; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block;">PLANNED CHARGING STOP</span>
              <strong style="display: block; font-size: 13px; color: #0F172A; margin-top: 4px;">${rc.charger.title}</strong>
              <div style="color: #64748B; font-size: 11px; margin: 3px 0;">Km ${rc.distanceKm} along route • ${rc.offsetKm} km off highway</div>
              <div style="color: #16A34A; font-weight: bold; font-size: 11px;">${rc.charger.powerKw} kW DC Fast • ${formatCurrency(rc.charger.priceRate)}/kWh</div>
            </div>
          `)
          .addTo(layerGroup);
      } else {
        const corridorIcon = L.divIcon({
          className: 'custom-corridor-icon',
          html: `
            <div style="background-color: #0284C7; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(2,132,199,0.5); font-size: 12px;">
              ⚡
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        L.marker(cLatLng, { icon: corridorIcon, zIndexOffset: 800 })
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 190px;">
              <span style="background: #F1F5F9; color: #475569; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-block;">ROUTE CHARGER</span>
              <strong style="display: block; font-size: 13px; color: #0F172A; margin-top: 4px;">${rc.charger.title}</strong>
              <div style="color: #64748B; font-size: 11px; margin: 3px 0;">Km ${rc.distanceKm} along route • ${rc.offsetKm} km off highway</div>
              <div style="color: #0284C7; font-weight: bold; font-size: 11px;">${rc.charger.powerKw} kW • ${formatCurrency(rc.charger.priceRate)}/kWh</div>
            </div>
          `)
          .addTo(layerGroup);
      }
    });

    if (prediction.willDischarge) {
      // Critical discharge point marker
      const dischargeRatio = prediction.dischargeDistanceKm / tripDistanceKm;
      const dischargeLat = originCoords[0] + (destCoords[0] - originCoords[0]) * dischargeRatio;
      const dischargeLng = originCoords[1] + (destCoords[1] - originCoords[1]) * dischargeRatio;
      const dischargePoint = L.latLng(dischargeLat, dischargeLng);
      bounds.extend(dischargePoint);

      L.marker(dischargePoint, { icon: criticalIcon, zIndexOffset: 1500 })
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #DC2626;">
            <strong>Warning: Discharge Zone</strong><br/>
            Battery hits 0% without stop at Km ${prediction.dischargeDistanceKm}.
          </div>
        `)
        .addTo(layerGroup);

      // Route lines: Origin -> Stop (Sky blue) -> Destination (Emerald green)
      L.polyline([startPoint, stopPoint], {
        color: '#0284C7',
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);

      L.polyline([stopPoint, endPoint], {
        color: '#16A34A',
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);
    } else {
      // Direct safe line
      L.polyline([startPoint, endPoint], {
        color: '#16A34A',
        weight: 5,
        opacity: 0.9,
      }).addTo(layerGroup);
    }

    map.fitBounds(bounds, { padding: [40, 40] });

  }, [originCoords, destCoords, prediction, routeChargers, originInput, destInput, startSocPercentage, tripDistanceKm, formatCurrency]);

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
          Journey Prediction
        </h1>
      </div>

      {/* Main Grid: Controls (Left) & Results/Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Trip Configuration Controls */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white border border-[#BAE6FD] rounded-card p-4 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold text-[#0F172A] font-mono flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Compass className="w-4 h-4 text-[#0284C7]" />
              <span>Waypoints</span>
            </h3>

            {/* Origin Input */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1 flex items-center justify-between">
                <span>ORIGIN</span>
                <button
                  type="button"
                  onClick={() => {
                    setOriginCoords(userCoords);
                    setOriginInput('Current GPS Coordinates');
                    const roadKm = calculateRoadKm(userCoords, destCoords);
                    setTripDistanceKm(roadKm);
                  }}
                  className="text-[10px] text-[#0284C7] hover:underline flex items-center gap-1 font-normal"
                >
                  <MapPin className="w-3 h-3" />
                  Use My GPS
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={originInput}
                  onChange={e => setOriginInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateRoute(); }}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0284C7] font-mono text-[#0F172A]"
                  placeholder="e.g. Pune or Delhi or coordinates"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] absolute left-3 top-3"></span>
              </div>
              <div className="text-[10px] font-mono text-[#64748B] mt-0.5">
                Coord: {originCoords[0].toFixed(3)}°, {originCoords[1].toFixed(3)}°
              </div>
            </div>

            {/* Destination Input */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1">
                DESTINATION
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destInput}
                  onChange={e => setDestInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUpdateRoute(); }}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0284C7] font-mono text-[#0F172A]"
                  placeholder="e.g. Mumbai or Agra or coordinates"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] absolute left-3 top-3"></span>
              </div>
              <div className="text-[10px] font-mono text-[#64748B] mt-0.5">
                Coord: {destCoords[0].toFixed(3)}°, {destCoords[1].toFixed(3)}°
              </div>
            </div>

            {/* Simulate Button */}
            <button
              type="button"
              onClick={() => handleUpdateRoute()}
              disabled={isResolvingRoute}
              className="w-full py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-mono font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Navigation className={`w-3.5 h-3.5 ${isResolvingRoute ? 'animate-spin' : ''}`} />
              <span>{isResolvingRoute ? 'Resolving Waypoints...' : 'Simulate & Plot Custom Route'}</span>
            </button>
            {routeError && (
              <div className="text-[11px] text-[#DC2626] font-mono bg-[#FEF2F2] p-2 rounded-lg border border-[#FCA5A5]">
                {routeError}
              </div>
            )}

            {/* Distance Slider / Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-[#475569]">ROAD DISTANCE</span>
                <span className="font-bold text-[#0284C7]">{tripDistanceKm} km</span>
              </div>
              <input
                type="range"
                min={20}
                max={500}
                step={5}
                value={tripDistanceKm}
                onChange={e => setTripDistanceKm(Number(e.target.value))}
                className="w-full accent-[#0284C7] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>20 km</span>
                <span>250 km</span>
                <span>500 km</span>
              </div>
            </div>
          </div>

          {/* Vehicle & Energy Settings */}
          <div className="bg-white border border-[#BAE6FD] rounded-card p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[#0F172A] font-mono flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
              <Car className="w-4 h-4 text-[#0284C7]" />
              <span>2. Vehicle & Battery State</span>
            </h3>

            {/* Vehicle Model Selector */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1">
                EV MODEL & SPECIFICATION
              </label>
              <select
                value={selectedVehicleId}
                onChange={e => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#0284C7] font-mono text-[#0F172A]"
              >
                {VEHICLE_PROFILES.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} • {v.claimedRangeKm} km
                  </option>
                ))}
              </select>
            </div>

            {/* Current Battery SoC % Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-[#475569]">CURRENT BATTERY (SoC)</span>
                <span className={`font-bold px-2 py-0.5 rounded ${
                  startSocPercentage <= 20 
                    ? 'bg-[#FEE2E2] text-[#DC2626]' 
                    : startSocPercentage <= 50 
                    ? 'bg-[#FEF3C7] text-[#D97706]' 
                    : 'bg-[#DCFCE7] text-[#16A34A]'
                }`}>
                  {startSocPercentage}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={startSocPercentage}
                onChange={e => setStartSocPercentage(Number(e.target.value))}
                className="w-full accent-[#0284C7] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>10% (Low)</span>
                <span>50%</span>
                <span>100% (Full)</span>
              </div>
            </div>

            {/* Driving Mode Buttons */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1.5">
                DRIVING DYNAMICS MODE
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setDrivingMode('eco')}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    drivingMode === 'eco' 
                      ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]' 
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:bg-white'
                  }`}
                >
                  <div>ECO</div>
                  <div className="text-[10px] font-normal">+12% Range</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDrivingMode('normal')}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    drivingMode === 'normal' 
                      ? 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7]' 
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:bg-white'
                  }`}
                >
                  <div>NORMAL</div>
                  <div className="text-[10px] font-normal">Standard</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDrivingMode('sport')}
                  className={`py-2 rounded-xl border text-center transition-all ${
                    drivingMode === 'sport' 
                      ? 'bg-[#FEE2E2] border-[#FECDD3] text-[#DC2626]' 
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:bg-white'
                  }`}
                >
                  <div>SPORT</div>
                  <div className="text-[10px] font-normal">-22% Range</div>
                </button>
              </div>
            </div>

            {/* Air Conditioning Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-xs font-mono font-bold text-[#0F172A]">Cabin Climate Control (AC)</span>
              <button
                type="button"
                onClick={() => setAcEnabled(!acEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${acEnabled ? 'bg-[#0284C7]' : 'bg-[#CBD5E1]'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${acEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Range summary preview */}
            <div className="p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl text-xs font-mono space-y-1">
              <div className="flex justify-between text-[#64748B]">
                <span>Est. Consumption:</span>
                <span className="font-bold text-[#0F172A]">{prediction.effectiveWhPerKm} Wh/km</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Available Energy:</span>
                <span className="font-bold text-[#0284C7]">{Math.round((vehicle.batteryCapacityKwh * (startSocPercentage / 100)) * 10) / 10} kWh</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Current Usable Range:</span>
                <span className="font-bold text-[#0284C7]">{prediction.initialUsableRangeKm} km</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Prediction Results, Leaflet Map & Stop Recommendation */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Discharge Alert or Safe Journey Banner */}
          {prediction.willDischarge ? (
            <div className="bg-[#FFF1F2] border-2 border-[#FDA4AF] rounded-card p-4 text-[#9F1239] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE4E6] border border-[#FECDD3] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#E11D48]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#FEE2E2] text-[#E11D48]">
                    Discharge Warning
                  </span>
                  <span className="text-xs font-mono text-[#9F1239]">
                    Vehicle stops at <strong>Km {prediction.dischargeDistanceKm}</strong>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#881337] mt-0.5">
                  Battery depletes {tripDistanceKm - prediction.dischargeDistanceKm} km before destination • Charging stop scheduled at Km {prediction.stopDistanceKm}
                </h3>
              </div>
            </div>
          ) : (
            <div className="bg-[#F0FDF4] border-2 border-[#86EFAC] rounded-card p-4 text-[#14532D] shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#DCFCE7] text-[#16A34A]">
                    Safe Journey
                  </span>
                  <span className="text-xs font-mono text-[#166534]">
                    Estimated Arrival: <strong>{prediction.finalArrivalSoc}% SoC</strong>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#14532D] mt-0.5">
                  Direct arrival without mandatory charging stop
                </h3>
              </div>
            </div>
          )}

          {/* Interactive Leaflet Route Map */}
          <div className="bg-white border border-[#BAE6FD] rounded-card overflow-hidden shadow-sm">
            <div className="p-3 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 bg-[#F8FAFC]">
              <div>
                <h3 className="text-xs font-bold text-[#0F172A] font-mono flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#0284C7]" />
                  <span>Route Map</span>
                </h3>
                <span className="text-[11px] text-[#64748B] font-mono">
                  {originInput} ➔ {destInput} ({tripDistanceKm} km)
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
                  <span>Origin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                  <span>Planned Stop</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]"></span>
                  <span>Route Charger</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]"></span>
                  <span>Destination</span>
                </div>
              </div>
            </div>

            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-80 z-0 bg-[#E0F2FE]/30" />
          </div>

          {/* Charging Stations Along Route Section */}
          <div className="bg-white border border-[#BAE6FD] rounded-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="text-xs font-bold text-[#0F172A] font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0284C7]" />
                <span>Nearby Chargers Along Route ({routeChargers.length})</span>
              </h3>
              <span className="text-[11px] font-mono text-[#64748B]">Click to change planned stop</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {routeChargers.map(rc => {
                const isSelected = rc.charger.id === prediction.bestCharger.id;
                return (
                  <div
                    key={rc.charger.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#F0F9FF] border-[#0284C7] ring-1 ring-[#0284C7]'
                        : 'bg-white border-[#E2E8F0] hover:border-[#BAE6FD]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7]">
                        Km {rc.distanceKm} • {rc.offsetKm} km off route
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#16A34A]">
                        {rc.charger.powerKw} kW
                      </span>
                    </div>
                    <h4 className="text-xs font-bold font-mono text-[#0F172A] truncate">
                      {rc.charger.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E2E8F0]/60">
                      <span className="text-[11px] font-mono font-bold text-[#475569]">
                        {formatCurrency(rc.charger.priceRate)}/kWh
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <span className="text-[10px] font-mono font-bold text-[#0284C7] px-2 py-1 rounded bg-[#E0F2FE]">
                            Active Stop ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedStopId(rc.charger.id)}
                            className="text-[10px] font-mono font-bold text-[#0284C7] hover:bg-[#E0F2FE] px-2 py-1 rounded border border-[#BAE6FD]"
                          >
                            Select Stop
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setBookingModalCharger(rc.charger)}
                          className="text-[10px] font-mono font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] px-2.5 py-1 rounded shadow-xs"
                        >
                          Book Bay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Planned Charging Stop Action Card (if discharge predicted) */}
          {prediction.willDischarge && (
            <div className="bg-white border-2 border-[#0284C7] rounded-card p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-mono font-bold text-[10px] border border-[#BAE6FD]">
                      PLANNED STOP • KM {prediction.stopDistanceKm}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#16A34A] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      {prediction.bestCharger.powerKw} kW Fast Bay
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mt-1 font-mono">
                    {prediction.bestCharger.title}
                  </h3>
                </div>

                {/* 1-Click Book Slot Button */}
                <button
                  type="button"
                  onClick={() => setBookingModalCharger(prediction.bestCharger)}
                  className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
                >
                  <Calendar className="w-4 h-4" />
                  <span>BOOK CHARGING SLOT</span>
                </button>
              </div>

              {/* Charging Stop Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 font-mono text-center">
                <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] uppercase block">Arrival Battery</span>
                  <span className="text-base font-bold text-[#D97706]">{prediction.arrivalSocAtStop}% SoC</span>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] uppercase block">Charge Needed</span>
                  <span className="text-base font-bold text-[#0284C7]">+{prediction.kwhToCharge} kWh</span>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] uppercase block">Dwell Time</span>
                  <span className="text-base font-bold text-[#0F172A]">{prediction.chargingTimeMinutes} mins</span>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] uppercase block">Est. Cost</span>
                  <span className="text-base font-bold text-[#16A34A]">{formatCurrency(prediction.chargingCost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Battery Discharge Curve & Journey Timeline */}
          <div className="bg-white border border-[#BAE6FD] rounded-card p-4 space-y-3.5 shadow-sm">
            <h3 className="text-sm font-bold text-[#0F172A] font-mono flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-[#0284C7]" />
                <span>Battery Level (SoC vs Distance)</span>
              </span>
              <span className="text-xs text-[#64748B] font-normal">
                Trip Duration: <strong className="text-[#0F172A]">{Math.floor(prediction.totalTripTimeMinutes / 60)}h {prediction.totalTripTimeMinutes % 60}m</strong>
              </span>
            </h3>

            {/* SVG SoC Telemetry Graph */}
            <div className="w-full h-44 pt-2">
              <svg viewBox="0 0 600 160" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="safeSocGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Critical 15% threshold dashed line */}
                <line x1="0" y1="135" x2="600" y2="135" stroke="#FECDD3" strokeDasharray="3,3" strokeWidth="1.5" />
                <text x="5" y="130" fill="#DC2626" fontSize="9" fontFamily="monospace">15% Critical Reserve Threshold</text>

                {/* 50% line */}
                <line x1="0" y1="80" x2="600" y2="80" stroke="#E2E8F0" strokeDasharray="3,3" />
                
                {prediction.willDischarge ? (
                  <>
                    {/* Uncharged failure trajectory (Red dashed curve plunging to 0%) */}
                    <line 
                      x1="0" 
                      y1={160 - (startSocPercentage * 1.4)} 
                      x2={(prediction.dischargeDistanceKm / tripDistanceKm) * 600} 
                      y2="155" 
                      stroke="#FDA4AF" 
                      strokeDasharray="4,4" 
                      strokeWidth="2" 
                    />

                    {/* Optimized Charging Stop Path: 
                        1. Start to Stop: (0, startY) to (stopX, arrivalY)
                        2. Rapid Charging Step: (stopX, arrivalY) to (stopX, 80% Y)
                        3. Stop to Destination: (stopX, 80% Y) to (600, finalArrivalY)
                    */}
                    {(() => {
                      const stopX = (prediction.stopDistanceKm / tripDistanceKm) * 600;
                      const startY = 160 - (startSocPercentage * 1.4);
                      const arrivalY = 160 - (prediction.arrivalSocAtStop * 1.4);
                      const boostedY = 160 - (prediction.targetDepartureSoc * 1.4);
                      const finalY = 160 - (prediction.finalArrivalSoc * 1.4);

                      return (
                        <>
                          {/* Shaded Area */}
                          <polygon
                            points={`0,160 0,${startY} ${stopX},${arrivalY} ${stopX},${boostedY} 600,${finalY} 600,160`}
                            fill="url(#safeSocGradient)"
                          />

                          {/* Polyline */}
                          <polyline
                            fill="none"
                            stroke="#0284C7"
                            strokeWidth="3"
                            points={`0,${startY} ${stopX},${arrivalY} ${stopX},${boostedY} 600,${finalY}`}
                          />

                          {/* Stop Node */}
                          <circle cx={stopX} cy={arrivalY} r="5" fill="#FFFFFF" stroke="#D97706" strokeWidth="3" />
                          <circle cx={stopX} cy={boostedY} r="5" fill="#FFFFFF" stroke="#16A34A" strokeWidth="3" />

                          {/* Node label */}
                          <text x={stopX + 8} y={boostedY + 12} fill="#0284C7" fontSize="10" fontFamily="monospace" fontWeight="bold">
                            +⚡ Stop (80%)
                          </text>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {/* Direct safe curve */}
                    {(() => {
                      const startY = 160 - (startSocPercentage * 1.4);
                      const finalY = 160 - (prediction.finalArrivalSoc * 1.4);

                      return (
                        <>
                          <polygon
                            points={`0,160 0,${startY} 600,${finalY} 600,160`}
                            fill="url(#safeSocGradient)"
                          />
                          <polyline
                            fill="none"
                            stroke="#16A34A"
                            strokeWidth="3"
                            points={`0,${startY} 600,${finalY}`}
                          />
                        </>
                      );
                    })()}
                  </>
                )}

                {/* X Axis milestones */}
                <circle cx="0" cy={160 - (startSocPercentage * 1.4)} r="4" fill="#16A34A" />
                <circle cx="600" cy={160 - (prediction.finalArrivalSoc * 1.4)} r="4" fill="#0284C7" />
              </svg>

              {/* X Axis distance marks */}
              <div className="flex justify-between text-[10px] font-mono text-[#64748B] pt-2 px-1">
                <span>0 km (Start: {startSocPercentage}%)</span>
                {prediction.willDischarge && (
                  <span className="text-[#0284C7] font-bold">Km {prediction.stopDistanceKm} (Charge)</span>
                )}
                <span>{tripDistanceKm} km (Arrive: {prediction.finalArrivalSoc}%)</span>
              </div>
            </div>

            {/* Turn-by-Turn Journey Milestones */}
            <div className="border-t border-[#E2E8F0] pt-4 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <div className="flex-1">
                  <strong>Depart {originInput}</strong> with <span className="text-[#16A34A] font-bold">{startSocPercentage}% battery</span>.
                </div>
                <span className="text-[#94A3B8]">0 km</span>
              </div>

              {prediction.willDischarge && (
                <div className="flex items-center gap-3 bg-[#F0F9FF] p-2.5 rounded-xl border border-[#BAE6FD]">
                  <span className="w-6 h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    <strong>Stop & Fast Charge:</strong> {prediction.bestCharger.title}. Plug in at <strong>{prediction.arrivalSocAtStop}%</strong>, charge for <strong>{prediction.chargingTimeMinutes} mins</strong> up to <strong>80%</strong>.
                  </div>
                  <span className="text-[#0284C7] font-bold">Km {prediction.stopDistanceKm}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold text-[11px] shrink-0">
                  {prediction.willDischarge ? '3' : '2'}
                </span>
                <div className="flex-1">
                  <strong>Arrive at {destInput}</strong> with a safe reserve of <strong className="text-[#0284C7]">{prediction.finalArrivalSoc}% battery</strong>.
                </div>
                <span className="text-[#94A3B8]">{tripDistanceKm} km</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Booking Modal (if user clicks "Book Charging Slot" on recommended station) */}
      {bookingModalCharger && (
        <ChargerDetailModal
          charger={bookingModalCharger}
          onClose={() => setBookingModalCharger(null)}
          onBookingSuccess={() => {
            setBookingModalCharger(null);
          }}
        />
      )}

    </div>
  );
};
