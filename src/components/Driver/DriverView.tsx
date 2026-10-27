import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChargerListing } from '../../types';
import { LiveMap } from '../Map/LiveMap';
import { HeatmapView } from '../Map/HeatmapView';
import { DiscoveryFilters, FilterState } from './DiscoveryFilters';
import { ChargerCard } from './ChargerCard';
import { ChargerDetailModal } from './ChargerDetailModal';
import { Database, PlusCircle, AlertCircle, Truck, Repeat, Radio, Activity } from 'lucide-react';

interface DriverViewProps {
  onOpenActiveSession: () => void;
  onNavigateToBookings?: () => void;
  onOpenBatteryDelivery?: () => void;
  onOpenV2V?: () => void;
  onOpenFranchise?: () => void;
}

export const DriverView: React.FC<DriverViewProps> = ({ 
  onOpenActiveSession,
  onNavigateToBookings,
  onOpenBatteryDelivery,
  onOpenV2V,
  onOpenFranchise,
}) => {
  const { chargers, loadSeedChargers, userCoords, setUserCoords } = useApp();

  const [selectedCharger, setSelectedCharger] = useState<ChargerListing | null>(null);
  const [bookingModalCharger, setBookingModalCharger] = useState<ChargerListing | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Auto-detect location on dashboard mount so the map drops a pin right at user's location
  React.useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          setIsLocating(false);
        },
        () => {
          // Fallback location
          setIsLocating(false);
        },
        { timeout: 8000 }
      );
    }
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedConnectors: [],
    selectedPowerTier: 'all',
    availableOnly: false,
    maxPrice: 50,
    selectedAmenities: [],
    sortBy: 'nearest',
    viewMode: 'map',
    radiusKm: 25,
  });

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          setIsLocating(false);
        },
        err => {
          setIsLocating(false);
          alert('Could not acquire GPS coordinates. Please ensure location permissions are enabled in your browser.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const filteredChargers = useMemo(() => {
    return chargers
      .filter(c => {
        if (c.listingStatus !== 'live') return false;

        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = c.title.toLowerCase().includes(q);
          const matchAddr = c.approxAddress.toLowerCase().includes(q);
          if (!matchTitle && !matchAddr) return false;
        }

        if (filters.selectedConnectors.length > 0) {
          const hasMatchingConnector = filters.selectedConnectors.some(conn =>
            c.connectorTypes.includes(conn)
          );
          if (!hasMatchingConnector) return false;
        }

        if (filters.selectedPowerTier !== 'all') {
          if (c.powerTier !== filters.selectedPowerTier) return false;
        }

        if (filters.availableOnly && c.status !== 'available') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'nearest') {
          const cosLat = Math.cos((userCoords[0] * Math.PI) / 180);
          const distA = Math.hypot(a.lat - userCoords[0], (a.lng - userCoords[1]) * cosLat);
          const distB = Math.hypot(b.lat - userCoords[0], (b.lng - userCoords[1]) * cosLat);
          return distA - distB;
        }
        if (filters.sortBy === 'cheapest') {
          return a.priceRate - b.priceRate;
        }
        if (filters.sortBy === 'rating') {
          return b.hostRating - a.hostRating;
        }
        if (filters.sortBy === 'power') {
          return b.powerKw - a.powerKw;
        }
        return 0;
      });
  }, [chargers, filters, userCoords]);

  return (
    <div className="space-y-5">
      
      {/* Quick SOS & Battery Services Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div 
          onClick={onOpenBatteryDelivery}
          className="bg-white border border-[#BAE6FD] hover:border-[#0284C7] p-3.5 rounded-xl shadow-xs flex items-center justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] group-hover:bg-[#0284C7] group-hover:text-white transition-all">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#0F172A] block group-hover:text-[#0284C7]">
                Doorstep Swappable Battery Delivery
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#0284C7] group-hover:translate-x-1 transition-transform">
            Order &rarr;
          </span>
        </div>

        <div 
          onClick={onOpenV2V}
          className="bg-white border border-[#FECDD3] hover:border-[#E11D48] p-3.5 rounded-xl shadow-xs flex items-center justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center text-[#E11D48] group-hover:bg-[#E11D48] group-hover:text-white transition-all">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#0F172A] block group-hover:text-[#E11D48]">
                Highway V2V Reverse Charge SOS
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-[#E11D48] group-hover:translate-x-1 transition-transform">
            Request &rarr;
          </span>
        </div>
      </div>

      {/* Discovery Filters Bar */}
      <DiscoveryFilters
        filters={filters}
        setFilters={setFilters}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        totalResults={filteredChargers.length}
      />

      {/* Main Content: Heatmap, Map or List */}
      {filters.viewMode === 'heatmap' ? (
        <HeatmapView onOpenFranchise={onOpenFranchise} />
      ) : filters.viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
          
          {/* Left Column: 4-Cols Scrollable Results List */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {filteredChargers.length === 0 ? (
              <div className="bg-white border border-[#BAE6FD] rounded-card p-8 text-center text-xs text-[#64748B] space-y-3 font-mono shadow-sm">
                <AlertCircle className="w-8 h-8 text-[#0284C7] mx-auto opacity-70" />
                <p className="font-bold text-[#0F172A] text-sm">0 Stations Active in Radius</p>
                <p className="font-sans text-[11px] leading-relaxed">
                  No verified chargers found for current search filters. You can load calibration grid stations to preview live bookings and map pins.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={loadSeedChargers}
                    className="w-full py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-xs"
                  >
                    Load Demo Stations
                  </button>
                </div>
              </div>
            ) : (
              filteredChargers.map(charger => (
                <ChargerCard
                  key={charger.id}
                  charger={charger}
                  isSelected={selectedCharger?.id === charger.id}
                  onSelect={chg => setSelectedCharger(chg)}
                  onBook={chg => setBookingModalCharger(chg)}
                  distanceKm={Number((Math.sqrt(Math.pow(charger.lat - userCoords[0], 2) + Math.pow(charger.lng - userCoords[1], 2)) * 111).toFixed(1))}
                />
              ))
            )}
          </div>

          {/* Right Column: 8-Cols Live Leaflet Map */}
          <div className="lg:col-span-7 xl:col-span-8 min-h-[500px] lg:min-h-full">
            <LiveMap
              chargers={filteredChargers}
              selectedCharger={selectedCharger}
              onSelectCharger={chg => setSelectedCharger(chg)}
              userCoords={userCoords}
              radiusKm={filters.radiusKm}
            />
          </div>

        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChargers.length === 0 ? (
            <div className="col-span-3 bg-white border border-[#BAE6FD] rounded-card p-12 text-center text-xs text-[#64748B] font-mono shadow-sm">
              0 charging stations registered.
            </div>
          ) : (
            filteredChargers.map(charger => (
                <ChargerCard
                  key={charger.id}
                  charger={charger}
                  isSelected={selectedCharger?.id === charger.id}
                  onSelect={chg => setSelectedCharger(chg)}
                  onBook={chg => setBookingModalCharger(chg)}
                  distanceKm={Number((Math.hypot(charger.lat - userCoords[0], (charger.lng - userCoords[1]) * Math.cos(userCoords[0] * Math.PI / 180)) * 111).toFixed(1))}
                />
            ))
          )}
        </div>
      )}

      {/* Detail & Booking Modal */}
      {bookingModalCharger && (
        <ChargerDetailModal
          charger={bookingModalCharger}
          onClose={() => setBookingModalCharger(null)}
          onBookingSuccess={() => {
            setBookingModalCharger(null);
            if (onNavigateToBookings) {
              onNavigateToBookings();
            }
          }}
        />
      )}

    </div>
  );
};
