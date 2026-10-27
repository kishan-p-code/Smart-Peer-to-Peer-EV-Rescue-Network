import React from 'react';
import { 
  X, 
  Zap, 
  Printer, 
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';

interface ReceiptModalProps {
  onClose: () => void;
  booking?: Booking | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ onClose, booking }) => {
  const { currentUser, formatCurrency, bookings } = useApp();

  const latestBooking = booking || bookings[0];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#BAE6FD] rounded-card w-full max-w-lg p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Invoice Header */}
        <div className="text-center pb-6 border-b border-[#E2E8F0]">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] flex items-center justify-center mx-auto mb-2 shadow-xs">
            <Zap className="w-6 h-6 fill-[#0284C7]" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#0284C7] font-bold">OFFICIAL CHARGING RECEIPT</span>
          <h2 className="text-xl font-bold text-[#0F172A] mt-1">Charging Session Tax Invoice</h2>
          <p className="text-xs text-[#64748B] font-mono">Invoice Reference: #EVIO-{latestBooking?.id || '2026-901'}</p>
        </div>

        {/* Breakdown Items */}
        <div className="py-6 space-y-3 text-xs font-mono border-b border-[#E2E8F0]">
          <div className="flex justify-between text-[#64748B]">
            <span>Charging Station:</span>
            <span className="text-[#0F172A] font-bold">{latestBooking?.chargerTitle || 'Metro Hub 22kW Dual AC'}</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Station Host:</span>
            <span className="text-[#0F172A] font-medium">{latestBooking?.hostName || 'Apex Green Energy'}</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Vehicle:</span>
            <span className="text-[#0F172A] font-medium">{latestBooking?.driverVehicle || 'Tesla Model 3'}</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Energy Dispensed:</span>
            <span className="text-[#0F172A] font-bold">{latestBooking?.estimatedKwh || 18.5} kWh</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Duration:</span>
            <span className="text-[#0F172A] font-medium">{latestBooking?.durationHours || 1.5} Hours</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Payment Method:</span>
            <span className="text-[#0F172A] font-bold uppercase">{latestBooking?.paymentMethod || 'Wallet'}</span>
          </div>
        </div>

        {/* Total Cost */}
        <div className="py-4 border-b border-[#E2E8F0] flex justify-between items-baseline font-mono">
          <div>
            <span className="text-xs text-[#64748B] block">Total Settled</span>
            <span className="text-[10px] text-[#16A34A] flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> Paid in full
            </span>
          </div>
          <div className="text-[28px] font-bold text-[#0284C7]">
            {formatCurrency(latestBooking?.totalAmount || 6.20)}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 flex gap-3 font-mono">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0284C7] font-bold text-xs flex items-center justify-center gap-2 border border-[#BAE6FD] shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs tracking-wider shadow-sm shadow-[#0284C7]/20"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
