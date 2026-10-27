export type UserRole = 'driver' | 'hub' | 'supervisor';

export type ConnectorType = 'Type 2' | 'CCS-2' | 'GB/T' | 'Type 1' | 'CHAdeMO';

export type PowerTier = 'slow' | 'fast' | 'rapid'; // slow: 3-7kW, fast: 11-22kW, rapid: 50kW+

export type ChargerStatus = 'available' | 'in-use' | 'offline';

export type ListingStatus = 'draft' | 'pending' | 'live' | 'paused' | 'rejected';

export type PricingType = 'per-kwh' | 'per-hour' | 'flat';

export type LocationPremiseType = 'home' | 'hub' | 'office' | 'commercial' | 'hotel' | 'other';

export type BookingStatus = 'requested' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  avatar: string;
  isVerified: boolean;
  walletBalance: number;
  autoAcceptBookings?: boolean; // Hub Operator setting: Auto-approve incoming booking requests
  swappableBatteriesCount?: number;
  hasV2VCapableVehicle?: boolean; // Driver setting: Has bidirectional V2V / V2L capability
  vehicle?: {
    model: string;
    make: string;
    batteryCapacity: number; // in kWh
    connector: ConnectorType;
    plateNumber: string;
    hasSwappableBattery?: boolean;
    batteryType?: string; // e.g. "48V 3.2kWh Lithium-ion Swap Pack"
  };
}

export interface ChargerListing {
  id: string;
  hostId: string;
  hostName: string;
  hostEmail?: string;
  hostAvatar: string;
  hostRating: number;
  hostReviewsCount: number;
  title: string;
  description: string;
  photos: string[];
  approxAddress: string; // Shown publicly
  exactAddress: string;  // Shown only after confirmed booking
  lat: number;
  lng: number;
  powerKw: number;
  powerTier: PowerTier;
  connectorTypes: ConnectorType[];
  cableLengthMeters: number;
  simultaneousSlots: number;
  pricingType: PricingType;
  priceRate: number; // In local currency per unit
  safetyCertificateName?: string;
  safetyCertificateVerified: boolean;
  schedule: {
    is247: boolean;
    days: string[];
    hours: string;
  };
  amenities: string[];
  accessNotes?: string; // Gate code, parking spot notes (shown after booking)
  bookingMode: 'instant' | 'approval';
  maxDurationHours: number;
  status: ChargerStatus;
  listingStatus: ListingStatus;
  rejectionReason?: string;
  createdAt: string;
  offersBatteryDelivery?: boolean;
  batteryStockCount?: number;
  locationType?: LocationPremiseType;
  isPublicStation?: boolean; // True for pre-existing public EV stations (Tata Power, Ather Grid, Statiq, Jio-bp)
  operatorBrand?: string;    // e.g. 'Tata Power EZ Charge', 'Ather Grid', 'Jio-bp pulse'
}

export interface Booking {
  id: string;
  chargerId: string;
  chargerTitle: string;
  hostId: string;
  hostName: string;
  driverId: string;
  driverName: string;
  driverVehicle: string;
  driverConnector: ConnectorType;
  startTime: string;
  endTime: string;
  durationHours: number;
  estimatedKwh: number;
  totalAmount: number;
  platformFee: number;
  status: BookingStatus;
  paymentMethod: 'wallet' | 'upi' | 'card';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  createdAt: string;
  activeSession?: {
    startedAt: string;
    currentKwh: number;
    currentCost: number;
    batteryPercentage: number;
    flowRateKw: number;
  };
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  isAutomated?: boolean;
}

export interface DisputeReport {
  id: string;
  bookingId: string;
  chargerId: string;
  chargerTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
}

export interface BatteryDeliveryRequest {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleInfo: string;
  batterySpec: string; // e.g. "48V 3.2kWh Lithium Smart Pack"
  hubId: string;
  hubName: string;
  hubPhone?: string;
  status: 'pending' | 'dispatched' | 'delivered' | 'cancelled';
  etaMinutes: number;
  deliveryFee: number;
  batterySwapFee: number;
  totalCost: number;
  deliveryPartnerName?: string;
  createdAt: string;
}

export interface FranchiseApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  city: string;
  locationAddress: string;
  lat?: number;
  lng?: number;
  packageType: 'micro' | 'commercial' | 'highway';
  powerSanctionKw: number;
  landType: 'owned' | 'leased';
  status: 'submitted' | 'under-review' | 'quotation-sent' | 'approved' | 'rejected';
  estimatedInvestment?: number;
  expectedMonthlyEarnings?: number;
  quotedRate?: number; // Quoted by Supervisor after reviewing location, power feeder, and feasibility
  supervisorNotes?: string;
  notes?: string;
  createdAt: string;
}

export interface V2VReverseChargeRequest {
  id: string;
  strandedDriverId: string;
  strandedDriverName: string;
  strandedDriverPhone: string;
  strandedVehicle: string;
  location: {
    lat: number;
    lng: number;
    highwayName: string;
  };
  currentSoc: number; // e.g. 4%
  requestedKwh: number; // e.g. 8 kWh to reach next fast charger
  offeredPayout: number; // e.g. ₹350
  status: 'broadcasting' | 'accepted' | 'transferring' | 'completed' | 'cancelled';
  donorDriverId?: string;
  donorDriverName?: string;
  donorVehicle?: string;
  transferredKwh?: number;
  createdAt: string;
}

export interface ActiveOnlineDriver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  batterySoc: number; // e.g. 78%
  hasV2VCable: boolean;
  v2vOutputKw: number; // e.g. 11
  lat: number;
  lng: number;
  highwayCorridor: string;
  isOnline: boolean;
  lastHeartbeat: number;
  isBackgroundActive?: boolean;
}

export interface HeatmapZone {
  id: string;
  type: 'high_ev_density' | 'charging_desert' | 'station_coverage';
  center: [number, number];
  radiusMeters: number;
  intensity: number; // 0 to 1
  label: string;
  evDriverCount?: number;
  unservedKm?: number;
  description: string;
}
