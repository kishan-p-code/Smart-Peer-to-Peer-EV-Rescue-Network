import React from 'react';
import { 
  X, 
  Zap, 
  MapPin, 
  Key, 
  Clock, 
  BatteryCharging, 
  MessageSquare, 
  PhoneCall, 
  ShieldAlert, 
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ActiveSessionModalProps {
  onClose: () => void;
  onOpenChat: () => void;
  onViewReceipt: () => void;
}

export const ActiveSessionModal: React.FC<ActiveSessionModalProps> = ({
  onClose,
  onOpenChat,
  onViewReceipt,
}) => {
  const { activeBooking, stopActiveSession, formatCurrency, chargers } = useApp();

  if (!activeBooking || !activeBooking.activeSession) {
    return null;
  }

  const charger = chargers.find(c => c.id === activeBooking.chargerId);
  const session = activeBooking.activeSession;

  const handleStopCharging = () => {
    stopActiveSession();
    onClose();
    onViewReceipt();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#BAE6FD] rounded-card w-full max-w-xl p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Live Status Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-[#16A34A] uppercase tracking-wider">
            Live Charging Telemetry in Progress
          </span>
        </div>

        <h3 className="text-xl font-bold text-[#0F172A] mb-1">{activeBooking.chargerTitle}</h3>
        <p className="text-xs text-[#64748B] mb-6 font-mono">
          Hosted by {activeBooking.hostName} • Vehicle: {activeBooking.driverVehicle}
        </p>

        {/* Telemetry Display (Light Skyblue Container) */}
        <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-6 mb-6 relative overflow-hidden shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            
            {/* Battery Circular Gauge */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-[#E2E8F0]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-[#0284C7] transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * session.batteryPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <BatteryCharging className="w-5 h-5 text-[#0284C7] mb-0.5" />
                <span className="font-mono text-2xl font-bold text-[#0F172A]">{session.batteryPercentage}%</span>
                <span className="text-[10px] text-[#64748B] font-mono font-bold">SOC</span>
              </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 gap-3 flex-1 w-full">
              
              <div className="p-3 rounded-xl bg-white border border-[#BAE6FD] shadow-xs">
                <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">Power Flow</span>
                <span className="font-mono text-xl font-bold text-[#0284C7]">{session.flowRateKw} kW</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#BAE6FD] shadow-xs">
                <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">Delivered Energy</span>
                <span className="font-mono text-xl font-bold text-[#16A34A]">{session.currentKwh} kWh</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#BAE6FD] shadow-xs">
                <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">Current Cost</span>
                <span className="font-mono text-xl font-bold text-[#0F172A]">{formatCurrency(session.currentCost)}</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#BAE6FD] shadow-xs">
                <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">Est. Remaining</span>
                <span className="font-mono text-xl font-bold text-[#64748B]">~22 min</span>
              </div>

            </div>

          </div>
        </div>

        {/* Revealed Access details */}
        <div className="space-y-3 mb-6">
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-mono font-bold text-[#0F172A] block uppercase">Exact Station Address Revealed:</span>
              <span className="text-[#64748B] font-mono">{charger?.exactAddress || activeBooking.chargerTitle}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-start gap-3">
            <Key className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-mono font-bold text-[#0F172A] block uppercase">Gate PIN & Parking Notes:</span>
              <span className="text-[#64748B] font-mono">{charger?.accessNotes || 'Gate passcode is 4829#. Park in Bay A marked in green.'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          <button
            onClick={() => {
              onClose();
              onOpenChat();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0284C7] text-xs font-mono font-bold text-[#475569] hover:text-[#0284C7] flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-[#0284C7]" />
            <span>Chat Host</span>
          </button>

          <a
            href="tel:911"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency 911</span>
          </a>

          <button
            onClick={handleStopCharging}
            className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-mono font-bold text-xs tracking-wider shadow-sm shadow-[#DC2626]/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>UNPLUG & GENERATE INVOICE</span>
          </button>

        </div>

      </div>
    </div>
  );
};
