import React, { useState } from 'react';
import { 
  Zap, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Layers,
  CheckCircle2,
  AlertCircle,
  Car,
  Home,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, ConnectorType, UserProfile } from '../../types';

export const AuthScreen: React.FC = () => {
  const { loginWithCredentials, registerAccount } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('driver');
  const [vehicleModel, setVehicleModel] = useState('Tesla Model Y');
  const [connector, setConnector] = useState<ConnectorType>('CCS-2');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both Email / ID and Password.');
      return;
    }

    const res = loginWithCredentials(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify your credentials or register a new dashboard account.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in your name, email / ID, and password.');
      return;
    }

    const newAccount: UserProfile = {
      id: `usr-${selectedRole}-${Date.now().toString().slice(-4)}`,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: '+1 555-0182',
      role: selectedRole,
      avatar: selectedRole === 'supervisor'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
        : selectedRole === 'hub'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isVerified: true,
      walletBalance: selectedRole === 'driver' ? 100.0 : selectedRole === 'hub' ? 350.0 : 0.0,
      vehicle: selectedRole === 'driver' ? {
        make: vehicleModel.split(' ')[0] || 'EV',
        model: vehicleModel,
        batteryCapacity: 75.0,
        connector,
        plateNumber: 'EV-2026',
      } : undefined
    };

    const res = registerAccount(newAccount);
    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  const fillQuickCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-[#0F172A] flex flex-col justify-center items-center p-4 selection:bg-[#BAE6FD] selection:text-[#0369A1]">
      
      {/* Top Brand Banner */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#BAE6FD] shadow-xs mb-3">
          <Zap className="w-4 h-4 text-[#0284C7] fill-[#0284C7]" />
          <span className="text-xs font-mono font-bold tracking-wider text-[#0284C7] uppercase">EVIO NETWORK v1.0</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Decentralized EV Charging Portal</h1>
        <p className="text-xs text-[#64748B] mt-1 font-sans">
          Single sign-on architecture. Enter your ID and password to automatically route into your dedicated dashboard.
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="bg-white border border-[#BAE6FD] rounded-card w-full max-w-md p-6 sm:p-8 shadow-xl shadow-[#0284C7]/5 relative font-sans">
        
        {/* Sign In vs Register Toggle */}
        <div className="flex bg-[#F8FAFC] p-1 rounded-xl border border-[#CBD5E1] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === 'signin' 
                ? 'bg-[#0284C7] text-white shadow-xs' 
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all ${
              mode === 'signup' 
                ? 'bg-[#0284C7] text-white shadow-xs' 
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Register Dashboard
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs font-mono text-[#E11D48] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            
            {/* Email / ID */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1.5 uppercase">
                Email / Account ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. demo@evio.com or your ID"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white font-sans transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1.5 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white font-mono transition-all"
                />
              </div>
              <p className="text-[11px] text-[#0284C7] font-mono mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Password determines your role dashboard automatically.</span>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#0284C7]/20 transition-all mt-2"
            >
              <span>Access My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Credentials Test Box */}
            <div className="pt-4 border-t border-[#E2E8F0]">
              <span className="block text-[11px] font-mono text-[#64748B] mb-2 uppercase font-bold text-center">
                Instant Dashboard Test Profiles (Same ID, Distinct Passwords):
              </span>
              <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('demo@evio.com', 'driver123')}
                  className="p-2 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] hover:border-[#0284C7] text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#0284C7]" />
                    <div>
                      <span className="font-bold text-[#0F172A] block text-[11px]">Driver Dashboard</span>
                      <span className="text-[10px] text-[#64748B]">demo@evio.com / driver123</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#0284C7] font-bold">Auto-Fill</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickCredentials('demo@evio.com', 'hub123')}
                  className="p-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] hover:border-[#16A34A] text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#16A34A]" />
                    <div>
                      <span className="font-bold text-[#0F172A] block text-[11px]">Hub (Host) Dashboard</span>
                      <span className="text-[10px] text-[#64748B]">demo@evio.com / hub123</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#16A34A] font-bold">Auto-Fill</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickCredentials('demo@evio.com', 'super123')}
                  className="p-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] hover:border-[#D97706] text-left flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                    <div>
                      <span className="font-bold text-[#0F172A] block text-[11px]">Supervisor Dashboard</span>
                      <span className="text-[10px] text-[#64748B]">demo@evio.com / super123</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#D97706] font-bold">Auto-Fill</span>
                </button>
              </div>
            </div>

          </form>
        )}

        {/* 2. REGISTRATION FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Dashboard Role Picker */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1.5 uppercase">
                Select Destination Dashboard
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('driver')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRole === 'driver'
                      ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0284C7] shadow-xs font-bold'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:border-[#0284C7]'
                  }`}
                >
                  <Car className="w-4 h-4 mx-auto mb-1 text-[#0284C7]" />
                  <span className="block text-[11px] font-mono leading-tight">Driver</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('hub')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRole === 'hub'
                      ? 'bg-[#DCFCE7] border-[#16A34A] text-[#16A34A] shadow-xs font-bold'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:border-[#16A34A]'
                  }`}
                >
                  <Home className="w-4 h-4 mx-auto mb-1 text-[#16A34A]" />
                  <span className="block text-[11px] font-mono leading-tight">Hub Host</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('supervisor')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedRole === 'supervisor'
                      ? 'bg-[#FEF3C7] border-[#D97706] text-[#D97706] shadow-xs font-bold'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:border-[#D97706]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-[#D97706]" />
                  <span className="block text-[11px] font-mono leading-tight">Supervisor</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1.5 uppercase">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white font-sans transition-all"
                />
              </div>
            </div>

            {/* Email / ID */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1.5 uppercase">
                Email / User ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. alex@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white font-sans transition-all"
                />
              </div>
              <p className="text-[10px] text-[#64748B] font-mono mt-1">
                Same ID can be registered across multiple dashboards.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#475569] mb-1.5 uppercase">
                Dashboard Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Set password for this dashboard"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white font-mono transition-all"
                />
              </div>
              <p className="text-[10px] text-[#0284C7] font-mono mt-1">
                Logging in with this password will drop you on the {selectedRole.toUpperCase()} dashboard.
              </p>
            </div>

            {/* Vehicle Options for Driver */}
            {selectedRole === 'driver' && (
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <span className="block text-[11px] font-mono font-bold text-[#0F172A]">
                  EV Charging Compatibility
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-[#64748B] mb-1">Vehicle Model</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={e => setVehicleModel(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[#64748B] mb-1">Connector Plug</label>
                    <select
                      value={connector}
                      onChange={e => setConnector(e.target.value as ConnectorType)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono font-bold text-[#0284C7]"
                    >
                      <option value="Type 2">Type 2 (Mennekes)</option>
                      <option value="CCS-2">CCS-2 Combo</option>
                      <option value="GB/T">GB/T</option>
                      <option value="CHAdeMO">CHAdeMO</option>
                      <option value="Type 1">Type 1 (J1772)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#0284C7]/20 transition-all mt-2"
            >
              <span>Create {selectedRole.toUpperCase()} Account & Enter</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>
        )}

      </div>

      {/* Safety Compliance Footnote */}
      <div className="mt-8 text-center text-xs text-[#64748B] font-mono flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
        <span>Verified Electrical Safety Authority (NB 777 Standard)</span>
      </div>

    </div>
  );
};
