import { useState, useEffect, useRef } from 'react';
import { FastForward, Rocket, Gauge, Compass } from 'lucide-react';

interface CinematicLaunchSequenceProps {
  onComplete: () => void;
  callsign: string;
}

export function CinematicLaunchSequence({ onComplete, callsign }: CinematicLaunchSequenceProps) {
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasFinishedRef = useRef<boolean>(false);

  const finishSequence = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 2.0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Launch video playback warning:', err);
            setIsPlaying(true);
          });
      }
    }

    // Safety fallback: complete after 5.2 seconds in all circumstances
    const fallbackTimer = setTimeout(() => {
      finishSequence();
    }, 5200);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Update progress directly from video timeupdate
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const cur = video.currentTime;
    const dur = video.duration || 10;
    const targetEnd = dur * 0.90;
    const currentPct = Math.min(100, Math.max(0, (cur / targetEnd) * 100));
    setProgressPercent(currentPct);

    if (cur >= targetEnd) {
      finishSequence();
    }
  };

  // Synthetic progress fallback if video fails to play
  useEffect(() => {
    if (isPlaying && !videoFailed) return;

    const startTime = Date.now();
    const duration = 4000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgressPercent(pct);
      if (elapsed >= duration) {
        clearInterval(interval);
        finishSequence();
      }
    }, 35);

    return () => clearInterval(interval);
  }, [isPlaying, videoFailed]);

  // Dynamic telemetry calculations as the rocket ascends
  const altitudeKm = Math.round((Math.pow(progressPercent / 100, 1.8) * 52.4) * 10) / 10;
  const velocityKmh = Math.round(Math.pow(progressPercent / 100, 1.5) * 6200);

  // Flight phase label
  const flightPhase = 
    progressPercent < 20 ? 'T+ 00:02 · MAIN ENGINE IGNITION & LIFTOFF' :
    progressPercent < 50 ? 'T+ 00:12 · TOWER CLEARED · TRANSONIC ACCELERATION' :
    progressPercent < 80 ? 'T+ 00:28 · MAX-Q DYNAMIC PRESSURE · STAGE 1 FLIGHT' :
    'T+ 00:46 · STRATOSPHERE PENETRATION · TELEMETRY LOCK';

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none animate-fadeIn font-sans">
      
      {/* ── Instant Fallback Poster Background (Prevents any black flash) ── */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none filter contrast-125 brightness-105"
        style={{ backgroundImage: 'url(./launch_poster.jpg)' }}
      />

      {/* ── Background Video Layer (High-Speed Flight 2.0x, Preloaded) ── */}
      {!videoFailed ? (
        <video
          ref={videoRef}
          src="./launch_cinematic.mp4"
          poster="./launch_poster.jpg"
          preload="auto"
          autoPlay
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onPlaying={() => setIsPlaying(true)}
          onEnded={finishSequence}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none filter contrast-125 brightness-105 transition-transform duration-1000 scale-105"
          onError={() => {
            setVideoFailed(true);
            setIsPlaying(false);
          }}
        />
      ) : null}

      {/* Atmospheric Space Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 100%)',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.85)'
        }} 
      />

      {/* ── Cinematic HUD Overlay ── */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 z-20 pointer-events-auto">
        
        {/* Top Minimal Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-md bg-black/60 backdrop-blur-xl border border-white/20 shadow-lg">
            <Rocket className="w-4 h-4 text-sky-400 animate-pulse" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-white">
                ORBITAL ASCENT // {callsign || 'ARTEMIS'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                STAGE 1 ACTIVE
              </span>
            </div>
          </div>

          {/* Quick Skip Button */}
          <button
            onClick={finishSequence}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono font-semibold transition backdrop-blur-md cursor-pointer shadow-md"
          >
            <span>Skip Launch</span>
            <FastForward className="w-3.5 h-3.5 text-sky-300" />
          </button>
        </div>

        {/* Live In-Flight Telemetry Readout (Mid-Right) */}
        <div className="self-end mr-4 hidden sm:flex flex-col gap-2 p-3 rounded-md bg-black/60 backdrop-blur-xl border border-white/20 shadow-xl font-mono text-xs text-white min-w-[210px]">
          <div className="text-[10px] text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-white/15 pb-1">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>Flight Dynamics</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">ALTITUDE:</span>
            <span className="font-bold text-sky-200">{altitudeKm.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">VELOCITY:</span>
            <span className="font-bold text-emerald-400">{velocityKmh.toLocaleString()} km/h</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">DOWNRANGE:</span>
            <span className="font-bold text-amber-300">{(altitudeKm * 0.45).toFixed(1)} km</span>
          </div>
        </div>

        {/* Bottom Fast Sleek Progress & Phase Bar */}
        <div className="max-w-lg mx-auto w-full pb-4">
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 p-3.5 rounded-md shadow-2xl">
            <div className="flex justify-between items-center text-[11px] font-mono mb-2 text-white/90">
              <span className="tracking-wider uppercase font-semibold text-sky-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{flightPhase}</span>
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {Math.floor(progressPercent)}%
              </span>
            </div>
            <div className="w-full bg-white/15 h-2 rounded-sm overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 h-full rounded-sm transition-all duration-75 ease-out shadow-[0_0_15px_rgba(56,189,248,0.8)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
