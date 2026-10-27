import React from 'react';
import { 
  Search, 
  MapPin, 
  Filter, 
  X, 
  Check, 
  Map as MapIcon, 
  List, 
  Zap, 
  Navigation,
  Database,
  PlusCircle,
  Activity
} from 'lucide-react';
import { ConnectorType, PowerTier } from '../../types';
import { useApp } from '../../context/AppContext';

export interface FilterState {
  searchQuery: string;
  selectedConnectors: ConnectorType[];
  selectedPowerTier: PowerTier | 'all';
  availableOnly: boolean;
  maxPrice: number;
  selectedAmenities: string[];
  sortBy: 'nearest' | 'cheapest' | 'rating' | 'power';
  viewMode: 'map' | 'list' | 'heatmap';
  radiusKm: number;
}

interface DiscoveryFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onLocateMe: () => void;
  isLocating?: boolean;
  totalResults: number;
}

const ALL_CONNECTORS: ConnectorType[] = ['Type 2', 'CCS-2', 'GB/T', 'CHAdeMO', 'Type 1'];

export const DiscoveryFilters: React.FC<DiscoveryFiltersProps> = ({
  filters,
  setFilters,
  onLocateMe,
  isLocating = false,
  totalResults,
}) => {
  const { loadSeedChargers, clearAllChargers, chargers } = useApp();

  const toggleConnector = (connector: ConnectorType) => {
    setFilters(prev => {
      const exists = prev.selectedConnectors.includes(connector);
      return {
        ...prev,
        selectedConnectors: exists 
          ? prev.selectedConnectors.filter(c => c !== connector)
          : [...prev.selectedConnectors, connector]
      };
    });
  };

  const clearAllFilters = () => {
    setFilters(prev => ({
      ...prev,
      searchQuery: '',
      selectedConnectors: [],
      selectedPowerTier: 'all',
      availableOnly: false,
      maxPrice: 50,
      selectedAmenities: [],
      sortBy: 'nearest',
    }));
  };

  const hasActiveFilters = 
    filters.searchQuery !== '' ||
    filters.selectedConnectors.length > 0 ||
    filters.selectedPowerTier !== 'all' ||
    filters.availableOnly;

  return (
    <div className="bg-white border border-[#BAE6FD] rounded-card p-5 space-y-4 shadow-sm">
      
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by neighborhood, street or hub (e.g. Metro Hub, Innovation Parkway)..."
            value={filters.searchQuery}
            onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:bg-white font-sans transition-all"
          />
          {filters.searchQuery && (
            <button 
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Current Location GPS */}
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all whitespace-nowrap shadow-xs ${
            isLocating 
              ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7]' 
              : 'bg-white border-[#CBD5E1] hover:border-[#0284C7] hover:bg-[#F0F9FF] text-[#475569] hover:text-[#0284C7]'
          }`}
          title="Detect GPS coordinates & center map"
        >
          <Navigation className={`w-3.5 h-3.5 text-[#0284C7] ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS...' : 'Locate Me'}</span>
        </button>

        {/* View mode toggle */}
        <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#CBD5E1]">
          <button
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'map' }))}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              filters.viewMode === 'map' ? 'bg-white text-[#0284C7] font-bold shadow-xs border border-[#BAE6FD]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="Interactive Grid Map"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono">Map</span>
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              filters.viewMode === 'list' ? 'bg-white text-[#0284C7] font-bold shadow-xs border border-[#BAE6FD]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="List / Card View"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono">List</span>
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, viewMode: 'heatmap' }))}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              filters.viewMode === 'heatmap' ? 'bg-[#FFF1F2] text-[#E11D48] font-bold shadow-xs border border-[#FECDD3]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="Heatmap: Active EV Density & Charging Deserts"
          >
            <Activity className="w-3.5 h-3.5 text-[#E11D48]" />
            <span className="hidden md:inline font-mono">Heatmap</span>
          </button>
        </div>
      </div>

      {/* Filter Row 1: Connector Specs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider mr-1">Connector:</span>
        {ALL_CONNECTORS.map(conn => {
          const isSelected = filters.selectedConnectors.includes(conn);
          return (
            <button
              key={conn}
              onClick={() => toggleConnector(conn)}
              className={`px-2.5 py-1 rounded-lg border font-mono transition-all text-xs flex items-center gap-1 ${
                isSelected 
                  ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] font-bold' 
                  : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:bg-white hover:border-[#94A3B8]'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-[#0284C7]" />}
              <span>{conn}</span>
            </button>
          );
        })}

        <div className="h-4 w-px bg-[#CBD5E1] mx-1 hidden lg:block"></div>

        {/* Speed Tier Pills */}
        <span className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider mr-1">Speed:</span>
        <div className="flex items-center gap-1 font-mono">
          <button
            onClick={() => setFilters(prev => ({ ...prev, selectedPowerTier: 'all' }))}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
              filters.selectedPowerTier === 'all'
                ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] font-bold'
                : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:bg-white'
            }`}
          >
            All Speeds
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, selectedPowerTier: 'slow' }))}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
              filters.selectedPowerTier === 'slow'
                ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] font-bold'
                : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:bg-white'
            }`}
          >
            3-7 kW
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, selectedPowerTier: 'fast' }))}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
              filters.selectedPowerTier === 'fast'
                ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] font-bold'
                : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:bg-white'
            }`}
          >
            11-22 kW
          </button>
          <button
            onClick={() => setFilters(prev => ({ ...prev, selectedPowerTier: 'rapid' }))}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
              filters.selectedPowerTier === 'rapid'
                ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] font-bold'
                : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:bg-white'
            }`}
          >
            50+ kW DC
          </button>
        </div>

        {/* Available only */}
        <button
          onClick={() => setFilters(prev => ({ ...prev, availableOnly: !prev.availableOnly }))}
          className={`ml-auto px-3 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            filters.availableOnly 
              ? 'bg-[#DCFCE7] border-[#86EFAC] text-[#16A34A]' 
              : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:bg-white'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${filters.availableOnly ? 'bg-[#16A34A]' : 'bg-[#94A3B8]'}`}></span>
          <span>Available Now</span>
        </button>
      </div>

      {/* Filter Row 2: Radius Slider & Controls */}
      <div className="pt-3 border-t border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[#64748B] font-mono font-semibold whitespace-nowrap">Search Radius:</span>
          <input
            type="range"
            min="1"
            max="50"
            value={filters.radiusKm}
            onChange={e => setFilters(prev => ({ ...prev, radiusKm: Number(e.target.value) }))}
            className="w-32 accent-[#0284C7] cursor-pointer"
          />
          <span className="font-mono text-[#0284C7] font-bold min-w-[50px]">{filters.radiusKm} km</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#64748B] font-mono">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#0284C7] font-mono"
            >
              <option value="nearest">Nearest Distance</option>
              <option value="cheapest">Lowest Price</option>
              <option value="rating">Highest Rating</option>
              <option value="power">Highest Power (kW)</option>
            </select>
          </div>

          <span className="text-[#64748B] font-mono text-[11px]">
            Active stations: <strong className="text-[#0F172A]">{totalResults}</strong>
          </span>

          {chargers.length === 0 ? (
            <button
              onClick={loadSeedChargers}
              className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] hover:border-[#0284C7] text-[11px] font-mono font-bold text-[#0284C7] flex items-center gap-1 transition-all shadow-xs"
              title="Load demo stations"
            >
              <Database className="w-3 h-3" />
              <span>Load Stations</span>
            </button>
          ) : (
            <button
              onClick={clearAllChargers}
              className="px-2 py-1 rounded bg-[#F8FAFC] border border-[#CBD5E1] text-[10px] font-mono text-[#64748B] hover:text-[#DC2626]"
              title="Clear all listed chargers"
            >
              Clear Grid
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[#DC2626] hover:underline text-[11px] font-mono font-semibold flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
