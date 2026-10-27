import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Check,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminPanel: React.FC = () => {
  const { 
    chargers, 
    approveChargerListing, 
    rejectChargerListing, 
    formatCurrency, 
    disputes, 
    resolveDispute,
    bookings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'disputes' | 'revenue'>('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedChargerIdForReject, setSelectedChargerIdForReject] = useState<string | null>(null);

  const pendingListings = chargers.filter(c => c.listingStatus === 'pending');

  const totalGMV = bookings.reduce((sum, b) => sum + b.totalAmount, 0) + 12500;
  const platformRevenue = bookings.reduce((sum, b) => sum + b.platformFee, 0) + 1250;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Admin Header */}
      <div className="bg-white border border-[#BAE6FD] rounded-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Compliance & Approvals</h1>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#CBD5E1] text-xs font-mono">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Pending Approvals</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {pendingListings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'disputes' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Disputes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {disputes.filter(d => d.status !== 'resolved').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'revenue' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Platform Revenue
          </button>
        </div>
      </div>

      {/* TAB 1: Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingListings.length === 0 ? (
            <div className="bg-white border border-[#BAE6FD] rounded-card p-12 text-center shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto mb-2 opacity-90" />
              <h3 className="text-base font-bold text-[#0F172A]">All Stations Verified & Active</h3>
            </div>
          ) : (
            pendingListings.map(chg => (
              <div 
                key={chg.id}
                className="bg-white border border-[#BAE6FD] rounded-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <img 
                    src={chg.photos[0]} 
                    alt="" 
                    className="w-32 h-24 rounded-xl object-cover border border-[#CBD5E1] bg-[#F8FAFC] shrink-0" 
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] text-[10px] font-mono font-bold uppercase">
                        REQUIRES COMPLIANCE APPROVAL
                      </span>
                      <span className="text-xs font-mono text-[#0284C7] font-bold">{chg.powerKw} kW ({chg.powerTier.toUpperCase()})</span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A]">{chg.title}</h3>
                    <p className="text-xs text-[#64748B] font-mono">{chg.exactAddress}</p>
                    <p className="text-xs text-[#64748B] font-mono">
                      Host: <strong className="text-[#0F172A]">{chg.hostName}</strong> • Rate: <span className="text-[#0284C7] font-bold">{formatCurrency(chg.priceRate)}</span>
                    </p>

                    <div className="mt-2 p-2.5 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-between text-xs max-w-md font-mono">
                      <div className="flex items-center gap-2 text-[#64748B]">
                        <FileText className="w-4 h-4 text-[#0284C7]" />
                        <span className="text-[#0F172A] text-[11px] font-bold truncate">{chg.safetyCertificateName || 'Safety_Cert_2026.pdf'}</span>
                      </div>
                      <span className="text-[10px] text-[#0284C7] font-bold underline cursor-pointer">
                        Inspect Certificate
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col lg:flex-row items-center gap-2.5 shrink-0 font-mono">
                  <button
                    onClick={() => approveChargerListing(chg.id)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs tracking-wider shadow-sm shadow-[#16A34A]/25 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>APPROVE & PUBLISH</span>
                  </button>

                  <button
                    onClick={() => setSelectedChargerIdForReject(chg.id)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>REJECT</span>
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Rejection Modal */}
          {selectedChargerIdForReject && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-[#BAE6FD] rounded-card p-6 max-w-md w-full space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-[#0F172A] font-mono">Reject Station Listing</h3>
                <p className="text-xs text-[#64748B] font-sans">
                  State the safety or electrical reason for rejection (e.g. invalid earth grounding reading, missing breaker specs).
                </p>
                <textarea
                  rows={3}
                  placeholder="Compliance rejection notes..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:border-[#DC2626] font-mono"
                />
                <div className="flex justify-end gap-2 font-mono">
                  <button
                    onClick={() => setSelectedChargerIdForReject(null)}
                    className="px-4 py-2 rounded-xl text-xs text-[#64748B] hover:text-[#0F172A]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedChargerIdForReject) {
                        rejectChargerListing(selectedChargerIdForReject, rejectReason || 'Incomplete safety certification');
                        setSelectedChargerIdForReject(null);
                        setRejectReason('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Disputes */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="bg-white border border-[#BAE6FD] rounded-card p-12 text-center text-xs text-[#64748B] font-mono shadow-sm">
              Zero active disputes or billing issues reported on network.
            </div>
          ) : (
            disputes.map(d => (
              <div key={d.id} className="bg-white border border-[#BAE6FD] rounded-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.status === 'resolved' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}>
                      {d.status}
                    </span>
                    <span className="text-xs text-[#64748B]">{d.chargerTitle}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">{d.reason}</h4>
                  <p className="text-xs text-[#64748B] mt-1 font-sans">{d.details}</p>
                </div>

                {d.status !== 'resolved' ? (
                  <button
                    onClick={() => resolveDispute(d.id)}
                    className="px-4 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold shadow-xs"
                  >
                    Resolve & Settle
                  </button>
                ) : (
                  <span className="text-xs text-[#16A34A] font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Case Closed
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Revenue Dashboard */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#BAE6FD] rounded-card p-6 space-y-3 shadow-sm">
            <span className="text-xs text-[#64748B] uppercase font-mono font-bold tracking-wider">
              Gross Merchandise Value (GMV)
            </span>
            <div className="font-mono text-[32px] font-bold text-[#0F172A]">{formatCurrency(totalGMV)}</div>
            <p className="text-xs text-[#64748B]">Total monetary value of power transacted across peer charging nodes.</p>
          </div>

          <div className="bg-white border border-[#BAE6FD] rounded-card p-6 space-y-3 shadow-sm">
            <span className="text-xs text-[#64748B] uppercase font-mono font-bold tracking-wider">
              Net Platform Take Rate (10%)
            </span>
            <div className="font-mono text-[32px] font-bold text-[#0284C7]">{formatCurrency(platformRevenue)}</div>
            <p className="text-xs text-[#64748B]">Platform commission allocated for network expansion and insurance escrow.</p>
          </div>
        </div>
      )}

    </div>
  );
};
