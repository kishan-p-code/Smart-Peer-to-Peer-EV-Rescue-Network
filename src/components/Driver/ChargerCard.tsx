import React from 'react';
import { 
  Zap, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Navigation,
  Building2,
  Home,
  Briefcase,
  ShoppingBag,
  Hotel
} from 'lucide-react';
import { ChargerListing } from '../../types';
import { useApp } from '../../context/AppContext';

interface ChargerCardProps {
  charger: ChargerListing;
  isSelected?: boolean;
  onSelect: (charger: ChargerListing) => void;
  onBook: (charger: ChargerListing) => void;
  distanceKm?: number;
}

export const ChargerCard: React.FC<ChargerCardProps> = ({
  charger,
  isSelected = false,
  onSelect,
  onBook,
  distanceKm = 1.8,
}) => {
  const { currentUser, formatCurrency } = useApp();

  const userConnector = currentUser?.vehicle?.connector;
  const isCompatible = userConnector ? charger.connectorTypes.includes(userConnector) : true;

  return (
    <div 
      onClick={() => onSelect(charger)}
      className={`bg-white rounded-card p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isSelected 
          ? 'border-[#0284C7] ring-2 ring-[#0284C7]/25 shadow-md bg-[#F0F9FF]' 
          : 'border-[#BAE6FD] hover:border-[#0284C7] hover:shadow-md'
      }`}
    >
      <div>
        {/* Photo & Status Banner */}
        <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-[#F1F5F9]">
          <img 
            src={charger.photos[0] || 'https://images.unsplash.com/photo-1558441719-798481498b3f?w=800'} 
            alt={charger.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          
          {/* Status Badge & Station Type */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
            {charger.isPublicStation ? (
              <span className="px-2.5 py-1 rounded-full bg-[#7C3AED] text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-md">
                <span>PUBLIC STATION</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-[#0284C7] text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-md">
                <span>EVIO HUB</span>
              </span>
            )}

            {charger.status === 'available' && (
              <span className="px-2 py-0.5 rounded-full bg-white/95 border border-[#86EFAC] text-[#16A34A] text-[10px] font-mono font-bold flex items-center gap-1 shadow-xs backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                <span>AVAILABLE</span>
              </span>
            )}
            {charger.status === 'in-use' && (
              <span className="px-2 py-0.5 rounded-full bg-white/95 border border-[#FCD34D] text-[#D97706] text-[10px] font-mono font-bold flex items-center gap-1 shadow-xs backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                <span>IN USE</span>
              </span>
            )}
            {charger.status === 'offline' && (
              <span className="px-2 py-0.5 rounded-full bg-white/95 border border-[#CBD5E1] text-[#64748B] text-[10px] font-mono font-bold shadow-xs backdrop-blur-md">
                OFFLINE
              </span>
            )}
          </div>

          {/* Power kW Pill */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-[#BAE6FD] px-2.5 py-1 rounded-xl flex items-center gap-1 text-[#0284C7] font-mono font-bold text-xs shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-[#0284C7]" />
            <span>{charger.powerKw} kW</span>
          </div>

          {/* Bottom telemetry on card image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-1 text-[#E2E8F0] font-mono text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{distanceKm} km (~6 min drive)</span>
            </div>
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20 text-[11px] font-mono">
              <span className="text-[#4ADE80] font-bold">{charger.hostRating.toFixed(1)}</span>
              <span className="text-[#CBD5E1]">({charger.hostReviewsCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Title, Premise Tag & Location */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {charger.locationType && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] flex items-center gap-1">
                {charger.locationType === 'home' && <Home className="w-3 h-3 text-[#0284C7]" />}
                {charger.locationType === 'hub' && <Building2 className="w-3 h-3 text-[#0284C7]" />}
                {charger.locationType === 'office' && <Briefcase className="w-3 h-3 text-[#0284C7]" />}
                {charger.locationType === 'commercial' && <ShoppingBag className="w-3 h-3 text-[#7C3AED]" />}
                {charger.locationType === 'hotel' && <Hotel className="w-3 h-3 text-[#0284C7]" />}
                <span>{charger.locationType}</span>
              </span>
            )}
            {charger.isPublicStation && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#F3E8FF] text-[#7C3AED] border border-[#D8B4FE]">
                {charger.operatorBrand || 'Third-Party Network'}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-[#0F172A] leading-snug">
            {charger.title}
          </h3>
          <p className="text-xs text-[#64748B] mt-1 font-sans">
            {charger.approxAddress}
          </p>
        </div>

        {/* Connectors */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {charger.connectorTypes.map(c => (
            <span 
              key={c} 
              className="px-2 py-0.5 rounded-md bg-[#F0F9FF] border border-[#BAE6FD] font-mono text-[11px] font-semibold text-[#0284C7]"
            >
              {c}
            </span>
          ))}

          {/* Compatibility badge */}
          {userConnector && (
            isCompatible ? (
              <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] text-[10px] font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Compatible with {currentUser?.vehicle?.model}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-[#FEF2F2] border-l-2 border-l-[#DC2626] border border-[#FECACA] text-[#DC2626] text-[10px] font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Connector Mismatch</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* Pricing & Booking Footer */}
      <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-[#0F172A] tracking-tight">
              {formatCurrency(charger.priceRate)}
            </span>
            <span className="text-xs text-[#64748B] font-mono">
              / {charger.pricingType === 'per-kwh' ? 'kWh' : 'hour'}
            </span>
          </div>
          <span className="text-[10px] text-[#64748B] font-mono block">
            {charger.isPublicStation ? 'Direct tariff at terminal' : 'Includes 10% network fee'}
          </span>
        </div>

        {charger.isPublicStation ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(charger);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] border border-[#D8B4FE] shadow-xs active:scale-95"
          >
            <span>DRIVE-IN ONLY</span>
            <Navigation className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook(charger);
            }}
            disabled={charger.status === 'offline'}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              charger.status === 'offline'
                ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                : 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm shadow-[#0284C7]/20 active:scale-95'
            }`}
          >
            <span>BOOK SLOT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};
