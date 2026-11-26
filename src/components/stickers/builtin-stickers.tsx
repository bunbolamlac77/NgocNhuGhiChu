import React from "react";

export type BuiltinStickerCategory = "animals" | "nature" | "sweets";

export interface BuiltinSticker {
  id: string;
  cat: BuiltinStickerCategory;
  name: string;
  renderSvg: (className?: string) => React.ReactElement;
}

export const STICKER_CATEGORIES: {
  id: BuiltinStickerCategory;
  label: string;
}[] = [
  { id: "animals", label: "Thú" },
  { id: "nature", label: "Hoa lá" },
  { id: "sweets", label: "Đồ ngọt & Nhật ký" },
];

export const BUILTIN_STICKERS: BuiltinSticker[] = [
  // --- ANIMALS (10) ---
  {
    id: "bunny",
    cat: "animals",
    name: "Thỏ Mochi",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <ellipse cx="17" cy="11" rx="4.5" ry="10" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="17" cy="12" rx="2" ry="6" fill="#FFB7CE" />
        <ellipse cx="31" cy="11" rx="4.5" ry="10" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="31" cy="12" rx="2" ry="6" fill="#FFB7CE" />
        <ellipse cx="24" cy="30" rx="15" ry="12.5" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="2" />
        <circle cx="18" cy="29" r="2" fill="#4A2C3A" />
        <circle cx="30" cy="29" r="2" fill="#4A2C3A" />
        <ellipse cx="14" cy="32" rx="3" ry="1.8" fill="#FF9EB5" opacity="0.8" />
        <ellipse cx="34" cy="32" rx="3" ry="1.8" fill="#FF9EB5" opacity="0.8" />
        <path d="M21.5 32 Q24 34.5 26.5 32" fill="none" stroke="#4A2C3A" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "piggy",
    cat: "animals",
    name: "Heo Mũm Mĩm",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M10 18 Q8 8 18 14" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M38 18 Q40 8 30 14" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="24" cy="28" rx="16" ry="13" fill="#FFC8DC" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="24" cy="30" rx="6" ry="4" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.6" />
        <circle cx="22" cy="30" r="1.1" fill="#4A2C3A" />
        <circle cx="26" cy="30" r="1.1" fill="#4A2C3A" />
        <circle cx="16" cy="25" r="2" fill="#4A2C3A" />
        <circle cx="32" cy="25" r="2" fill="#4A2C3A" />
      </svg>
    ),
  },
  {
    id: "bear",
    cat: "animals",
    name: "Gấu Mật Ong",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <circle cx="12" cy="15" r="5.5" fill="#D9A37C" stroke="#4A2C3A" strokeWidth="2" />
        <circle cx="36" cy="15" r="5.5" fill="#D9A37C" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="24" cy="27" rx="15.5" ry="13" fill="#E3B18D" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="24" cy="30" rx="6.2" ry="4.5" fill="#FFF3E6" />
        <circle cx="17" cy="25" r="2" fill="#4A2C3A" />
        <circle cx="31" cy="25" r="2" fill="#4A2C3A" />
        <ellipse cx="24" cy="28.5" rx="2.2" ry="1.5" fill="#4A2C3A" />
        <ellipse cx="13" cy="29" rx="2.8" ry="1.6" fill="#FF9EB5" opacity="0.75" />
        <ellipse cx="35" cy="29" rx="2.8" ry="1.6" fill="#FF9EB5" opacity="0.75" />
      </svg>
    ),
  },
  {
    id: "kitty",
    cat: "animals",
    name: "Mèo Dâu Tây",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <polygon points="10,21 12,8 22,16" fill="#FFF5F8" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="38,21 36,8 26,16" fill="#FFF5F8" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="24" cy="29" rx="15" ry="12.5" fill="#FFF5F8" stroke="#4A2C3A" strokeWidth="2" />
        <circle cx="18" cy="28" r="2" fill="#4A2C3A" />
        <circle cx="30" cy="28" r="2" fill="#4A2C3A" />
        <path d="M21.5 31.5 Q24 34 26.5 31.5" fill="none" stroke="#4A2C3A" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="13.5" cy="31" rx="2.8" ry="1.6" fill="#FF9EB5" />
        <ellipse cx="34.5" cy="31" rx="2.8" ry="1.6" fill="#FF9EB5" />
      </svg>
    ),
  },
  {
    id: "corgi",
    cat: "animals",
    name: "Cún Corgi",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <polygon points="9,20 11,6 21,16" fill="#F6B87A" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="39,20 37,6 27,16" fill="#F6B87A" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <ellipse cx="24" cy="29" rx="15.5" ry="12.5" fill="#F6B87A" stroke="#4A2C3A" strokeWidth="2" />
        <path d="M12 31 Q24 22 36 31 Q33 41 24 41 Q15 41 12 31 Z" fill="#FFFDF9" />
        <circle cx="17" cy="27" r="2" fill="#4A2C3A" />
        <circle cx="31" cy="27" r="2" fill="#4A2C3A" />
        <ellipse cx="24" cy="30" rx="2.5" ry="1.8" fill="#4A2C3A" />
        <path d="M22 33 Q24 37 26 33" fill="#FF85A9" stroke="#4A2C3A" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "panda",
    cat: "animals",
    name: "Gấu Trúc",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <circle cx="12" cy="14" r="5.5" fill="#4A2C3A" />
        <circle cx="36" cy="14" r="5.5" fill="#4A2C3A" />
        <ellipse cx="24" cy="28" rx="15.5" ry="13" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="17" cy="27" rx="4.2" ry="3.2" transform="rotate(-15 17 27)" fill="#4A2C3A" />
        <ellipse cx="31" cy="27" rx="4.2" ry="3.2" transform="rotate(15 31 27)" fill="#4A2C3A" />
        <circle cx="17.5" cy="26.5" r="1.2" fill="#FFFFFF" />
        <circle cx="30.5" cy="26.5" r="1.2" fill="#FFFFFF" />
        <ellipse cx="24" cy="30" rx="2.2" ry="1.4" fill="#4A2C3A" />
        <ellipse cx="12.5" cy="31" rx="2.8" ry="1.6" fill="#FF9EB5" opacity="0.8" />
        <ellipse cx="35.5" cy="31" rx="2.8" ry="1.6" fill="#FF9EB5" opacity="0.8" />
      </svg>
    ),
  },
  {
    id: "fox",
    cat: "animals",
    name: "Cáo Nhỏ",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <polygon points="9,20 12,7 22,17" fill="#FF9F7A" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="39,20 36,7 26,17" fill="#FF9F7A" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 26 Q24 14 39 26 Q35 41 24 41 Q13 41 9 26 Z" fill="#FF9F7A" stroke="#4A2C3A" strokeWidth="2" />
        <path d="M11 29 Q18 28 24 40 Q30 28 37 29 Q34 40 24 41 Q14 40 11 29 Z" fill="#FFF7EE" />
        <circle cx="18" cy="27" r="2" fill="#4A2C3A" />
        <circle cx="30" cy="27" r="2" fill="#4A2C3A" />
        <circle cx="24" cy="32" r="2.2" fill="#4A2C3A" />
      </svg>
    ),
  },
  {
    id: "duck",
    cat: "animals",
    name: "Vịt Vàng",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M22 12 Q24 6 27 12" fill="none" stroke="#4A2C3A" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="24" cy="28" rx="15" ry="13.5" fill="#FFF0A8" stroke="#4A2C3A" strokeWidth="2" />
        <circle cx="17" cy="26" r="2" fill="#4A2C3A" />
        <circle cx="31" cy="26" r="2" fill="#4A2C3A" />
        <ellipse cx="24" cy="30.5" rx="5.5" ry="3" fill="#FFA666" stroke="#4A2C3A" strokeWidth="1.6" />
        <ellipse cx="13" cy="29.5" rx="2.8" ry="1.6" fill="#FF9EB5" opacity="0.8" />
        <ellipse cx="35" cy="29.5" rx="2.8" ry="1.6" fill="#FF9EB5" opacity="0.8" />
      </svg>
    ),
  },
  {
    id: "bird",
    cat: "animals",
    name: "Chim Chíp",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <ellipse cx="22" cy="26" rx="14" ry="11.5" fill="#FFF2B2" stroke="#4A2C3A" strokeWidth="2" />
        <path d="M34 24 L42 27 L34 30 Z" fill="#FFA86B" stroke="#4A2C3A" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="27" cy="23.5" r="2" fill="#4A2C3A" />
        <path d="M15 26 Q22 22 25 29 Q18 33 15 26 Z" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "butterfly",
    cat: "animals",
    name: "Bướm Hồng",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <ellipse cx="15" cy="19" rx="10" ry="7.5" transform="rotate(-24 15 19)" fill="#FFB7CE" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="33" cy="19" rx="10" ry="7.5" transform="rotate(24 33 19)" fill="#FFB7CE" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="17" cy="30" rx="7" ry="5.5" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="1.8" />
        <ellipse cx="31" cy="30" rx="7" ry="5.5" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="1.8" />
        <rect x="22" y="15" width="4" height="19" rx="2" fill="#4A2C3A" />
      </svg>
    ),
  },

  // --- NATURE & FLOWERS (8) ---
  {
    id: "sakura",
    cat: "nature",
    name: "Hoa Anh Đào",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <g transform="translate(24,24)">
          <ellipse cy="-10" rx="5.8" ry="8.5" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.8" />
          <ellipse cy="-10" rx="5.8" ry="8.5" fill="#FFC5D9" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(72)" />
          <ellipse cy="-10" rx="5.8" ry="8.5" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(144)" />
          <ellipse cy="-10" rx="5.8" ry="8.5" fill="#FFC5D9" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(216)" />
          <ellipse cy="-10" rx="5.8" ry="8.5" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(288)" />
          <circle r="4.2" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="1.6" />
        </g>
      </svg>
    ),
  },
  {
    id: "tulip",
    cat: "nature",
    name: "Hoa Tulip",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M24 27 V42" stroke="#5AA473" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M24 37 Q15 35 14 29 Q20 30 24 35" fill="#BFE8CC" stroke="#4A2C3A" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 14 Q14 28 24 28 Q34 28 34 14 L29 19 L24 11 L19 19 Z" fill="#FF8FB8" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "leaf",
    cat: "nature",
    name: "Cành Lá Xuân",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M9 38 Q22 26 38 11" fill="none" stroke="#4A2C3A" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="18" cy="22" rx="7.5" ry="4" transform="rotate(-38 18 22)" fill="#BFE8CC" stroke="#4A2C3A" strokeWidth="1.8" />
        <ellipse cx="29" cy="27" rx="7.5" ry="4" transform="rotate(20 29 27)" fill="#A5E0B9" stroke="#4A2C3A" strokeWidth="1.8" />
        <ellipse cx="32" cy="14" rx="6" ry="3.4" transform="rotate(-48 32 14)" fill="#FFB7CE" stroke="#4A2C3A" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: "clover",
    cat: "nature",
    name: "Cỏ 4 Lá",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M24 26 Q24 36 18 42" fill="none" stroke="#4A2C3A" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="18" cy="18" r="6.5" fill="#BFE8CC" stroke="#4A2C3A" strokeWidth="1.8" />
        <circle cx="30" cy="18" r="6.5" fill="#A5E0B9" stroke="#4A2C3A" strokeWidth="1.8" />
        <circle cx="18" cy="29" r="6.5" fill="#A5E0B9" stroke="#4A2C3A" strokeWidth="1.8" />
        <circle cx="30" cy="29" r="6.5" fill="#BFE8CC" stroke="#4A2C3A" strokeWidth="1.8" />
        <circle cx="24" cy="23.5" r="2.2" fill="#FFE07D" />
      </svg>
    ),
  },
  {
    id: "rainbow",
    cat: "nature",
    name: "Cầu Vồng",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M8 34 A16 16 0 0 1 40 34" fill="none" stroke="#FF8FB8" strokeWidth="5" strokeLinecap="round" />
        <path d="M13 34 A11 11 0 0 1 35 34" fill="none" stroke="#FFE07D" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M18 34 A6 6 0 0 1 30 34" fill="none" stroke="#A7DEFF" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="10" cy="35" r="4.5" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="1.5" />
        <circle cx="38" cy="35" r="4.5" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "moon",
    cat: "nature",
    name: "Trăng Sao",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M31 11 A14 14 0 1 0 37 33 A11 11 0 1 1 31 11 Z" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M33 13 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5-3.5 -3.5-1.5 3.5-1.5 z" fill="#FFB7CE" stroke="#4A2C3A" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "daisy",
    cat: "nature",
    name: "Hoa Cúc",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <g transform="translate(24,24)">
          <ellipse cy="-11" rx="4.2" ry="7.2" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="1.8" />
          <ellipse cy="-11" rx="4.2" ry="7.2" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(60)" />
          <ellipse cy="-11" rx="4.2" ry="7.2" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(120)" />
          <ellipse cy="-11" rx="4.2" ry="7.2" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(180)" />
          <ellipse cy="-11" rx="4.2" ry="7.2" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(240)" />
          <ellipse cy="-11" rx="4.2" ry="7.2" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="1.8" transform="rotate(300)" />
          <circle r="5.5" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="1.8" />
        </g>
      </svg>
    ),
  },
  {
    id: "cloud",
    cat: "nature",
    name: "Đám Mây Cười",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path
          d="M11 33 Q7 33 7 28 Q7 22 13 22 Q15 14 24 15 Q32 14 35 21 Q41 22 41 28 Q41 33 36 33 Z"
          fill="#FFFFFF"
          stroke="#4A2C3A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="25" r="1.6" fill="#4A2C3A" />
        <circle cx="29" cy="25" r="1.6" fill="#4A2C3A" />
        <ellipse cx="15.5" cy="27.5" rx="2.4" ry="1.3" fill="#FF9EB5" opacity="0.8" />
        <ellipse cx="32.5" cy="27.5" rx="2.4" ry="1.3" fill="#FF9EB5" opacity="0.8" />
        <path d="M22 27.5 Q24 29.8 26 27.5" fill="none" stroke="#4A2C3A" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },

  // --- SWEETS & STATIONERY (10) ---
  {
    id: "cake",
    cat: "sweets",
    name: "Bánh Kem Dâu",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <rect x="10" y="22" width="28" height="17" rx="5" fill="#FFF5E6" stroke="#4A2C3A" strokeWidth="2" />
        <path d="M10 26 Q15 31 20 26 Q24 31 28 26 Q33 31 38 26 L38 22 Q38 18 33 18 L15 18 Q10 18 10 22 Z" fill="#FFB7CE" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="24" cy="14" r="4.5" fill="#E84E7F" stroke="#4A2C3A" strokeWidth="1.8" />
        <path d="M22 10 Q24 8 26 10" stroke="#6BC48D" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "boba",
    cat: "sweets",
    name: "Trà Sữa",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <rect x="22" y="5" width="4" height="11" rx="1.5" fill="#FF8FB8" stroke="#4A2C3A" strokeWidth="1.6" />
        <path d="M14 16 L34 16 L31 40 Q30 42 28 42 L20 42 Q18 42 17 40 Z" fill="#F9DEC9" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <rect x="12" y="14" width="24" height="4.5" rx="2" fill="#FFB7CE" stroke="#4A2C3A" strokeWidth="1.8" />
        <circle cx="20" cy="36" r="2.2" fill="#4A2C3A" />
        <circle cx="25" cy="37.5" r="2.2" fill="#4A2C3A" />
        <circle cx="29" cy="35.5" r="2.2" fill="#4A2C3A" />
      </svg>
    ),
  },
  {
    id: "strawberry",
    cat: "sweets",
    name: "Dâu Tây",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M24 41 C13 38 10 24 14 17 C18 12 30 12 34 17 C38 24 35 38 24 41 Z" fill="#FF6F9C" stroke="#4A2C3A" strokeWidth="2" />
        <path d="M16 16 Q24 10 32 16 Q27 20 24 17 Q21 20 16 16 Z" fill="#8CD6A4" stroke="#4A2C3A" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="19" cy="24" r="1.2" fill="#FFFFFF" />
        <circle cx="28" cy="23" r="1.2" fill="#FFFFFF" />
        <circle cx="24" cy="31" r="1.2" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: "peach",
    cat: "sweets",
    name: "Đào Hồng",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M24 39 C12 36 9 23 15 16 C19 12 24 16 24 16 C24 16 29 12 33 16 C39 23 36 36 24 39 Z" fill="#FFB8C6" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="30" cy="12" rx="5.5" ry="3" transform="rotate(-28 30 12)" fill="#A5E0B9" stroke="#4A2C3A" strokeWidth="1.6" />
        <circle cx="20" cy="26" r="1.6" fill="#4A2C3A" />
        <circle cx="28" cy="26" r="1.6" fill="#4A2C3A" />
        <path d="M22.5 28.5 Q24 30.5 25.5 28.5" fill="none" stroke="#4A2C3A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "ribbon",
    cat: "sweets",
    name: "Nơ Ruy-băng",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M22 24 L13 38 L19 36 L23 27" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M26 24 L35 38 L29 36 L25 27" fill="#FF9EBF" stroke="#4A2C3A" strokeWidth="1.8" strokeLinejoin="round" />
        <ellipse cx="14" cy="21" rx="9" ry="7" transform="rotate(-12 14 21)" fill="#FFB7CE" stroke="#4A2C3A" strokeWidth="2" />
        <ellipse cx="34" cy="21" rx="9" ry="7" transform="rotate(12 34 21)" fill="#FFB7CE" stroke="#4A2C3A" strokeWidth="2" />
        <circle cx="24" cy="22" r="4.5" fill="#FF85A9" stroke="#4A2C3A" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "letter",
    cat: "sweets",
    name: "Thư Tình",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <rect x="7" y="13" width="34" height="23" rx="4" fill="#FFFFFF" stroke="#4A2C3A" strokeWidth="2" />
        <path d="M8 15 L24 27 L40 15" fill="none" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 22.8c-1.5-2-4.2-.6-3.4 1.6.6 1.7 3.4 3.5 3.4 3.5s2.8-1.8 3.4-3.5c.8-2.2-1.9-3.6-3.4-1.6z" fill="#D63D76" />
      </svg>
    ),
  },
  {
    id: "pencil",
    cat: "sweets",
    name: "Bút Chì Cười",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <g transform="translate(24,24) rotate(-25) translate(-9,-20)">
          <rect x="0" y="8" width="18" height="22" rx="3" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="2" />
          <rect x="0" y="2" width="18" height="7" rx="3" fill="#FF9BB8" stroke="#4A2C3A" strokeWidth="2" />
          <rect x="0" y="8" width="18" height="4" fill="#BCE6FF" stroke="#4A2C3A" strokeWidth="1.8" />
          <polygon points="0,30 18,30 9,41" fill="#FDE6C4" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="6,37 12,37 9,41" fill="#4A2C3A" />
        </g>
      </svg>
    ),
  },
  {
    id: "sparkheart",
    cat: "sweets",
    name: "Tim Lấp Lánh",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M24 39 C12 31 9 23 9 18 A8.5 8.5 0 0 1 24 13 A8.5 8.5 0 0 1 39 18 C39 23 36 31 24 39 Z" fill="#FF8FB8" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 17 Q19 14 21 16" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M38 9 l1 2.5 2.5 1 -2.5 1 -1 2.5 -1-2.5 -2.5-1 2.5-1 z" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="1" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "heartlock",
    cat: "sweets",
    name: "Ổ Khóa Tim",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <path d="M16 21 V16 A8 8 0 0 1 32 16 V21" fill="none" stroke="#4A2C3A" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="11" y="21" width="26" height="20" rx="6" fill="#FFE07D" stroke="#4A2C3A" strokeWidth="2.2" />
        <path d="M24 27.2c-1.8-2.3-5-.7-4 2 .7 2 4 4.1 4 4.1s3.3-2.1 4-4.1c1-2.7-2.2-4.3-4-2z" fill="#D63D76" />
      </svg>
    ),
  },
  {
    id: "wishtag",
    cat: "sweets",
    name: "Thẻ Ước",
    renderSvg: (className = "w-10 h-10") => (
      <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
        <line x1="24" y1="5" x2="24" y2="11" stroke="#D63D76" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 15 L24 9 L35 15 L35 39 Q35 42 32 42 L16 42 Q13 42 13 39 Z" fill="#FFF7FA" stroke="#4A2C3A" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 24.5c-1.8-2.3-5-.7-4 2 .7 2 4 4.1 4 4.1s3.3-2.1 4-4.1c1-2.7-2.2-4.3-4-2z" fill="#FF79A8" />
      </svg>
    ),
  },
];

export function getBuiltinStickerById(id: string): BuiltinSticker | undefined {
  return BUILTIN_STICKERS.find((item) => item.id === id);
}

interface BuiltinStickerSvgProps {
  id: string;
  className?: string;
}

export function BuiltinStickerSvg({ id, className }: BuiltinStickerSvgProps) {
  const sticker = getBuiltinStickerById(id);
  if (!sticker) return null;
  return sticker.renderSvg(className);
}
