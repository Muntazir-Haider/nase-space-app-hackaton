import { useState } from 'react';
import { getAstronautVisuals } from '../../utils/astronautAssets';
import { User } from 'lucide-react';

interface AstronautAvatarProps {
  callsign: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hasAlert?: boolean;
  className?: string;
}

export function AstronautAvatar({
  callsign,
  name,
  size = 'md',
  hasAlert = false,
  className = '',
}: AstronautAvatarProps) {
  const [imageError, setImageError] = useState<boolean>(false);
  const visuals = getAstronautVisuals(callsign);

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-11 h-11 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-base',
  }[size];

  const ringClasses = hasAlert
    ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-white'
    : 'ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-white';

  const initials = (name || callsign)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${sizeClasses} rounded-full overflow-hidden bg-slate-900 border border-black/[0.1] shadow-md flex items-center justify-center font-mono font-bold text-white ${ringClasses}`}
      >
        {!imageError && visuals.photoUrl ? (
          <img
            src={visuals.photoUrl}
            alt={name || callsign}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0b3d91] to-slate-900 flex items-center justify-center text-white">
            {initials ? initials : <User className="w-4 h-4 text-white" />}
          </div>
        )}
      </div>

      {/* Live Status indicator dot */}
      <span
        className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${
          size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' || size === 'xl' ? 'w-4 h-4' : 'w-3 h-3'
        } ${hasAlert ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
        title={hasAlert ? 'Active Physiological Alert' : 'Nominal Homeostatic Status'}
      />
    </div>
  );
}
