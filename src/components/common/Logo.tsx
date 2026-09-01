import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon: Modern fusion of Hand (Tangan), Wallet (Dompet), and Coin/Money (Uang) */}
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 shadow-md shadow-teal-500/20 text-white ${iconSizes[size]}`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 text-white stroke-current"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Wallet Base Outline */}
          <path
            d="M8 17C8 14.7909 9.79086 13 12 13H36C38.2091 13 40 14.7909 40 17V33C40 35.2091 38.2091 37 36 37H12C9.79086 37 8 35.2091 8 33V17Z"
            fill="currentColor"
            fillOpacity="0.15"
          />
          {/* Wallet Flap Accent */}
          <path d="M30 21H38C39.1046 21 40 21.8954 40 23V27C40 28.1046 39.1046 29 38 29H30C28.8954 29 28 28.1046 28 27V23C28 21.8954 28.8954 21 30 21Z" fill="currentColor" fillOpacity="0.4" />
          <circle cx="34" cy="25" r="1.5" fill="#ffffff" />
          
          {/* Coin Rising with Glow */}
          <circle cx="24" cy="15" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.8" />
          <path d="M24 12.5V17.5M22 13.5H25.5C26 13.5 26.5 14 26.5 14.5C26.5 15 26 15.5 25.5 15.5H22.5C22 15.5 21.5 16 21.5 16.5C21.5 17 22 17.5 22.5 17.5H26" stroke="#854d0e" strokeWidth="1.2" />

          {/* Supportive Hand Silhouette Underneath */}
          <path
            d="M6 31C8.5 35 13 39 19 40C23 40.5 28 39 31 37"
            stroke="#ffffff"
            strokeWidth="2.4"
          />
          <path
            d="M13 36C16 38 20 38.5 24 38"
            stroke="#99f6e4"
            strokeWidth="2"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`${titleSizes[size]} text-slate-900 dark:text-white`}>
              NUQUDY
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          </div>
          {showTagline && (
            <span className="text-[11px] font-medium tracking-wide text-teal-600 dark:text-teal-400 uppercase -mt-0.5">
              Smart Financial Management
            </span>
          )}
        </div>
      )}
    </div>
  );
};
