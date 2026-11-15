import React, { useState, useEffect, useRef } from 'react';
import { 
  Orbit, 
  Radio, 
  Wind, 
  Sun, 
  Activity, 
  Compass, 
  RotateCcw, 
  Play, 
  Pause, 
  Layers, 
  Gauge
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
  const [selectedZone, setSelectedZone] = useState<'airlock' | 'cabin' | 'radiation' | 'propulsion'>('airlock');

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
      const co2Drift = Math.sin(tick * 0.25) * 12 + (Math.random() - 0.5) * 8;
      setLiveCo2(Math.round(baseCo2 + co2Drift));

      const presDrift = Math.sin(tick * 0.15) * 0.04 + (Math.random() - 0.5) * 0.02;
      setLivePressure(Math.round((basePressure + presDrift) * 10) / 10);

      const radDrift = Math.sin(tick * 0.3) * 3 + (Math.random() - 0.5) * 2;
      setLiveRad(Math.round(baseRad + radDrift));
    }, 450);

    return () => clearInterval(interval);
  }, [baseCo2, basePressure, baseRad]);

  const isCo2Elevated = liveCo2 > 2500;
  const displayAngle = Math.round(rotationAngle);

  return (
    <div className="bg-white rounded-2xl border border-black/[0.09] shadow-[0_10px_30px_-4px_rgba(0,0,0,0.08),0_3px_10px_-1px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col font-sans select-none">
      
      {/* ── Apple-Grade Hardware Card Header ── */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0b3d91] flex items-center justify-center text-white shadow-xs shrink-0">
            <Orbit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="font-extrabold text-xs sm:text-sm text-slate-950 tracking-tight uppercase break-words sm:whitespace-nowrap">
                NASA Orion MPC-V · 3D Flight Telemetry
              </span>
              <span className="text-[10px] font-mono px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0b3d91] font-bold border border-blue-200 whitespace-nowrap shrink-0">
                {activeMission} · DAY {flightDay}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 font-semibold mt-0.5 truncate">
              Deep Space Vehicle Systems & Cabin Environmental Telemetry
            </div>
          </div>
        </div>

        {/* Status Pill & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Real DSN Carrier Status */}
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-2xs whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">DSN: CANBERRA 70M ACTIVE</span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#f4f5f8] p-1 rounded-xl border border-black/[0.05] text-xs shrink-0 whitespace-nowrap">
            <button
              onClick={() => setActiveTab('schematic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                activeTab === 'schematic'
                  ? 'bg-white text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-[#0b3d91]" />
              <span>3D Vehicle</span>
            </button>
            <button
              onClick={() => setActiveTab('orbit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer active:scale-[0.98] whitespace-nowrap ${
                activeTab === 'orbit'
                  ? 'bg-white text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#0b3d91]" />
              <span>Lunar Trajectory</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Display Grid ── */}
      <div className="p-4 sm:p-6 grid grid-cols-1 2xl:grid-cols-12 gap-6 items-stretch bg-[#fbfbfd]">
        
        {/* Left Column: 360-Degree 3D CAD Stage (8 cols on 2xl, full width below) */}
        <div className="2xl:col-span-8 bg-[#090d16] rounded-2xl p-3 sm:p-5 relative overflow-hidden flex flex-col items-center justify-between min-h-[350px] sm:min-h-[460px] border border-black/[0.15] shadow-lg w-full min-w-0">
          
          {/* Stage Header Info Bar */}
          <div className="w-full flex flex-wrap items-center justify-between z-10 bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/10 text-xs font-mono text-slate-300 gap-2">
            <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
              <span className="text-white font-bold tracking-wider text-[11px] sm:text-xs">
                3D CAD MODEL · YAW: {displayAngle}°
              </span>
            </div>
            
            {/* Subsystem Focus Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {[
                { id: 'airlock', label: 'ECLSS Hatch', angle: 0 },
                { id: 'cabin', label: 'Crew Module', angle: 90 },
                { id: 'radiation', label: 'Service Module', angle: 180 },
                { id: 'propulsion', label: 'Solar Arrays', angle: 270 },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedZone(sub.id as any);
                    setIsAutoRotating(false);
                    setRotationAngle(sub.angle);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    selectedZone === sub.id
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <div className="text-slate-400 text-[10px] sm:text-[11px] whitespace-nowrap shrink-0">
              LATENCY: 22m 14s
            </div>
          </div>

          {activeTab === 'schematic' ? (
            /* ── 360-DEGREE REAL 3D ORION MPC-V STAGE ── */
            <div 
              className="relative w-full my-auto flex items-center justify-center z-10 cursor-grab active:cursor-grabbing select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              title="Click and drag horizontally to spin NASA Orion spacecraft 360 degrees"
            >
              {/* Stationary Viewport Frame */}
              <div className="relative w-full h-[260px] sm:h-[360px] flex items-center justify-center overflow-hidden">
                {/* 3D Rotational Spacecraft Wrapper */}
                <div
                  className="w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `perspective(1000px) rotateY(${rotationAngle}deg)`,
                    transition: isDraggingRef.current ? 'none' : 'transform 0.1s ease-out',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Authentic Real 3D NASA Orion Spacecraft Render */}
                  <img
                    src="./real_orion_spacecraft_transparent.png"
                    alt="NASA Orion MPC-V 3D Deep Space Spacecraft"
                    className="h-[220px] sm:h-[320px] w-auto max-w-[95%] object-contain filter contrast-115 brightness-105 pointer-events-none select-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                  />
                </div>

                {/* Precision Interactive Subsystem Pins (Clean, Solid Apple Hardware Style) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Pin 1: ECLSS Hatch / CO2 */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone('airlock');
                    }}
                    className={`absolute top-[28%] left-[52%] pointer-events-auto cursor-pointer transition-all duration-200 group flex items-center gap-1.5 ${
                      selectedZone === 'airlock' ? 'scale-110 z-20' : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-md ${
                      isCo2Elevated ? 'bg-rose-500 ring-4 ring-rose-500/30' : 'bg-emerald-500 ring-4 ring-emerald-500/30'
                    }`}>
                      1
                    </span>
                    <span className="bg-slate-900/95 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border border-white/20 shadow-md backdrop-blur-sm">
                      ECLSS Hatch: {liveCo2} ppm
                    </span>
                  </div>

                  {/* Pin 2: Service Module Radiation */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone('radiation');
                    }}
                    className={`absolute bottom-[28%] left-[40%] pointer-events-auto cursor-pointer transition-all duration-200 group flex items-center gap-1.5 ${
                      selectedZone === 'radiation' ? 'scale-110 z-20' : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-500/30 flex items-center justify-center text-[9px] font-bold text-white shadow-md">
                      2
                    </span>
                    <span className="bg-slate-900/95 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border border-white/20 shadow-md backdrop-blur-sm">
                      ESM Shield: {liveRad} μSv/d
                    </span>
                  </div>

                  {/* Pin 3: Crew Cabin Pressure */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone('cabin');
                    }}
                    className={`absolute bottom-[28%] right-[32%] pointer-events-auto cursor-pointer transition-all duration-200 group flex items-center gap-1.5 ${
                      selectedZone === 'cabin' ? 'scale-110 z-20' : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30 flex items-center justify-center text-[9px] font-bold text-white shadow-md">
                      3
                    </span>
                    <span className="bg-slate-900/95 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border border-white/20 shadow-md backdrop-blur-sm">
                      Cabin: {livePressure.toFixed(1)} kPa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Lunar Orbit Trajectory View */
            <div className="relative w-full max-w-lg my-auto flex flex-col items-center justify-center p-4">
              <svg viewBox="0 0 540 280" className="w-full h-auto">
                {/* Earth at Left */}
                <g>
                  <circle cx="80" cy="140" r="42" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                  <circle cx="80" cy="140" r="42" fill="none" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="6" className="animate-pulse" />
                  <path d="M 65 125 Q 75 115 85 130 Q 95 145 75 160 Z" fill="#10b981" opacity="0.6" />
                  <text x="80" y="198" fill="#cbd5e1" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
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
                  <text x="450" y="188" fill="#cbd5e1" fontSize="11" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                    LUNAR SOUTH POLE
                  </text>
                </g>

                {/* Trajectory Arc */}
                <path 
                  d="M 122 140 C 200 40, 360 40, 435 125 C 475 170, 435 220, 380 200 C 260 160, 180 220, 118 160" 
                  fill="none" 
                  stroke="#38bdf8" 
                  strokeWidth="2.5" 
                  strokeDasharray="6 4"
                />

                {/* Spacecraft Marker */}
                <g transform="translate(350, 68)">
                  <circle cx="0" cy="0" r="12" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping-ring" />
                  <polygon points="0,-8 10,8 -10,8" fill="#f8fafc" stroke="#0b3d91" strokeWidth="1" />
                  <rect x="15" y="-14" width="130" height="22" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="80" y="1" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ORION: DAY {flightDay} OF 14
                  </text>
                </g>
              </svg>
            </div>
          )}

          {/* ── Rotation Controls Toolbar ── */}
          {activeTab === 'schematic' && (
            <div className="w-full flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs font-mono bg-slate-900/90 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white/10 text-slate-300 z-10">
              {/* Play / Pause Rotation */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-semibold transition cursor-pointer active:scale-[0.98] text-[11px] sm:text-xs ${
                    isAutoRotating
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle continuous 360 degree rotation"
                >
                  {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isAutoRotating ? 'Auto Spin: ON' : 'Auto Spin: OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRotationAngle(0)}
                  className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer active:scale-[0.98]"
                  title="Reset Yaw angle to 0°"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Angle Presets */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                {[
                  { angle: 0,   label: '0° Profile' },
                  { angle: 90,  label: '90° Nose' },
                  { angle: 180, label: '180° Port' },
                  { angle: 270, label: '270° Aft' },
                ].map((preset) => (
                  <button
                    key={preset.angle}
                    onClick={() => {
                      setIsAutoRotating(false);
                      setRotationAngle(preset.angle);
                    }}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs cursor-pointer active:scale-[0.98] transition font-semibold ${
                      Math.abs(displayAngle - preset.angle) < 10
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 font-bold text-[11px] sm:text-xs">
                <span className="text-cyan-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>YAW {displayAngle}°</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Solid Physical Telemetry Breakdown Cards (4 cols) */}
        {/* Right Column: Solid Physical Telemetry Breakdown Cards (4 cols on 2xl, full responsive stack below) */}
        <div className="2xl:col-span-4 flex flex-col justify-between gap-4 w-full min-w-0">
          <div className="bg-white border border-black/[0.08] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-3 gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 min-w-0 truncate">
                <Layers className="w-4 h-4 text-[#0b3d91] shrink-0" />
                <span className="truncate">Life Support Subsystems</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono whitespace-nowrap shrink-0 ${
                isCo2Elevated 
                  ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {isCo2Elevated ? 'ADVISORY' : 'NOMINAL'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 2xl:grid-cols-1 gap-3.5">
              {/* Card 1: CO2 */}
              <div 
                onClick={() => setSelectedZone('airlock')}
                className={`p-4 rounded-xl border transition cursor-pointer active:scale-[0.99] ${
                  selectedZone === 'airlock' 
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/20' 
                    : 'bg-[#f4f5f8] border-black/[0.06] hover:border-black/[0.12]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] truncate">
                    <Wind className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Airlock CO₂</span>
                  </span>
                  <span className={`font-mono font-extrabold text-sm flex items-center gap-1 shrink-0 ${
                    isCo2Elevated ? 'text-rose-600' : 'text-slate-950'
                  }`}>
                    {liveCo2} ppm
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden my-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCo2Elevated ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (liveCo2 / 5000) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-semibold gap-1">
                  <span>Limit: 2,500 ppm</span>
                  <span className="font-mono text-slate-700">Bed B: Active</span>
                </div>
              </div>

              {/* Card 2: Cabin Atmospheric Pressure */}
              <div 
                onClick={() => setSelectedZone('cabin')}
                className={`p-4 rounded-xl border transition cursor-pointer active:scale-[0.99] ${
                  selectedZone === 'cabin' 
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/20' 
                    : 'bg-[#f4f5f8] border-black/[0.06] hover:border-black/[0.12]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] truncate">
                    <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Cabin Pressure</span>
                  </span>
                  <span className="font-mono font-extrabold text-sm text-slate-950 shrink-0">
                    {livePressure.toFixed(1)} kPa
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden my-2">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '99%' }} />
                </div>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-semibold gap-1">
                  <span>Nominal: 101.3 kPa</span>
                  <span className="font-mono text-slate-700">O₂: 21.2 kPa</span>
                </div>
              </div>

              {/* Card 3: Radiation Dosimetry */}
              <div 
                onClick={() => setSelectedZone('radiation')}
                className={`p-4 rounded-xl border transition cursor-pointer active:scale-[0.99] ${
                  selectedZone === 'radiation' 
                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/20' 
                    : 'bg-[#f4f5f8] border-black/[0.06] hover:border-black/[0.12]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] truncate">
                    <Sun className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>Galactic Rad</span>
                  </span>
                  <span className="font-mono font-extrabold text-sm text-slate-950 shrink-0">
                    {liveRad} μSv/d
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden my-2">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: '42%' }} />
                </div>
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-semibold gap-1">
                  <span>ALARA: Safe</span>
                  <span className="font-mono text-purple-700">14.2 mSv</span>
                </div>
              </div>
            </div>
          </div>

          {/* DSN Downlink Solid Box */}
          <div className="p-4 bg-[#f4f5f8] border border-black/[0.06] rounded-2xl flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 whitespace-nowrap">DSN Telemetry Downlink</div>
                <div className="text-[11px] text-slate-600 font-semibold truncate">Store & Forward · 360° Drag Supported</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 whitespace-nowrap">
              LOCKED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
