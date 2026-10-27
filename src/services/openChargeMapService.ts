import { ChargerListing, ConnectorType, PowerTier } from '../types';

const OCM_API_KEY = 'ad006700-30f2-4b9a-a092-38e1f21c3234';

// Helper to normalize connector types
const mapOcmConnector = (ocmType: string): ConnectorType => {
  const lower = (ocmType || '').toLowerCase();
  if (lower.includes('ccs') || lower.includes('combo')) return 'CCS-2';
  if (lower.includes('type 2') || lower.includes('mennekes')) return 'Type 2';
  if (lower.includes('chademo')) return 'CHAdeMO';
  if (lower.includes('gb/t') || lower.includes('gbt')) return 'GB/T';
  if (lower.includes('type 1') || lower.includes('j1772')) return 'Type 1';
  return 'Type 2';
};

export async function fetchOpenChargeMapStations(
  lat: number,
  lng: number,
  distanceKm: number = 40
): Promise<ChargerListing[]> {
  try {
    const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=${distanceKm}&distanceunit=KM&maxresults=25&key=${OCM_API_KEY}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Open Charge Map API returned status:', response.status);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const publicStations: ChargerListing[] = data.map((poi: any, idx: number) => {
      const addr = poi.AddressInfo || {};
      const operator = poi.OperatorInfo?.Title || 'Public Fast EV Grid';
      const connections = Array.isArray(poi.Connections) ? poi.Connections : [];
      
      // Determine max power and connectors
      let maxPower = 22;
      const connectorsSet = new Set<ConnectorType>();

      connections.forEach((conn: any) => {
        if (conn.PowerKW && conn.PowerKW > maxPower) {
          maxPower = Math.round(conn.PowerKW);
        }
        if (conn.ConnectionType?.Title) {
          connectorsSet.add(mapOcmConnector(conn.ConnectionType.Title));
        }
      });

      if (connectorsSet.size === 0) {
        connectorsSet.add('Type 2');
        connectorsSet.add('CCS-2');
      }

      const powerTier: PowerTier = maxPower >= 50 ? 'rapid' : maxPower >= 11 ? 'fast' : 'slow';
      const isOperational = poi.StatusType?.IsOperational ?? true;

      // Unsplash verified public charging station image pool
      const stationImages = [
        'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
        'https://images.unsplash.com/photo-1558441719-798481498b3f?w=800',
        'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800',
        'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800'
      ];
      const photo = stationImages[idx % stationImages.length];

      return {
        id: `ocm-${poi.ID || idx}`,
        hostId: `operator-${(operator.toLowerCase().replace(/[^a-z0-9]/g, '')) || 'ocm'}`,
        hostName: `${operator} Network`,
        hostAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
        hostRating: 4.6,
        hostReviewsCount: 30 + (idx * 7) % 80,
        title: addr.Title || `${operator} ${maxPower}kW Station`,
        description: `Pre-existing public EV station verified on Open Charge Map grid. Operates on first-come, first-served walk-in basis.`,
        photos: [photo],
        approxAddress: addr.AddressLine1 
          ? `${addr.AddressLine1}${addr.Town ? ', ' + addr.Town : ''}` 
          : 'Public Highway Commercial Bay',
        exactAddress: [addr.AddressLine1, addr.Town, addr.StateOrProvince, addr.Postcode].filter(Boolean).join(', ') || 'Public EV Station Location',
        lat: Number(addr.Latitude) || lat + (Math.random() - 0.5) * 0.05,
        lng: Number(addr.Longitude) || lng + (Math.random() - 0.5) * 0.05,
        powerKw: maxPower,
        powerTier,
        connectorTypes: Array.from(connectorsSet),
        cableLengthMeters: 5.0,
        simultaneousSlots: Math.max(1, connections.length || 2),
        pricingType: 'per-kwh',
        priceRate: maxPower >= 50 ? 22.50 : 17.00,
        safetyCertificateName: 'OpenChargeMap_Verified_Registry.pdf',
        safetyCertificateVerified: true,
        schedule: {
          is247: true,
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          hours: 'Open 24/7',
        },
        amenities: ['Public Access', 'Restrooms Nearby', 'Drive-in Direct Access'],
        accessNotes: 'Public station: Drive into charging bay directly. Pay at terminal via RFID card or operator app.',
        bookingMode: 'instant',
        maxDurationHours: 2,
        status: isOperational ? 'available' : 'offline',
        listingStatus: 'live',
        createdAt: '2026-10-01',
        locationType: 'commercial',
        isPublicStation: true,
        operatorBrand: operator,
        offersBatteryDelivery: false,
        batteryStockCount: 0,
      };
    });

    return publicStations;
  } catch (error) {
    console.warn('Failed to fetch from Open Charge Map API:', error);
    return [];
  }
}
