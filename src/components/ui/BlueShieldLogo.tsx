import React, { useState } from 'react';
import logoAsset from '../../assets/images/blueshield_official_logo_1790404341619.jpg';

interface BlueShieldLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  theme?: 'dark' | 'light';
  subtext?: string;
  className?: string;
}

export const BlueShieldLogo: React.FC<BlueShieldLogoProps> = ({
  size = 'md',
  showWordmark = true,
  theme = 'dark',
  subtext,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const iconDimensions = {
    sm: { w: 30, h: 30, rounded: 'rounded-md' },
    md: { w: 38, h: 38, rounded: 'rounded-lg' },
    lg: { w: 52, h: 52, rounded: 'rounded-xl' },
    xl: { w: 68, h: 68, rounded: 'rounded-2xl' },
  };

  const textStyles = {
    sm: { title: 'text-sm font-bold', sub: 'text-[9px]' },
    md: { title: 'text-base font-bold', sub: 'text-[10px]' },
    lg: { title: 'text-xl font-bold', sub: 'text-xs' },
    xl: { title: 'text-2xl font-bold', sub: 'text-xs' },
  };

  const { w, h, rounded } = iconDimensions[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official BlueShield Emblem (Matches User Insignia: Rolling Wave, Mobile Geopin, Verification Crest, Volunteer Check, Community Cleanup) */}
      <div
        className={`relative shrink-0 flex items-center justify-center overflow-hidden shadow-xs ring-1 ring-teal-400/40 bg-white ${rounded}`}
        style={{ width: `${w}px`, height: `${h}px` }}
      >
        {!imageError ? (
          <img
            src={logoAsset}
            alt="BlueShield Coastal Marine Platform Official Logo"
            className="w-full h-full object-contain p-0.5"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-0.5"
          >
            {/* Outer Shield Shell */}
            <path
              d="M50 6C20 6 12 20 12 36C12 66 32 86 50 94C68 86 88 66 88 36C88 20 80 6 50 6Z"
              fill="#0F3866"
              stroke="#00A3E0"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Dynamic Wave Crest at Top */}
            <path
              d="M20 30C28 16 44 14 56 22C68 30 76 22 84 32C76 40 60 40 50 34C40 28 30 38 20 30Z"
              fill="#38BDF8"
            />
            {/* Top-Left: Geopin with phone */}
            <circle cx="32" cy="46" r="10" fill="#00A3E0" />
            <rect x="29" y="42" width="6" height="9" rx="1.5" fill="#FFFFFF" />
            {/* Center: Verification Crest with arrow */}
            <path
              d="M50 38L62 48L50 68L38 48Z"
              fill="#FFFFFF"
            />
            <path
              d="M45 52L49 56L56 46"
              stroke="#0D9488"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bottom-Left: Human with checkmark */}
            <circle cx="32" cy="70" r="5" fill="#2DD4BF" />
            <path d="M26 82C26 77 30 76 35 76" stroke="#2DD4BF" strokeWidth="2" />
            {/* Bottom-Right: Community with cleaning bucket */}
            <circle cx="68" cy="70" r="5" fill="#2DD4BF" />
            <rect x="65" y="74" width="7" height="8" rx="1" fill="#38BDF8" />
            {/* Cyan Data Arc */}
            <circle cx="20" cy="58" r="1.5" fill="#38BDF8" />
            <circle cx="30" cy="86" r="1.5" fill="#38BDF8" />
            <circle cx="50" cy="90" r="1.5" fill="#38BDF8" />
            <circle cx="70" cy="86" r="1.5" fill="#38BDF8" />
            <circle cx="80" cy="58" r="1.5" fill="#38BDF8" />
          </svg>
        )}
      </div>

      {/* Brand Typography */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className={`flex items-baseline gap-0.5 tracking-tight ${textStyles[size].title}`}>
            <span className={theme === 'dark' ? 'text-white' : 'text-[#0B2545]'}>
              Blue
            </span>
            <span className="text-[#00A3E0]">
              Shield
            </span>
          </div>
          {subtext && (
            <span
              className={`font-mono tracking-wider uppercase mt-0.5 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              } ${textStyles[size].sub}`}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
