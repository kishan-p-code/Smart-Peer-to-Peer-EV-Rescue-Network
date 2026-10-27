import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './components/Auth/AuthScreen';
import { Navbar } from './components/Navbar';
import { DriverView } from './components/Driver/DriverView';
import { MyBookingsView } from './components/Driver/MyBookingsView';
import { HostDashboard } from './components/Host/HostDashboard';
import { ListingWizardModal } from './components/Host/ListingWizardModal';
import { SupervisorDashboard } from './components/Supervisor/SupervisorDashboard';
import { ActiveSessionModal } from './components/Driver/ActiveSessionModal';
import { WalletModal } from './components/Common/WalletModal';
import { ReceiptModal } from './components/Common/ReceiptModal';
import { ChatDrawer } from './components/Common/ChatDrawer';
import { AIAssistantDrawer } from './components/Common/AIAssistantDrawer';
import { BatteryDeliveryModal } from './components/Driver/BatteryDeliveryModal';
import { FranchiseModal } from './components/Franchise/FranchiseModal';
import { V2VReverseChargingModal } from './components/Driver/V2VReverseChargingModal';
import { JourneyPredictionView } from './components/Driver/JourneyPredictionView';
import { Zap, ShieldCheck } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, role } = useApp();

  const [currentTab, setCurrentTab] = useState<'driver' | 'bookings' | 'host' | 'admin' | 'journey'>('driver');
  const [showListingWizard, setShowListingWizard] = useState(false);
  const [showActiveSession, setShowActiveSession] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [showBatteryDeliveryModal, setShowBatteryDeliveryModal] = useState(false);
  const [showFranchiseModal, setShowFranchiseModal] = useState(false);
  const [showV2VModal, setShowV2VModal] = useState(false);

  // Automatically sync initial tab when logging into specific role dashboard
  React.useEffect(() => {
    if (role === 'driver') {
      if (currentTab !== 'driver' && currentTab !== 'bookings' && currentTab !== 'journey') {
        setCurrentTab('driver');
      }
    } else if (role === 'hub') {
      setCurrentTab('host');
    } else if (role === 'supervisor') {
      setCurrentTab('admin');
    }
  }, [role]);

  // If no user is logged in, show the AuthScreen
  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#BAE6FD] selection:text-[#0369A1]">
      
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenWallet={() => setShowWalletModal(true)}
        onOpenChat={() => setShowChatDrawer(true)}
        onOpenActiveSession={() => setShowActiveSession(true)}
        onOpenAI={() => setShowAIDrawer(true)}
        onOpenBatteryDelivery={() => setShowBatteryDeliveryModal(true)}
        onOpenV2V={() => setShowV2VModal(true)}
        onOpenFranchise={() => setShowFranchiseModal(true)}
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* DRIVER DASHBOARD */}
        {role === 'driver' && (
          <>
            {currentTab === 'bookings' ? (
              <MyBookingsView
                onOpenActiveSession={() => setShowActiveSession(true)}
                onOpenReceipt={() => setShowReceiptModal(true)}
                onOpenChat={() => setShowChatDrawer(true)}
              />
            ) : currentTab === 'journey' ? (
              <JourneyPredictionView />
            ) : (
              <DriverView 
                onOpenActiveSession={() => setShowActiveSession(true)} 
                onNavigateToBookings={() => setCurrentTab('bookings')}
                onOpenBatteryDelivery={() => setShowBatteryDeliveryModal(true)}
                onOpenV2V={() => setShowV2VModal(true)}
                onOpenFranchise={() => setShowFranchiseModal(true)}
              />
            )}
          </>
        )}

        {/* HUB (HOST) DASHBOARD */}
        {role === 'hub' && (
          <HostDashboard
            onOpenListingWizard={() => setShowListingWizard(true)}
            onOpenFranchise={() => setShowFranchiseModal(true)}
          />
        )}

        {/* SUPERVISOR DASHBOARD */}
        {role === 'supervisor' && (
          <SupervisorDashboard />
        )}
      </main>

      {/* Modals & Drawers */}
      {showListingWizard && (
        <ListingWizardModal
          onClose={() => setShowListingWizard(false)}
          onSuccess={() => {
            setShowListingWizard(false);
            setCurrentTab('host');
          }}
        />
      )}

      {showActiveSession && (
        <ActiveSessionModal
          onClose={() => setShowActiveSession(false)}
          onOpenChat={() => setShowChatDrawer(true)}
          onViewReceipt={() => setShowReceiptModal(true)}
        />
      )}

      {showWalletModal && (
        <WalletModal
          onClose={() => setShowWalletModal(false)}
        />
      )}

      {showReceiptModal && (
        <ReceiptModal
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {showChatDrawer && (
        <ChatDrawer
          onClose={() => setShowChatDrawer(false)}
        />
      )}

      {showAIDrawer && (
        <AIAssistantDrawer
          onClose={() => setShowAIDrawer(false)}
        />
      )}

      {showBatteryDeliveryModal && (
        <BatteryDeliveryModal
          onClose={() => setShowBatteryDeliveryModal(false)}
        />
      )}

      {showFranchiseModal && (
        <FranchiseModal
          onClose={() => setShowFranchiseModal(false)}
        />
      )}

      {showV2VModal && (
        <V2VReverseChargingModal
          onClose={() => setShowV2VModal(false)}
        />
      )}

      {/* Technical Footer (DESIGN.md: Technical tone & reliability) */}
      <footer className="border-t border-[#BAE6FD] bg-white py-5 px-4 sm:px-8 mt-12 text-xs text-[#64748B] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-bold">
              <Zap className="w-3 h-3 fill-[#0284C7] text-[#0284C7]" />
            </div>
            <span className="font-bold text-[#0F172A] tracking-wider">EVIO TELEMETRY v1.0</span>
            <span className="hidden md:inline text-[#64748B]">• Decentralized EV Charging Grid</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#16A34A]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Electrical Safety Certified</span>
            </span>
            <span className="text-[#0284C7] font-semibold">White & Sky Blue Grid</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
