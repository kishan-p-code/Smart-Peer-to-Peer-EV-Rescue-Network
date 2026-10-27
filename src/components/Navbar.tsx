import React, { useState } from 'react';
import { 
  Zap, 
  MapPin, 
  LayoutDashboard, 
  ShieldCheck, 
  Wallet, 
  Bell, 
  MessageSquare, 
  Car, 
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Cpu,
  LogOut,
  DollarSign,
  Truck,
  Building2,
  Repeat,
  Radio,
  Navigation
} from 'lucide-react';
import { useApp, Currency } from '../context/AppContext';

interface NavbarProps {
  currentTab: 'driver' | 'bookings' | 'host' | 'admin' | 'journey';
  setCurrentTab: (tab: 'driver' | 'bookings' | 'host' | 'admin' | 'journey') => void;
  onOpenWallet: () => void;
  onOpenChat: () => void;
  onOpenActiveSession: () => void;
  onOpenAI: () => void;
  onOpenBatteryDelivery: () => void;
  onOpenV2V: () => void;
  onOpenFranchise: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenWallet,
  onOpenChat,
  onOpenActiveSession,
  onOpenAI,
  onOpenBatteryDelivery,
  onOpenV2V,
  onOpenFranchise,
}) => {
  const { 
    currentUser, 
    logoutUser,
    role, 
    switchRole, 
    currency,
    setCurrency,
    formatCurrency, 
    activeBooking,
    notifications,
    markNotificationsAsRead
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#BAE6FD] px-4 lg:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setCurrentTab('driver')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] group-hover:border-[#0284C7] group-hover:bg-[#0284C7] group-hover:text-white transition-all shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-[#0F172A] font-mono">EVIO</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-mono font-bold border border-[#BAE6FD]">NETWORK</span>
              </div>
              <p className="text-[10px] text-[#64748B] uppercase tracking-wider hidden sm:block font-mono">Peer-to-Peer Charging Grid</p>
            </div>
          </div>

          {/* Role-Specific Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            {role === 'driver' && (
              <>
                <button
                  onClick={() => setCurrentTab('driver')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'driver' 
                      ? 'bg-[#0284C7] text-white shadow-sm font-bold' 
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Find Chargers</span>
                </button>

                <button
                  onClick={() => setCurrentTab('journey')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'journey' 
                      ? 'bg-[#0284C7] text-white shadow-sm font-bold' 
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Journey Prediction</span>
                </button>

                <button
                  onClick={() => setCurrentTab('bookings')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'bookings' 
                      ? 'bg-[#0284C7] text-white shadow-sm font-bold' 
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>My Sessions</span>
                </button>
              </>
            )}

            {role === 'hub' && (
              <button
                onClick={() => setCurrentTab('host')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#16A34A] text-white shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Hub Stations & Telemetry</span>
              </button>
            )}

            {role === 'supervisor' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0284C7] text-white shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Supervisor Safety Operations</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">

          {/* Battery Delivery Button (Driver Only) */}
          {role === 'driver' && (
            <button
              onClick={onOpenBatteryDelivery}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0284C7] text-xs font-mono font-bold text-[#0F172A] hover:text-[#0284C7] transition-all shadow-xs"
              title="Order Swappable Battery Delivery"
            >
              <Truck className="w-3.5 h-3.5 text-[#0284C7]" />
              <span className="hidden lg:inline">Battery Delivery</span>
            </button>
          )}

          {/* V2V Highway Reverse Charge SOS (Driver Only) */}
          {role === 'driver' && (
            <button
              onClick={onOpenV2V}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#FECDD3] hover:border-[#E11D48] text-xs font-mono font-bold text-[#E11D48] hover:bg-[#FFF1F2] transition-all shadow-xs"
              title="P2P V2V Highway Reverse Charge SOS"
            >
              <Repeat className="w-3.5 h-3.5 text-[#E11D48]" />
              <span className="hidden lg:inline">V2V SOS</span>
            </button>
          )}

          {/* Hub Franchise Partner (Driver & Hub only - Strictly hidden for Supervisor) */}
          {role !== 'supervisor' && (
            <button
              onClick={onOpenFranchise}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] hover:border-[#16A34A] text-xs font-mono font-bold text-[#16A34A] transition-all shadow-xs"
              title="Setup Hub Franchise with Bulk Wholesale Chargers"
            >
              <Building2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="hidden md:inline">Franchise</span>
            </button>
          )}

          {/* AI Telemetry Assistant */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] hover:border-[#0284C7] text-xs font-mono font-bold text-[#0284C7] transition-all shadow-xs"
            title="Open AI Route & Charging Assistant"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">AI Assistant</span>
          </button>

          {/* Active Session Indicator */}
          {activeBooking && activeBooking.activeSession && (
            <button
              onClick={onOpenActiveSession}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DCFCE7] border border-[#86EFAC] hover:bg-[#BBF7D0] transition-all text-[#16A34A] text-xs font-mono font-bold shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              <span className="hidden sm:inline">CHARGING:</span>
              <span>{activeBooking.activeSession.batteryPercentage}%</span>
              <span className="text-[#64748B] hidden md:inline">({activeBooking.activeSession.flowRateKw} kW)</span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0284C7] text-xs font-mono text-[#475569] transition-all shadow-xs"
            >
              <span className="text-[#0284C7] font-bold">{currency}</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {showCurrencyMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-[#BAE6FD] rounded-xl shadow-xl py-1 z-50">
                {(['USD', 'EUR', 'GBP', 'INR'] as Currency[]).map(c => (
                  <button
                    key={c}
                    onClick={() => { setCurrency(c); setShowCurrencyMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center justify-between hover:bg-[#F0F9FF] ${currency === c ? 'text-[#0284C7] font-bold' : 'text-[#0F172A]'}`}
                  >
                    <span>{c}</span>
                    {currency === c && <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Balance Pill */}
          {currentUser && (
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#BAE6FD] hover:border-[#0284C7] transition-all shadow-xs"
              title="Wallet & Balance"
            >
              <Wallet className="w-3.5 h-3.5 text-[#0284C7]" />
              <span className="text-xs font-mono font-bold text-[#0F172A]">
                {formatCurrency(currentUser.walletBalance)}
              </span>
            </button>
          )}

          {/* Chat */}
          <button
            onClick={onOpenChat}
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0284C7] hover:border-[#0284C7] transition-all shadow-xs"
            title="Messages"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markNotificationsAsRead();
              }}
              className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0284C7] hover:border-[#0284C7] transition-all shadow-xs relative"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#DC2626]"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#BAE6FD] rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F172A] font-mono uppercase">Activity Feed</span>
                  <span className="text-[10px] text-[#0284C7] font-mono font-bold">LIVE TELEMETRY</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#64748B]">No recent events recorded.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 hover:bg-[#F0F9FF] transition-colors">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A] mb-1">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-[#64748B] font-mono">{n.time}</span>
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">{n.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-white border border-[#BAE6FD] hover:border-[#0284C7] transition-all shadow-xs"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-[#0F172A] leading-tight">{currentUser.name}</p>
                  <p className="text-[10px] text-[#0284C7] font-mono uppercase font-bold tracking-wider">{role}</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center font-mono text-xs text-[#0284C7] font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#BAE6FD] rounded-xl shadow-2xl p-2 z-50">
                  <div className="p-2 border-b border-[#E2E8F0] mb-2">
                    <p className="text-xs font-bold text-[#0F172A]">{currentUser.name}</p>
                    <p className="text-[11px] text-[#64748B] font-mono">{currentUser.email}</p>
                  </div>

                  <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
                    <div className="text-[10px] uppercase font-bold text-[#94A3B8]">Connected Role</div>
                    <div className="text-[#0F172A] font-bold">
                      {role === 'driver' ? 'EV Driver Account' : role === 'hub' ? 'Charging Hub Operator' : 'Grid Safety Supervisor'}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logoutUser();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-around mt-3 pt-2 border-t border-[#E2E8F0] text-xs font-mono">
        {role === 'driver' && (
          <>
            <button
              onClick={() => setCurrentTab('driver')}
              className={`flex flex-col items-center gap-1 ${currentTab === 'driver' ? 'text-[#0284C7] font-bold' : 'text-[#64748B]'}`}
            >
              <MapPin className="w-4 h-4" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setCurrentTab('journey')}
              className={`flex flex-col items-center gap-1 ${currentTab === 'journey' ? 'text-[#0284C7] font-bold' : 'text-[#64748B]'}`}
            >
              <Navigation className="w-4 h-4" />
              <span>Journey</span>
            </button>
            <button
              onClick={() => setCurrentTab('bookings')}
              className={`flex flex-col items-center gap-1 ${currentTab === 'bookings' ? 'text-[#0284C7] font-bold' : 'text-[#64748B]'}`}
            >
              <Car className="w-4 h-4" />
              <span>Sessions</span>
            </button>
          </>
        )}
        {role === 'hub' && (
          <button
            onClick={() => setCurrentTab('host')}
            className="flex flex-col items-center gap-1 text-[#16A34A] font-bold"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Hub Dashboard</span>
          </button>
        )}
        {role === 'supervisor' && (
          <button
            onClick={() => setCurrentTab('admin')}
            className="flex flex-col items-center gap-1 text-[#0284C7] font-bold"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Supervisor Console</span>
          </button>
        )}
      </div>
    </header>
  );
};
