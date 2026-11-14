import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  KeyRound,
  User,
  Sparkles,
  Activity,
  Stethoscope,
  Satellite,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CinematicLaunchSequence } from './CinematicLaunchSequence';

/* ─── Natural Mission Clock (UTC) ────────────────────────────── */
function MissionClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(t.getUTCHours()).padStart(2, '0');
  const mm = String(t.getUTCMinutes()).padStart(2, '0');
  const ss = String(t.getUTCSeconds()).padStart(2, '0');
  return (
    <span className="font-mono text-xs text-slate-200 tracking-wider drop-shadow">
      MET {hh}:{mm}:{ss}
    </span>
  );
}

/* ─── Role Config ────────────────────────────────────────────── */
const ROLES = [
  { key: 'CREW_MEDICAL_OFFICER', label: 'CMO', title: 'Medical Officer', Icon: Stethoscope },
  { key: 'FLIGHT_SURGEON',       label: 'FS',  title: 'Flight Surgeon',  Icon: Satellite   },
  { key: 'MISSION_SPECIALIST',   label: 'MS',  title: 'Astronaut',       Icon: Activity    },
  { key: 'GUEST_OBSERVER',       label: 'OB',  title: 'Observer',        Icon: Sparkles    },
] as const;

export function LoginPage() {
  const { login, quickLogin, availableRoles } = useAuth();

  const [selectedRole, setSelectedRole]   = useState<string>('CREW_MEDICAL_OFFICER');
  const [callsign,     setCallsign]       = useState<string>('ARTEMIS-CMO');
  const [pin,          setPin]            = useState<string>('2026');
  const [showPin,      setShowPin]        = useState<boolean>(false);
  const [rememberMe,   setRememberMe]     = useState<boolean>(true);
  const [submitting,   setSubmitting]     = useState<boolean>(false);
  const [launching,    setLaunching]      = useState<boolean>(false);
  const [errorMsg,     setErrorMsg]       = useState<string>('');

  const pendingLogin = React.useRef<(() => Promise<void>) | null>(null);

  const handleRoleSelect = (key: string) => {
    setSelectedRole(key);
    setErrorMsg('');
    const matched = availableRoles.find((r) => r.role_key === key);
    if (matched) {
      setCallsign(matched.default_callsign);
      setPin(matched.default_pin);
    }
  };

  const onLaunchComplete = async () => {
    if (!pendingLogin.current) return;
    try {
      await pendingLogin.current();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMsg(msg);
      setLaunching(false);
      setSubmitting(false);
    }
  };

  const triggerLaunch = (loginFn: () => Promise<void>) => {
    if (submitting) return;
    pendingLogin.current = loginFn;
    setErrorMsg('');
    setSubmitting(true);
    setLaunching(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim() || !pin.trim()) {
      setErrorMsg('Callsign and security PIN are required.');
      return;
    }
    triggerLaunch(() => login(callsign, pin, selectedRole));
  };

  const handleQuickDemo = (roleKey: string) => {
    triggerLaunch(() => quickLogin(roleKey));
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 font-sans select-none text-slate-100 flex flex-col justify-between">
      
      {/* ── BACKGROUND: ISS Orbit Video ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        src="/iss_orbital_station.mp4"
      />

      {/* Atmospheric Glass Vignette (translucent so Earth and space station shine through) */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(10, 18, 32, 0.25) 0%, rgba(3, 8, 20, 0.55) 75%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />

      {/* ── Fast Cinematic Rocket Launch Sequence (triggers on login) ── */}
      {launching && (
        <CinematicLaunchSequence 
          onComplete={onLaunchComplete} 
          callsign={callsign || 'ARTEMIS-CREW'} 
        />
      )}

      {/* ── Top Navbar (Frosted Glass Pill) ── */}
      <header className="relative z-10 p-4 sm:p-6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/80 flex items-center justify-center text-white shadow-lg border border-white/20 backdrop-blur-md">
            <HeartPulse className="w-5 h-5 text-white drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white drop-shadow-sm">
                NASA Mission Sentinel
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md">
                Artemis III
              </span>
            </div>
            <p className="text-[11px] text-slate-300 drop-shadow-sm">Crew Health & Telemetry Outpost</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MissionClock />
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-emerald-300 text-xs backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">System Nominal</span>
          </div>
        </div>
      </header>

      {/* ── Center: Industry Standard Glassmorphic Login Card ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div 
          className={`w-full max-w-[420px] rounded-3xl p-7 sm:p-8 transition-all duration-300 relative ${
            launching ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
          }`}
          style={{
            background: 'rgba(15, 23, 42, 0.42)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)',
          }}
        >
          {/* Card Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-blue-400 mb-3 shadow-inner backdrop-blur-md">
              <Lock className="w-5 h-5 drop-shadow" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
              Sign in to Terminal
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Enter your credentials to access flight telemetry
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Operator Role Segmented Control */}
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1.5 drop-shadow-sm">
                Role Classification
              </label>
              <div className="grid grid-cols-4 gap-1 bg-black/30 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                {ROLES.map(({ key, label, title, Icon }) => {
                  const active = selectedRole === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleRoleSelect(key)}
                      title={title}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                        active
                          ? 'bg-blue-600/90 text-white font-semibold shadow-md border border-blue-400/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-0.5" />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Callsign Input */}
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1.5 drop-shadow-sm">
                Callsign / Flight ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="e.g. ARTEMIS-CMO"
                  disabled={submitting}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-black/30 hover:bg-black/40 focus:bg-black/50 border border-white/15 hover:border-white/25 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25 text-white placeholder-slate-400 rounded-xl text-sm font-mono focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] backdrop-blur-md disabled:opacity-50"
                />
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-200 drop-shadow-sm">
                  Security PIN
                </label>
                <span className="text-[11px] font-mono text-slate-300">Default: 2026</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength={10}
                  disabled={submitting}
                  className="w-full pl-10 pr-10 py-2.5 bg-black/30 hover:bg-black/40 focus:bg-black/50 border border-white/15 hover:border-white/25 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25 text-white tracking-widest placeholder-slate-400 rounded-xl text-sm font-mono focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] backdrop-blur-md disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-slate-400 cursor-default">Air-gapped safe</span>
            </div>

            {/* Primary Submit Button (Glassy Liquid Touch) */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white bg-blue-600/90 hover:bg-blue-500 active:bg-blue-700 border border-blue-400/30 shadow-[0_4px_20px_rgba(37,99,235,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-md transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4 shrink-0 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Industry Standard SSO / Fast Profile Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/15" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
              <span className="px-2.5 py-0.5 rounded-full text-slate-300 bg-white/10 backdrop-blur-md border border-white/10">
                Or Continue With
              </span>
            </div>
          </div>

          {/* 1-Click Fast Profile Access (Frosted Glass Tiles) */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'CREW_MEDICAL_OFFICER', name: 'Dr. Elena Vance', role: 'Medical Officer' },
              { key: 'GUEST_OBSERVER',       name: 'Judge Evaluator',  role: 'Guest Observer' },
            ].map(({ key, name, role }) => (
              <button
                key={key}
                type="button"
                disabled={submitting}
                onClick={() => handleQuickDemo(key)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 hover:border-white/30 backdrop-blur-md transition-all text-left cursor-pointer disabled:opacity-50 group shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white block drop-shadow-sm">
                    {name}
                  </span>
                  <span className="text-[10px] text-slate-300 block">
                    {role}
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
              </button>
            ))}
          </div>

          {/* Bottom Compliance Tag */}
          <div className="mt-5 pt-3 text-center border-t border-white/10">
            <span className="text-[10px] text-slate-400 font-mono">
              Protected by NASA Mission Sentinel IAM · Offline Capable
            </span>
          </div>
        </div>
      </main>

      {/* ── Footer (Frosted Glass Pill) ── */}
      <footer className="relative z-10 p-4 flex justify-center">
        <div className="px-4 py-1.5 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-md">
          <span className="text-[11px] font-mono text-slate-300">
            International Space Station Orbital Outpost · Low Earth Orbit (408 km)
          </span>
        </div>
      </footer>

    </div>
  );
}
