import React from 'react';

interface KiteLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const KiteLogo: React.FC<KiteLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Icon matching the logo: Graduation Cap + Flying Kite */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        {/* Soft Circular Badge Background */}
        <circle cx="50" cy="50" r="48" fill="#FFFDF8" stroke="#FED7AA" strokeWidth="1.5" />

        {/* Kite 1 (Top Left) */}
        <polygon
          points="38,24 50,30 38,36 26,30"
          fill="#FFF7ED"
          stroke="#EA580C"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="38" y1="24" x2="38" y2="36" stroke="#EA580C" strokeWidth="1.5" />
        <line x1="26" y1="30" x2="50" y2="30" stroke="#EA580C" strokeWidth="1.5" />
        {/* Kite String */}
        <path
          d="M38,36 Q45,45 52,50 Q60,54 68,52"
          fill="none"
          stroke="#FDBA74"
          strokeWidth="1.2"
          strokeDasharray="2 1"
        />

        {/* Kite 2 (Top Right) */}
        <polygon
          points="70,22 82,28 70,38 60,30"
          fill="#FFF7ED"
          stroke="#EA580C"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="70" y1="22" x2="70" y2="38" stroke="#EA580C" strokeWidth="1.5" />
        <line x1="60" y1="30" x2="82" y2="28" stroke="#EA580C" strokeWidth="1.5" />

        {/* Graduation Cap (Mũ cử nhân màu đỏ tươi Cánh Diều) */}
        {/* Cap diamond */}
        <polygon
          points="25,48 48,40 45,55 22,60"
          fill="#DC2626"
          stroke="#991B1B"
          strokeWidth="1.5"
        />
        <polygon
          points="15,53 45,42 56,50 25,60"
          fill="#EF4444"
          stroke="#DC2626"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Cap skull cap under */}
        <path
          d="M25,58 L25,67 C25,71 36,73 44,70 L44,57 Z"
          fill="#B91C1C"
        />
        {/* Tassel */}
        <path
          d="M26,52 Q18,55 16,63"
          fill="none"
          stroke="#DC2626"
          strokeWidth="1.5"
        />
        <circle cx="16" cy="64" r="2" fill="#DC2626" />
      </svg>

      {showText && (
        <div className="leading-tight">
          <div className="text-[11px] font-medium text-amber-700 italic tracking-wide">
            Mẫu Giáo
          </div>
          <div className="text-base font-extrabold text-red-600 tracking-wider uppercase font-serif">
            CÁNH DIỀU
          </div>
          <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-widest">
            Luyện nhân cách ươm mầm tài năng
          </div>
        </div>
      )}
    </div>
  );
};
