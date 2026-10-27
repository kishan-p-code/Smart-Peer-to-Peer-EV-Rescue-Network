import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  X, 
  Truck, 
  BatteryCharging, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Navigation, 
  ChevronRight, 
  Phone, 
  Zap,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BatteryDeliveryRequest } from '../../types';

interface BatteryDeliveryModalProps {
  onClose: () => void;
}

// Distance helper
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

export const BatteryDeliveryModal: React.FC<BatteryDeliveryModalProps> = ({ onClose }) => {
  const { 
    currentUser, 
    chargers, 
    formatCurrency, 
    batteryDeliveries, 
    requestBatteryDelivery, 
    completeBatteryDelivery, 
    cancelBatteryDelivery,
    userCoords,
    setUserCoords 
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [pinCoords, setPinCoords] = useState<[number, number]>(userCoords || [37.7749, -122.4194]);

  // Find and rank nearest hubs that offer battery delivery based on user's live location
  const batteryHubs = chargers.filter(c => c.offersBatteryDelivery);
  const defaultHub = chargers[0] || {
    id: 'hub-metro-01',
    hostId: 'usr-hub-demo',
    hostName: 'Marcus Vance Metro Hub',
    approxAddress: 'Financial District Bay 4 (2.4 km away)',
    lat: 37.7749,
    lng: -122.4194,
    batteryStockCount: 8,
  };

  const hubsWithDistance = React.useMemo(() => {
    const list = batteryHubs.length > 0 ? batteryHubs : [defaultHub];
    return list.map(h => ({
      ...h,
      distanceKm: getDistanceKm(pinCoords[0], pinCoords[1], h.lat, h.lng),
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [batteryHubs, pinCoords]);

  const nearestHub = hubsWithDistance[0] || defaultHub;
  const [selectedHubId, setSelectedHubId] = useState(nearestHub.hostId);

  // Automatically update selectedHubId when nearest hub changes based on GPS location
  useEffect(() => {
    if (nearestHub) {
      setSelectedHubId(nearestHub.hostId);
    }
  }, [nearestHub.hostId]);

  const [batterySpec, setBatterySpec] = useState(
    currentUser?.vehicle?.batteryType || '51.1V 3.7kWh Quick-Swap Pack'
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Highway Shoulder / Near Central Park Gate 3, 4th Cross Road'
  );
  const [driverPhone, setDriverPhone] = useState(currentUser?.phone || '+91 98765-43210');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Active delivery for current user if any
  const activeDelivery = batteryDeliveries.find(
    d => d.driverId === currentUser?.id && d.status !== 'delivered' && d.status !== 'cancelled'
  );

  const deliveryFee = 120;
  const batterySwapFee = 280;
  const totalCost = deliveryFee + batterySwapFee;

  // Initialize interactive map for live location fetching
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: pinCoords,
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Delivery drop pin
    const deliveryIcon = L.divIcon({
      className: 'battery-drop-pin',
      html: `
        <div class="flex flex-col items-center cursor-move -translate-y-4">
          <div style="background-color: #0284C7; color: white;" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap mb-1 shadow-md border border-white">
            Delivery Drop Point
          </div>
          <div class="w-6 h-6 rounded-full bg-[#0284C7] border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
          </div>
        </div>
      `,
      iconSize: [130, 48],
      iconAnchor: [65, 46],
    });

    const marker = L.marker(pinCoords, { icon: deliveryIcon, draggable: true }).addTo(map);
    userMarkerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const newCoords: [number, number] = [Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5))];
      setPinCoords(newCoords);
      setUserCoords(newCoords);
      setDeliveryAddress(`GPS Location (${newCoords[0]}, ${newCoords[1]}) - Driver Standby`);
    });

    // Render Hub markers that offer battery delivery
    batteryHubs.forEach(hub => {
      const hubIcon = L.divIcon({
        className: 'hub-battery-pin',
        html: `
          <div class="flex flex-col items-center">
            <div style="background-color: #16A34A; color: white;" class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold whitespace-nowrap mb-1 shadow-md border border-white">
              Hub (${hub.batteryStockCount || 5} Packs)
            </div>
            <div class="w-5 h-5 rounded-full bg-[#16A34A] border-2 border-white shadow-md flex items-center justify-center text-white">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
          </div>
        `,
        iconSize: [110, 40],
        iconAnchor: [55, 38],
      });

      const hubMarker = L.marker([hub.lat, hub.lng], { icon: hubIcon }).addTo(map);
      hubMarker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 2px;">
          <strong style="color: #0F172A; display: block;">${hub.title}</strong>
          <span style="color: #16A34A; font-weight: bold;">${hub.batteryStockCount || 5} Swappable Packs Ready</span>
        </div>
      `);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleFetchCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          const newCoords: [number, number] = [Number(pos.coords.latitude.toFixed(5)), Number(pos.coords.longitude.toFixed(5))];
          setPinCoords(newCoords);
          setUserCoords(newCoords);
          setDeliveryAddress(`Live GPS Standby: ${newCoords[0]}, ${newCoords[1]} (Highway Shoulder)`);
          setIsLocating(false);

          if (mapInstanceRef.current && userMarkerRef.current) {
            mapInstanceRef.current.flyTo(newCoords, 15, { animate: true, duration: 1 });
            userMarkerRef.current.setLatLng(newCoords);
          }
        },
        () => {
          setIsLocating(false);
          alert('Could not acquire GPS position. You can drag the pin on the map to set your location.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleOrder = () => {
    if (!currentUser) {
      alert('Please sign in to order battery delivery.');
      return;
    }
    setIsSubmitting(true);

    const chosenHub = nearestHub;
    const eta = Math.max(10, Math.round((nearestHub.distanceKm || 2) * 4.5));

    requestBatteryDelivery({
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverPhone: driverPhone,
      driverLocation: {
        lat: pinCoords[0],
        lng: pinCoords[1],
        address: deliveryAddress,
      },
      vehicleInfo: currentUser.vehicle ? `${currentUser.vehicle.make} ${currentUser.vehicle.model}` : 'Swappable EV Two-Wheeler',
      batterySpec: batterySpec,
      hubId: chosenHub.hostId || 'usr-hub-demo',
      hubName: chosenHub.hostName || 'Marcus Vance Metro Hub',
      hubPhone: '+91 98111-22334',
      etaMinutes: eta,
      deliveryFee,
      batterySwapFee,
      totalCost,
    });

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#BAE6FD] rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative my-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#BAE6FD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <span>Doorstep Swappable Battery Delivery</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] font-bold border border-[#BAE6FD]">
                  On-Demand
                </span>
              </h2>
              <p className="text-xs text-[#64748B] font-mono">
                Discharged on the road? The nearest Hub dispatches a fresh 100% charged battery pack.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shadow-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If Active Delivery In Progress */}
        {activeDelivery ? (
          <div className="p-6 rounded-2xl bg-[#F0F9FF] border-2 border-[#0284C7] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#0284C7] uppercase px-3 py-1 rounded-full bg-white border border-[#BAE6FD]">
                Order #{activeDelivery.id}
              </span>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                activeDelivery.status === 'dispatched' 
                  ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] animate-pulse'
                  : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
              }`}>
                {activeDelivery.status === 'dispatched' ? 'RIDER ON THE WAY' : 'DISPATCH PENDING'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-[#BAE6FD]">
                <span className="text-[10px] text-[#64748B] block font-bold">DISPATCHED FROM HUB</span>
                <span className="font-bold text-[#0F172A]">{activeDelivery.hubName}</span>
                <span className="text-[11px] text-[#0284C7] block mt-0.5">{activeDelivery.hubPhone}</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-[#BAE6FD]">
                <span className="text-[10px] text-[#64748B] block font-bold">BATTERY PACK SPEC</span>
                <span className="font-bold text-[#0F172A]">{activeDelivery.batterySpec}</span>
                <span className="text-[11px] text-[#16A34A] block mt-0.5">100% Fully Charged</span>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-[#BAE6FD]">
                <span className="text-[10px] text-[#64748B] block font-bold">ESTIMATED ARRIVAL</span>
                <span className="font-bold text-[#0284C7] text-sm">~{activeDelivery.etaMinutes} Minutes</span>
                <span className="text-[11px] text-[#64748B] block mt-0.5">Rider: {activeDelivery.deliveryPartnerName || 'Express Evio Van'}</span>
              </div>
            </div>

            {/* Delivery address banner */}
            <div className="p-3.5 bg-white rounded-xl border border-[#CBD5E1] text-xs font-mono flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748B] block font-bold">DROP LOCATION</span>
                <span className="text-[#0F172A] font-bold">{activeDelivery.driverLocation.address}</span>
              </div>
              <span className="text-[10px] text-[#0284C7] font-bold">GPS: {activeDelivery.driverLocation.lat.toFixed(4)}, {activeDelivery.driverLocation.lng.toFixed(4)}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => cancelBatteryDelivery(activeDelivery.id)}
                className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#E11D48] text-xs font-mono hover:bg-[#FFF1F2] transition-colors"
              >
                Cancel Order
              </button>

              <button
                type="button"
                onClick={() => {
                  completeBatteryDelivery(activeDelivery.id);
                  alert('Battery swap verified & fresh battery installed!');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Rider Arrived • Confirm Battery Swap</span>
              </button>
            </div>
          </div>
        ) : (
          /* Order Placement View */
          <div className="space-y-4">
            
            {/* Battery Spec Choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-[#0F172A] flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-[#0284C7]" />
                <span>Select Your Vehicle Battery Pack Specification</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { title: '48V 3.2 kWh Pack', subtitle: 'Standard 2W (Ather/Bounce/Ola)', code: '48V 3.2kWh Quick-Swap Pack' },
                  { title: '51.1V 3.7 kWh Pack', subtitle: 'High Range 2W & 3W Cargo', code: '51.1V 3.7kWh Quick-Swap Pack' },
                  { title: '72V 5.0 kWh Pack', subtitle: 'Heavy Duty 3W Commercial', code: '72V 5.0kWh Heavy Commercial Pack' }
                ].map(spec => (
                  <button
                    key={spec.code}
                    type="button"
                    onClick={() => setBatterySpec(spec.code)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      batterySpec === spec.code
                        ? 'bg-[#E0F2FE] border-[#0284C7] shadow-xs ring-1 ring-[#0284C7]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] hover:bg-white'
                    }`}
                  >
                    <span className="font-mono font-bold text-xs text-[#0F172A] block">{spec.title}</span>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">{spec.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Map with Location Fetching */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#0284C7]" />
                  <span>Pin Your Exact Standby / Breakdown Location</span>
                </span>

                <button
                  type="button"
                  onClick={handleFetchCurrentLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] font-bold text-xs shadow-xs transition-all"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Acquiring GPS...' : 'Fetch My Current Location'}</span>
                </button>
              </div>

              {/* Map Canvas */}
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[#BAE6FD] shadow-xs z-0 isolate">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                <span>Drag pin to reposition exact delivery drop point</span>
                <span className="text-[#0284C7] font-bold">Coordinates: {pinCoords[0].toFixed(5)}, {pinCoords[1].toFixed(5)}</span>
              </div>
            </div>

            {/* Address Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="font-bold text-[#475569] block mb-1">Landmark / Highway Address</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Near Flyover Exit 14, Highway NH-48"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">Driver Phone Number</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={e => setDriverPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Nearest Hub Auto-Assigned by Location */}
            <div className="p-3.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#BAE6FD]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0284C7]" />
                  <div>
                    <span className="font-bold text-[#0F172A] block">{nearestHub.hostName}</span>
                    <span className="text-[10px] text-[#0284C7] font-semibold">
                      Nearest Hub ({nearestHub.distanceKm?.toFixed(1) || '1.8'} km away from your location)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[#16A34A] font-bold block">
                    ETA ~{Math.max(10, Math.round((nearestHub.distanceKm || 2) * 4.5))} Mins
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    {nearestHub.batteryStockCount || 8} Charged Packs Ready
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[#64748B] text-[11px]">
                <span>Fresh 100% Battery Pack Charge</span>
                <span>{formatCurrency(batterySwapFee)}</span>
              </div>
              <div className="flex justify-between text-[#64748B] text-[11px]">
                <span>On-Demand Express Delivery Fee</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="pt-2 border-t border-[#BAE6FD] flex justify-between font-bold text-sm text-[#0F172A]">
                <span>Total Delivery & Swap Fee</span>
                <span className="text-[#0284C7] text-base">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={handleOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs tracking-wider shadow-md shadow-[#0284C7]/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>DISPATCH EMERGENCY BATTERY DELIVERY • {formatCurrency(totalCost)}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
