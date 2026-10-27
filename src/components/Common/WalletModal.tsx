import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  PlusCircle, 
  Smartphone, 
  CreditCard, 
  CheckCircle2 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WalletModalProps {
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ onClose }) => {
  const { currentUser, formatCurrency, topUpWallet } = useApp();
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [paymentOption, setPaymentOption] = useState<'upi' | 'card'>('upi');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTopUp = () => {
    topUpWallet(topUpAmount);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2500);
  };

  const transactions = [
    { id: 'TX-901', desc: 'Charging Session #BKG-901', amount: -380.00, date: 'Today, 02:30 PM', type: 'debit' },
    { id: 'TX-882', desc: 'UPI Auto Top-up', amount: +1000.00, date: 'Yesterday, 11:15 AM', type: 'credit' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#BAE6FD] rounded-card w-full max-w-md p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-[#CBD5E1] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] shadow-xs"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Balance Card */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-[#64748B] uppercase tracking-wider font-mono font-bold mb-1">
            <Wallet className="w-4 h-4 text-[#0284C7]" />
            <span>Evio Pay Wallet Balance</span>
          </div>
          <div className="font-mono text-[32px] font-bold text-[#0F172A] tracking-tight">
            {formatCurrency(currentUser?.walletBalance || 0)}
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-mono">Available for 1-click EV charging sessions.</p>
        </div>

        {/* Top-up controls */}
        <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-4 mb-6 space-y-4 font-mono shadow-xs">
          <span className="text-xs font-bold text-[#0F172A] block uppercase">Quick Top-Up</span>
          
          <div className="grid grid-cols-3 gap-2">
            {[500, 1000, 2000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setTopUpAmount(amt)}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  topUpAmount === amt
                    ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-xs'
                    : 'bg-white border-[#CBD5E1] text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                +{formatCurrency(amt)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setPaymentOption('upi')}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 ${
                paymentOption === 'upi' ? 'bg-white border-[#0284C7] text-[#0284C7] font-bold shadow-xs' : 'bg-white/70 border-[#CBD5E1] text-[#64748B]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Apple Pay / UPI</span>
            </button>
            <button
              onClick={() => setPaymentOption('card')}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 ${
                paymentOption === 'card' ? 'bg-white border-[#0284C7] text-[#0284C7] font-bold shadow-xs' : 'bg-white/70 border-[#CBD5E1] text-[#64748B]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Debit Card</span>
            </button>
          </div>

          <button
            onClick={handleTopUp}
            className="w-full py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs tracking-wider shadow-sm shadow-[#0284C7]/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ADD {formatCurrency(topUpAmount)}</span>
          </button>

          {showSuccess && (
            <div className="p-2 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] text-xs font-bold text-center flex items-center justify-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Funds added successfully!</span>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div>
          <span className="text-xs uppercase font-mono font-bold text-[#64748B] tracking-wider block mb-3">Transaction History</span>
          <div className="space-y-2 font-mono">
            {transactions.map(tx => (
              <div key={tx.id} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0F172A] block">{tx.desc}</span>
                  <span className="text-[10px] text-[#64748B]">{tx.date}</span>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>
                  {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
