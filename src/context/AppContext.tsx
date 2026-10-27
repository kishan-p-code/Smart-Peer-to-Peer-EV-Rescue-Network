import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  ChargerListing, 
  Booking, 
  BookingStatus,
  UserRole, 
  ChatMessage, 
  DisputeReport,
  BatteryDeliveryRequest,
  FranchiseApplication,
  V2VReverseChargeRequest,
  ActiveOnlineDriver,
  HeatmapZone,
  LocationPremiseType 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_CHARGERS, 
  INITIAL_BOOKINGS, 
  INITIAL_DISPUTES, 
  SEED_CALIBRATION_CHARGERS,
  INITIAL_BATTERY_DELIVERIES,
  INITIAL_FRANCHISE_APPLICATIONS,
  INITIAL_V2V_REQUESTS,
  INITIAL_ONLINE_DRIVERS,
  INITIAL_HEATMAP_ZONES 
} from '../data/mockData';
import { fetchOpenChargeMapStations } from '../services/openChargeMapService';

export type Currency = 'USD' | 'EUR' | 'INR' | 'GBP';

interface AppContextType {
  currentUser: UserProfile | null;
  loginUser: (user: UserProfile) => void;
  loginWithCredentials: (email: string, password: string) => { success: boolean; error?: string; user?: UserProfile };
  registerAccount: (account: UserProfile) => { success: boolean; error?: string };
  logoutUser: () => void;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  userCoords: [number, number];
  setUserCoords: (coords: [number, number]) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (amount: number) => string;
  chargers: ChargerListing[];
  loadSeedChargers: () => void;
  clearAllChargers: () => void;
  addChargerListing: (newCharger: Omit<ChargerListing, 'id' | 'createdAt' | 'status' | 'listingStatus'>) => ChargerListing;
  deleteCharger: (chargerId: string) => void;
  updateChargerStatus: (chargerId: string, status: ChargerListing['status']) => void;
  approveChargerListing: (chargerId: string) => void;
  rejectChargerListing: (chargerId: string, reason: string) => void;
  toggleHostVacation: (chargerId: string) => void;
  autoAcceptBookings: boolean;
  toggleAutoAcceptBookings: () => void;
  bookings: Booking[];
  createBooking: (
    charger: ChargerListing,
    startTime: string,
    endTime: string,
    durationHours: number,
    estimatedKwh: number,
    paymentMethod: 'wallet' | 'upi' | 'card'
  ) => { success: boolean; error?: string; booking?: Booking };
  acceptBookingRequest: (bookingId: string) => void;
  declineBookingRequest: (bookingId: string) => void;
  startChargingSession: (bookingId: string) => void;
  activeBooking: Booking | null;
  stopActiveSession: () => void;
  topUpWallet: (amount: number) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (bookingId: string, text: string) => void;
  disputes: DisputeReport[];
  resolveDispute: (disputeId: string) => void;
  batteryDeliveries: BatteryDeliveryRequest[];
  requestBatteryDelivery: (data: Omit<BatteryDeliveryRequest, 'id' | 'createdAt' | 'status'>) => BatteryDeliveryRequest;
  dispatchBatteryDelivery: (requestId: string, deliveryPartnerName?: string) => void;
  completeBatteryDelivery: (requestId: string) => void;
  cancelBatteryDelivery: (requestId: string) => void;
  franchiseApplications: FranchiseApplication[];
  submitFranchiseApplication: (app: Omit<FranchiseApplication, 'id' | 'createdAt' | 'status'>) => FranchiseApplication;
  updateFranchiseStatus: (id: string, status: FranchiseApplication['status']) => void;
  quoteFranchiseApplication: (id: string, quotedRate: number, supervisorNotes: string) => void;
  v2vRequests: V2VReverseChargeRequest[];
  createV2VRequest: (data: Omit<V2VReverseChargeRequest, 'id' | 'createdAt' | 'status'>) => V2VReverseChargeRequest;
  acceptV2VRequest: (requestId: string, donorDriverId: string, donorDriverName: string, donorVehicle: string) => void;
  startV2VTransfer: (requestId: string) => void;
  completeV2VTransfer: (requestId: string, transferredKwh: number) => void;
  cancelV2VRequest: (requestId: string) => void;
  onlineDrivers: ActiveOnlineDriver[];
  sendDirectV2VRequest: (driverId: string, requestedKwh: number, payout: number) => V2VReverseChargeRequest;
  heatmapZones: HeatmapZone[];
  notifications: Array<{ id: string; title: string; desc: string; time: string; read: boolean }>;
  markNotificationsAsRead: () => void;
}

const DEFAULT_ACCOUNTS: UserProfile[] = [
  {
    id: 'usr-driver-demo',
    name: 'Sarah Jenkins (Driver)',
    email: 'driver@evio.com',
    password: 'driver123',
    phone: '+91 98765-43210',
    role: 'driver',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isVerified: true,
    walletBalance: 2500.0,
    vehicle: {
      make: 'Ather',
      model: '450X Swappable Gen 3',
      batteryCapacity: 3.7,
      connector: 'Type 2',
      plateNumber: 'KA-01-EV-4421',
      hasSwappableBattery: true,
      batteryType: '51.1V 3.7kWh Quick-Swap Pack',
    }
  },
  {
    id: 'usr-hub-demo',
    name: 'Marcus Vance (Hub Host)',
    email: 'hub@evio.com',
    password: 'hub123',
    phone: '+91 98111-22334',
    role: 'hub',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isVerified: true,
    walletBalance: 15400.0,
    autoAcceptBookings: true,
    swappableBatteriesCount: 8,
  },
  {
    id: 'usr-supervisor-demo',
    name: 'Elena Rostova (Grid Supervisor)',
    email: 'supervisor@evio.com',
    password: 'super123',
    phone: '+91 98999-00112',
    role: 'supervisor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    isVerified: true,
    walletBalance: 0,
  },
  // Unified ID accounts for testing:
  {
    id: 'usr-multi-driver',
    name: 'Alex Demo (Driver)',
    email: 'demo@evio.com',
    password: 'driver123',
    phone: '+91 98333-44556',
    role: 'driver',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    isVerified: true,
    walletBalance: 2800.0,
    hasV2VCapableVehicle: true,
    vehicle: {
      make: 'Hyundai',
      model: 'Ioniq 5 (Bidirectional V2L / V2V Enabled)',
      batteryCapacity: 77.4,
      connector: 'CCS-2',
      plateNumber: 'MH-12-EV-9921',
    }
  },
  {
    id: 'usr-multi-hub',
    name: 'Alex Demo (Hub Host)',
    email: 'demo@evio.com',
    password: 'hub123',
    phone: '+91 98333-44557',
    role: 'hub',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    isVerified: true,
    walletBalance: 18500.0,
    autoAcceptBookings: true,
    swappableBatteriesCount: 6,
  },
  {
    id: 'usr-multi-supervisor',
    name: 'Alex Demo (Supervisor)',
    email: 'demo@evio.com',
    password: 'super123',
    phone: '+91 98333-44558',
    role: 'supervisor',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    isVerified: true,
    walletBalance: 0,
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registeredAccounts, setRegisteredAccounts] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('evio_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('evio_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userCoords, setUserCoords] = useState<[number, number]>([37.7749, -122.4194]);
  const [currency, setCurrency] = useState<Currency>('INR');

  const [chargers, setChargers] = useState<ChargerListing[]>(() => {
    const saved = localStorage.getItem('evio_chargers');
    if (saved) {
      try {
        const parsed: ChargerListing[] = JSON.parse(saved);
        // Merge public stations if not present yet
        const hasPublic = parsed.some(c => c.isPublicStation);
        if (!hasPublic) {
          const publicSeed = INITIAL_CHARGERS.filter(c => c.isPublicStation);
          return [...parsed, ...publicSeed];
        }
        return parsed;
      } catch (e) {
        return INITIAL_CHARGERS;
      }
    }
    return INITIAL_CHARGERS;
  });

  const [onlineDrivers, setOnlineDrivers] = useState<ActiveOnlineDriver[]>(() => {
    const saved = localStorage.getItem('evio_online_drivers_pool');
    return saved ? JSON.parse(saved) : INITIAL_ONLINE_DRIVERS;
  });

  const [heatmapZones] = useState<HeatmapZone[]>(INITIAL_HEATMAP_ZONES);

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('evio_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [disputes, setDisputes] = useState<DisputeReport[]>(() => {
    const saved = localStorage.getItem('evio_disputes');
    return saved ? JSON.parse(saved) : INITIAL_DISPUTES;
  });

  const [batteryDeliveries, setBatteryDeliveries] = useState<BatteryDeliveryRequest[]>(() => {
    const saved = localStorage.getItem('evio_battery_deliveries');
    return saved ? JSON.parse(saved) : INITIAL_BATTERY_DELIVERIES;
  });

  const [franchiseApplications, setFranchiseApplications] = useState<FranchiseApplication[]>(() => {
    const saved = localStorage.getItem('evio_franchise_apps');
    return saved ? JSON.parse(saved) : INITIAL_FRANCHISE_APPLICATIONS;
  });

  const [v2vRequests, setV2vRequests] = useState<V2VReverseChargeRequest[]>(() => {
    const saved = localStorage.getItem('evio_v2v_requests');
    return saved ? JSON.parse(saved) : INITIAL_V2V_REQUESTS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; time: string; read: boolean }>>([]);

  useEffect(() => {
    localStorage.setItem('evio_battery_deliveries', JSON.stringify(batteryDeliveries));
  }, [batteryDeliveries]);

  useEffect(() => {
    localStorage.setItem('evio_franchise_apps', JSON.stringify(franchiseApplications));
  }, [franchiseApplications]);

  useEffect(() => {
    localStorage.setItem('evio_v2v_requests', JSON.stringify(v2vRequests));
  }, [v2vRequests]);

  useEffect(() => {
    localStorage.setItem('evio_accounts', JSON.stringify(registeredAccounts));
  }, [registeredAccounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('evio_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('evio_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('evio_chargers', JSON.stringify(chargers));
  }, [chargers]);

  useEffect(() => {
    localStorage.setItem('evio_bookings', JSON.stringify(bookings));
  }, [bookings]);

  // Real-time Active Online EV Drivers Heartbeat (Keeps tab active in background & syncs across browser sessions)
  useEffect(() => {
    const updatePresence = () => {
      setOnlineDrivers(prev => {
        const now = Date.now();
        let updated = [...prev];

        // If current user is logged in as a driver, register their live session in the pool
        if (currentUser && currentUser.role === 'driver') {
          const myIdx = updated.findIndex(d => d.id === currentUser.id);
          const myDriverData: ActiveOnlineDriver = {
            id: currentUser.id,
            name: currentUser.name,
            phone: currentUser.phone || '+91 98333-44556',
            vehicle: currentUser.vehicle ? `${currentUser.vehicle.make} ${currentUser.vehicle.model}` : 'Tata Nexon EV Max',
            batterySoc: 78,
            hasV2VCable: Boolean(currentUser.hasV2VCapableVehicle ?? true),
            v2vOutputKw: 11,
            lat: userCoords[0] + 0.002,
            lng: userCoords[1] + 0.003,
            highwayCorridor: 'NH-48 Expressway Corridor (Your Live Background Session)',
            isOnline: true,
            lastHeartbeat: now,
            isBackgroundActive: true,
          };

          if (myIdx >= 0) {
            updated[myIdx] = myDriverData;
          } else {
            updated.push(myDriverData);
          }
        }

        // Keep active simulated grid peers alive with fresh timestamps
        updated = updated.map(d => {
          if (d.id.startsWith('drv-online-')) {
            return {
              ...d,
              lastHeartbeat: now,
              isOnline: true,
              isBackgroundActive: true,
            };
          }
          // Real peer tabs timeout after 35 seconds of inactivity
          const isAlive = (now - d.lastHeartbeat) < 35000;
          return { ...d, isOnline: isAlive };
        });

        localStorage.setItem('evio_online_drivers_pool', JSON.stringify(updated));
        return updated;
      });
    };

    updatePresence();
    const interval = setInterval(updatePresence, 5000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'evio_online_drivers_pool' && e.newValue) {
        try {
          setOnlineDrivers(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [currentUser, userCoords]);

  // Helper to ensure realistic nearby EV charging stations exist around user's active GPS coordinates
  useEffect(() => {
    let isMounted = true;
    const [uLat, uLng] = userCoords;
    const cosLat = Math.cos((uLat * Math.PI) / 180) || 1;
    const toLat = (km: number) => km / 111;
    const toLng = (km: number) => km / (111 * cosLat);

    // Calculate distance in km
    const getDistKm = (lat: number, lng: number) => {
      const dLat = (lat - uLat) * 111;
      const dLng = (lng - uLng) * 111 * cosLat;
      return Math.hypot(dLat, dLng);
    };

    const nearbyExisting = chargers.filter(c => getDistKm(c.lat, c.lng) <= 30);

    if (nearbyExisting.length < 4) {
      const generatedLocalCluster: ChargerListing[] = [
        {
          id: `nearby-hub-01-${Math.round(uLat * 1000)}-${Math.round(uLng * 1000)}`,
          hostId: 'usr-hub-demo',
          hostName: 'GreenGrid Community Hub',
          hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          hostRating: 4.9,
          hostReviewsCount: 38,
          title: 'GreenGrid 22kW Dual AC Community Hub',
          description: 'Verified Level 2 community charging hub with solar battery backup, Type B RCD protection and automated bay access.',
          photos: [
            'https://images.unsplash.com/photo-1558441719-798481498b3f?w=800',
            'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800'
          ],
          approxAddress: 'Central Commercial Plaza (approx. 1.1 km)',
          exactAddress: 'Bay 4, Commercial Plaza, EV Sector',
          lat: uLat + toLat(0.8),
          lng: uLng + toLng(0.8),
          powerKw: 22,
          powerTier: 'fast',
          connectorTypes: ['Type 2', 'CCS-2'],
          cableLengthMeters: 7.5,
          simultaneousSlots: 2,
          pricingType: 'per-kwh',
          priceRate: 18.0,
          safetyCertificateName: 'Certified_Electrical_Safety_Report_2026.pdf',
          safetyCertificateVerified: true,
          schedule: {
            is247: true,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            hours: 'Open 24/7',
          },
          amenities: ['Covered Canopy', 'HD CCTV Security', 'High-Speed WiFi', 'Keyless Gate Access'],
          accessNotes: 'Automated boom barrier with sensor. Access PIN: 4829#.',
          bookingMode: 'instant',
          maxDurationHours: 4,
          status: 'available',
          listingStatus: 'live',
          createdAt: '2026-10-10',
          locationType: 'hub',
          isPublicStation: false,
          offersBatteryDelivery: true,
          batteryStockCount: 8,
        },
        {
          id: `nearby-dc-02-${Math.round(uLat * 1000)}-${Math.round(uLng * 1000)}`,
          hostId: 'host-dc-02',
          hostName: 'HyperCharge Mobility Network',
          hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          hostRating: 4.85,
          hostReviewsCount: 52,
          title: 'HyperCharge Express 60kW DC Fast Station',
          description: 'High-speed DC rapid charging bay equipped with dual CCS-2 guns, liquid-cooled cabling and lounge seating.',
          photos: [
            'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
            'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800'
          ],
          approxAddress: 'Metro Ring Expressway Avenue (approx. 2.2 km)',
          exactAddress: 'Plot 12B, Expressway Service Bay',
          lat: uLat - toLat(1.5),
          lng: uLng + toLng(1.6),
          powerKw: 60,
          powerTier: 'rapid',
          connectorTypes: ['CCS-2', 'Type 2', 'CHAdeMO'],
          cableLengthMeters: 5.0,
          simultaneousSlots: 2,
          pricingType: 'per-kwh',
          priceRate: 21.5,
          safetyCertificateName: 'DC_High_Voltage_Compliance_2026.pdf',
          safetyCertificateVerified: true,
          schedule: {
            is247: true,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            hours: 'Open 24/7',
          },
          amenities: ['Coffee Lounge', 'Clean Restrooms', 'Air-Conditioned Waiting', 'Free WiFi'],
          accessNotes: 'Direct expressway slip road access. Drive straight into marked HyperCharge bay.',
          bookingMode: 'instant',
          maxDurationHours: 2,
          status: 'available',
          listingStatus: 'live',
          createdAt: '2026-10-12',
          locationType: 'commercial',
          isPublicStation: false,
        },
        {
          id: `nearby-ultra-03-${Math.round(uLat * 1000)}-${Math.round(uLng * 1000)}`,
          hostId: 'host-ultra-03',
          hostName: 'VoltStream Networks',
          hostAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          hostRating: 4.95,
          hostReviewsCount: 84,
          title: 'VoltStream Ultra 120kW SuperHub',
          description: 'Ultra-fast heavy duty DC hub designed for long-range EVs. 10% to 80% charge in ~24 minutes.',
          photos: [
            'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800'
          ],
          approxAddress: 'Highway Link Interchange (approx. 3.8 km)',
          exactAddress: 'Highway Mile 4, EV Fueling Terminal',
          lat: uLat + toLat(2.6),
          lng: uLng - toLng(2.8),
          powerKw: 120,
          powerTier: 'rapid',
          connectorTypes: ['CCS-2'],
          cableLengthMeters: 6.0,
          simultaneousSlots: 4,
          pricingType: 'per-kwh',
          priceRate: 24.0,
          safetyCertificateName: 'Grid_Interconnect_120kW_Signoff.pdf',
          safetyCertificateVerified: true,
          schedule: {
            is247: true,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            hours: 'Open 24/7',
          },
          amenities: ['24/7 Convenience Store', 'EV Tech Support', 'EV Lounge', 'Wheelchair Accessible'],
          accessNotes: 'Direct entry from interchange service road. Follow green EV signage to canopy.',
          bookingMode: 'instant',
          maxDurationHours: 1,
          status: 'available',
          listingStatus: 'live',
          createdAt: '2026-10-08',
          locationType: 'hub',
          isPublicStation: false,
        },
        {
          id: `nearby-home-04-${Math.round(uLat * 1000)}-${Math.round(uLng * 1000)}`,
          hostId: 'host-home-04',
          hostName: 'Rohan Sharma (Private Host)',
          hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          hostRating: 4.7,
          hostReviewsCount: 16,
          title: 'EcoDrive Residential Wallbox 7.4kW',
          description: 'Convenient neighborhood private driveway charger. Safe, calm residential area with dedicated parking bay.',
          photos: [
            'https://images.unsplash.com/photo-1558441719-798481498b3f?w=800'
          ],
          approxAddress: 'Greenwood Residential Enclave (approx. 850m)',
          exactAddress: 'Villa 22, Greenwood Gardens',
          lat: uLat - toLat(0.6),
          lng: uLng - toLng(0.6),
          powerKw: 7.4,
          powerTier: 'slow',
          connectorTypes: ['Type 2'],
          cableLengthMeters: 5.0,
          simultaneousSlots: 1,
          pricingType: 'per-kwh',
          priceRate: 15.0,
          safetyCertificateName: 'Home_Earthing_Safety_Cert.pdf',
          safetyCertificateVerified: true,
          schedule: {
            is247: false,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            hours: '06:00 AM - 11:00 PM',
          },
          amenities: ['Gated Community', 'Night Lighting', 'CCTV Security'],
          accessNotes: 'Inform security gate: Visiting Villa 22 for EV charging. Dedicated bay on left driveway.',
          bookingMode: 'instant',
          maxDurationHours: 6,
          status: 'available',
          listingStatus: 'live',
          createdAt: '2026-10-14',
          locationType: 'home',
          isPublicStation: false,
        },
        {
          id: `nearby-pub-05-${Math.round(uLat * 1000)}-${Math.round(uLng * 1000)}`,
          hostId: 'operator-national-grid',
          hostName: 'National EV Highway Grid',
          hostAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
          hostRating: 4.5,
          hostReviewsCount: 96,
          title: 'Public Transit Junction Fast EV Station',
          description: 'Public fast station on the government electrical mobility grid. Open walk-in first-come basis.',
          photos: [
            'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800'
          ],
          approxAddress: 'Public Bus & Transit Interchange (approx. 1.8 km)',
          exactAddress: 'Transit Way Bus Terminal Bay 9',
          lat: uLat - toLat(1.1),
          lng: uLng - toLng(1.4),
          powerKw: 60,
          powerTier: 'rapid',
          connectorTypes: ['CCS-2', 'Type 2'],
          cableLengthMeters: 5.0,
          simultaneousSlots: 2,
          pricingType: 'per-kwh',
          priceRate: 21.0,
          safetyCertificateName: 'State_Discom_Certification.pdf',
          safetyCertificateVerified: true,
          schedule: {
            is247: true,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            hours: 'Open 24/7',
          },
          amenities: ['Public Transit Link', 'Automated Kiosk', 'Night Floodlights'],
          accessNotes: 'Public station: Drive into terminal EV bay. Direct RFID or QR scan at pillar.',
          bookingMode: 'instant',
          maxDurationHours: 2,
          status: 'available',
          listingStatus: 'live',
          createdAt: '2026-09-28',
          locationType: 'hub',
          isPublicStation: true,
          operatorBrand: 'National EV Grid',
        },
        {
          id: `nearby-mall-06-${Math.round(uLat * 1000)}-${Math.round(uLng * 1000)}`,
          hostId: 'host-mall-06',
          hostName: 'City Center Mall Ops',
          hostAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
          hostRating: 4.6,
          hostReviewsCount: 44,
          title: 'City Center Mall Parking B1 50kW Fast Hub',
          description: 'Underground covered charging station in premier shopping mall. Charge your vehicle while shopping or dining.',
          photos: [
            'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800'
          ],
          approxAddress: 'City Center Mall Parking B1 (approx. 2.9 km)',
          exactAddress: 'Basement Level 1, Bay E-12',
          lat: uLat + toLat(1.3),
          lng: uLng + toLng(2.6),
          powerKw: 50,
          powerTier: 'rapid',
          connectorTypes: ['CCS-2', 'Type 2'],
          cableLengthMeters: 5.0,
          simultaneousSlots: 3,
          pricingType: 'per-kwh',
          priceRate: 20.0,
          safetyCertificateName: 'Mall_Electrical_Audit_2026.pdf',
          safetyCertificateVerified: true,
          schedule: {
            is247: false,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            hours: '08:00 AM - 11:30 PM',
          },
          amenities: ['Shopping Mall', 'Food Court', 'Multiplex Cinema', 'Washrooms'],
          accessNotes: 'Enter basement parking gate 2. Turn right towards pillar E-12 marked EV Zone.',
          bookingMode: 'instant',
          maxDurationHours: 3,
          status: 'in-use',
          listingStatus: 'live',
          createdAt: '2026-10-05',
          locationType: 'commercial',
          isPublicStation: false,
        },
        {
          id: `nearby-hotel-07-${Math.round(uLat * 1000)}-${Math.round(uLng * 1000)}`,
          hostId: 'host-hotel-07',
          hostName: 'Grand Vista Hospitality',
          hostAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          hostRating: 4.9,
          hostReviewsCount: 22,
          title: 'Grand Vista Destination Charger 11kW',
          description: 'Premium hospitality destination charging point with valet assistance and fine dining lounge.',
          photos: [
            'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800'
          ],
          approxAddress: 'Grand Vista Hotel & Suites (approx. 1.9 km)',
          exactAddress: 'Front Porch, Grand Vista Avenue',
          lat: uLat - toLat(1.3),
          lng: uLng - toLng(1.4),
          powerKw: 11,
          powerTier: 'fast',
          connectorTypes: ['Type 2'],
          cableLengthMeters: 6.0,
          simultaneousSlots: 1,
          pricingType: 'per-kwh',
          priceRate: 16.0,
          safetyCertificateName: 'Hospitality_EV_Certified.pdf',
          safetyCertificateVerified: true,
          schedule: {
            is247: true,
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            hours: 'Open 24/7',
          },
          amenities: ['Hotel Lobby Lounge', 'Valet Parking', 'Fine Dining', 'Clean Restrooms'],
          accessNotes: 'Drive to hotel front porch. Valet attendants will connect your vehicle.',
          bookingMode: 'instant',
          maxDurationHours: 5,
          status: 'available',
          listingStatus: 'live',
          createdAt: '2026-10-15',
          locationType: 'commercial',
          isPublicStation: false,
        }
      ];

      setChargers(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const toAdd = generatedLocalCluster.filter(c => !existingIds.has(c.id));
        if (toAdd.length === 0) return prev;
        const merged = [...toAdd, ...prev];
        try {
          localStorage.setItem('evio_chargers', JSON.stringify(merged));
        } catch (e) {
          console.warn('Storage save error:', e);
        }
        return merged;
      });
    }

    // Also query Open Charge Map API for external public stations
    fetchOpenChargeMapStations(uLat, uLng, 40)
      .then(ocmStations => {
        if (!isMounted || ocmStations.length === 0) return;
        setChargers(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newStations = ocmStations.filter(s => !existingIds.has(s.id));
          if (newStations.length === 0) return prev;
          const merged = [...newStations, ...prev];
          try {
            localStorage.setItem('evio_chargers', JSON.stringify(merged));
          } catch (e) {
            console.warn('Storage save error:', e);
          }
          return merged;
        });
      })
      .catch(err => console.warn('Open Charge Map sync warning:', err));

    return () => {
      isMounted = false;
    };
  }, [userCoords[0], userCoords[1]]);

  const role: UserRole = currentUser?.role || 'driver';

  const loginUser = (user: UserProfile) => {
    setCurrentUser(user);
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Authentication Verified',
        desc: `Session initialized for ${user.name} (${user.role.toUpperCase()}).`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  // Password-based dashboard routing: ID can be the same, but password created during registration decides the dashboard
  const loginWithCredentials = (emailInput: string, passwordInput: string) => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    const match = registeredAccounts.find(
      acc => acc.email.trim().toLowerCase() === trimmedEmail && acc.password === passwordInput
    );

    if (match) {
      setCurrentUser(match);
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: `${match.role.toUpperCase()} Authentication Successful`,
          desc: `Redirected to ${match.role.toUpperCase()} Dashboard as ${match.name}.`,
          time: 'Just now',
          read: false,
        },
        ...prev
      ]);
      return { success: true, user: match };
    }

    return { 
      success: false, 
      error: 'Invalid credentials. No account found for this ID and Password combination. Register or verify your credentials.' 
    };
  };

  const registerAccount = (account: UserProfile) => {
    // Check if an account with same email AND same password already exists
    const existing = registeredAccounts.find(
      a => a.email.toLowerCase() === account.email.toLowerCase() && a.password === account.password
    );

    if (existing) {
      return { 
        success: false, 
        error: 'An account with this ID and password already exists. Please choose a different password for this dashboard.' 
      };
    }

    const updated = [account, ...registeredAccounts];
    setRegisteredAccounts(updated);
    setCurrentUser(account);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Account Registered',
        desc: `New ${account.role.toUpperCase()} account created for ${account.name}. Dashboard initialized.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);

    return { success: true };
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
  };

  const loadSeedChargers = () => {
    setChargers(SEED_CALIBRATION_CHARGERS);
  };

  const clearAllChargers = () => {
    setChargers([]);
  };

  const formatCurrency = (amount: number): string => {
    switch (currency) {
      case 'EUR':
        return `€${amount.toFixed(2)}`;
      case 'USD':
        return `$${amount.toFixed(2)}`;
      case 'GBP':
        return `£${amount.toFixed(2)}`;
      case 'INR':
      default:
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }
  };

  const activeBooking = bookings.find(b => b.status === 'active') || null;

  useEffect(() => {
    if (!activeBooking) return;

    const timer = setInterval(() => {
      setBookings(prev => prev.map(b => {
        if (b.id !== activeBooking.id || !b.activeSession) return b;
        const currentPercentage = Math.min(100, b.activeSession.batteryPercentage + 1);
        const addedKwh = 0.20;
        const newKwh = Number((b.activeSession.currentKwh + addedKwh).toFixed(2));
        const rate = 0.28;
        const newCost = Number((newKwh * rate).toFixed(2));

        return {
          ...b,
          activeSession: {
            ...b.activeSession,
            batteryPercentage: currentPercentage,
            currentKwh: newKwh,
            currentCost: newCost,
          }
        };
      }));
    }, 4000);

    return () => clearInterval(timer);
  }, [activeBooking?.id]);

  const addChargerListing = (
    newChargerData: Omit<ChargerListing, 'id' | 'createdAt' | 'status' | 'listingStatus'>
  ): ChargerListing => {
    const newCharger: ChargerListing = {
      ...newChargerData,
      id: `NODE-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'offline',
      listingStatus: 'pending',
    };

    setChargers(prev => [newCharger, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Listing Submitted for Compliance Review',
        desc: `Station [${newCharger.title}] queued for electrical verification.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);

    return newCharger;
  };

  const deleteCharger = (chargerId: string) => {
    setChargers(prev => prev.filter(c => c.id !== chargerId));
    setBookings(prev => prev.map(b => b.chargerId === chargerId ? { ...b, status: 'cancelled' } : b));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Station Deleted',
        desc: `Charging node ${chargerId} permanently removed from the system.`,
        time: 'Just now',
        read: false
      },
      ...prev
    ]);
  };

  const updateChargerStatus = (chargerId: string, status: ChargerListing['status']) => {
    setChargers(prev => prev.map(c => c.id === chargerId ? { ...c, status } : c));
  };

  const approveChargerListing = (chargerId: string) => {
    setChargers(prev => prev.map(c => c.id === chargerId ? { 
      ...c, 
      listingStatus: 'live', 
      status: 'available',
      safetyCertificateVerified: true 
    } : c));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Listing Approved & Activated',
        desc: `Charging node ${chargerId} certified by administrator and published live.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const rejectChargerListing = (chargerId: string, reason: string) => {
    setChargers(prev => prev.map(c => c.id === chargerId ? { 
      ...c, 
      listingStatus: 'rejected', 
      rejectionReason: reason 
    } : c));
  };

  const toggleHostVacation = (chargerId: string) => {
    setChargers(prev => prev.map(c => {
      if (c.id !== chargerId) return c;
      const nextStatus = c.listingStatus === 'paused' ? 'live' : 'paused';
      const mapStatus = nextStatus === 'live' ? 'available' : 'offline';
      return { ...c, listingStatus: nextStatus, status: mapStatus };
    }));
  };

  const autoAcceptBookings = currentUser?.autoAcceptBookings ?? false;

  const toggleAutoAcceptBookings = () => {
    if (!currentUser) return;
    const newVal = !currentUser.autoAcceptBookings;
    const updatedUser = { ...currentUser, autoAcceptBookings: newVal };
    setCurrentUser(updatedUser);
    setRegisteredAccounts(prev => prev.map(a => a.id === currentUser.id ? { ...a, autoAcceptBookings: newVal } : a));
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: newVal ? 'Auto-Accept Enabled' : 'Auto-Accept Disabled',
        desc: newVal 
          ? 'Incoming driver slot requests will now be auto-confirmed instantly.'
          : 'Incoming driver slot requests now require manual approval.',
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const createBooking = (
    charger: ChargerListing,
    startTime: string,
    endTime: string,
    durationHours: number,
    estimatedKwh: number,
    paymentMethod: 'wallet' | 'upi' | 'card'
  ) => {
    if (!currentUser) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    const rate = charger.priceRate;
    const subtotal = charger.pricingType === 'per-kwh' ? estimatedKwh * rate : durationHours * rate;
    const platformFee = Number((subtotal * 0.10).toFixed(2));
    const totalAmount = Number((subtotal + platformFee).toFixed(2));

    if (paymentMethod === 'wallet' && currentUser.walletBalance < totalAmount) {
      return { success: false, error: `Insufficient wallet balance. Required: ${formatCurrency(totalAmount)}. Current balance: ${formatCurrency(currentUser.walletBalance)}.` };
    }

    if (paymentMethod === 'wallet') {
      const updatedUser = { ...currentUser, walletBalance: currentUser.walletBalance - totalAmount };
      setCurrentUser(updatedUser);
    }

    // Check if the hub host has auto-accept enabled
    const hostUser = registeredAccounts.find(
      u => u.id === charger.hostId || (charger.hostEmail && u.email.toLowerCase() === charger.hostEmail.toLowerCase())
    );
    const isHostAutoAccept = Boolean(hostUser?.autoAcceptBookings);
    const initialStatus: BookingStatus = isHostAutoAccept ? 'confirmed' : 'requested';

    const newBooking: Booking = {
      id: `BKG-${Math.floor(1000 + Math.random() * 9000)}`,
      chargerId: charger.id,
      chargerTitle: charger.title,
      hostId: charger.hostId,
      hostName: charger.hostName,
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverVehicle: currentUser.vehicle ? `${currentUser.vehicle.make} ${currentUser.vehicle.model}` : 'EV Vehicle',
      driverConnector: currentUser.vehicle?.connector || 'Type 2',
      startTime,
      endTime,
      durationHours,
      estimatedKwh,
      totalAmount,
      platformFee,
      status: initialStatus,
      paymentMethod,
      paymentStatus: 'paid',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setBookings(prev => [newBooking, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: isHostAutoAccept ? 'Slot Booking Auto-Confirmed by Hub' : 'Booking Request Sent to Hub',
        desc: isHostAutoAccept 
          ? `Slot on [${charger.title}] automatically confirmed by Host's smart dispatcher. Scheduled slot: ${startTime}.`
          : `Request for [${charger.title}] sent to host ${charger.hostName}. Slot will be confirmed upon host acceptance.`,
        time: 'Just now',
        read: false
      },
      ...prev
    ]);

    return { success: true, booking: newBooking };
  };

  const acceptBookingRequest = (bookingId: string) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'confirmed',
      };
    }));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Slot Booking Confirmed by Hub',
        desc: `Driver ${target.driverName}'s booking request for ${target.chargerTitle} approved for scheduled slot: ${target.startTime}.`,
        time: 'Just now',
        read: false
      },
      ...prev
    ]);
  };

  const startChargingSession = (bookingId: string) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    const charger = chargers.find(c => c.id === target.chargerId);
    const power = charger?.powerKw || 22;
    const rate = charger?.priceRate || 18.00;

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'active',
        activeSession: {
          startedAt: new Date().toISOString(),
          currentKwh: 0.20,
          currentCost: Number((0.20 * rate).toFixed(2)),
          batteryPercentage: 42,
          flowRateKw: power,
        }
      };
    }));

    updateChargerStatus(target.chargerId, 'in-use');

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Vehicle Connected & Charging Started',
        desc: `Vehicle plugged into ${target.chargerTitle}. Real-time power delivery active at ${power} kW.`,
        time: 'Just now',
        read: false
      },
      ...prev
    ]);
  };

  const declineBookingRequest = (bookingId: string) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    // Refund if paid via wallet and the driver is the current user
    if (target.paymentMethod === 'wallet' && currentUser && currentUser.id === target.driverId) {
      setCurrentUser({ ...currentUser, walletBalance: currentUser.walletBalance + target.totalAmount });
    }

    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'rejected' } : b));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Booking Request Declined',
        desc: `Booking #${bookingId} was declined by the hub host.`,
        time: 'Just now',
        read: false
      },
      ...prev
    ]);
  };

  const stopActiveSession = () => {
    if (!activeBooking) return;
    setBookings(prev => prev.map(b => {
      if (b.id !== activeBooking.id) return b;
      return {
        ...b,
        status: 'completed',
      };
    }));

    updateChargerStatus(activeBooking.chargerId, 'available');

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Session Disconnected',
        desc: `Session at ${activeBooking.chargerTitle} completed. Invoice generated.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const topUpWallet = (amount: number) => {
    if (!currentUser) return;
    const updated = { ...currentUser, walletBalance: currentUser.walletBalance + amount };
    setCurrentUser(updated);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Balance Credited',
        desc: `Added ${formatCurrency(amount)} to wallet balance.`,
        time: 'Just now',
        read: false
      },
      ...prev
    ]);
  };

  const sendChatMessage = (bookingId: string, text: string) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      bookingId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);
  };

  const resolveDispute = (disputeId: string) => {
    setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'resolved' } : d));
  };

  // Battery Delivery Feature
  const requestBatteryDelivery = (data: Omit<BatteryDeliveryRequest, 'id' | 'createdAt' | 'status'>): BatteryDeliveryRequest => {
    const newReq: BatteryDeliveryRequest = {
      ...data,
      id: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      createdAt: 'Just now',
    };

    if (currentUser && currentUser.walletBalance >= data.totalCost) {
      setCurrentUser({ ...currentUser, walletBalance: currentUser.walletBalance - data.totalCost });
    }

    setBatteryDeliveries(prev => [newReq, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Emergency Battery Delivery Requested',
        desc: `Dispatch request for ${data.batterySpec} sent to ${data.hubName}. Estimated arrival in ~${data.etaMinutes} mins.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);

    return newReq;
  };

  const dispatchBatteryDelivery = (requestId: string, deliveryPartnerName: string = 'Express Evio Delivery Rider') => {
    setBatteryDeliveries(prev => prev.map(r => r.id === requestId ? { ...r, status: 'dispatched', deliveryPartnerName } : r));
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Battery Dispatched to Vehicle',
        desc: `Order #${requestId} is out for delivery with ${deliveryPartnerName}.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const completeBatteryDelivery = (requestId: string) => {
    const req = batteryDeliveries.find(r => r.id === requestId);
    if (req && currentUser && currentUser.role === 'hub') {
      // Credit hub operator with swap fee
      setCurrentUser({ ...currentUser, walletBalance: currentUser.walletBalance + req.totalCost });
    }
    setBatteryDeliveries(prev => prev.map(r => r.id === requestId ? { ...r, status: 'delivered' } : r));
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Battery Swap Successfully Completed',
        desc: `Order #${requestId} fresh battery safely installed into vehicle.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const cancelBatteryDelivery = (requestId: string) => {
    const req = batteryDeliveries.find(r => r.id === requestId);
    if (req && currentUser && currentUser.id === req.driverId) {
      // Refund driver
      setCurrentUser({ ...currentUser, walletBalance: currentUser.walletBalance + req.totalCost });
    }
    setBatteryDeliveries(prev => prev.map(r => r.id === requestId ? { ...r, status: 'cancelled' } : r));
  };

  // Franchise Feature
  const submitFranchiseApplication = (app: Omit<FranchiseApplication, 'id' | 'createdAt' | 'status'>): FranchiseApplication => {
    const newApp: FranchiseApplication = {
      ...app,
      id: `FRAN-${Date.now().toString().slice(-4)}`,
      status: 'submitted',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setFranchiseApplications(prev => [newApp, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Franchise Hub Application Submitted',
        desc: `Application for ${app.city} (${app.packageType.toUpperCase()} Hub) sent to Supervisor for bulk hardware pricing approval.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);

    return newApp;
  };

  const updateFranchiseStatus = (id: string, status: FranchiseApplication['status']) => {
    setFranchiseApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Franchise Application ${status.toUpperCase()}`,
        desc: `Franchise order #${id} has been marked as ${status} by the Supervisor.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const quoteFranchiseApplication = (id: string, quotedRate: number, supervisorNotes: string) => {
    setFranchiseApplications(prev => prev.map(a => a.id === id ? {
      ...a,
      status: 'quotation-sent',
      quotedRate,
      supervisorNotes,
    } : a));
    const target = franchiseApplications.find(a => a.id === id);
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Wholesale Quotation Dispatched to Applicant',
        desc: `Supervisor quoted ₹${quotedRate.toLocaleString('en-IN')} for ${target?.applicantName || 'Applicant'} (${target?.packageType.toUpperCase()} Hub) in ${target?.city}.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  // Peer-to-Peer V2V Reverse Charging
  const createV2VRequest = (data: Omit<V2VReverseChargeRequest, 'id' | 'createdAt' | 'status'>): V2VReverseChargeRequest => {
    const newReq: V2VReverseChargeRequest = {
      ...data,
      id: `V2V-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'broadcasting',
      createdAt: 'Just now',
    };

    setV2vRequests(prev => [newReq, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Highway V2V Reverse Charge SOS Broadcasted',
        desc: `Emergency SOS sent to passing EVs on ${data.location.highwayName}. Requesting ${data.requestedKwh} kWh at ${formatCurrency(data.offeredPayout)}.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);

    return newReq;
  };

  const acceptV2VRequest = (requestId: string, donorDriverId: string, donorDriverName: string, donorVehicle: string) => {
    setV2vRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: 'accepted',
      donorDriverId,
      donorDriverName,
      donorVehicle,
    } : r));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'V2V Rescue Mission Accepted',
        desc: `${donorDriverName} (${donorVehicle}) is approaching your highway location with bidirectional charging cable.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const startV2VTransfer = (requestId: string) => {
    setV2vRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'transferring' } : r));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'V2V Reverse Charge Transfer Started',
        desc: `Bidirectional DC/AC cable locked. Delivering emergency energy at 11 kW.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const completeV2VTransfer = (requestId: string, transferredKwh: number) => {
    const req = v2vRequests.find(r => r.id === requestId);
    if (req && req.donorDriverId && currentUser && currentUser.id === req.donorDriverId) {
      setCurrentUser({ ...currentUser, walletBalance: currentUser.walletBalance + req.offeredPayout });
    }

    setV2vRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'completed', transferredKwh } : r));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'V2V Reverse Charging Completed',
        desc: `Transferred ${transferredKwh} kWh successfully. Reward of ${formatCurrency(req?.offeredPayout || 450)} settled.`,
        time: 'Just now',
        read: false,
      },
      ...prev
    ]);
  };

  const sendDirectV2VRequest = (driverId: string, requestedKwh: number, payout: number): V2VReverseChargeRequest => {
    const targetDriver = onlineDrivers.find(d => d.id === driverId);
    return createV2VRequest({
      strandedDriverId: currentUser?.id || 'usr-driver-demo',
      strandedDriverName: currentUser?.name || 'Stranded EV Driver',
      strandedDriverPhone: currentUser?.phone || '+91 99887-76655',
      strandedVehicle: currentUser?.vehicle ? `${currentUser.vehicle.make} ${currentUser.vehicle.model}` : 'Tata Nexon EV Max',
      location: {
        lat: userCoords[0],
        lng: userCoords[1],
        highwayName: `NH-48 Corridor (Directed to ${targetDriver ? targetDriver.name : 'Active Driver'} at ${targetDriver ? targetDriver.vehicle : 'Passing EV'})`,
      },
      currentSoc: 4,
      requestedKwh,
      offeredPayout: payout,
    });
  };

  const cancelV2VRequest = (requestId: string) => {
    setV2vRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'cancelled' } : r));
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        loginUser,
        loginWithCredentials,
        registerAccount,
        logoutUser,
        role,
        switchRole,
        userCoords,
        setUserCoords,
        currency,
        setCurrency,
        formatCurrency,
        chargers,
        loadSeedChargers,
        clearAllChargers,
        addChargerListing,
        deleteCharger,
        updateChargerStatus,
        approveChargerListing,
        rejectChargerListing,
        toggleHostVacation,
        autoAcceptBookings,
        toggleAutoAcceptBookings,
        bookings,
        createBooking,
        acceptBookingRequest,
        declineBookingRequest,
        startChargingSession,
        activeBooking,
        stopActiveSession,
        topUpWallet,
        chatMessages,
        sendChatMessage,
        disputes,
        resolveDispute,
        batteryDeliveries,
        requestBatteryDelivery,
        dispatchBatteryDelivery,
        completeBatteryDelivery,
        cancelBatteryDelivery,
        franchiseApplications,
        submitFranchiseApplication,
        updateFranchiseStatus,
        quoteFranchiseApplication,
        v2vRequests,
        createV2VRequest,
        acceptV2VRequest,
        startV2VTransfer,
        completeV2VTransfer,
        cancelV2VRequest,
        onlineDrivers,
        sendDirectV2VRequest,
        heatmapZones,
        notifications,
        markNotificationsAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
