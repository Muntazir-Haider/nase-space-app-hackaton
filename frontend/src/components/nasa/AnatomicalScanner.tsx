import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Moon,
  Thermometer,
  Wind,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  Layers,
  Brain,
  Zap,
  RotateCcw,
  Play,
  Pause,
  Compass,
} from 'lucide-react';
import { AstronautSummary, DeteriorationAlert } from '../../types';

interface AnatomicalScannerProps {
  astronaut: AstronautSummary | null;
  activeAlert: DeteriorationAlert | null;
  latestVitals?: {
    rhr?: number;
    sleep?: number;
    hrr?: number;
    spo2?: number;
    temp?: number;
  };
}

export function AnatomicalScanner({
  astronaut,
  activeAlert,
  latestVitals = {
    rhr: 68.9,
    sleep: 5.2,
    hrr: 24.5,
    spo2: 98.4,
    temp: 36.8,
  },
}: AnatomicalScannerProps) {
  const [selectedOrgan, setSelectedOrgan] = useState<'cardiac' | 'sleep' | 'hrr' | 'spo2' | 'temp'>('cardiac');
  const [anatomyLayer, setAnatomyLayer] = useState<'all' | 'cardiovascular' | 'respiratory' | 'nervous' | 'metabolic'>('all');

  // ── 360-Degree 3D Rotation State ──
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);

  // Smooth continuous 360-degree rotation loop
  useEffect(() => {
    let animId: number;
    const animate = () => {
      if (isAutoRotating && !isDraggingRef.current) {
        setRotationAngle((prev) => (prev + 0.45) % 360);
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating]);

  // Drag-to-rotate handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;
    setRotationAngle((prev) => {
      let next = (prev + deltaX * 0.7) % 360;
      if (next < 0) next += 360;
      return next;
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  if (!astronaut) return null;

  const hasAlert = !!activeAlert;

  // Normalized yaw angle in degrees
  const displayAngle = Math.round(rotationAngle);

  return (
    <div className="bg-white rounded-md border border-slate-300 shadow-2xs overflow-hidden flex flex-col font-sans select-none">

      {/* ── Top Header ── */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#0b3d91] flex items-center justify-center text-white shadow-xs">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 tracking-wider uppercase">
                360° Real Human Anatomical Scanner & Skeletal Mesh
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-bold border ${hasAlert
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                {hasAlert ? 'CLINICAL ALERT DETECTED' : 'ANATOMY NOMINAL'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Continuous 360° rotational CT / MRI volumetric scan with active vertical laser sweeping
            </p>
          </div>
        </div>

        {/* Flight clearance badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Flight Status:</span>
          <span className={`text-xs px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 border ${astronaut.medical_clearance_status === 'FULL_FLIGHT_CLEARANCE'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
            {astronaut.medical_clearance_status === 'FULL_FLIGHT_CLEARANCE' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{astronaut.medical_clearance_status.replace(/_/g, ' ')}</span>
          </span>
        </div>
      </div>

      {/* ── Layer Filter Toolbar ── */}
      <div className="px-5 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>ANATOMICAL LAYER:</span>
        </div>
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: 'Complete Skeleton & Organs' },
            { id: 'cardiovascular', label: 'Heart & Circulatory' },
            { id: 'respiratory', label: 'Lungs & Thoracic' },
            { id: 'nervous', label: 'Cranial & Nervous' },
            { id: 'metabolic', label: 'Visceral & Core' },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setAnatomyLayer(layer.id as any)}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-mono transition cursor-pointer border ${anatomyLayer === layer.id
                ? 'bg-cyan-600 text-white font-bold border-cyan-400 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Scanner Area ── */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch bg-slate-950">

        {/* Anatomical Holographic Scanner (Left 7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-md p-4 relative overflow-hidden flex flex-col items-center justify-between min-h-[530px] border border-slate-800 shadow-inner">

          {/* Subtle Precision Grid Lines */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(56,189,248,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Real-Time Live Animated ECG Strip */}
          <div className="w-full bg-slate-950/90 border border-slate-800 rounded-md p-2.5 relative z-10">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ECG LEAD II · CONTINUOUS TELEMETRY
              </span>
              <span className="font-bold text-slate-200">{(latestVitals.rhr ?? 68.9).toFixed(1)} BPM</span>
            </div>
            <svg viewBox="0 0 500 36" className="w-full h-7">
              <path
                d="M 0 18 L 40 18 L 50 18 L 55 10 L 62 28 L 70 4 L 78 24 L 85 18 L 140 18 L 150 18 L 155 10 L 162 28 L 170 4 L 178 24 L 185 18 L 240 18 L 250 18 L 255 10 L 262 28 L 270 4 L 278 24 L 285 18 L 340 18 L 350 18 L 355 10 L 362 28 L 370 4 L 378 24 L 385 18 L 440 18 L 450 18 L 455 10 L 462 28 L 470 4 L 478 24 L 485 18 L 500 18"
                fill="none"
                stroke={hasAlert ? '#f43f5e' : '#10b981'}
                strokeWidth="2"
                strokeLinecap="round"
                className="animate-ecg-flow"
              />
            </svg>
          </div>

          {/* ── 360-DEGREE 3D ROTATIONAL ANATOMICAL STAGE ── */}
          <div
            className="relative w-full max-w-sm my-2 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            title="Click and drag horizontally to spin human body 360 degrees"
          >
            {/* Stationary Box Frame (Remains stable with solid corners; does NOT rotate) */}
            <div
              className="relative w-full h-[395px] flex items-center justify-center overflow-hidden rounded-md border border-cyan-500/25 bg-black/75 shadow-[0_0_35px_rgba(6,182,212,0.15)]"
            >
              {/* 3D Rotational Human Body Wrapper (ONLY the anatomy rotates) */}
              <div
                className="w-full h-full flex items-center justify-center pointer-events-none"
                style={{
                  transform: `perspective(900px) rotateY(${rotationAngle}deg)`,
                  transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Authentic Real Anatomy Skeleton & Organs Transparent Image */}
                <img
                  src="/real_human_anatomy_transparent.png"
                  alt="Real Human Skeleton and Internal Anatomical Organs"
                  className="h-[385px] w-auto max-w-[90%] object-contain filter contrast-115 brightness-105 pointer-events-none select-none drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                />
              </div>

              {/* 3D Depth Floor Platform Glow */}
              <div
                className="absolute bottom-1 inset-x-8 h-6 rounded-full bg-cyan-500/20 blur-md pointer-events-none"
              />

              {/* ── SCANNER MOVING UP AND DOWN (Continuous Vertical Laser Beam) ── */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md">
                <div className="absolute inset-x-0 animate-scanner-laser">
                  {/* Horizontal Intense Laser Bar */}
                  <div className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee,0_0_8px_#38bdf8]" />
                  
                  {/* Volumetric Downward Light Field */}
                  <div className="h-14 bg-gradient-to-b from-cyan-400/25 via-cyan-500/8 to-transparent" />

                  {/* Left & Right Scanner Emitter Nodes */}
                  <div className="absolute -top-1 left-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <div className="absolute -top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />

                  {/* Live Scanner Altitude Tag */}
                  <div className="absolute -top-5 right-3 px-1.5 py-0.5 rounded-xs bg-slate-900/90 border border-cyan-500/50 text-[9px] font-mono text-cyan-300 font-bold shadow-md">
                    LASER SCANNER · Z-AXIS SWEEP
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Telemetry Overlay (SVG Leader Lines & Hotspots) */}
            <svg 
              viewBox="0 0 380 395" 
              className="absolute inset-0 w-full h-full pointer-events-auto"
            >
              {/* 1. CRANIAL / SLEEP HOTSPOT */}
              {(anatomyLayer === 'all' || anatomyLayer === 'nervous') && (
                <g className="cursor-pointer group" onClick={() => setSelectedOrgan('sleep')}>
                  <circle
                    cx="190" cy="50" r="7"
                    fill="#38bdf8"
                    className="transition-transform group-hover:scale-125"
                  />
                  <circle cx="190" cy="50" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.2" className="animate-ping" />
                  <polyline points="197,50 280,50 295,38" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
                  <rect x="230" y="22" width="140" height="26" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                  <text x="236" y="33" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    CRANIAL // SLEEP EEG
                  </text>
                  <text x="236" y="43" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {(latestVitals.sleep ?? 5.2).toFixed(1)}h · {(latestVitals.sleep ?? 5.2) < 6 ? 'DEFICIT' : 'OPTIMAL'}
                  </text>
                </g>
              )}

              {/* 2. MYOCARDIUM / HEART HOTSPOT */}
              {(anatomyLayer === 'all' || anatomyLayer === 'cardiovascular') && (
                <g className="cursor-pointer group" onClick={() => setSelectedOrgan('cardiac')}>
                  {hasAlert && (
                    <circle cx="194" cy="142" r="26" fill="#ef4444" fillOpacity="0.4" className="animate-pulse" />
                  )}
                  <circle
                    cx="194" cy="142" r="8"
                    fill={hasAlert ? '#ef4444' : '#10b981'}
                    className="transition-transform group-hover:scale-125 animate-heart-pulse"
                  />
                  <circle cx="194" cy="142" r="15" fill="none" stroke={hasAlert ? '#ef4444' : '#10b981'} strokeWidth="1.2" className="animate-ping" />
                  <polyline points="186,142 95,142 80,130" fill="none" stroke={hasAlert ? '#ef4444' : '#10b981'} strokeWidth="1.2" />
                  <rect x="10" y="114" width="145" height="26" rx="3" fill="#0f172a" stroke={hasAlert ? '#ef4444' : '#059669'} strokeWidth="1" />
                  <text x="16" y="125" fill={hasAlert ? '#f87171' : '#34d399'} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    HEART // RESTING HR
                  </text>
                  <text x="16" y="135" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {(latestVitals.rhr ?? 68.9).toFixed(1)} BPM {hasAlert ? '· ELEVATED' : '· NOMINAL'}
                  </text>
                </g>
              )}

              {/* 3. LUNGS / SpO2 HOTSPOT */}
              {(anatomyLayer === 'all' || anatomyLayer === 'respiratory') && (
                <g className="cursor-pointer group" onClick={() => setSelectedOrgan('spo2')}>
                  <circle cx="214" cy="130" r="6" fill="#2dd4bf" className="transition-transform group-hover:scale-125" />
                  <polyline points="220,130 280,130 295,118" fill="none" stroke="#2dd4bf" strokeWidth="1.2" />
                  <rect x="230" y="102" width="140" height="26" rx="3" fill="#0f172a" stroke="#0d9488" strokeWidth="1" />
                  <text x="236" y="113" fill="#2dd4bf" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    LUNGS // SpO₂ OX
                  </text>
                  <text x="236" y="123" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {(latestVitals.spo2 ?? 98.4).toFixed(1)}% · PaO₂ 98 mmHg
                  </text>
                </g>
              )}

              {/* 4. VISCERAL / CORE TEMP HOTSPOT */}
              {(anatomyLayer === 'all' || anatomyLayer === 'metabolic') && (
                <g className="cursor-pointer group" onClick={() => setSelectedOrgan('temp')}>
                  <circle cx="178" cy="174" r="6" fill="#f59e0b" className="transition-transform group-hover:scale-125" />
                  <polyline points="172,174 95,174 80,186" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
                  <rect x="10" y="170" width="145" height="26" rx="3" fill="#0f172a" stroke="#d97706" strokeWidth="1" />
                  <text x="16" y="181" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    VISCERAL // CORE TEMP
                  </text>
                  <text x="16" y="191" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {(latestVitals.temp ?? 36.8).toFixed(2)}°C · HOMEOSTASIS
                  </text>
                </g>
              )}

              {/* 5. VAGUS / HRR HOTSPOT */}
              {(anatomyLayer === 'all' || anatomyLayer === 'nervous' || anatomyLayer === 'cardiovascular') && (
                <g className="cursor-pointer group" onClick={() => setSelectedOrgan('hrr')}>
                  <circle cx="190" cy="208" r="6" fill="#a855f7" className="transition-transform group-hover:scale-125" />
                  <polyline points="196,208 280,208 295,220" fill="none" stroke="#a855f7" strokeWidth="1.2" />
                  <rect x="230" y="204" width="140" height="26" rx="3" fill="#0f172a" stroke="#7e22ce" strokeWidth="1" />
                  <text x="236" y="215" fill="#c084fc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    VAGUS // HR RECOVERY
                  </text>
                  <text x="236" y="225" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {(latestVitals.hrr ?? 24.5).toFixed(1)} BPM/min · RECOVERY
                  </text>
                </g>
              )}
            </svg>

          </div>

          {/* ── 360° ROTATION & SCANNER CONTROLS BAR ── */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-md border border-slate-800 text-slate-400">
            {/* Auto Spin Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border font-semibold transition cursor-pointer ${isAutoRotating
                  ? 'bg-blue-600/90 text-white border-blue-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                title="Toggle continuous 360 degree body rotation"
              >
                {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isAutoRotating ? 'Auto 360° Spin: ON' : 'Auto 360° Spin: OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRotationAngle(0)}
                className="p-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title="Reset angle to 0°"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Angle Snap Buttons */}
            <div className="flex items-center gap-1">
              {[
                { angle: 0, label: '0° (Front)' },
                { angle: 90, label: '90° (Right)' },
                { angle: 180, label: '180° (Back)' },
                { angle: 270, label: '270° (Left)' },
              ].map((preset) => (
                <button
                  key={preset.angle}
                  onClick={() => {
                    setIsAutoRotating(false);
                    setRotationAngle(preset.angle);
                  }}
                  className={`px-2 py-0.5 rounded-sm border cursor-pointer ${Math.abs(displayAngle - preset.angle) < 10
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Real-time Angle & Scanner Status */}
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                <span>YAW: {displayAngle}°</span>
              </span>
              <span className="text-emerald-400 font-bold">SCANNER: MOVING</span>
            </div>
          </div>
        </div>

        {/* Right Details Panel (Right 5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          <div className="border border-slate-200 rounded-md p-4 bg-white shadow-2xs">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-blue-700" />
                <span>Organ Biomarker Telemetry</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-sm">
                {selectedOrgan.toUpperCase()} SELECTED
              </span>
            </div>

            <div className="space-y-2">
              {/* Cardiac channel */}
              <div
                onClick={() => setSelectedOrgan('cardiac')}
                className={`p-3 rounded-md border transition cursor-pointer ${selectedOrgan === 'cardiac'
                  ? 'bg-blue-50/60 border-blue-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Heart className={`w-3.5 h-3.5 ${hasAlert ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`} />
                    Cardiovascular Myocardium (ECG)
                  </span>
                  <span className={`font-mono font-bold flex items-center gap-1.5 ${hasAlert ? 'text-rose-600' : 'text-slate-900'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {(latestVitals.rhr ?? 68.9).toFixed(1)} bpm
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {hasAlert ? 'Myocardial stress: +1.12 bpm/day drift over 4 consecutive days (+6.5 bpm above baseline).' : 'Resting cardiac output stable within normal 1.0σ personal corridor.'}
                </p>
              </div>

              {/* Sleep channel */}
              <div
                onClick={() => setSelectedOrgan('sleep')}
                className={`p-3 rounded-md border transition cursor-pointer ${selectedOrgan === 'sleep'
                  ? 'bg-blue-50/60 border-blue-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-blue-600" />
                    Cerebral Cortex & Circadian Phase
                  </span>
                  <span className={`font-mono font-bold ${hasAlert ? 'text-amber-600' : 'text-slate-900'}`}>
                    {(latestVitals.sleep ?? 5.2).toFixed(1)} hrs
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {hasAlert ? 'Slow-wave sleep deficit: -2.3 hrs below 7.5h mission baseline post EVA spacewalk.' : 'Normal REM / NREM sleep architecture maintained.'}
                </p>
              </div>

              {/* Heart rate recovery channel */}
              <div
                onClick={() => setSelectedOrgan('hrr')}
                className={`p-3 rounded-md border transition cursor-pointer ${selectedOrgan === 'hrr'
                  ? 'bg-blue-50/60 border-blue-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    Vagus Nerve Autonomic Recovery
                  </span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    {(latestVitals.hrr ?? 24.5).toFixed(1)} bpm/min
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Parasympathetic reactivation rate: evaluates autonomic nervous recovery velocity after exercise.
                </p>
              </div>

              {/* Respiratory & Core Temp Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  onClick={() => setSelectedOrgan('spo2')}
                  className={`p-2.5 rounded-md border transition cursor-pointer ${selectedOrgan === 'spo2' ? 'bg-blue-50/60 border-blue-500' : 'bg-white border-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-1 text-slate-700 text-[11px] font-semibold">
                    <Wind className="w-3 h-3 text-emerald-600" />
                    Pulmonary SpO₂
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    {(latestVitals.spo2 ?? 98.4).toFixed(1)}%
                  </div>
                </div>

                <div
                  onClick={() => setSelectedOrgan('temp')}
                  className={`p-2.5 rounded-md border transition cursor-pointer ${selectedOrgan === 'temp' ? 'bg-blue-50/60 border-blue-500' : 'bg-white border-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-1 text-slate-700 text-[11px] font-semibold">
                    <Thermometer className="w-3 h-3 text-amber-600" />
                    Core Temp
                  </div>
                  <div className="font-mono font-bold text-slate-900 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {(latestVitals.temp ?? 36.8).toFixed(2)}°C
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Directives Note */}
          <div className="p-3 bg-white border border-slate-200 rounded-md text-xs flex items-start gap-2.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-[11px] text-slate-600 leading-normal">
              Click and drag horizontally on the body to manually rotate it 360°. The biometric laser scanner automatically traverses vertically (head-to-toe) while synchronizing live physiological telemetry.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
