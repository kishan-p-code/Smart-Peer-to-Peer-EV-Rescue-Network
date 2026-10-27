import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Check,
  AlertTriangle,
  Activity,
  Zap,
  Cpu,
  BarChart3,
  Clock,
  Layers,
  Search,
  Trash2,
  MapPin,
  PlayCircle,
  PauseCircle,
  Users,
  ArrowLeft,
  Building,
  ChevronRight,
  Receipt,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChargerListing, FranchiseApplication } from '../../types';
import { ChargerInspectionModal } from '../Common/ChargerInspectionModal';

export const SupervisorDashboard: React.FC = () => {
  const { 
    chargers, 
    approveChargerListing, 
    rejectChargerListing, 
    deleteCharger,
    toggleHostVacation,
    formatCurrency, 
    disputes, 
    resolveDispute,
    bookings,
    franchiseApplications,
    updateFranchiseStatus,
    quoteFranchiseApplication
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'hubs' | 'franchise' | 'grid' | 'disputes' | 'audit'>('all');
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [selectedChargerForInspect, setSelectedChargerForInspect] = useState<ChargerListing | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedChargerIdForReject, setSelectedChargerIdForReject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Wholesale Quotation modal state
  const [selectedAppForQuote, setSelectedAppForQuote] = useState<FranchiseApplication | null>(null);
  const [quoteRateInput, setQuoteRateInput] = useState<number>(380000);
  const [quoteNotesInput, setQuoteNotesInput] = useState<string>(
    'Location and substation feeder verified. Subsidized 40% bulk pricing sanctioned for turnkey installation.'
  );

  const pendingListings = chargers.filter(c => c.listingStatus === 'pending');
  const liveListings = chargers.filter(c => c.listingStatus === 'live');
  const activeSessions = bookings.filter(b => b.status === 'active');

  const totalGridCapacityKw = liveListings.reduce((sum, c) => sum + c.powerKw, 0);
  const currentLoadKw = activeSessions.reduce((sum, b) => sum + (b.activeSession?.flowRateKw || 0), 0);
  const loadPercentage = totalGridCapacityKw > 0 ? ((currentLoadKw / totalGridCapacityKw) * 100).toFixed(1) : '0.0';

  // Distinct Hub hosts from chargers & registrations
  const uniqueHubs = React.useMemo(() => {
    const hubMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      avatar?: string;
      chargers: typeof chargers;
      totalCapacityKw: number;
      pendingCount: number;
      liveCount: number;
    }>();

    chargers.forEach(c => {
      const hid = c.hostId || 'hub-101';
      if (!hubMap.has(hid)) {
        hubMap.set(hid, {
          id: hid,
          name: c.hostName || 'Hub Host',
          email: c.hostEmail || `${hid.toLowerCase()}@network.evio`,
          avatar: c.hostAvatar,
          chargers: [],
          totalCapacityKw: 0,
          pendingCount: 0,
          liveCount: 0,
        });
      }
      const h = hubMap.get(hid)!;
      h.chargers.push(c);
      h.totalCapacityKw += c.powerKw;
      if (c.listingStatus === 'pending') h.pendingCount += 1;
      if (c.listingStatus === 'live') h.liveCount += 1;
    });

    return Array.from(hubMap.values());
  }, [chargers]);

  const selectedHub = uniqueHubs.find(h => h.id === selectedHubId) || null;

  const filteredAllChargers = chargers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || 
      c.id.toLowerCase().includes(q) || 
      c.hostName.toLowerCase().includes(q) || 
      c.approxAddress.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Supervisor Header */}
      <div className="bg-white border border-[#BAE6FD] rounded-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-[#0284C7] uppercase tracking-wider">
              Electrical Safety Authority & Grid Supervision
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Supervisor Operations Console</h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#CBD5E1] text-xs font-mono flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>All Chargers Fleet</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {chargers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safety Approvals</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {pendingListings.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('hubs');
              setSelectedHubId(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'hubs' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Hub Operators</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {uniqueHubs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('franchise')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'franchise' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Franchise Wholesale</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {franchiseApplications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'grid' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Grid Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'disputes' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Disputes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {disputes.filter(d => d.status !== 'resolved').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-[#0284C7] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Log</span>
          </button>
        </div>
      </div>

      {/* Real-Time Supervisor KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#BAE6FD] rounded-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748B] mb-1">
            <span>Total Network Fleet</span>
            <Zap className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#0F172A]">
            {chargers.length} Stations
          </div>
        </div>

        <div className="bg-white border border-[#BAE6FD] rounded-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748B] mb-1">
            <span>Pending Verifications</span>
            <ShieldCheck className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#0F172A]">
            {pendingListings.length} Pending
          </div>
        </div>

        <div className="bg-white border border-[#BAE6FD] rounded-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748B] mb-1">
            <span>Instant Grid Load</span>
            <Activity className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#0F172A]">
            {currentLoadKw.toFixed(1)} kW
          </div>
        </div>

        <div className="bg-white border border-[#BAE6FD] rounded-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748B] mb-1">
            <span>Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#0F172A]">
            {disputes.filter(d => d.status !== 'resolved').length} Pending
          </div>
        </div>
      </div>

      {/* TAB 0: ALL CHARGERS FLEET & SUPERVISOR DELETION AUTHORITY */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0284C7]" />
                <span>All Grid Charging Stations Authority ({chargers.length})</span>
              </h2>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Title, Node ID or Host..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white font-sans"
              />
            </div>
          </div>

          {filteredAllChargers.length === 0 ? (
            <div className="bg-white border border-[#BAE6FD] rounded-card p-12 text-center text-xs text-[#64748B] font-mono shadow-sm">
              0 stations matching search query.
            </div>
          ) : (
            <div className="bg-white border border-[#BAE6FD] rounded-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Node ID & Photo</th>
                      <th className="py-3 px-4">Station Title</th>
                      <th className="py-3 px-4">Host / Operator</th>
                      <th className="py-3 px-4">Power & Rate</th>
                      <th className="py-3 px-4">Earthing Safety</th>
                      <th className="py-3 px-4">Grid Status</th>
                      <th className="py-3 px-4 text-right">Supervisor Authority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredAllChargers.map(charger => (
                      <tr 
                        key={charger.id} 
                        onClick={() => setSelectedChargerForInspect(charger)}
                        className="hover:bg-[#F0F9FF] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={charger.photos[0] || 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800'} 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-cover border border-[#CBD5E1] group-hover:border-[#0284C7]"
                            />
                            <div>
                              <span className="font-bold text-[#0284C7] block">{charger.id}</span>
                              <span className="text-[10px] text-[#64748B] font-sans">
                                {charger.lat.toFixed(3)}, {charger.lng.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0F172A] font-sans text-xs group-hover:text-[#0284C7] transition-colors">{charger.title}</div>
                          <div className="text-[11px] text-[#64748B] truncate max-w-xs">{charger.approxAddress}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#0F172A]">{charger.hostName}</div>
                          <div className="text-[10px] text-[#94A3B8]">{charger.hostEmail || 'host@network'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#0284C7]">{charger.powerKw} kW</span>
                          <span className="text-[10px] text-[#64748B] block">{formatCurrency(charger.priceRate)}/unit</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            charger.safetyCertificateVerified ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#D97706]'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            <span>{charger.safetyCertificateVerified ? 'Verified' : 'Pending'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            charger.listingStatus === 'live' 
                              ? 'bg-[#DCFCE7] text-[#16A34A]' 
                              : charger.listingStatus === 'pending'
                              ? 'bg-[#FEF3C7] text-[#D97706]'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}>
                            {charger.listingStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChargerForInspect(charger);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] text-xs font-bold flex items-center gap-1 shadow-xs"
                              title="View past receipts, power graphs & telemetry"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>Graphs & Receipts</span>
                            </button>

                            {charger.listingStatus === 'pending' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveChargerListing(charger.id);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs flex items-center gap-1"
                                title="Approve station live"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Supervisor Authority: Are you sure you want to permanently delete node [${charger.title}] (${charger.id}) from the network?`)) {
                                  deleteCharger(charger.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-[#E11D48] hover:bg-[#FFE4E6] border border-transparent hover:border-[#FECDD3] transition-all"
                              title="Delete charger permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: SAFETY APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0F172A] font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
              <span>Safety Certification Approval Queue ({pendingListings.length})</span>
            </h2>
          </div>

          {pendingListings.length === 0 ? (
            <div className="bg-white border border-[#BAE6FD] rounded-card p-12 text-center text-xs text-[#64748B] font-mono shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2 opacity-80" />
              <p className="font-bold text-[#0F172A]">All Safety Certificates Verified</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingListings.map(charger => (
                <div 
                  key={charger.id} 
                  className="bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                        {charger.id}
                      </span>
                      <h3 className="text-base font-bold text-[#0F172A]">{charger.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] font-mono font-bold">
                        Pending Electrical Audit
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-[#64748B]">
                      <div>
                        <span className="block text-[10px] text-[#94A3B8]">HOST</span>
                        <span className="text-[#0F172A] font-medium">{charger.hostName}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#94A3B8]">LOCATION</span>
                        <span className="text-[#0F172A] font-medium">{charger.exactAddress}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#94A3B8]">POWER SPECS</span>
                        <span className="text-[#0284C7] font-bold">{charger.powerKw} kW ({charger.connectorTypes.join(', ')})</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#94A3B8]">RATE</span>
                        <span className="text-[#0F172A] font-bold">{formatCurrency(charger.priceRate)}/{charger.pricingType === 'per-kwh' ? 'kWh' : 'hr'}</span>
                      </div>
                    </div>

                    {/* Certificate Box */}
                    <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0284C7]" />
                        <span className="font-bold text-[#0F172A]">Document: {charger.safetyCertificateName || 'State_Earthing_Inspection.pdf'}</span>
                        <span className="text-[#64748B] text-[10px]">• Earthing Resistance &lt; 5Ω Verified</span>
                      </div>
                      <span className="text-[11px] text-[#0284C7] font-bold underline cursor-pointer">
                        View Audit Scan
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col lg:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChargerForInspect(charger)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] font-mono text-xs font-bold transition-all shadow-xs"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Inspect Graphs & Telemetry</span>
                    </button>

                    <button
                      onClick={() => approveChargerListing(charger.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-mono text-xs font-bold transition-all shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Authorize Live</span>
                    </button>

                    <button
                      onClick={() => setSelectedChargerIdForReject(charger.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#E11D48] text-[#E11D48] hover:bg-[#FFF1F2] font-mono text-xs font-bold transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete station [${charger.title}]?`)) {
                          deleteCharger(charger.id);
                        }
                      }}
                      className="p-2.5 rounded-xl text-[#E11D48] hover:bg-[#FFE4E6] border border-transparent hover:border-[#FECDD3] transition-all"
                      title="Delete Charger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reject Reason Modal */}
          {selectedChargerIdForReject && (
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-[#BAE6FD] rounded-card p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-sm font-bold text-[#0F172A] font-mono mb-3">Specify Rejection Finding</h3>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Earthing measurement exceeds 5 Ohms or missing RCCB specification."
                  className="w-full h-24 p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] mb-4 font-sans"
                />
                <div className="flex justify-end gap-2 text-xs font-mono">
                  <button
                    onClick={() => {
                      setSelectedChargerIdForReject(null);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#64748B]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedChargerIdForReject) {
                        rejectChargerListing(selectedChargerIdForReject, rejectReason || 'Safety documentation non-compliant.');
                        setSelectedChargerIdForReject(null);
                        setRejectReason('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: HUB OPERATORS / HOSTS DIRECTORY */}
      {activeTab === 'hubs' && (
        <div className="space-y-5">
          {selectedHub ? (
            /* Selected Hub View - Shows all chargers of that hub! */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedHubId(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[#0284C7] hover:border-[#0284C7] text-xs font-mono font-bold transition-all shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to All Hub Operators</span>
                </button>
              </div>

              {/* Hub Profile Banner */}
              <div className="bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] font-bold text-xl font-mono shrink-0">
                    <Building className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-[#0284C7] uppercase px-2 py-0.5 rounded bg-[#E0F2FE]">
                        {selectedHub.id}
                      </span>
                      <span className="text-xs text-[#16A34A] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Commercial Host</span>
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#0F172A]">{selectedHub.name}</h2>
                    <p className="text-xs text-[#64748B] font-mono mt-0.5">Contact: {selectedHub.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center font-mono">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                    <span className="text-[10px] text-[#64748B] block uppercase">STATIONS</span>
                    <span className="text-base font-bold text-[#0F172A] mt-0.5 block">{selectedHub.chargers.length}</span>
                  </div>
                  <div className="p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl">
                    <span className="text-[10px] text-[#64748B] block uppercase">TOTAL POWER</span>
                    <span className="text-base font-bold text-[#0284C7] mt-0.5 block">{selectedHub.totalCapacityKw} kW</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                    <span className="text-[10px] text-[#64748B] block uppercase">LIVE ON GRID</span>
                    <span className="text-base font-bold text-[#16A34A] mt-0.5 block">{selectedHub.liveCount}</span>
                  </div>
                </div>
              </div>

              {/* All Chargers of this Hub */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#0F172A] font-mono flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#0284C7]" />
                    <span>All Charging Stations Registered by {selectedHub.name} ({selectedHub.chargers.length})</span>
                  </h3>
                </div>

                <div className="bg-white border border-[#BAE6FD] rounded-card overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Node ID & Photo</th>
                        <th className="py-3 px-4">Station Title</th>
                        <th className="py-3 px-4">Power & Rate</th>
                        <th className="py-3 px-4">Earthing Safety</th>
                        <th className="py-3 px-4">Listing Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {selectedHub.chargers.map(charger => (
                        <tr 
                          key={charger.id}
                          onClick={() => setSelectedChargerForInspect(charger)}
                          className="hover:bg-[#F0F9FF] transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img 
                                src={charger.photos[0] || 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800'} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover border border-[#CBD5E1] group-hover:border-[#0284C7]"
                              />
                              <div>
                                <span className="font-bold text-[#0284C7] block">{charger.id}</span>
                                <span className="text-[10px] text-[#64748B] font-sans">
                                  {charger.lat.toFixed(3)}, {charger.lng.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0F172A] text-xs group-hover:text-[#0284C7]">{charger.title}</div>
                            <div className="text-[11px] text-[#64748B] truncate max-w-xs">{charger.approxAddress}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#0284C7]">{charger.powerKw} kW</span>
                            <span className="text-[10px] text-[#64748B] block">{formatCurrency(charger.priceRate)}/unit</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                              charger.safetyCertificateVerified ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#D97706]'
                            }`}>
                              <ShieldCheck className="w-3 h-3" />
                              <span>{charger.safetyCertificateVerified ? 'Verified' : 'Pending'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              charger.listingStatus === 'live' 
                                ? 'bg-[#DCFCE7] text-[#16A34A]' 
                                : charger.listingStatus === 'pending'
                                ? 'bg-[#FEF3C7] text-[#D97706]'
                                : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}>
                              {charger.listingStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChargerForInspect(charger);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0284C7] text-xs font-bold flex items-center gap-1 shadow-xs"
                              >
                                <Activity className="w-3.5 h-3.5" />
                                <span>Graphs & Receipts</span>
                              </button>

                              {charger.listingStatus === 'pending' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    approveChargerListing(charger.id);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Supervisor Authority: Are you sure you want to permanently delete node [${charger.title}] (${charger.id})?`)) {
                                    deleteCharger(charger.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-[#E11D48] hover:bg-[#FFE4E6] border border-transparent hover:border-[#FECDD3] transition-all"
                                title="Delete charger permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Hubs Directory List */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#0F172A] font-mono flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0284C7]" />
                    <span>Registered Hub Operators & Commercial Hosts ({uniqueHubs.length})</span>
                  </h2>
                </div>
              </div>

              {uniqueHubs.length === 0 ? (
                <div className="bg-white border border-[#BAE6FD] rounded-card p-12 text-center text-xs text-[#64748B] font-mono shadow-sm">
                  0 Hub Operators registered on the grid.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {uniqueHubs.map(hub => (
                    <div
                      key={hub.id}
                      onClick={() => setSelectedHubId(hub.id)}
                      className="bg-white border border-[#BAE6FD] hover:border-[#0284C7] rounded-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-mono text-xs font-bold border border-[#BAE6FD]">
                            {hub.id}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC]">
                            ACTIVE OPERATOR
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] font-bold text-lg font-mono shrink-0 group-hover:bg-[#0284C7] group-hover:text-white transition-all">
                            <Building className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0284C7] transition-colors truncate">
                              {hub.name}
                            </h3>
                            <p className="text-xs text-[#64748B] font-mono truncate">{hub.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E2E8F0] text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-[#94A3B8] block">FLEET STATIONS</span>
                            <span className="font-bold text-[#0F172A] text-sm">{hub.chargers.length} Chargers</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#94A3B8] block">TOTAL CAPACITY</span>
                            <span className="font-bold text-[#0284C7] text-sm">{hub.totalCapacityKw} kW</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono text-[#0284C7] font-bold group-hover:text-[#0369A1]">
                        <span>View All {hub.chargers.length} Chargers</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: FRANCHISE WHOLESALE HARDWARE PARTNERSHIP APPLICATIONS */}
      {activeTab === 'franchise' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-[#16A34A] uppercase px-2 py-0.5 rounded bg-[#DCFCE7] border border-[#86EFAC]">
                    Wholesale Procurement Pipeline
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
                  Franchise Hub Partners & Bulk Charger Applications ({franchiseApplications.length})
                </h2>
              </div>

              <div className="p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl text-center font-mono">
                <span className="text-[10px] text-[#64748B] block uppercase font-bold">Approved Franchisees</span>
                <span className="text-xl font-bold text-[#0284C7] mt-0.5 block">
                  {franchiseApplications.filter(a => a.status === 'approved').length}
                </span>
              </div>
            </div>
          </div>

          {franchiseApplications.length === 0 ? (
            <div className="bg-white border border-[#BAE6FD] rounded-card p-12 text-center text-xs text-[#64748B] font-mono shadow-sm">
              Zero pending franchise applications.
            </div>
          ) : (
            <div className="space-y-4">
              {franchiseApplications.map(app => (
                <div 
                  key={app.id}
                  className="bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-mono text-xs font-bold border border-[#BAE6FD]">
                        {app.id}
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">{app.applicantName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        app.status === 'quotation-sent' || app.status === 'approved' 
                          ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                          : app.status === 'rejected'
                          ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                          : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                      }`}>
                        {app.status === 'quotation-sent' 
                          ? `QUOTED: ${formatCurrency(app.quotedRate || 0)}` 
                          : app.status === 'approved' 
                          ? 'WHOLESALE APPROVED' 
                          : app.status === 'rejected' 
                          ? 'REJECTED' 
                          : 'PENDING SUPERVISOR VERIFICATION'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-[#64748B]">
                      <div>
                        <span className="block text-[10px] text-[#94A3B8]">CITY / CORRIDOR</span>
                        <span className="text-[#0F172A] font-bold">{app.city}</span>
                        {app.lat && (
                          <span className="text-[10px] text-[#0284C7] block">GPS: {app.lat.toFixed(4)}, {app.lng?.toFixed(4)}</span>
                        )}
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#94A3B8]">PACKAGE SETUP</span>
                        <span className="text-[#0284C7] font-bold capitalize">{app.packageType} Hub Bundle</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#94A3B8]">SUPERVISOR QUOTE</span>
                        <span className="text-[#16A34A] font-bold">
                          {app.quotedRate ? formatCurrency(app.quotedRate) : 'Pending Feeder Audit'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#94A3B8]">SANCTIONED POWER</span>
                        <span className="text-[#0F172A] font-medium">{app.powerSanctionKw} kW ({app.landType} land)</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#475569] font-sans bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                      <strong>Site Location:</strong> {app.locationAddress}. {app.notes}
                      {app.supervisorNotes && (
                        <span className="block mt-1 text-[#16A34A] font-mono font-bold">
                          Supervisor Audit Notes: {app.supervisorNotes}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#64748B] font-mono">
                      Contact: {app.phone} • {app.email} • Submitted: {app.createdAt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-stretch gap-2 shrink-0 font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAppForQuote(app);
                        setQuoteRateInput(app.quotedRate || (app.packageType === 'micro' ? 120000 : app.packageType === 'commercial' ? 420000 : 980000));
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>{app.quotedRate ? 'Update Wholesale Quote' : 'Verify & Send Wholesale Quote'}</span>
                    </button>

                    {app.status !== 'approved' && app.quotedRate && (
                      <button
                        type="button"
                        onClick={() => updateFranchiseStatus(app.id, 'approved')}
                        className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Authorize Hardware PO</span>
                      </button>
                    )}

                    {app.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => updateFranchiseStatus(app.id, 'rejected')}
                        className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#E11D48] text-[#E11D48] hover:bg-[#FFF1F2] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Decline Application</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRID TELEMETRY & LOAD BALANCING */}
      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="font-bold text-[#0F172A] font-mono">Substation Feeder Telemetry (Live)</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span>Normal Grid Frequency</span>
              </span>
            </div>

            {/* Grid Measurements */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <div className="text-[10px] text-[#64748B]">LINE VOLTAGE</div>
                <div className="text-xl font-bold text-[#0F172A] mt-0.5">231.4 V</div>
                <div className="text-[10px] text-[#16A34A]">Nominal (+0.6%)</div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <div className="text-[10px] text-[#64748B]">GRID FREQUENCY</div>
                <div className="text-xl font-bold text-[#0F172A] mt-0.5">50.02 Hz</div>
                <div className="text-[10px] text-[#16A34A]">Locked PLL</div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <div className="text-[10px] text-[#64748B]">POWER FACTOR</div>
                <div className="text-xl font-bold text-[#0284C7] mt-0.5">0.985</div>
                <div className="text-[10px] text-[#0284C7]">cos φ optimal</div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                <div className="text-[10px] text-[#64748B]">PEAK SHAVING</div>
                <div className="text-xl font-bold text-[#16A34A] mt-0.5">STANDBY</div>
                <div className="text-[10px] text-[#64748B]">No curtailment needed</div>
              </div>
            </div>

            {/* Live Station Load List */}
            <div>
              <h4 className="font-bold text-xs font-mono text-[#0F172A] mb-3 uppercase tracking-wider">
                Live Station Load Table
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left">
                  <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-3">Node ID</th>
                      <th className="py-2.5 px-3">Station Name</th>
                      <th className="py-2.5 px-3">Rated kW</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Safety Doc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {chargers.map(chg => (
                      <tr key={chg.id} className="hover:bg-[#F0F9FF]">
                        <td className="py-2.5 px-3 font-bold text-[#0284C7]">{chg.id}</td>
                        <td className="py-2.5 px-3 text-[#0F172A]">{chg.title}</td>
                        <td className="py-2.5 px-3 font-bold">{chg.powerKw} kW</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            chg.status === 'available' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                            chg.status === 'in-use' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}>
                            {chg.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#16A34A] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{chg.safetyCertificateVerified ? 'Verified' : 'Pending'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Supervisor Substation Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#BAE6FD] rounded-card p-5 shadow-sm space-y-4 font-mono">
              <h4 className="font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0284C7]" />
                <span>Substation Load Balancer</span>
              </h4>

              <div className="p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-bold text-[#0F172A]">
                  <span>Dynamic Curtailment:</span>
                  <span className="text-[#16A34A]">AUTOMATIC (ACTIVE)</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Max Substation Headroom:</span>
                  <span>120 kW</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Emergency Shutdown Relay:</span>
                  <span className="text-[#16A34A]">ARMED</span>
                </div>
              </div>

              <button
                onClick={() => alert('Grid compliance report exported.')}
                className="w-full py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-xs"
              >
                Export Grid Compliance Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPUTES */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#0F172A] font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
            <span>Station Disputes & Arbitration ({disputes.length})</span>
          </h2>

          {disputes.length === 0 ? (
            <div className="bg-white border border-[#BAE6FD] rounded-card p-12 text-center text-xs text-[#64748B] font-mono shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2 opacity-80" />
              <p className="font-bold text-[#0F172A]">Zero Active Station Incidents</p>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              {disputes.map(dispute => (
                <div key={dispute.id} className="bg-white border border-[#BAE6FD] rounded-card p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#E11D48] text-xs">#{dispute.id}</span>
                      <span className="text-xs font-bold text-[#0F172A]">{dispute.reason}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        dispute.status === 'resolved' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FFE4E6] text-[#E11D48]'
                      }`}>
                        {dispute.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] font-sans">{dispute.details}</div>
                    <div className="text-[11px] text-[#94A3B8]">Logged by User #{dispute.reporterId} • Booking #{dispute.bookingId} • {dispute.createdAt}</div>
                  </div>

                  {dispute.status !== 'resolved' && (
                    <button
                      onClick={() => resolveDispute(dispute.id)}
                      className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold whitespace-nowrap shadow-xs"
                    >
                      Arbitrate & Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#BAE6FD] rounded-card p-6 shadow-sm space-y-4 font-mono">
          <h3 className="font-bold text-[#0F172A] text-sm">Supervisor Security & Safety Audit Trail</h3>

          <div className="divide-y divide-[#E2E8F0] text-xs">
            <div className="py-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-[#0284C7]">SAFETY_VERIFY</span>
                <span className="text-[#0F172A] ml-2">Node NODE-001 certified for Level 2 operation (32A RCD Type B)</span>
              </div>
              <span className="text-[11px] text-[#94A3B8]">14 mins ago</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-[#16A34A]">GRID_STABILITY</span>
                <span className="text-[#0F172A] ml-2">Line frequency stabilized at 50.02 Hz across all active bays</span>
              </div>
              <span className="text-[11px] text-[#94A3B8]">1 hr ago</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-[#D97706]">INSPECTION_REQ</span>
                <span className="text-[#0F172A] ml-2">New installation uploaded: State_Certified_Earthing_Report.pdf</span>
              </div>
              <span className="text-[11px] text-[#94A3B8]">3 hrs ago</span>
            </div>
          </div>
        </div>
      )}

      {/* Charger Inspection Modal with Graphs, Past Invoices & Authority Actions */}
      {selectedChargerForInspect && (
        <ChargerInspectionModal
          charger={selectedChargerForInspect}
          onClose={() => setSelectedChargerForInspect(null)}
          isSupervisor={true}
          onApprove={(id) => {
            approveChargerListing(id);
            setSelectedChargerForInspect(prev => prev && prev.id === id ? { ...prev, listingStatus: 'live', status: 'available', safetyCertificateVerified: true } : prev);
          }}
          onDelete={(id) => {
            deleteCharger(id);
            setSelectedChargerForInspect(null);
          }}
        />
      )}

      {/* Supervisor Wholesale Quotation Modal */}
      {selectedAppForQuote && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#BAE6FD] rounded-card p-6 w-full max-w-lg shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#0284C7]" />
                  <span>Quote Subsidized Wholesale Rate</span>
                </h3>
                <p className="text-xs text-[#64748B] font-mono mt-0.5">
                  Applicant: {selectedAppForQuote.applicantName} ({selectedAppForQuote.packageType.toUpperCase()} Hub)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppForQuote(null)}
                className="w-7 h-7 rounded-full border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1] text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Proposed Location:</span>
                <strong className="text-[#0F172A]">{selectedAppForQuote.city}</strong>
              </div>
              {selectedAppForQuote.lat && (
                <div className="flex justify-between">
                  <span className="text-[#64748B]">GPS Coordinates:</span>
                  <strong className="text-[#0284C7]">{selectedAppForQuote.lat.toFixed(5)}, {selectedAppForQuote.lng?.toFixed(5)}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#64748B]">Sanctioned Load:</span>
                <strong className="text-[#0F172A]">{selectedAppForQuote.powerSanctionKw} kW ({selectedAppForQuote.landType})</strong>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="font-bold text-[#475569] block mb-1">Quoted Wholesale Package Rate (in ₹ INR) *</label>
                <input
                  type="number"
                  min="50000"
                  step="5000"
                  value={quoteRateInput}
                  onChange={e => setQuoteRateInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:border-[#0284C7]"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">Subsidized factory-direct wholesale bulk rate for complete hardware & gateway bundle.</span>
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">Supervisor Feasibility & Audit Notes *</label>
                <textarea
                  rows={3}
                  value={quoteNotesInput}
                  onChange={e => setQuoteNotesInput(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedAppForQuote(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (quoteRateInput > 0) {
                    quoteFranchiseApplication(selectedAppForQuote.id, quoteRateInput, quoteNotesInput);
                    setSelectedAppForQuote(null);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Dispatch Wholesale Quotation</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
