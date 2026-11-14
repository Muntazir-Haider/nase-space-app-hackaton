import React, { useState, useEffect, useRef } from 'react';
import { 
  Orbit, 
  Radio, 
  Wind, 
  Sun, 
  Activity, 
  Compass, 
  Cpu,
  RotateCcw,
  Play,
  Pause,
  Layers
} from 'lucide-react';
import { EnvironmentalTelemetryItem } from '../../types';

interface NASASpacecraftHologramProps {
  telemetry?: EnvironmentalTelemetryItem[];
  activeMission?: string;
  flightDay?: number;
}

export function NASASpacecraftHologram({
  telemetry = [],
  activeMission = 'ARTEMIS-III',
  flightDay = 14,
}: NASASpacecraftHologramProps) {
  const [activeTab, setActiveTab] = useState<'schematic' | 'orbit'>('schematic');
  const [selectedZone, setSelectedZone] = useState<string>('airlock');

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
        setRotationAngle((prev) => (prev + 0.35) % 360);
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

  // Base readings from props
  const baseCo2 = telemetry.find(t => t.parameter_name === 'CABIN_CO2_PPM')?.value || 3450;
  const basePressure = telemetry.find(t => t.parameter_name === 'CABIN_PRESSURE_KPA')?.value || 101.3;
  const baseRad = telemetry.find(t => t.parameter_name === 'IONIZING_RADIATION')?.value || 295;

  // ── Live Fluctuating Environmental Telemetry (~450ms stream) ──
  const [liveCo2, setLiveCo2] = useState<number>(baseCo2);
  const [livePressure, setLivePressure] = useState<number>(basePressure);
  const [liveRad, setLiveRad] = useState<number>(baseRad);

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      // CO2 scrubber micro-drift
      const co2Drift = Math.sin(tick * 0.25) * 12 + (Math.random() - 0.5) * 8;
      setLiveCo2(Math.round(baseCo2 + co2Drift));

      // Cabin barometric micro-variation
      const presDrift = Math.sin(tick * 0.15) * 0.04 + (Math.random() - 0.5) * 0.02;
      setLivePressure(Math.round((basePressure + presDrift) * 10) / 10);

      // Deep space ionizing radiation detector jitter
      const radDrift = Math.sin(tick * 0.3) * 3 + (Math.random() - 0.5) * 2;
      setLiveRad(Math.round(baseRad + radDrift));
    }, 450);

    return () => clearInterval(interval);
  }, [baseCo2, basePressure, baseRad]);

  const isCo2Elevated = liveCo2 > 2500;
  const displayAngle = Math.round(rotationAngle);

  return (
    <div className="bg-white rounded-md border border-slate-300 shadow-2xs overflow-hidden flex flex-col font-sans select-none">
      
      {/* ── Header Bar ── */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#0b3d91] flex items-center justify-center text-white shadow-xs">
            <Orbit className="w-4 h-4 animate-radar-sweep" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 tracking-wider uppercase">
                360° Real 3D NASA Orion MPC-V · {activeMission} HUD
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-blue-50 text-[#0b3d91] font-bold border border-blue-200">
                FLIGHT DAY {flightDay}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              Autonomous deep-space life support telemetry & Deep Space Network (DSN) uplink
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white p-1 rounded-md border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('schematic')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold transition cursor-pointer ${
              activeTab === 'schematic'
                ? 'bg-[#0b3d91] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3D Spacecraft Schematic</span>
          </button>
          <button
            onClick={() => setActiveTab('orbit')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold transition cursor-pointer ${
              activeTab === 'orbit'
                ? 'bg-[#0b3d91] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Lunar Orbit Trajectory</span>
          </button>
        </div>
      </div>

      {/* ── Main HUD Display Area ── */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch bg-slate-950">
        
        {/* Left Interactive 3D Canvas / Hologram (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-md p-4 relative overflow-hidden flex flex-col items-center justify-between min-h-[460px] border border-slate-800 shadow-inner">
          
          {/* Subtle Grid and Radar Rings */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(56,189,248,0.4) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* DSN Comms Telemetry Bar */}
          <div className="w-full flex items-center justify-between z-10 bg-slate-950/80 px-3 py-1.5 rounded-md border border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold tracking-wider">
                DSN DOWNLINK: ACTIVE · CANBERRA ANTENNA 70M
              </span>
            </div>
            <div className="text-slate-400">
              LATENCY: 22m 14s (STORE & FORWARD)
            </div>
          </div>

          {activeTab === 'schematic' ? (
            /* ── 360-DEGREE REAL 3D ORION MPC-V STAGE ── */
            <div 
              className="relative w-full max-w-2xl my-auto flex items-center justify-center z-10 cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              title="Click and drag horizontally to spin NASA Orion spacecraft 360 degrees"
            >
              {/* Stationary Box Frame (Remains stable with solid corners; does NOT rotate) */}
              <div 
                className="relative w-full h-[330px] flex items-center justify-center overflow-hidden rounded-md border border-cyan-500/25 bg-black/75 shadow-[0_0_35px_rgba(6,182,212,0.15)]"
              >
                {/* 3D Depth Orbit Platform Glow */}
                <div 
                  className="absolute bottom-2 inset-x-12 h-8 rounded-full bg-cyan-500/20 blur-md pointer-events-none"
                />

                {/* Radar Tracking Ellipses */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
                  <ellipse cx="50%" cy="50%" rx="45%" ry="22%" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                  <ellipse cx="50%" cy="50%" rx="30%" ry="14%" fill="none" stroke="#38bdf8" strokeWidth="1" />
                </svg>

                {/* 3D Rotational Spacecraft Wrapper (ONLY the Orion spacecraft rotates) */}
                <div
                  className="w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `perspective(1000px) rotateY(${rotationAngle}deg)`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Authentic Real 3D NASA Orion MPC-V Spacecraft Transparent Render */}
                  <img
                    src="/real_orion_spacecraft_transparent.png"
                    alt="Real 3D NASA Orion MPC-V Deep Space Spacecraft"
                    className="h-[310px] w-auto max-w-[95%] object-contain filter contrast-120 brightness-110 pointer-events-none select-none drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                  />
                </div>

                {/* ── Continuous Laser Radar Scanner Sweep across the Hull ── */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md">
                  <div className="absolute inset-x-0 animate-scanner-laser">
                    <div className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee,0_0_8px_#38bdf8]" />
                    <div className="h-12 bg-gradient-to-b from-cyan-400/20 via-cyan-500/5 to-transparent" />
                    <div className="absolute -top-1 left-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    <div className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    <div className="absolute -top-5 right-3 px-1.5 py-0.5 rounded-xs bg-slate-900/90 border border-cyan-500/50 text-[9px] font-mono text-cyan-300 font-bold shadow-md">
                      HULL RADAR SCANNER ACTIVE
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Telemetry Overlay (SVG Leader Lines & Hotspots) */}
              <svg 
                viewBox="0 0 540 330" 
                className="absolute inset-0 w-full h-full pointer-events-auto"
              >
                {/* 1. AIRLOCK & LIFE SUPPORT // CO2 HOTSPOT */}
                <g className="cursor-pointer group" onClick={() => setSelectedZone('airlock')}>
                  <circle 
                    cx="300" cy="90" r="7" 
                    fill={isCo2Elevated ? '#ef4444' : '#10b981'} 
                    className="transition-transform group-hover:scale-125"
                  />
                  <circle cx="300" cy="90" r="14" fill="none" stroke={isCo2Elevated ? '#ef4444' : '#10b981'} strokeWidth="1.2" className="animate-ping" />
                  <polyline points="300,83 300,48 240,48" fill="none" stroke={isCo2Elevated ? '#ef4444' : '#10b981'} strokeWidth="1.2" />
                  <rect x="70" y="34" width="165" height="26" rx="3" fill="#0f172a" stroke={isCo2Elevated ? '#ef4444' : '#059669'} strokeWidth="1" />
                  <text x="76" y="45" fill={isCo2Elevated ? '#f87171' : '#34d399'} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    AIRLOCK // CO₂ SCRUBBER
                  </text>
                  <text x="76" y="55" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    CO₂: {liveCo2} ppm {isCo2Elevated ? '· ADVISORY' : '· NOMINAL'}
                  </text>
                </g>

                {/* 2. CREW COMMAND MODULE // CABIN PRESSURE HOTSPOT */}
                <g className="cursor-pointer group" onClick={() => setSelectedZone('cabin')}>
                  <circle cx="380" cy="140" r="6" fill="#38bdf8" className="transition-transform group-hover:scale-125" />
                  <polyline points="386,140 450,140 470,125" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
                  <rect x="375" y="105" width="155" height="26" rx="3" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                  <text x="381" y="116" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    CABIN // COMMAND MODULE
                  </text>
                  <text x="381" y="126" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    CABIN: {livePressure} kPa · O₂/N₂
                  </text>
                </g>

                {/* 3. RADIATION SHIELDING // DOSIMETRY HOTSPOT */}
                <g className="cursor-pointer group" onClick={() => setSelectedZone('radiation')}>
                  <circle cx="220" cy="200" r="6" fill="#a855f7" className="transition-transform group-hover:scale-125" />
                  <polyline points="220,206 220,245 280,245" fill="none" stroke="#a855f7" strokeWidth="1.2" />
                  <rect x="285" y="232" width="160" height="26" rx="3" fill="#0f172a" stroke="#7e22ce" strokeWidth="1" />
                  <text x="291" y="243" fill="#c084fc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    DOSIMETRY // IONIZING RAD
                  </text>
                  <text x="291" y="253" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    RAD: {liveRad} μSv/day · ALARA
                  </text>
                </g>

                {/* 4. PROPULSION // OMS ENGINE BELL */}
                <g className="cursor-pointer group">
                  <circle cx="120" cy="165" r="5" fill="#f59e0b" className="transition-transform group-hover:scale-125" />
                  <polyline points="120,170 120,210 60,210" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
                  <rect x="10" y="197" width="145" height="26" rx="3" fill="#0f172a" stroke="#d97706" strokeWidth="1" />
                  <text x="16" y="208" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    PROPULSION // OMS ENGINE
                  </text>
                  <text x="16" y="218" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    26.7 kN · 316s ISP READY
                  </text>
                </g>
              </svg>
            </div>
          ) : (
            /* Lunar Transfer Orbit (Earth to Moon Trajectory) */
            <div className="relative w-full max-w-lg my-auto flex flex-col items-center justify-center">
              <svg viewBox="0 0 540 280" className="w-full h-auto">
                {/* Earth at Left */}
                <g>
                  <circle cx="80" cy="140" r="42" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                  <circle cx="80" cy="140" r="42" fill="none" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="6" className="animate-pulse" />
                  <path d="M 65 125 Q 75 115 85 130 Q 95 145 75 160 Z" fill="#10b981" opacity="0.6" />
                  <text x="80" y="195" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    EARTH (DSN Uplink)
                  </text>
                </g>

                {/* Moon at Right */}
                <g>
                  <circle cx="450" cy="140" r="28" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                  <circle cx="440" cy="132" r="6" fill="#334155" />
                  <circle cx="458" cy="146" r="4" fill="#334155" />
                  <circle cx="446" cy="152" r="5" fill="#334155" />
                  <circle cx="450" cy="164" r="3" fill="#ef4444" className="animate-ping" />
                  <text x="450" y="185" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    LUNAR SOUTH POLE
                  </text>
                </g>

                {/* Trans-Lunar Injection (TLI) Trajectory Arc */}
                <path 
                  d="M 122 140 C 200 40, 360 40, 435 125 C 475 170, 435 220, 380 200 C 260 160, 180 220, 118 160" 
                  fill="none" 
                  stroke="#38bdf8" 
                  strokeWidth="2.5" 
                  strokeDasharray="6 4"
                />

                {/* Spacecraft Active Position on Trajectory */}
                <g transform="translate(350, 68)">
                  <circle cx="0" cy="0" r="12" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping-ring" />
                  <polygon points="0,-8 10,8 -10,8" fill="#f8fafc" stroke="#0b3d91" strokeWidth="1" />
                  <line x1="0" y1="0" x2="-270" y2="72" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                  <rect x="15" y="-14" width="130" height="22" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="80" y="1" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ORION: DAY {flightDay} OF 14
                  </text>
                </g>
              </svg>
            </div>
          )}

          {/* ── 360° ROTATION & SCANNER CONTROLS BAR ── */}
          {activeTab === 'schematic' && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono bg-slate-950 p-2 rounded-md border border-slate-800 text-slate-400 z-10">
              {/* Auto Spin Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border font-semibold transition cursor-pointer ${
                    isAutoRotating
                      ? 'bg-blue-600/90 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle continuous 360 degree spacecraft rotation"
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
                  { angle: 0,   label: '0° (Profile)' },
                  { angle: 90,  label: '90° (Command Nose)' },
                  { angle: 180, label: '180° (Port Wings)' },
                  { angle: 270, label: '270° (Aft Thruster)' },
                ].map((preset) => (
                  <button
                    key={preset.angle}
                    onClick={() => {
                      setIsAutoRotating(false);
                      setRotationAngle(preset.angle);
                    }}
                    className={`px-2 py-0.5 rounded-sm border cursor-pointer ${
                      Math.abs(displayAngle - preset.angle) < 10
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Real-time Angle & Radar Status */}
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>YAW: {displayAngle}°</span>
                </span>
                <span className="text-emerald-400 font-bold">RADAR: ACTIVE</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Info Box / Live Habitat Zone Breakdown (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3">
          <div className="border border-slate-200 rounded-md p-4 bg-white shadow-2xs">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0b3d91]" />
                <span>Life Support Telemetry</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                isCo2Elevated 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {isCo2Elevated ? 'ADVISORY ELEVATED' : 'NOMINAL FLIGHT'}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* CO2 metric */}
              <div 
                onClick={() => setSelectedZone('airlock')}
                className={`p-3 rounded-md border transition cursor-pointer ${
                  selectedZone === 'airlock' 
                    ? 'bg-blue-50/60 border-blue-500 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-blue-600" />
                    Airlock CO₂ Concentration
                  </span>
                  <span className={`font-mono font-bold flex items-center gap-1 ${
                    isCo2Elevated ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isCo2Elevated ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                    {liveCo2} ppm
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCo2Elevated ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (liveCo2 / 5000) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  NASA flight limit: 2,500 ppm · Active scrubber cycling post-EVA
                </p>
              </div>

              {/* Cabin Pressure */}
              <div 
                onClick={() => setSelectedZone('cabin')}
                className={`p-3 rounded-md border transition cursor-pointer ${
                  selectedZone === 'cabin' 
                    ? 'bg-blue-50/60 border-blue-500 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Atmospheric Pressure
                  </span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    {livePressure} kPa
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '99%' }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Nominal sea-level oxygen-nitrogen mix (101.3 kPa)</p>
              </div>

              {/* Radiation Dosimetry */}
              <div 
                onClick={() => setSelectedZone('radiation')}
                className={`p-3 rounded-md border transition cursor-pointer ${
                  selectedZone === 'radiation' 
                    ? 'bg-blue-50/60 border-blue-500 shadow-2xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-purple-600" />
                    Galactic Cosmic Radiation
                  </span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    {liveRad} μSv/day
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: '42%' }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Safe within NASA ALARA 30-day cumulative limits</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-md flex items-center gap-2.5 text-xs text-slate-700 shadow-2xs">
            <Radio className="w-4 h-4 text-[#0b3d91] shrink-0" />
            <span className="text-[11px] text-slate-600">
              Orion MPC-V operates in deep space store-and-forward mode. Drag horizontally to rotate the 3D spacecraft 360°.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
