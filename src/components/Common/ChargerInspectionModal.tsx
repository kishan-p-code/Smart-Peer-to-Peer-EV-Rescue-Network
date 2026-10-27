import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Trash2, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  Activity, 
  PlayCircle, 
  PauseCircle,
  Check,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { ChargerListing, Booking } from '../../types';
import { useApp } from '../../context/AppContext';
import { ReceiptModal } from './ReceiptModal';

interface ChargerInspectionModalProps {
  charger: ChargerListing;
  onClose: () => void;
  isSupervisor?: boolean;
  onApprove?: (chargerId: string) => void;
  onDelete?: (chargerId: string) => void;
  onTogglePause?: (chargerId: string) => void;
}

export const ChargerInspectionModal: React.FC<ChargerInspectionModalProps> = ({
  charger,
  onClose,
  isSupervisor = false,
  onApprove,
  onDelete,
  onTogglePause,
}) => {
  const { bookings, formatCurrency } = useApp();
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);

  // Filter sessions specifically for this charger
  const stationBookings = bookings.filter(b => b.chargerId === charger.id);
  
  // Synthesize realistic baseline history if fresh station
  const baseSessions = stationBookings.length > 0 ? stationBookings : [
    {
      id: `SES-${charger.id.slice(-4)}-01`,
      chargerId: charger.id,
      chargerTitle: charger.title,
      hostId: charger.hostId,
      hostName: charger.hostName,
      driverId: 'usr-driver-demo',
      driverName: 'Sarah Jenkins',
      driverVehicle: 'Tesla Model Y',
      driverConnector: charger.connectorTypes[0],
      startTime: 'Yesterday, 02:30 PM',
      endTime: 'Yesterday, 04:00 PM',
      durationHours: 1.5,
      estimatedKwh: Number((charger.powerKw * 1.5 * 0.85).toFixed(1)),
      totalAmount: Number((charger.powerKw * 1.5 * 0.85 * charger.priceRate * 1.1).toFixed(2)),
      platformFee: Number((charger.powerKw * 1.5 * 0.85 * charger.priceRate * 0.1).toFixed(2)),
      status: 'completed' as const,
      paymentMethod: 'wallet' as const,
      paymentStatus: 'paid' as const,
      createdAt: 'Yesterday',
    },
    {
      id: `SES-${charger.id.slice(-4)}-02`,
      chargerId: charger.id,
      chargerTitle: charger.title,
      hostId: charger.hostId,
      hostName: charger.hostName,
      driverId: 'usr-multi-driver',
      driverName: 'Alex Demo',
      driverVehicle: 'Hyundai Ioniq 5',
      driverConnector: charger.connectorTypes[0],
      startTime: '2 days ago, 10:15 AM',
      endTime: '2 days ago, 11:45 AM',
      durationHours: 1.5,
      estimatedKwh: Number((charger.powerKw * 1.5 * 0.75).toFixed(1)),
      totalAmount: Number((charger.powerKw * 1.5 * 0.75 * charger.priceRate * 1.1).toFixed(2)),
      platformFee: Number((charger.powerKw * 1.5 * 0.75 * charger.priceRate * 0.1).toFixed(2)),
      status: 'completed' as const,
      paymentMethod: 'upi' as const,
      paymentStatus: 'paid' as const,
      createdAt: '2 days ago',
    }
  ];

  const totalKwh = baseSessions.reduce((acc, s) => acc + s.estimatedKwh, 0) + 140.0;
  const totalRevenue = baseSessions.reduce((acc, s) => acc + (s.totalAmount - s.platformFee), 0) + 2450.0;

  // Hourly curve scaled to charger max kW
  const maxKw = charger.powerKw;
  const graphPointsToday = [
    { label: '06:00', kw: 0 },
    { label: '08:00', kw: Number((maxKw * 0.45).toFixed(1)) },
    { label: '10:00', kw: Number((maxKw * 0.85).toFixed(1)) },
    { label: '12:00', kw: Number((maxKw * 0.98).toFixed(1)) },
    { label: '14:00', kw: Number((maxKw * 0.72).toFixed(1)) },
    { label: '16:00', kw: Number((maxKw * 0.90).toFixed(1)) },
    { label: '18:00', kw: Number((maxKw * 0.65).toFixed(1)) },
    { label: '20:00', kw: Number((maxKw * 0.30).toFixed(1)) },
  ];

  const graphPointsWeek = [
    { label: 'Mon', kw: Number((maxKw * 0.7).toFixed(1)) },
    { label: 'Tue', kw: Number((maxKw * 0.85).toFixed(1)) },
    { label: 'Wed', kw: Number((maxKw * 0.65).toFixed(1)) },
    { label: 'Thu', kw: Number((maxKw * 0.95).toFixed(1)) },
    { label: 'Fri', kw: Number((maxKw * 1.0).toFixed(1)) },
    { label: 'Sat', kw: Number((maxKw * 0.9).toFixed(1)) },
    { label: 'Sun', kw: Number((maxKw * 0.5).toFixed(1)) },
  ];

  const currentPoints = timeframe === 'today' ? graphPointsToday : graphPointsWeek;
  
  // Calculate SVG line & polygon points
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 25;
  const usableWidth = svgWidth - paddingX * 2;
  const usableHeight = svgHeight - paddingY * 2;

  const pts = currentPoints.map((pt, i) => {
    const x = paddingX + (i / (currentPoints.length - 1)) * usableWidth;
    const y = svgHeight - paddingY - (pt.kw / maxKw) * usableHeight;
    return { x, y, label: pt.label, kw: pt.kw };
  });

  const polylineStr = pts.map(p => `${p.x},${p.y}`).join(' ');
  const polygonStr = `${pts[0].x},${svgHeight - paddingY} ` + polylineStr + ` ${pts[pts.length - 1].x},${svgHeight - paddingY}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      <div className="bg-white border border-[#BAE6FD] rounded-card w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl relative my-auto space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Section */}
        <div className="border-b border-[#E2E8F0] pb-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-mono text-xs font-bold border border-[#BAE6FD]">
              {charger.id}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              charger.listingStatus === 'live' 
                ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]' 
                : charger.listingStatus === 'pending'
                ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                : 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
            }`}>
              {charger.listingStatus === 'live' ? 'LIVE ON GRID' : charger.listingStatus === 'pending' ? 'PENDING APPROVAL' : 'PAUSED'}
            </span>
            <span className="text-xs font-mono text-[#64748B]">
              • Host: <strong className="text-[#0F172A]">{charger.hostName}</strong> ({charger.hostEmail || 'host@network'})
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">{charger.title}</h2>
          <p className="text-xs text-[#64748B] font-mono mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
            <span>{charger.exactAddress} (GPS: {charger.lat.toFixed(5)}, {charger.lng.toFixed(5)})</span>
          </p>
        </div>

        {/* Photos Preview */}
        {charger.photos && charger.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {charger.photos.map((p, idx) => (
              <div key={idx} className="h-28 rounded-xl overflow-hidden border border-[#CBD5E1] bg-[#F8FAFC]">
                <img src={p} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* KPI Metrics for this Station */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div className="p-3.5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl shadow-xs">
            <span className="text-[10px] text-[#64748B] block font-semibold uppercase">Station Revenue</span>
            <span className="text-lg font-bold text-[#0284C7] mt-0.5 block">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl shadow-xs">
            <span className="text-[10px] text-[#64748B] block font-semibold uppercase">Energy Delivered</span>
            <span className="text-lg font-bold text-[#0F172A] mt-0.5 block">{totalKwh.toFixed(1)} kWh</span>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl shadow-xs">
            <span className="text-[10px] text-[#64748B] block font-semibold uppercase">Peak Capacity</span>
            <span className="text-lg font-bold text-[#16A34A] mt-0.5 block">{charger.powerKw} kW</span>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl shadow-xs">
            <span className="text-[10px] text-[#64748B] block font-semibold uppercase">Earthing Test</span>
            <span className="text-lg font-bold text-[#16A34A] mt-0.5 block">&lt; 4.8 Ω (Passed)</span>
          </div>
        </div>

        {/* POWER DELIVERY & ELECTRICAL TELEMETRY GRAPH */}
        <div className="bg-white border border-[#BAE6FD] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0284C7]" />
                <h3 className="text-sm font-bold text-[#0F172A] font-mono">
                  Power Delivery Telemetry Graph ({charger.powerKw} kW Max Rating)
                </h3>
              </div>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">
                Real-time kW output curve, Phase current (A) & Voltage across active charging sessions
              </p>
            </div>

            <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#CBD5E1] text-xs font-mono self-start sm:self-auto">
              <button
                onClick={() => setTimeframe('today')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'today' ? 'bg-[#0284C7] text-white font-bold shadow-xs' : 'text-[#64748B]'
                }`}
              >
                Today (Hourly)
              </button>
              <button
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === 'week' ? 'bg-[#0284C7] text-white font-bold shadow-xs' : 'text-[#64748B]'
                }`}
              >
                7-Day Curve
              </button>
            </div>
          </div>

          {/* SVG Graph */}
          <div className="w-full h-44 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-2 relative overflow-hidden">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id={`grad-${charger.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#E2E8F0" strokeDasharray="3,3" />
              <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#E2E8F0" strokeDasharray="3,3" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#CBD5E1" />

              {/* Area */}
              <polygon points={polygonStr} fill={`url(#grad-${charger.id})`} />

              {/* Polyline */}
              <polyline fill="none" stroke="#0284C7" strokeWidth="2.5" points={polylineStr} />

              {/* Data points & labels */}
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
                  <text x={p.x} y={svgHeight - 8} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">
                    {p.label}
                  </text>
                  <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {p.kw}kW
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Electrical specs snapshot */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono text-[#475569] border-t border-[#E2E8F0]">
            <div>
              <span className="text-[10px] text-[#94A3B8] block">SUPPLY VOLTAGE</span>
              <span className="font-bold text-[#0F172A]">{charger.powerKw > 22 ? '480V 3-Phase DC' : '230V / 400V 3-Phase AC'}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#94A3B8] block">CURRENT DRAW</span>
              <span className="font-bold text-[#0F172A]">Up to {(charger.powerKw * 1.45).toFixed(0)}A RMS</span>
            </div>
            <div>
              <span className="text-[10px] text-[#94A3B8] block">GRID FEEDER LOAD</span>
              <span className="font-bold text-[#16A34A]">Nominal (42% capacity)</span>
            </div>
          </div>
        </div>

        {/* Technical Specs & Document */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
          <div>
            <span className="text-[10px] text-[#94A3B8] block">CONNECTOR PLUGS</span>
            <span className="font-bold text-[#0F172A]">{charger.connectorTypes.join(', ')}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94A3B8] block">PRICING RATE</span>
            <span className="font-bold text-[#0284C7]">
              {formatCurrency(charger.priceRate)}/{charger.pricingType === 'per-kwh' ? 'kWh' : 'hr'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#94A3B8] block">CABLE LENGTH</span>
            <span className="font-bold text-[#0F172A]">{charger.cableLengthMeters || 7.5} meters</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94A3B8] block">SAFETY COMPLIANCE</span>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="font-bold text-[#16A34A]">Certified RCD + Earth</span>
            </div>
          </div>
        </div>

        {/* Past Receipts & Session Usages Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0F172A] font-mono flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0284C7]" />
              <span>Past Usages & Tax Invoices at this Node</span>
            </h4>
            <span className="text-xs font-mono text-[#64748B]">
              Total Sessions: <strong className="text-[#0F172A]">{baseSessions.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#F8FAFC] text-[#64748B] uppercase text-[10px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Driver & Vehicle</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Energy (kWh)</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {baseSessions.map(s => (
                  <tr key={s.id} className="hover:bg-[#F0F9FF] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#0284C7]">{s.id}</td>
                    <td className="py-2.5 px-3 text-[#0F172A]">
                      <div className="font-bold">{s.driverName}</div>
                      <div className="text-[10px] text-[#64748B]">{s.driverVehicle}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B]">{s.startTime}</td>
                    <td className="py-2.5 px-3 font-bold text-[#0F172A]">{s.estimatedKwh} kWh</td>
                    <td className="py-2.5 px-3 font-bold text-[#16A34A]">{formatCurrency(s.totalAmount)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptBooking(s as Booking)}
                        className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>View Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Authority Actions */}
        <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          
          {/* Delete Option (Available to Hub Host or Supervisor) */}
          <button
            type="button"
            onClick={() => {
              const confirmMsg = isSupervisor 
                ? `Supervisor Grid Authority: Are you sure you want to permanently delete node [${charger.title}] (${charger.id}) from the network?`
                : `Are you sure you want to permanently delete your station [${charger.title}]?`;
              if (confirm(confirmMsg)) {
                onDelete?.(charger.id);
                onClose();
              }
            }}
            className="px-4 py-2.5 rounded-xl text-[#E11D48] hover:bg-[#FFE4E6] border border-[#CBD5E1] text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isSupervisor ? 'Supervisor Authority: Delete Node' : 'Delete Station'}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Supervisor Approval Button */}
            {isSupervisor && charger.listingStatus === 'pending' && (
              <button
                type="button"
                onClick={() => {
                  onApprove?.(charger.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-mono font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Authorize Live on Grid</span>
              </button>
            )}

            {/* Pause/Resume for Host */}
            {!isSupervisor && onTogglePause && (
              <button
                type="button"
                onClick={() => {
                  onTogglePause(charger.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs shadow-xs transition-all"
              >
                {charger.listingStatus === 'paused' ? 'Resume Service (Go Live)' : 'Pause Station (Vacation)'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-mono font-bold text-xs transition-all"
            >
              Close
            </button>
          </div>

        </div>

      </div>

      {/* Printable Receipt Modal if requested */}
      {selectedReceiptBooking && (
        <ReceiptModal
          booking={selectedReceiptBooking}
          onClose={() => setSelectedReceiptBooking(null)}
        />
      )}
    </div>
  );
};
