import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  X, 
  Repeat, 
  Zap, 
  Radio, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Car, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp, 
  BatteryCharging, 
  DollarSign,
  Navigation,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { V2VReverseChargeRequest, ActiveOnlineDriver } from '../../types';

interface V2VReverseChargingModalProps {
  onClose: () => void;
}

// Haversine formula to compute live distance in km
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

export const V2VReverseChargingModal: React.FC<V2VReverseChargingModalProps> = ({ onClose }) => {
  const { 
    currentUser, 
    formatCurrency, 
    v2vRequests, 
    createV2VRequest, 
    acceptV2VRequest, 
    startV2VTransfer, 
    completeV2VTransfer, 
    cancelV2VRequest,
    userCoords,
    onlineDrivers,
    sendDirectV2VRequest 
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkersRef = useRef<{ [key: string]: L.Marker }>({});

  const [activeTab, setActiveTab] = useState<'request' | 'donor'>('request');
  
  // Request form state
  const [currentSoc, setCurrentSoc] = useState(4);
  const [requestedKwh, setRequestedKwh] = useState(8.0);
  const [offeredPayout, setOfferedPayout] = useState(450);
  const [highwayName, setHighwayName] = useState('NH-48 Highway Northbound (KM 142 Shoulder)');
  const [selectedPeerDriver, setSelectedPeerDriver] = useState<ActiveOnlineDriver | null>(null);

  const [vehicleMake, setVehicleMake] = useState(
    currentUser?.vehicle ? `${currentUser.vehicle.make} ${currentUser.vehicle.model}` : 'Tata Nexon EV Max'
  );

  // Filter only drivers with website opened in background / active heartbeat
  const liveActiveDrivers = onlineDrivers.filter(
    d => d.isOnline && d.id !== currentUser?.id
  );

  // My current active request if I am stranded
  const myActiveRequest = v2vRequests.find(
    r => r.strandedDriverId === currentUser?.id && r.status !== 'completed' && r.status !== 'cancelled'
  );

  // Active mission if I am the donor
  const donorMission = v2vRequests.find(
    r => r.donorDriverId === currentUser?.id && r.status !== 'completed' && r.status !== 'cancelled'
  );

  // Simulated energy transfer ticker
  const [transferredLiveKwh, setTransferredLiveKwh] = useState(0.8);

  useEffect(() => {
    let timer: any;
    if ((myActiveRequest && myActiveRequest.status === 'transferring') || (donorMission && donorMission.status === 'transferring')) {
      timer = setInterval(() => {
        setTransferredLiveKwh(prev => Number((prev + 0.3).toFixed(1)));
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [myActiveRequest?.status, donorMission?.status]);

  // Leaflet Interactive Radar Map
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

    // My Location Marker (Emergency Red SOS Pin)
    const myIcon = L.divIcon({
      className: 'my-v2v-location-pin',
      html: `
        <div class="flex flex-col items-center -translate-y-4">
          <div style="background-color: #E11D48; color: white;" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap mb-1 shadow-md border border-white flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>My Stranded EV</span>
          </div>
          <div class="w-7 h-7 rounded-full bg-[#E11D48] border-2 border-white shadow-lg flex items-center justify-center text-white">
            <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [120, 52],
      iconAnchor: [60, 50],
    });

    L.marker(userCoords, { icon: myIcon, zIndexOffset: 1000 })
      .bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 11px;">
          <strong style="color: #E11D48;">Your Stranded EV Position</strong>
          <div>GPS: ${userCoords[0].toFixed(4)}, ${userCoords[1].toFixed(4)}</div>
          <div style="color: #64748B;">SoC: ${currentSoc}% • SOS Radar Active</div>
        </div>
      `)
      .addTo(map);

    // Draw Radar Circle
    L.circle(userCoords, {
      radius: 6000,
      color: '#E11D48',
      weight: 1.5,
      dashArray: '4, 8',
      fillColor: '#E11D48',
      fillOpacity: 0.04,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Online Driver Markers on Radar Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old driver markers
    Object.values(driverMarkersRef.current).forEach(m => m.remove());
    driverMarkersRef.current = {};

    liveActiveDrivers.forEach(driver => {
      const dist = getDistanceKm(userCoords[0], userCoords[1], driver.lat, driver.lng);
      const isSelected = selectedPeerDriver?.id === driver.id;

      const driverIcon = L.divIcon({
        className: 'online-driver-pin',
        html: `
          <div class="flex flex-col items-center cursor-pointer transform hover:scale-110 transition-transform ${isSelected ? 'scale-125 z-50' : ''}">
            <div style="background-color: #0284C7; color: white;" class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold whitespace-nowrap mb-1 shadow-md border border-white flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></span>
              <span>${driver.name.split(' ')[0]} (${dist} km)</span>
            </div>
            <div class="w-6 h-6 rounded-full bg-[#0284C7] border-2 border-white shadow-md flex items-center justify-center text-white">
              <span class="text-[9px] font-bold font-mono">${driver.batterySoc}%</span>
            </div>
          </div>
        `,
        iconSize: [110, 44],
        iconAnchor: [55, 42],
      });

      const marker = L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 11px; padding: 2px;">
          <strong style="color: #0F172A; display: block;">${driver.name}</strong>
          <span style="color: #0284C7; font-weight: bold;">${driver.vehicle}</span>
          <div style="color: #16A34A; font-mono; font-size: 10px; margin-top: 2px;">
            Battery: ${driver.batterySoc}% • V2V Output: ${driver.v2vOutputKw} kW
          </div>
          <div style="color: #64748B; font-size: 10px; margin-top: 2px;">
            Distance: ${dist} km away • Tab Active
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedPeerDriver(driver);
      });

      driverMarkersRef.current[driver.id] = marker;
    });
  }, [liveActiveDrivers, userCoords, selectedPeerDriver]);

  const handleBroadcastSOS = () => {
    if (!currentUser) {
      alert('Please sign in to broadcast V2V request.');
      return;
    }

    createV2VRequest({
      strandedDriverId: currentUser.id,
      strandedDriverName: currentUser.name,
      strandedDriverPhone: currentUser.phone || '+91 99887-76655',
      strandedVehicle: vehicleMake,
      location: {
        lat: userCoords[0],
        lng: userCoords[1],
        highwayName,
      },
      currentSoc,
      requestedKwh,
      offeredPayout,
    });
  };

  const handleDirectSOS = (targetDriver: ActiveOnlineDriver) => {
    if (!currentUser) {
      alert('Please sign in to request V2V charging.');
      return;
    }
    sendDirectV2VRequest(targetDriver.id, requestedKwh, offeredPayout);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#BAE6FD] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative my-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#BAE6FD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#E11D48]">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  Highway V2V Reverse Charge Grid
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-mono font-bold border border-[#86EFAC] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                  <span>{liveActiveDrivers.length} Online Drivers in Radar</span>
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-mono">
                Peer-to-peer vehicle-to-vehicle bidirectional power transfer. Real-time background active driver network.
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

        {/* Mode Selector */}
        <div className="flex rounded-xl bg-[#F1F5F9] p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'request'
                ? 'bg-white text-[#E11D48] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
            <span>I Am Stranded (Broadcast SOS / Request Passing EV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donor')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'donor'
                ? 'bg-white text-[#0284C7] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Radio className="w-4 h-4 text-[#0284C7]" />
            <span>Passing Driver Radar ({v2vRequests.filter(r => r.status === 'broadcasting').length} Active Missions)</span>
          </button>
        </div>

        {/* Live Active Mission Telemetry (if either user is in active session) */}
        {(myActiveRequest || donorMission) ? (
          (() => {
            const currentMission = myActiveRequest || donorMission!;
            return (
              <div className="p-6 rounded-2xl bg-[#F0F9FF] border-2 border-[#0284C7] space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#0284C7] uppercase px-3 py-1 rounded-full bg-white border border-[#BAE6FD]">
                    Session #{currentMission.id}
                  </span>
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                    currentMission.status === 'transferring'
                      ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] animate-pulse'
                      : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                  }`}>
                    {currentMission.status === 'transferring' ? 'REVERSE CHARGING IN PROGRESS' : 'DONOR APPROACHING ON HIGHWAY'}
                  </span>
                </div>

                {/* Car-to-Car Diagram */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center font-mono">
                  {/* Donor Car */}
                  <div className="p-4 bg-white rounded-xl border border-[#CBD5E1] space-y-1">
                    <span className="text-[10px] text-[#64748B] block font-bold uppercase">DONOR VEHICLE</span>
                    <h4 className="font-bold text-sm text-[#0F172A] truncate">
                      {currentMission.donorVehicle || 'Passing Hyundai Ioniq 5'}
                    </h4>
                    <p className="text-xs text-[#0284C7]">{currentMission.donorDriverName || 'Good Samaritan Driver'}</p>
                    <span className="text-[11px] text-[#16A34A] font-bold block mt-1">Bidirectional V2V Output: 11 kW</span>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="w-12 h-12 rounded-full bg-[#0284C7] text-white flex items-center justify-center shadow-md animate-bounce">
                      <Zap className="w-6 h-6 fill-white" />
                    </div>
                    <span className="text-[11px] text-[#0284C7] font-bold font-mono">11 kW Flow Rate</span>
                    <span className="text-[10px] text-[#64748B]">CCS2 Bidirectional Cable</span>
                  </div>

                  {/* Stranded Car */}
                  <div className="p-4 bg-white rounded-xl border border-[#CBD5E1] space-y-1">
                    <span className="text-[10px] text-[#64748B] block font-bold uppercase">STRANDED RECEIVER</span>
                    <h4 className="font-bold text-sm text-[#0F172A] truncate">
                      {currentMission.strandedVehicle}
                    </h4>
                    <p className="text-xs text-[#E11D48]">
                      SOC: {currentMission.currentSoc}% &rarr; {currentMission.currentSoc + Math.min(15, Math.round(transferredLiveKwh * 1.8))}%
                    </p>
                    <span className="text-[11px] text-[#16A34A] font-bold block mt-1">
                      Received: {transferredLiveKwh} / {currentMission.requestedKwh} kWh
                    </span>
                  </div>
                </div>

                {/* Telemetry Progress */}
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Emergency Energy Transferred:</span>
                    <strong className="text-[#0284C7] text-sm">{transferredLiveKwh} kWh of {currentMission.requestedKwh} kWh</strong>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0284C7] to-[#16A34A] transition-all duration-300"
                      style={{ width: `${Math.min(100, (transferredLiveKwh / currentMission.requestedKwh) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => cancelV2VRequest(currentMission.id)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#E11D48] text-xs font-mono hover:bg-[#FFF1F2] transition-colors"
                  >
                    Abort Mission
                  </button>

                  {currentMission.status === 'accepted' ? (
                    <button
                      type="button"
                      onClick={() => startV2VTransfer(currentMission.id)}
                      className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Lock Cables & Start 11 kW Transfer</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => completeV2VTransfer(currentMission.id, transferredLiveKwh)}
                      className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settle Transfer & Release Payout ({formatCurrency(currentMission.offeredPayout)})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })()
        ) : activeTab === 'request' ? (
          /* Mode A: Stranded Driver Request */
          <div className="space-y-4">
            
            {/* Real-time Highway Radar Map */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-[#E11D48] animate-pulse" />
                  <span>Live Highway Radar (Active Online EV Drivers Nearby)</span>
                </span>
                <span className="text-[#16A34A] font-bold text-[11px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                  <span>Syncing browser background sessions</span>
                </span>
              </div>

              {/* Leaflet Map Canvas */}
              <div className="relative w-full h-52 rounded-xl overflow-hidden border border-[#BAE6FD] shadow-xs z-0 isolate">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                <span>Red beacon = Your vehicle | Blue pins = Passing EV drivers with website open in background</span>
                <span className="text-[#0284C7] font-bold">GPS: {userCoords[0].toFixed(4)}, {userCoords[1].toFixed(4)}</span>
              </div>
            </div>

            {/* Online EV Drivers List (Direct Request or Broadcast) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#0F172A] uppercase">Active EV Drivers on Your Travel Corridor:</span>
                <span className="text-[11px] text-[#64748B]">Click driver to send direct SOS</span>
              </div>

              {liveActiveDrivers.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-center text-xs text-[#64748B] font-mono">
                  No other EV drivers currently online on this highway. You can broadcast an SOS beacon below.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-44 overflow-y-auto">
                  {liveActiveDrivers.map(driver => {
                    const dist = getDistanceKm(userCoords[0], userCoords[1], driver.lat, driver.lng);
                    const isSelected = selectedPeerDriver?.id === driver.id;

                    return (
                      <div
                        key={driver.id}
                        onClick={() => setSelectedPeerDriver(driver)}
                        className={`p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#F0F9FF] border-[#0284C7] ring-2 ring-[#0284C7]/20 shadow-xs'
                            : 'bg-white border-[#CBD5E1] hover:border-[#0284C7]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                            <strong className="text-[#0F172A]">{driver.name}</strong>
                          </div>
                          <span className="font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded text-[10px]">
                            {dist} km away
                          </span>
                        </div>

                        <div className="text-[11px] text-[#475569] space-y-0.5">
                          <p className="truncate font-semibold">{driver.vehicle}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                            <span>Battery: <strong className="text-[#16A34A]">{driver.batterySoc}%</strong></span>
                            <span>Output: <strong>{driver.v2vOutputKw} kW</strong></span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                          <span className="text-[9px] text-[#64748B] uppercase">Tab Active in Background</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectSOS(driver);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-[10px] shadow-xs"
                          >
                            Send Direct SOS
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Request Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
              <div>
                <label className="font-bold text-[#475569] block mb-1">Current Battery (SOC %)</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={currentSoc}
                  onChange={e => setCurrentSoc(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#E11D48] font-bold focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">Energy Needed (kWh)</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  step="0.5"
                  value={requestedKwh}
                  onChange={e => setRequestedKwh(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0284C7] font-bold focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">Offered Payout to Driver</label>
                <input
                  type="number"
                  min="200"
                  max="1500"
                  step="50"
                  value={offeredPayout}
                  onChange={e => setOfferedPayout(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#16A34A] font-bold focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Broadcast Button */}
            <button
              type="button"
              onClick={handleBroadcastSOS}
              className="w-full py-3.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-mono font-bold text-xs tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4 animate-ping" />
              <span>BROADCAST SOS TO ALL PASSING EV DRIVERS • REWARD {formatCurrency(offeredPayout)}</span>
            </button>
          </div>
        ) : (
          /* Mode B: Passing EV Donor Radar */
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#0284C7]" />
                  <span>Nearby Highway V2V SOS Broadcasts</span>
                </h3>
                <p className="text-xs text-[#64748B] font-sans mt-0.5">
                  Stranded vehicles on your highway travel corridor. Deliver 5-10 kWh using your bidirectional V2V adapter and earn instant compensation.
                </p>
              </div>
            </div>

            {v2vRequests.filter(r => r.status === 'broadcasting').length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B] border border-dashed border-[#CBD5E1] rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2 opacity-80" />
                <p className="font-bold text-[#0F172A]">Zero Active Stranded Vehicles</p>
                <p className="font-sans text-[11px] text-[#64748B] mt-0.5">
                  All passing highway vehicles are currently charged. Emergency broadcasts will alert you immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {v2vRequests
                  .filter(r => r.status === 'broadcasting')
                  .map(req => (
                    <div 
                      key={req.id} 
                      className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E11D48] text-white">
                            SOS ACTIVE
                          </span>
                          <span className="font-bold text-xs text-[#0F172A]">{req.strandedVehicle}</span>
                          <span className="text-xs text-[#E11D48] font-bold">({req.currentSoc}% Battery Remaining)</span>
                        </div>
                        <p className="text-xs text-[#475569] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                          <span>{req.location.highwayName}</span>
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          Driver: <strong className="text-[#0F172A]">{req.strandedDriverName}</strong> • Requesting {req.requestedKwh} kWh
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        <span className="text-base font-bold text-[#16A34A]">
                          +{formatCurrency(req.offeredPayout)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            acceptV2VRequest(
                              req.id, 
                              currentUser?.id || 'usr-donor-01', 
                              currentUser?.name || 'Alex Donor (Passing Ioniq 5)', 
                              currentUser?.vehicle ? `${currentUser.vehicle.make} ${currentUser.vehicle.model}` : 'Hyundai Ioniq 5 (V2V)'
                            );
                          }}
                          className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>Accept Mission</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
