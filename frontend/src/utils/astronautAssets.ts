// Maps astronaut callsigns or IDs to official NASA portraits, flags, and mission patches

export interface AstronautVisualProfile {
  photoUrl: string;
  badgeUrl?: string;
  roleIcon: string;
  flagCode: string;
  flightSuitColor: string;
}

export function getAstronautVisuals(callsign: string): AstronautVisualProfile {
  const norm = (callsign || '').toUpperCase();

  if (norm.includes('01') || norm.includes('VANCE')) {
    return {
      photoUrl: '/astronauts/elena_rostova.jpg',
      badgeUrl: '/artemis_mission_patch.svg',
      roleIcon: 'CommandLead',
      flagCode: '🇺🇸',
      flightSuitColor: 'border-blue-500',
    };
  }

  if (norm.includes('02') || norm.includes('THORNE') || norm.includes('VANCE')) {
    return {
      photoUrl: '/astronauts/marcus_vance.jpg',
      badgeUrl: '/artemis_mission_patch.svg',
      roleIcon: 'PilotSystems',
      flagCode: '🇺🇸',
      flightSuitColor: 'border-indigo-500',
    };
  }

  // ARTEMIS-03 / Sarah Chen
  return {
    photoUrl: '/astronauts/sarah_chen.jpg',
    badgeUrl: '/artemis_mission_patch.svg',
    roleIcon: 'BioSpecialist',
    flagCode: '🇺🇸',
    flightSuitColor: 'border-emerald-500',
  };
}
