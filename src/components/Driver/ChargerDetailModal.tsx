import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet, 
  CreditCard, 
  Smartphone, 
  Info,
  Car,
  Check,
  Navigation,
  Building2,
  Home,
  Briefcase,
  ShoppingBag,
  Hotel
} from 'lucide-react';
import { ChargerListing } from '../../types';
import { useApp } from '../../context/AppContext';

interface ChargerDetailModalProps {
  charger: ChargerListing;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const ChargerDetailModal: React.FC<ChargerDetailModalProps> = ({
  charger,
  onClose,
  onBookingSuccess,
}) => {
  const { currentUser, formatCurrency, createBooking, topUpWallet } = useApp();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(1.5);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('Today, 02:00 PM - 03:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'upi' | 'card'>('wallet');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userConnector = currentUser?.vehicle?.connector || 'Type 2';
  const isCompatible = charger.connectorTypes.includes(userConnector);

  const estimatedKwh = Math.min(
    currentUser?.vehicle?.batteryCapacity || 60,
    Number((charger.powerKw * selectedDuration * 0.85).toFixed(1))
  );

  const subtotal = charger.pricingType === 'per-kwh' 
    ? Number((estimatedKwh * charger.priceRate).toFixed(2))
    : Number((selectedDuration * charger.priceRate).toFixed(2));

  const platformFee = Number((subtotal * 0.10).toFixed(2));
  const totalAmount = Number((subtotal + platformFee).toFixed(2));

  const handleBook = () => {
    setBookingError(null);
    setIsSubmitting(true);

    const now = new Date();
    const startTime = selectedSlotTime.includes('Now') 
      ? 'Today, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : selectedSlotTime;
    
    const end = new Date(now.getTime() + selectedDuration * 3600 * 1000);
    const endTime = 'Today, ' + end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const result = createBooking(
      charger,
      startTime,
      endTime,
      selectedDuration,
      estimatedKwh,
      paymentMethod
    );

    setIsSubmitting(false);

    if (result.success) {
      onBookingSuccess();
    } else {
      setBookingError(result.error || 'Failed to submit booking request.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-[#BAE6FD] max-w-4xl w-full overflow-hidden shadow-2xl my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#BAE6FD] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              charger.isPublicStation ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'bg-[#E0F2FE] text-[#0284C7]'
            }`}>
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-[#0F172A]">{charger.title}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  charger.isPublicStation 
                    ? 'bg-[#F3E8FF] text-[#7C3AED] border border-[#D8B4FE]' 
                    : 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
                }`}>
                  {charger.isPublicStation ? 'Public Station' : 'EVIO Hub'}
                </span>
                {charger.locationType && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                    {charger.locationType}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">{charger.approxAddress}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[80vh] overflow-y-auto">
          
          {/* Left Column: 7 Cols Photos & Tech Details */}
          <div className="lg:col-span-7 p-5 sm:p-6 space-y-5">
            
            {/* Main Photo & Thumbs */}
            <div className="space-y-2">
              <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden bg-[#F1F5F9] border border-[#CBD5E1]">
                <img 
                  src={charger.photos[activePhotoIndex] || 'https://images.unsplash.com/photo-1558441719-798481498b3f?w=800'} 
                  alt={charger.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-mono text-[11px] border border-white/20">
                  {charger.powerKw} kW • {charger.connectorTypes.join(' / ')}
                </div>
              </div>

              {charger.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {charger.photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIndex(i)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        activePhotoIndex === i ? 'border-[#0284C7] ring-2 ring-[#0284C7]/30' : 'border-[#CBD5E1] opacity-70'
                      }`}
                    >
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Compatibility Alert */}
            <div>
              {isCompatible ? (
                <div className="p-3.5 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-[#0F172A] font-mono">Full Compatibility Confirmed</p>
                    <p className="text-[#475569]">
                      Your vehicle supports {userConnector}. This charger provides compatible {charger.connectorTypes.join(', ')}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#FEF2F2] border-l-4 border-l-[#DC2626] border border-[#FECACA] flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-[#DC2626] font-mono">Connector Incompatibility Warning</p>
                    <p className="text-[#B91C1C]">
                      Your vehicle requires {userConnector}. This station supplies {charger.connectorTypes.join(', ')}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] uppercase font-mono font-bold block">Peak Output</span>
                <span className="font-mono text-base font-bold text-[#0284C7]">{charger.powerKw} kW</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] uppercase font-mono font-bold block">Cable Length</span>
                <span className="font-mono text-base font-bold text-[#0F172A]">{charger.cableLengthMeters}m</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] uppercase font-mono font-bold block">Charge Bays</span>
                <span className="font-mono text-base font-bold text-[#0F172A]">{charger.simultaneousSlots}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] uppercase font-mono font-bold block">Property Type</span>
                <span className="font-mono text-base font-bold text-[#16A34A] uppercase">{charger.locationType || 'Hub'}</span>
              </div>
            </div>

            {/* Description & Amenities */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#0F172A] uppercase tracking-wider block">Station Details</span>
              <p className="text-xs text-[#64748B] leading-relaxed">{charger.description}</p>
              
              <div className="flex flex-wrap gap-1.5 pt-2">
                {charger.amenities.map(a => (
                  <span key={a} className="px-2.5 py-1 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] text-[11px] font-mono text-[#0284C7]">
                    ✓ {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Location & Access Note */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5 text-xs text-[#64748B]">
              <Info className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span>
                <strong>Station Navigation:</strong> Exact address & gate access passcode are displayed upon booking or direct arrival.
              </span>
            </div>

          </div>

          {/* Right Column: Branching for Public Station vs EVIO Hub */}
          {charger.isPublicStation ? (
            /* Public Station: Walk-in / Drive-in Only */
            <div className="lg:col-span-5 p-6 bg-[#FAF5FF] flex flex-col justify-between space-y-6 border-l border-[#E9D5FF]">
              <div className="space-y-5">
                <div className="border-b border-[#E9D5FF] pb-4">
                  <span className="px-2.5 py-1 rounded-full bg-[#7C3AED] text-white text-[10px] font-mono font-bold inline-block mb-2 shadow-xs">
                    PUBLIC THIRD-PARTY STATION
                  </span>
                  <h3 className="text-xl font-bold text-[#0F172A]">
                    {charger.operatorBrand || 'Public Fast EV Grid'}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-mono text-3xl font-extrabold text-[#7C3AED]">
                      {formatCurrency(charger.priceRate)}
                    </span>
                    <span className="text-xs text-[#64748B] font-mono">
                      per kWh at terminal
                    </span>
                  </div>
                </div>

                {/* Public Station Notice */}
                <div className="p-4 rounded-xl bg-white border border-[#D8B4FE] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#7C3AED]">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>No Advance Slot Reservation Required</span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    This is a pre-existing public fast charging facility. Drivers can drive directly to the station bays and charge on a first-come, first-served basis.
                  </p>
                  <div className="pt-2 border-t border-[#F3E8FF] text-[11px] text-[#64748B] space-y-1">
                    <p>• <strong>Payment:</strong> RFID card, operator mobile app, or terminal UPI.</p>
                    <p>• <strong>Advance booking:</strong> Only EVIO Community Hubs support advance slot booking.</p>
                  </div>
                </div>

                {/* Exact Location & Bay Access */}
                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase block">Exact Station Bay Address</span>
                  <p className="text-xs font-bold text-[#0F172A]">{charger.exactAddress}</p>
                  <p className="text-[11px] text-[#64748B] font-mono">{charger.accessNotes}</p>
                </div>
              </div>

              {/* Direct Navigation Button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${charger.lat},${charger.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-mono font-bold text-xs tracking-wider shadow-md shadow-[#7C3AED]/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>NAVIGATE VIA GOOGLE MAPS / GPS</span>
              </a>
            </div>
          ) : (
            /* EVIO Community Hub: Full Slot Booking Workflow */
            <div className="lg:col-span-5 p-6 bg-[#F0F9FF] flex flex-col justify-between space-y-6 border-l border-[#BAE6FD]">
              
              <div className="space-y-5">
                
                {/* Tariff banner */}
                <div className="border-b border-[#BAE6FD] pb-4">
                  <span className="text-xs text-[#64748B] uppercase font-mono font-bold tracking-wider block mb-1">
                    Charging Rate
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-extrabold text-[#0284C7]">
                      {formatCurrency(charger.priceRate)}
                    </span>
                    <span className="text-xs text-[#64748B] font-mono">
                      per {charger.pricingType === 'per-kwh' ? 'kWh delivered' : 'hour'}
                    </span>
                  </div>
                </div>

                {/* Arrival Slot */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Select Scheduled Charging Slot</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Today, 02:00 PM - 03:00 PM',
                      'Today, 04:30 PM - 05:30 PM',
                      'Today, 07:00 PM - 08:00 PM',
                      'Tomorrow, 09:30 AM - 10:30 AM'
                    ].map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlotTime(slot)}
                        className={`p-2.5 rounded-xl border text-xs text-left font-mono transition-all ${
                          selectedSlotTime === slot 
                            ? 'bg-white border-[#0284C7] text-[#0284C7] font-bold shadow-xs' 
                            : 'bg-white/80 border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#0F172A]">Charging Duration:</span>
                    <span className="text-[#0284C7] font-bold">{selectedDuration} hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[0.5, 1.0, 1.5, 2.0, 3.0].map(dur => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setSelectedDuration(dur)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                          selectedDuration === dur
                            ? 'bg-[#0284C7] border-[#0284C7] text-white font-bold'
                            : 'bg-white border-[#CBD5E1] text-[#64748B] hover:border-[#0284C7]'
                        }`}
                      >
                        {dur}h
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-[#0F172A] block">Payment Method</label>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
                        paymentMethod === 'wallet' 
                          ? 'bg-white border-[#0284C7] text-[#0F172A] shadow-xs' 
                          : 'bg-white/70 border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#0284C7]" />
                        <span>Evio Pay Wallet</span>
                      </div>
                      <span className="font-bold text-[#16A34A]">
                        {formatCurrency(currentUser?.walletBalance || 0)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
                        paymentMethod === 'upi' 
                          ? 'bg-white border-[#0284C7] text-[#0F172A] shadow-xs' 
                          : 'bg-white/70 border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#0284C7]" />
                        <span>Instant UPI / Apple Pay</span>
                      </div>
                      <span className="text-[10px] text-[#64748B]">Zero Fee</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
                        paymentMethod === 'card' 
                          ? 'bg-white border-[#0284C7] text-[#0F172A] shadow-xs' 
                          : 'bg-white/70 border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#0284C7]" />
                        <span>Credit / Debit Card</span>
                      </div>
                      <span className="text-[10px] text-[#64748B]">Visa/MC</span>
                    </button>
                  </div>
                </div>

                {/* Cost breakdown */}
                <div className="pt-3 border-t border-[#BAE6FD] space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Energy Subtotal ({estimatedKwh} kWh)</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Network Platform Fee (10%)</span>
                    <span>{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-[#0F172A] font-bold pt-2 border-t border-[#BAE6FD]">
                    <span className="text-sm">Total Amount</span>
                    <span className="text-base text-[#0284C7]">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border-l-4 border-l-[#DC2626] text-xs text-[#DC2626] font-mono">
                    <div className="flex items-center justify-between">
                      <span>{bookingError}</span>
                      {bookingError.includes('Insufficient') && (
                        <button
                          onClick={() => topUpWallet(500)}
                          className="underline font-bold text-[#0F172A] ml-2"
                        >
                          + Add ₹500
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Action */}
              <button
                onClick={handleBook}
                disabled={isSubmitting || charger.status === 'offline'}
                className="w-full py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs tracking-wider shadow-md shadow-[#0284C7]/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>REQUEST SLOT APPROVAL FROM HUB</span>
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
