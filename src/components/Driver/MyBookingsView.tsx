import React from 'react';
import { 
  Car, 
  Zap, 
  FileText, 
  MessageSquare, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MyBookingsViewProps {
  onOpenActiveSession: () => void;
  onOpenReceipt: () => void;
  onOpenChat: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  onOpenActiveSession,
  onOpenReceipt,
  onOpenChat,
}) => {
  const { bookings, formatCurrency, activeBooking, startChargingSession } = useApp();

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-white border border-[#BAE6FD] rounded-card p-5 shadow-sm">
        <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Charging Sessions & History</h1>
      </div>

      {/* Pending Approval Banner */}
      {bookings.some(b => b.status === 'requested') && (
        <div className="bg-[#F0F9FF] border-2 border-[#0284C7] rounded-card p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] animate-ping"></span>
            <div>
              <div className="text-xs font-mono font-bold text-[#0284C7] uppercase">
                Slot Request Pending Host Confirmation
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Slot Scheduled Banners */}
      {bookings.filter(b => b.status === 'confirmed').map(b => (
        <div key={b.id} className="bg-[#F0FDF4] border-2 border-[#16A34A] rounded-card p-6 relative overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-[#16A34A] uppercase tracking-wider">
                  SLOT APPROVED BY HUB HOST • SCHEDULED RESERVATION CONFIRMED
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">{b.chargerTitle}</h3>
              <p className="text-xs text-[#0F172A] font-mono">
                Scheduled Charging Window: <strong className="text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">{b.startTime}</strong> ({b.durationHours} hrs duration)
              </p>
              <p className="text-[11px] text-[#64748B] font-mono mt-0.5">
                Host: <strong className="text-[#0F172A]">{b.hostName}</strong> • Vehicle: {b.driverVehicle} • Access Notes: Automated boom barrier, PIN: 4829#
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  startChargingSession(b.id);
                  onOpenActiveSession();
                }}
                className="px-5 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-mono font-bold text-xs tracking-wider shadow-md shadow-[#16A34A]/25 transition-all flex items-center gap-2 active:scale-98"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>START CHARGING SESSION</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Active Session Highlight Banner */}
      {activeBooking && activeBooking.activeSession && (
        <div className="bg-[#F0FDF4] border-2 border-[#16A34A] rounded-card p-6 relative overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span className="text-xs font-mono font-bold text-[#16A34A] uppercase tracking-wider">
                  ACTIVE CHARGING SESSION IN PROGRESS
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">{activeBooking.chargerTitle}</h3>
              <p className="text-xs text-[#64748B] mt-0.5 font-mono">
                Vehicle: {activeBooking.driverVehicle} • Plugged in: {activeBooking.startTime}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono font-bold text-[#64748B] block">Battery SOC</span>
                <span className="font-mono text-2xl font-bold text-[#16A34A]">
                  {activeBooking.activeSession.batteryPercentage}%
                </span>
              </div>

              <button
                onClick={onOpenActiveSession}
                className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-mono font-bold text-xs tracking-wider shadow-sm shadow-[#16A34A]/25 transition-all flex items-center gap-1.5"
              >
                <span>LIVE TELEMETRY</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions History Table */}
      <div className="bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0F172A] mb-4">Past Sessions & Receipts</h3>
        
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B] border border-dashed border-[#CBD5E1] rounded-xl font-mono">
            No charging sessions recorded in your account yet. Select a station on the map to start charging.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] font-mono tracking-wider">
                  <th className="pb-3 font-semibold">Session ID</th>
                  <th className="pb-3 font-semibold">Station & Host</th>
                  <th className="pb-3 font-semibold">Timestamp & Duration</th>
                  <th className="pb-3 font-semibold">Energy (kWh)</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Amount Settled</th>
                  <th className="pb-3 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-[#F0F9FF] transition-colors">
                    <td className="py-3.5 font-mono text-[#0284C7] font-bold">{b.id}</td>
                    <td className="py-3.5">
                      <div className="font-bold text-[#0F172A]">{b.chargerTitle}</div>
                      <div className="text-[11px] text-[#64748B] font-mono">Host: {b.hostName}</div>
                    </td>
                    <td className="py-3.5 font-mono">
                      <div className="text-[#0F172A] font-semibold">{b.startTime}</div>
                      <div className="text-[11px] text-[#64748B]">{b.durationHours} hours</div>
                    </td>
                    <td className="py-3.5 font-mono text-[#0F172A] font-bold">
                      {b.estimatedKwh} kWh
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        b.status === 'active' 
                          ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                          : b.status === 'confirmed'
                          ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                          : b.status === 'completed'
                          ? 'bg-[#F1F5F9] text-[#475569]'
                          : b.status === 'requested'
                          ? 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
                          : b.status === 'rejected'
                          ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                          : 'bg-[#FEF3C7] text-[#D97706]'
                      }`}>
                        {b.status === 'requested' 
                          ? 'Awaiting Host Approval' 
                          : b.status === 'confirmed'
                          ? `Confirmed (${b.startTime})`
                          : b.status === 'rejected' 
                          ? 'Declined by Host' 
                          : b.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-[#0F172A]">
                      {formatCurrency(b.totalAmount)}
                    </td>
                    <td className="py-3.5 text-right space-x-2 font-mono">
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            startChargingSession(b.id);
                            onOpenActiveSession();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Plug In</span>
                        </button>
                      )}
                      <button
                        onClick={onOpenReceipt}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0284C7] text-xs text-[#0284C7] font-bold inline-flex items-center gap-1 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>Invoice</span>
                      </button>
                      <button
                        onClick={onOpenChat}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0284C7] text-xs text-[#64748B] hover:text-[#0284C7] inline-flex items-center gap-1 shadow-xs"
                        title="Chat Host"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#0284C7]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
