import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  X, 
  Building2, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  Layers, 
  MapPin, 
  Navigation, 
  Clock, 
  FileText,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FranchiseApplication } from '../../types';

interface FranchiseModalProps {
  onClose: () => void;
}

export const FranchiseModal: React.FC<FranchiseModalProps> = ({ onClose }) => {
  const { 
    currentUser, 
    formatCurrency, 
    submitFranchiseApplication, 
    franchiseApplications,
    updateFranchiseStatus,
    userCoords,
    setUserCoords 
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);

  const [activeTab, setActiveTab] = useState<'apply' | 'status'>('apply');
  const [selectedPackage, setSelectedPackage] = useState<'micro' | 'commercial' | 'highway'>('commercial');
  
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98450-12345');
  const [city, setCity] = useState('Pune / Expressway Corridor');
  const [locationAddress, setLocationAddress] = useState('Plot 42, Highway Rest Plaza or Commercial Complex');
  const [landType, setLandType] = useState<'owned' | 'leased'>('owned');
  const [powerSanctionKw, setPowerSanctionKw] = useState(100);
  const [notes, setNotes] = useState('Site has 24/7 commercial access, dedicated parking bays, and nearby restaurant amenities.');
  
  const [pinCoords, setPinCoords] = useState<[number, number]>(userCoords || [37.7749, -122.4194]);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // My applications
  const myApplications = franchiseApplications.filter(
    app => app.email.toLowerCase() === (currentUser?.email || email).toLowerCase() || app.applicantName === currentUser?.name
  );

  // Package architecture configurations without fixed prices
  const packages = [
    {
      type: 'micro' as const,
      name: 'Micro-Hub Setup',
      subtitle: 'Societies, Cafes & Retail Parking Lots',
      hardware: '2x 22 kW Dual AC Fast Wallboxes + EVIO Cloud Gateway + Bi-directional Smart Meters',
      powerNeeded: '45 kVA Feeder Line',
      chargersIncluded: '2 High-Speed AC Charging Bays',
      badge: 'Starter Commercial',
    },
    {
      type: 'commercial' as const,
      name: 'Commercial Fast-Hub',
      subtitle: 'Shopping Malls, Corporate Tech Parks & Urban Junctions',
      hardware: '1x 60 kW Dual DC Fast Gun (CCS-2) + 2x 22 kW AC + Surge Isolation Breaker Panel + Canopy Signage',
      powerNeeded: '100 kVA Substation Feeder',
      chargersIncluded: '3 Simultaneous Multi-Gun Bays (DC + AC)',
      badge: 'Most Popular',
    },
    {
      type: 'highway' as const,
      name: 'Highway Mega-Hub + Battery Swap',
      subtitle: 'Expressways, National Highways & Heavy Transport Corridors',
      hardware: '2x 120 kW Ultra-Fast DC Guns (Dual CCS-2) + 8-Bay Swappable Battery Cabinet + Solar Microgrid Inverter',
      powerNeeded: '250 kVA Dedicated Transformer',
      chargersIncluded: '4 Ultra-Fast DC Bays + 8 Swappable Battery Slots',
      badge: 'Maximum Revenue',
    }
  ];

  // Leaflet location picker map
  useEffect(() => {
    if (activeTab !== 'apply') return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      const map = L.map(mapContainerRef.current, {
        center: pinCoords,
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'franchise-location-pin',
        html: `
          <div class="flex flex-col items-center cursor-move -translate-y-4">
            <div style="background-color: #0284C7; color: white;" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap mb-1 shadow-md border border-white">
              Proposed Hub Site
            </div>
            <div class="w-7 h-7 rounded-full bg-[#0284C7] border-2 border-white shadow-lg flex items-center justify-center text-white">
              <div class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
            </div>
          </div>
        `,
        iconSize: [130, 52],
        iconAnchor: [65, 50],
      });

      const marker = L.marker(pinCoords, { icon: pinIcon, draggable: true }).addTo(map);
      pinMarkerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const coords: [number, number] = [Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5))];
        setPinCoords(coords);
        setLocationAddress(`Proposed EVIO Hub Site (${coords[0]}, ${coords[1]}), ${city}`);
      });

      mapInstanceRef.current = map;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords: [number, number] = [Number(pos.coords.latitude.toFixed(5)), Number(pos.coords.longitude.toFixed(5))];
          setPinCoords(coords);
          setUserCoords(coords);
          setLocationAddress(`GPS Coordinates: ${coords[0]}, ${coords[1]}`);
          setIsLocating(false);

          if (mapInstanceRef.current && pinMarkerRef.current) {
            mapInstanceRef.current.flyTo(coords, 15, { animate: true, duration: 1 });
            pinMarkerRef.current.setLatLng(coords);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !phone || !city) {
      alert('Please fill out your contact and city information.');
      return;
    }

    submitFranchiseApplication({
      applicantName,
      email: email || currentUser?.email || 'applicant@evio.com',
      phone,
      city,
      locationAddress: locationAddress || `Site near ${city}`,
      lat: pinCoords[0],
      lng: pinCoords[1],
      packageType: selectedPackage,
      powerSanctionKw,
      landType,
      notes,
    });

    setIsSubmitted(true);
    setActiveTab('status');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#BAE6FD] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative my-auto space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#BAE6FD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0F172A]">
                  EVIO Turnkey Franchise Hub Program
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] text-[10px] font-mono font-bold border border-[#86EFAC]">
                  Factory-Direct Wholesale
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-mono">
                Set up an EV charging hub with OEM bulk hardware discounts. The Supervisor reviews your site and quotes tailored wholesale rates.
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

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#F1F5F9] p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'apply'
                ? 'bg-white text-[#0284C7] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Apply for Franchise Hub (Map Location & Feeder Specs)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'status'
                ? 'bg-white text-[#16A34A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>My Applications & Supervisor Wholesale Quotations ({myApplications.length})</span>
          </button>
        </div>

        {activeTab === 'apply' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Step 1: Select Proposed Hub Architecture */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#0F172A] uppercase flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#0284C7]" />
                <span>1. Select Hub Architecture & Hardware Configuration</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {packages.map(pkg => {
                  const isSelected = selectedPackage === pkg.type;
                  return (
                    <div
                      key={pkg.type}
                      onClick={() => setSelectedPackage(pkg.type)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-[#0284C7] bg-[#F0F9FF] shadow-sm ring-2 ring-[#0284C7]/20' 
                          : 'border-[#E2E8F0] bg-white hover:border-[#BAE6FD]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            isSelected ? 'bg-[#0284C7] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}>
                            {pkg.badge}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0284C7]" />}
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-[#0F172A]">{pkg.name}</h4>
                          <p className="text-[11px] text-[#64748B] mt-0.5">{pkg.subtitle}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-[#BAE6FD] text-xs font-mono space-y-1">
                          <span className="text-[10px] text-[#0284C7] block font-bold">HARDWARE SPECS</span>
                          <p className="text-[11px] text-[#334155] leading-snug">{pkg.hardware}</p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#E2E8F0] text-xs font-mono">
                        <div className="flex justify-between text-[#64748B] text-[11px]">
                          <span>Grid Power:</span>
                          <span className="font-bold text-[#0F172A]">{pkg.powerNeeded}</span>
                        </div>
                        <div className="mt-2 text-center p-1.5 rounded bg-[#DCFCE7] text-[#16A34A] font-bold text-[10px]">
                          ✓ Rates Quoted Post-Verification
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Interactive Location Picker Map */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#0F172A] flex items-center gap-1.5 uppercase">
                  <MapPin className="w-4 h-4 text-[#0284C7]" />
                  <span>2. Pin Proposed Hub Land / Highway Location on Map</span>
                </span>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] font-bold text-xs shadow-xs transition-all"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
                </button>
              </div>

              {/* Map Canvas */}
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-[#BAE6FD] shadow-xs z-0 isolate">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono">
                <span>Drag the pin to mark your exact land parcel or highway shoulder</span>
                <span className="text-[#0284C7] font-bold">Coordinates: {pinCoords[0].toFixed(5)}, {pinCoords[1].toFixed(5)}</span>
              </div>
            </div>

            {/* Step 3: Site & Contact Details */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-mono font-bold text-[#0F172A] uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0284C7]" />
                <span>3. Applicant Contact & Land Feasibility</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <label className="font-bold text-[#475569] block mb-1">Applicant / Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={e => setApplicantName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singhania"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#475569] block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. partner@energy.in"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#475569] block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 98220-11223"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <label className="font-bold text-[#475569] block mb-1">City / Highway Corridor *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Pune / Mumbai Expressway"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#475569] block mb-1">Land Ownership</label>
                  <select
                    value={landType}
                    onChange={e => setLandType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                  >
                    <option value="owned">Commercial Land Owned</option>
                    <option value="leased">Long-Term Leased (&gt;5 Years)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#475569] block mb-1">Available / Sanctioned Power (kW)</label>
                  <input
                    type="number"
                    min="25"
                    max="500"
                    step="5"
                    value={powerSanctionKw}
                    onChange={e => setPowerSanctionKw(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="text-xs font-mono">
                <label className="font-bold text-[#475569] block mb-1">Site Address & Amenities</label>
                <input
                  type="text"
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  placeholder="e.g. Food Mall Plaza, KM 48 Mumbai-Pune Expressway, Khalapur"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                />
              </div>

              <div className="text-xs font-mono">
                <label className="font-bold text-[#475569] block mb-1">Additional Site Notes (Transformer capacity, daily footfall)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Workflow Notice Banner */}
            <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#16A34A] font-mono">Supervisor Review & Rate Quotation Process</strong>
                <p className="text-[#334155] mt-0.5 leading-relaxed font-sans">
                  Upon submitting your application, our Grid Operations Supervisor will verify your proposed map location, check local substation feeder availability, and dispatch a tailored, subsidized wholesale hardware rate directly to your account.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs tracking-wider shadow-md shadow-[#0284C7]/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>SUBMIT APPLICATION FOR SUPERVISOR LOCATION VERIFICATION & WHOLESALE QUOTATION</span>
            </button>
          </form>
        ) : (
          /* Tab: Status & Supervisor Quotations */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">My Submitted Franchise Applications</h3>
                <p className="text-xs text-[#64748B] font-mono mt-0.5">
                  Track the status of your site application and review wholesale rates quoted by the Supervisor.
                </p>
              </div>
            </div>

            {myApplications.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#64748B] border border-dashed border-[#CBD5E1] rounded-xl font-mono">
                <Building2 className="w-8 h-8 text-[#0284C7] mx-auto mb-2 opacity-60" />
                <p className="font-bold text-[#0F172A]">No Franchise Applications Found</p>
                <p className="mt-1">Fill out the application form with your proposed map coordinates to receive wholesale quotes.</p>
              </div>
            ) : (
              <div className="space-y-3 font-mono">
                {myApplications.map(app => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-white border border-[#BAE6FD] shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                          {app.id}
                        </span>
                        <h4 className="font-bold text-sm text-[#0F172A] capitalize">{app.packageType} Hub Proposal</h4>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase self-start sm:self-auto ${
                        app.status === 'quotation-sent' || app.status === 'approved'
                          ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                          : app.status === 'rejected'
                          ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                          : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                      }`}>
                        {app.status === 'quotation-sent' 
                          ? 'WHOLESALE QUOTATION RECEIVED' 
                          : app.status === 'approved'
                          ? 'WHOLESALE APPROVED'
                          : app.status === 'rejected'
                          ? 'REJECTED'
                          : 'UNDER SUPERVISOR VERIFICATION'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">LOCATION & GPS</span>
                        <span className="text-[#0F172A] font-bold block">{app.city}</span>
                        <span className="text-[11px] text-[#64748B]">{app.lat ? `${app.lat.toFixed(4)}, ${app.lng?.toFixed(4)}` : app.locationAddress}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">SANCTIONED POWER</span>
                        <span className="text-[#0284C7] font-bold">{app.powerSanctionKw} kW</span>
                        <span className="text-[11px] text-[#64748B] block">Land: {app.landType}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">APPLICATION DATE</span>
                        <span className="text-[#0F172A] font-bold">{app.createdAt}</span>
                      </div>
                    </div>

                    {/* Quotation from Supervisor */}
                    {app.quotedRate ? (
                      <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5 uppercase">
                            <Award className="w-4 h-4 text-[#16A34A]" />
                            <span>Official Supervisor Wholesale Hardware Quotation</span>
                          </span>
                          <span className="text-xl font-bold font-mono text-[#16A34A]">
                            {formatCurrency(app.quotedRate)}
                          </span>
                        </div>
                        {app.supervisorNotes && (
                          <p className="text-xs text-[#334155] font-sans">
                            <strong>Supervisor Notes:</strong> {app.supervisorNotes}
                          </p>
                        )}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              updateFranchiseStatus(app.id, 'approved');
                              alert('Wholesale quotation accepted! EVIO hardware procurement team will contact you to dispatch equipment.');
                            }}
                            className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-xs"
                          >
                            Accept Quotation & Authorize Hardware PO
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E] flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Supervisor is reviewing your GPS coordinates and electrical feasibility. Tailored wholesale rates will appear here shortly.</span>
                      </div>
                    )}
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
