import React from "react";

interface BunnyLockCoverProps {
  className?: string;
}

export function BunnyLockCover({ className = "w-44 h-40" }: BunnyLockCoverProps) {
  return (
    <div className={`relative anim-float ${className}`}>
      <svg
        viewBox="0 0 210 185"
        className="w-full h-full drop-shadow-md"
        role="img"
        aria-label="Bìa sổ Thỏ Mochi khóa tim vàng"
      >
        <path
          d="M36 150 Q105 166 176 146 L176 164 Q105 182 36 166 Z"
          fill="#FFFDF9"
          stroke="#4A2C3A"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect
          x="24"
          y="14"
          width="26"
          height="150"
          rx="10"
          fill="#8C5368"
          stroke="#4A2C3A"
          strokeWidth="3"
        />
        <rect
          x="42"
          y="12"
          width="136"
          height="148"
          rx="22"
          fill="#FFA9C7"
          stroke="#4A2C3A"
          strokeWidth="3"
        />
        <rect
          x="50"
          y="20"
          width="120"
          height="132"
          rx="16"
          fill="none"
          stroke="#FFF6F9"
          strokeWidth="2.6"
          strokeDasharray="6 6"
        />
        <circle
          cx="110"
          cy="82"
          r="44"
          fill="#DFF2FF"
          stroke="#E06D97"
          strokeWidth="3"
        />
        <ellipse
          cx="95"
          cy="40"
          rx="10.5"
          ry="22"
          transform="rotate(-8 95 40)"
          fill="#FFFFFF"
          stroke="#4A2C3A"
          strokeWidth="2.8"
        />
        <ellipse
          cx="95"
          cy="42"
          rx="5"
          ry="13"
          transform="rotate(-8 95 42)"
          fill="#FFC1D6"
        />
        <ellipse
          cx="125"
          cy="40"
          rx="10.5"
          ry="22"
          transform="rotate(8 125 40)"
          fill="#FFFFFF"
          stroke="#4A2C3A"
          strokeWidth="2.8"
        />
        <ellipse
          cx="125"
          cy="42"
          rx="5"
          ry="13"
          transform="rotate(8 125 42)"
          fill="#FFC1D6"
        />
        <ellipse
          cx="110"
          cy="88"
          rx="35"
          ry="29"
          fill="#FFFFFF"
          stroke="#4A2C3A"
          strokeWidth="2.8"
        />
        <path
          d="M90 85 Q95 79 100 85"
          fill="none"
          stroke="#4A2C3A"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M120 85 Q125 79 130 85"
          fill="none"
          stroke="#4A2C3A"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <ellipse cx="86" cy="94" rx="7" ry="4" fill="#FF92B2" opacity="0.75" />
        <ellipse cx="134" cy="94" rx="7" ry="4" fill="#FF92B2" opacity="0.75" />
        <ellipse cx="110" cy="91" rx="3.2" ry="2.2" fill="#5C374C" />
        <path
          d="M104 95 Q107 99 110 95 Q113 99 116 95"
          fill="none"
          stroke="#4A2C3A"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <ellipse
          cx="90"
          cy="115"
          rx="12"
          ry="8"
          fill="#FFFFFF"
          stroke="#4A2C3A"
          strokeWidth="2.6"
        />
        <ellipse
          cx="130"
          cy="115"
          rx="12"
          ry="8"
          fill="#FFFFFF"
          stroke="#4A2C3A"
          strokeWidth="2.6"
        />
        <rect
          x="158"
          y="68"
          width="28"
          height="34"
          rx="9"
          fill="#FFE07D"
          stroke="#4A2C3A"
          strokeWidth="2.8"
        />
        <path
          d="M172 80.5 c-2.4-3.2-7-1-5.8 2.6 c1 2.8 5.8 5.8 5.8 5.8 s4.8-3 5.8-5.8 c1.2-3.6-3.4-5.8-5.8-2.6z"
          fill="#D63D76"
        />
        <g transform="translate(8, 72) rotate(-22)">
          <rect
            x="0"
            y="16"
            width="28"
            height="58"
            rx="6"
            fill="#FFE07D"
            stroke="#4A2C3A"
            strokeWidth="2.6"
          />
          <rect
            x="0"
            y="6"
            width="28"
            height="14"
            rx="5"
            fill="#FF9BB8"
            stroke="#4A2C3A"
            strokeWidth="2.6"
          />
          <rect
            x="0"
            y="17"
            width="28"
            height="8"
            fill="#BCE6FF"
            stroke="#4A2C3A"
            strokeWidth="2.4"
          />
          <polygon
            points="0,74 28,74 14,96"
            fill="#FDE6C4"
            stroke="#4A2C3A"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <polygon points="9,88 19,88 14,96" fill="#4A2C3A" />
          <circle cx="9" cy="46" r="2.2" fill="#4A2C3A" />
          <circle cx="19" cy="46" r="2.2" fill="#4A2C3A" />
          <path
            d="M12 49 Q14 52 16 49"
            fill="none"
            stroke="#4A2C3A"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
