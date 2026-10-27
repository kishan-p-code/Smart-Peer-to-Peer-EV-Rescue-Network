import React, { useState } from 'react';
import { 
  Zap, 
  Calendar, 
  PlusCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileText,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Cpu,
  Layers,
  MapPin,
  Check,
  Trash2,
  X,
  Receipt,
  ExternalLink,
  ChevronRight,
  Truck,
  Building2,
  BatteryCharging,
  Package,
  ZapOff,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChargerListing, Booking } from '../../types';
import { ReceiptModal } from '../Common/ReceiptModal';
import { ChargerInspectionModal } from '../Common/ChargerInspectionModal';

interface HostDashboardProps {
  onOpenListingWizard: () => void;
  onOpenFranchise?: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ onOpenListingWizard, onOpenFranchise }) => {
  const { 
    currentUser, 
    chargers, 
    bookings, 
    formatCurrency, 
    toggleHostVacation, 
    approveChargerListing,
    deleteCharger,
    acceptBookingRequest,
    declineBookingRequest,
    autoAcceptBookings,
    toggleAutoAcceptBookings,
    batteryDeliveries,
    dispatchBatteryDelivery,
    completeBatteryDelivery
  } = useApp();

  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [selectedChargerForDetail, setSelectedChargerForDetail] = useState<ChargerListing | null>(null);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);

  // Filter strictly for chargers listed by this Hub Operator
  const myChargers = chargers.filter(c => 
    c.hostId === currentUser?.id || 
    (c.hostEmail && c.hostEmail === currentUser?.email) ||
    (currentUser?.id === 'usr-hub-demo' && c.hostId === 'host-101') ||
    (currentUser?.id === 'usr-multi-hub' && c.hostId === 'host-101')
  );

  // Incoming driver booking requests for this Hub Operator's stations only
  const pendingRequests = bookings.filter(b => 
    b.status === 'requested' && myChargers.some(c => c.id === b.chargerId)
  );

  // Relevant bookings for this host's chargers
  const myChargerIds = new Set(myChargers.map(c => c.id));
  const hostBookings = bookings.filter(b => myChargerIds.has(b.chargerId));
  const activeOrDoneBookings = hostBookings.filter(b => b.status === 'confirmed' || b.status === 'active');

  const totalCapacityKw = myChargers.reduce((sum, c) => sum + c.powerKw, 0);
  const liveCount = myChargers.filter(c => c.listingStatus === 'live').length;
  const pendingCount = myChargers.filter(c => c.listingStatus === 'pending').length;

  // Real data calculations - strictly 0 if no chargers listed
  const totalEarnings = myChargers.length === 0 ? 0 : activeOrDoneBookings.reduce((sum, b) => sum + (b.totalAmount - b.platformFee), 0);
  const totalSessions = myChargers.length === 0 ? 0 : activeOrDoneBookings.length;
  const totalKwh = myChargers.length === 0 ? 0 : activeOrDoneBookings.reduce((sum, b) => sum + (b.activeSession?.currentKwh || b.estimatedKwh || 0), 0);

  // Dynamic daily telemetry aggregation
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartDataWeekly = dayNames.map(label => ({ label, kwh: 0, earnings: 0 }));

  if (myChargers.length > 0) {
    activeOrDoneBookings.forEach(b => {
      const d = new Date(b.startTime || b.createdAt);
      const dayIdx = (d.getDay() + 6) % 7;
      const kwh = b.activeSession?.currentKwh || b.estimatedKwh || 0;
      const earn = b.totalAmount - b.platformFee;
      chartDataWeekly[dayIdx].kwh += Math.round(kwh * 10) / 10;
      chartDataWeekly[dayIdx].earnings += Math.round(earn * 10) / 10;
    });
  }

  const maxChartKwh = Math.max(...chartDataWeekly.map(d => d.kwh), 10);
  const peakDay = chartDataWeekly.reduce((max, d) => d.kwh > max.kwh ? d : max, chartDataWeekly[0]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-[#16A34A] uppercase tracking-wider">
              Hub Operator Console
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Station Fleet • {currentUser?.name || 'Hub Host'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Auto-Accept Toggle Switch */}
          <div className="flex items-center gap-2.5 bg-[#F0F9FF] border border-[#BAE6FD] p-2 rounded-xl">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-mono font-bold text-[#0F172A] block">Auto-Accept Requests</span>
              <span className="text-[10px] text-[#64748B] font-mono">
                {autoAcceptBookings ? 'Slots auto-confirmed' : 'Manual host approval'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAutoAcceptBookings}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                autoAcceptBookings
                  ? 'bg-[#16A34A] text-white shadow-[#16A34A]/25'
                  : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
              }`}
              title="Automatically confirm incoming driver booking requests"
            >
              <span className={`w-2 h-2 rounded-full ${autoAcceptBookings ? 'bg-white animate-pulse' : 'bg-[#94A3B8]'}`}></span>
              <span>{autoAcceptBookings ? 'Auto-Pilot ON' : 'Turn Auto-Pilot ON'}</span>
            </button>
          </div>

          {onOpenFranchise && (
            <button
              onClick={onOpenFranchise}
              className="px-3.5 py-2.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] hover:border-[#16A34A] text-[#16A34A] font-mono font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
              title="Setup Hub Franchise with Bulk Wholesale Chargers"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Franchise Bulk Buy</span>
            </button>
          )}

          <button
            onClick={onOpenListingWizard}
            className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs tracking-wider shadow-md shadow-[#0284C7]/25 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>LIST NEW CHARGER</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards at Top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Fleet Count */}
        <div className="bg-white border border-[#BAE6FD] rounded-card p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-mono font-bold mb-2">
            <span>MY CHARGING FLEET</span>
            <span className="text-[#0284C7] font-mono">{liveCount} Live</span>
          </div>
          <div className="font-mono text-[30px] font-bold text-[#0F172A] tracking-tight">
            {myChargers.length} {myChargers.length === 1 ? 'Station' : 'Stations'}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#64748B] font-mono">
            <span className="text-[#D97706] font-bold">{pendingCount}</span>
            <span>Awaiting supervisor approval</span>
          </div>
        </div>

        {/* KPI 2: Total Power Capacity */}
        <div className="bg-white border border-[#BAE6FD] rounded-card p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-mono font-bold mb-2">
            <span>TOTAL CAPACITY</span>
            <Zap className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="font-mono text-[30px] font-bold text-[#16A34A] tracking-tight">
            {totalCapacityKw} kW
          </div>
          <div className="mt-2 text-xs text-[#64748B] font-mono">
            Combined grid capacity
          </div>
        </div>

        {/* KPI 3: Net Earnings */}
        <div className="bg-white border border-[#BAE6FD] rounded-card p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-mono font-bold mb-2">
            <span>NET EARNINGS</span>
            <span className="text-[#16A34A] font-mono">{myChargers.length === 0 ? '0%' : '+14.2%'}</span>
          </div>
          <div className="font-mono text-[30px] font-bold text-[#0F172A] tracking-tight">
            {formatCurrency(totalEarnings)}
          </div>
          <div className="mt-2 text-xs text-[#64748B] font-mono">
            After 10% network operations fee
          </div>
        </div>

        {/* KPI 4: Sessions & Energy */}
        <div className="bg-white border border-[#BAE6FD] rounded-card p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-mono font-bold mb-2">
            <span>SESSIONS DISPENSED</span>
            <Clock className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="font-mono text-[30px] font-bold text-[#0284C7] tracking-tight">
            {totalSessions}
          </div>
          <div className="mt-2 text-xs text-[#64748B] font-mono">
            {totalKwh} kWh delivered
          </div>
        </div>

      </div>

      {/* DEDICATED SECTION: ALL CHARGERS LISTED BY ME (FLEET) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] font-mono flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#0284C7]" />
              <span>All Stations Listed by Me ({myChargers.length})</span>
            </h2>
            <p className="text-xs text-[#64748B] font-sans">
              Click any station card to inspect full details, past session usages, and tax invoices.
            </p>
          </div>

          <button
            onClick={onOpenListingWizard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-mono font-bold transition-all shadow-xs self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Another Charger</span>
          </button>
        </div>

        {myChargers.length === 0 ? (
          <div className="bg-white border border-[#BAE6FD] rounded-card p-12 text-center text-xs text-[#64748B] font-mono shadow-sm space-y-4">
            <AlertCircle className="w-10 h-10 text-[#0284C7] mx-auto opacity-70" />
            <div>
              <p className="font-bold text-base text-[#0F172A]">You Have Not Listed Any Chargers Yet</p>
              <p className="font-sans text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                Turn your home wallbox, commercial parking lot, or garage socket into an active income stream on the Evio charging grid.
              </p>
            </div>
            <button
              onClick={onOpenListingWizard}
              className="px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs shadow-xs"
            >
              List My First Charger
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myChargers.map(charger => (
              <div 
                key={charger.id}
                onClick={() => setSelectedChargerForDetail(charger)}
                className="bg-white border border-[#BAE6FD] hover:border-[#0284C7] rounded-card overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                {/* Station Photo Header */}
                <div className="relative h-44 bg-[#F1F5F9] overflow-hidden">
                  <img 
                    src={charger.photos[0] || 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800'} 
                    alt={charger.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#BAE6FD] text-[11px] font-mono font-bold text-[#0284C7] flex items-center gap-1 shadow-xs">
                      <Zap className="w-3 h-3 fill-[#0284C7]" />
                      <span>{charger.powerKw} kW</span>
                    </div>
                    {charger.locationType && (
                      <span className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-full border border-[#CBD5E1] text-[10px] font-mono font-bold text-[#475569] uppercase shadow-xs">
                        {charger.locationType}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {/* Listing Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shadow-xs ${
                      charger.listingStatus === 'live'
                        ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                        : charger.listingStatus === 'pending'
                        ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                        : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
                    }`}>
                      {charger.listingStatus === 'live' ? 'LIVE ON GRID' : charger.listingStatus === 'pending' ? 'PENDING APPROVAL' : 'PAUSED'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/60 text-white px-2 py-0.5 rounded">
                    {charger.id}
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A] line-clamp-1 group-hover:text-[#0284C7] transition-colors">{charger.title}</h3>
                    <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1 font-mono">
                      <MapPin className="w-3 h-3 text-[#0284C7] shrink-0" />
                      <span className="truncate">{charger.approxAddress}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#E2E8F0] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">CONNECTORS</span>
                        <span className="font-bold text-[#0F172A] truncate block">{charger.connectorTypes.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#94A3B8] block">PRICING RATE</span>
                        <span className="font-bold text-[#0284C7]">
                          {formatCurrency(charger.priceRate)}/{charger.pricingType === 'per-kwh' ? 'kWh' : 'hr'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <FileText className="w-3 h-3 text-[#0284C7] shrink-0" />
                        <span className="truncate">{charger.safetyCertificateName || 'Electrical_Earthing.pdf'}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${charger.safetyCertificateVerified ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                        {charger.safetyCertificateVerified ? 'Verified' : 'In Review'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHostVacation(charger.id);
                        }}
                        className={`flex-1 p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          charger.listingStatus === 'live'
                            ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]'
                            : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B]'
                        }`}
                        title="Set station live for drivers"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{charger.listingStatus === 'live' ? 'Live' : 'Set Live'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHostVacation(charger.id);
                        }}
                        className={`flex-1 p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          charger.listingStatus === 'paused'
                            ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
                            : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B]'
                        }`}
                        title="Temporarily pause station availability"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </button>

                      {/* Delete Charger Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to permanently delete station [${charger.title}]?`)) {
                            deleteCharger(charger.id);
                          }
                        }}
                        className="p-2 rounded-xl text-[#E11D48] hover:bg-[#FFE4E6] border border-[#CBD5E1] hover:border-[#FECDD3] transition-all"
                        title="Delete Station"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Pending Supervisor Verification Notice */}
                    {charger.listingStatus === 'pending' && (
                      <div className="w-full py-1.5 px-2 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] font-mono text-[10px] font-bold text-center flex items-center justify-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Awaiting Supervisor Safety Approval</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Telemetry & Power Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 8-Column SVG Area Chart */}
        <div className="lg:col-span-8 bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#0284C7]" />
                  <span>Real-Time Power Delivery (kWh)</span>
                </h3>
                <p className="text-xs text-[#64748B] font-mono">Telemetry aggregate across your charging bays</p>
              </div>

              <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#CBD5E1] text-xs font-mono self-start sm:self-auto">
                {(['day', 'week', 'month'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all ${
                      timeframe === tf 
                        ? 'bg-[#0284C7] text-white font-bold shadow-xs' 
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Chart or Empty State */}
            {myChargers.length === 0 ? (
              <div className="w-full h-56 flex flex-col items-center justify-center border-2 border-dashed border-[#CBD5E1] rounded-2xl bg-[#F8FAFC] p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] mb-2.5">
                  <ZapOff className="w-6 h-6 text-[#0284C7]" />
                </div>
                <h4 className="text-sm font-bold text-[#0F172A] font-mono">No Charging Nodes Connected</h4>
                <p className="text-xs text-[#64748B] max-w-md mt-1 font-sans">
                  You have not added any charging stations yet. Real-time electrical telemetry (kWh) and power delivery graphs will stream here once your node is listed and drivers book sessions.
                </p>
                <button
                  onClick={onOpenListingWizard}
                  className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold font-mono transition-all shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New Charger
                </button>
              </div>
            ) : (
              <div className="w-full h-56 pt-2">
                <svg viewBox="0 0 700 220" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGradientLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid guidelines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#E2E8F0" strokeDasharray="3,3" />
                  <line x1="0" y1="100" x2="700" y2="100" stroke="#E2E8F0" strokeDasharray="3,3" />
                  <line x1="0" y1="160" x2="700" y2="160" stroke="#E2E8F0" strokeDasharray="3,3" />

                  {/* Area Path */}
                  <polygon
                    points={`0,220 ${chartDataWeekly.map((d, i) => `${i * 116.6},${Math.round(200 - (d.kwh / maxChartKwh) * 150)}`).join(' ')} 700,220`}
                    fill="url(#areaGradientLight)"
                  />

                  {/* Line Path */}
                  <polyline
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth="3"
                    points={chartDataWeekly.map((d, i) => `${i * 116.6},${Math.round(200 - (d.kwh / maxChartKwh) * 150)}`).join(' ')}
                  />

                  {/* Data Points */}
                  {chartDataWeekly.map((d, idx) => (
                    <circle
                      key={idx}
                      cx={idx * 116.6}
                      cy={Math.round(200 - (d.kwh / maxChartKwh) * 150)}
                      r="4.5"
                      fill="#FFFFFF"
                      stroke="#0284C7"
                      strokeWidth="3"
                    />
                  ))}
                </svg>

                {/* X Axis */}
                <div className="flex justify-between text-[11px] font-mono text-[#64748B] pt-2 px-1">
                  {chartDataWeekly.map(d => (
                    <div key={d.label} className="text-center">
                      <div>{d.label}</div>
                      <div className="text-[10px] text-[#0F172A] font-bold">{d.kwh} kWh</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between text-xs font-mono text-[#64748B]">
            <span>Peak delivery window: <strong className="text-[#0F172A]">{myChargers.length === 0 ? 'None (0 kWh)' : `${peakDay.label} (${peakDay.kwh} kWh)`}</strong></span>
            <span>Est. upcoming payout: <strong className="text-[#16A34A]">{formatCurrency(totalEarnings * 0.9)}</strong></span>
          </div>
        </div>

        {/* 4-Column Requests & Safety */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Incoming Driver Requests - Approvals dictate when slot is confirmed */}
          <div className="bg-white border border-[#BAE6FD] rounded-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono font-bold text-[#64748B] tracking-wider">Driver Requests</span>
              <span className="text-[10px] font-mono font-bold text-[#0284C7]">{pendingRequests.length} pending approval</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center text-xs text-[#64748B]">
                <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto mb-2 opacity-80" />
                <p>Zero pending booking requests.</p>
                <p className="text-[11px] mt-1 text-[#94A3B8] font-mono">Incoming driver slots appear here for host acceptance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-3.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-2 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F172A]">{req.driverName}</span>
                      <span className="text-[#0284C7] font-bold">{formatCurrency(req.totalAmount)}</span>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Station: <strong className="text-[#0F172A]">{req.chargerTitle}</strong>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {req.driverVehicle} • {req.durationHours}h slot ({req.startTime})
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => acceptBookingRequest(req.id)}
                        className="flex-1 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Slot</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => declineBookingRequest(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:bg-[#FFE4E6] text-[#DC2626] text-xs font-semibold transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swappable Battery Delivery Orders for this Hub */}
          <div className="bg-white border border-[#BAE6FD] rounded-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0284C7]" />
                <span className="text-xs uppercase font-mono font-bold text-[#64748B] tracking-wider">
                  Battery Swap Deliveries
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#16A34A] px-2 py-0.5 rounded bg-[#DCFCE7] border border-[#86EFAC]">
                {currentUser?.swappableBatteriesCount || 8} In Stock
              </span>
            </div>

            {batteryDeliveries.filter(d => d.status !== 'cancelled').length === 0 ? (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center text-xs text-[#64748B]">
                <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto mb-2 opacity-80" />
                <p>No active battery delivery orders.</p>
                <p className="text-[11px] mt-1 text-[#94A3B8] font-mono">Drivers with removable batteries requesting delivery will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {batteryDeliveries.filter(d => d.status !== 'cancelled').slice(0, 3).map(del => (
                  <div key={del.id} className="p-3.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A]">{del.driverName}</span>
                      <span className="font-bold text-[#16A34A]">+{formatCurrency(del.totalCost)}</span>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Battery: <strong className="text-[#0F172A]">{del.batterySpec}</strong>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Location: <strong className="text-[#0284C7]">{del.driverLocation.address}</strong>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        del.status === 'delivered' 
                          ? 'bg-[#DCFCE7] text-[#16A34A]'
                          : del.status === 'dispatched'
                          ? 'bg-[#E0F2FE] text-[#0284C7]'
                          : 'bg-[#FEF3C7] text-[#D97706]'
                      }`}>
                        {del.status.toUpperCase()}
                      </span>

                      {del.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => dispatchBatteryDelivery(del.id, 'Express Hub Rider - Santosh')}
                          className="px-3 py-1 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-[11px] font-bold transition-all shadow-xs"
                        >
                          Dispatch Rider
                        </button>
                      )}

                      {del.status === 'dispatched' && (
                        <button
                          type="button"
                          onClick={() => completeBatteryDelivery(del.id)}
                          className="px-3 py-1 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-bold transition-all shadow-xs"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety Compliance Card */}
          <div className="bg-white border border-[#BAE6FD] rounded-card p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span className="font-mono">Electrical Safety Compliant</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Ground earthing resistance under 5 Ohms. High-speed Type B RCD surge protection verified for all live bays.
            </p>
            <div className="text-[11px] font-mono text-[#0284C7] flex items-center gap-1 font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span>Certified_Inspection_Approval_2026.pdf</span>
            </div>
          </div>

        </div>

      </div>

      {/* Table: Chronological Sessions Log */}
      <div className="bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F172A] mb-4">Chronological Session Log & Payouts</h3>
        
        {bookings.filter(b => myChargers.some(c => c.id === b.chargerId)).length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B] border border-dashed border-[#CBD5E1] rounded-xl font-mono">
            No charging sessions recorded for your stations in this billing cycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-mono tracking-wider">
                  <th className="pb-3 font-semibold">Session ID</th>
                  <th className="pb-3 font-semibold">Station</th>
                  <th className="pb-3 font-semibold">Driver & Vehicle</th>
                  <th className="pb-3 font-semibold">Duration & Energy</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Net Payout</th>
                  <th className="pb-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {bookings
                  .filter(b => myChargers.some(c => c.id === b.chargerId))
                  .map(b => (
                    <tr key={b.id} className="hover:bg-[#F0F9FF] transition-colors">
                      <td className="py-3 font-mono text-[#0284C7] font-bold">{b.id}</td>
                      <td className="py-3 font-medium text-[#0F172A]">{b.chargerTitle}</td>
                      <td className="py-3">
                        <div className="font-bold text-[#0F172A]">{b.driverName}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">{b.driverVehicle}</div>
                      </td>
                      <td className="py-3 font-mono">
                        <span className="text-[#0F172A] font-semibold">{b.durationHours}h</span>
                        <span className="text-[#64748B] ml-2">({b.estimatedKwh} kWh)</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          b.status === 'active' 
                            ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                            : b.status === 'completed'
                            ? 'bg-[#F1F5F9] text-[#475569]'
                            : b.status === 'requested'
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-[#F8FAFC] text-[#64748B]'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-[#0F172A]">
                        {formatCurrency(b.totalAmount - b.platformFee)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedReceiptBooking(b)}
                          className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] font-mono text-[11px] font-bold transition-all inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: SPECIFIC CHARGER DETAIL, PAST RECEIPTS & POWER GRAPHS */}
      {selectedChargerForDetail && (
        <ChargerInspectionModal
          charger={selectedChargerForDetail}
          onClose={() => setSelectedChargerForDetail(null)}
          isSupervisor={false}
          onDelete={(id) => deleteCharger(id)}
          onTogglePause={(id) => toggleHostVacation(id)}
        />
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {selectedReceiptBooking && (
        <ReceiptModal
          booking={selectedReceiptBooking}
          onClose={() => setSelectedReceiptBooking(null)}
        />
      )}

    </div>
  );
};
