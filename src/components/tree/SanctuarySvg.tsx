"use client";

import React from "react";
import type { MvpAnimalId } from "@/lib/tree/animal-quotes";
import type { LocalWishRecord, TreeStage } from "@/types/models";
import { WishTagLayer } from "./WishTagLayer";

interface SanctuarySvgProps {
  stage: TreeStage;
  wishes: readonly LocalWishRecord[];
  dewAnimating: boolean;
  celebrating: boolean;
  onSelectWish: (wish: LocalWishRecord) => void;
  onTapAnimal: (animalId: MvpAnimalId) => void;
}

const DEW_DROP_XS = [148, 168, 184, 202, 218];

export function SanctuarySvg({
  stage,
  wishes,
  dewAnimating,
  celebrating,
  onSelectWish,
  onTapAnimal,
}: SanctuarySvgProps) {
  const showPetals = stage >= 4 || celebrating;

  return (
    <div
      data-sanctuary-stage={stage}
      data-celebrating={celebrating ? "true" : "false"}
      className="relative w-full rounded-[26px] border-2 border-[#FFD1E1] overflow-hidden k-shadow bg-gradient-to-b from-[#CBEFFF] to-[#FFE4EC]"
    >
      <svg viewBox="0 0 360 400" className="w-full h-auto block select-none">
        <defs>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF5C0" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#FFD4A3" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFD4A3" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE885" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#FFB74D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFB74D" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#875447" />
            <stop offset="55%" stopColor="#A66E5E" />
            <stop offset="100%" stopColor="#7A493E" />
          </linearGradient>
          <linearGradient id="meadowBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8EED0" />
            <stop offset="100%" stopColor="#AEE3BA" />
          </linearGradient>
          <linearGradient id="meadowFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DCF6E0" />
            <stop offset="100%" stopColor="#BBEBC4" />
          </linearGradient>
        </defs>

        {/* Day Sun Halo */}
        <g id="sky-sun">
          <circle cx="292" cy="58" r="52" fill="url(#sunGlow)" />
          <circle cx="292" cy="58" r="18" fill="#FFF2A8" opacity="0.95" />
        </g>

        {/* Soft Fluffy Clouds */}
        <g id="sky-clouds" opacity="0.88">
          <path
            d="M18 68 Q18 52 36 52 Q46 38 64 45 Q78 44 82 58 Q94 60 92 71 Q90 78 76 78 L28 78 Q16 77 18 68 Z"
            fill="#FFFFFF"
          />
          <path
            d="M242 84 Q242 73 254 73 Q263 62 276 68 Q288 68 290 78 Q300 81 297 89 Q295 94 284 94 L250 94 Q241 93 242 84 Z"
            fill="#FFFFFF"
            opacity="0.85"
          />
        </g>

        {/* Far Soft Hills */}
        <path
          d="M0 320 Q85 274 180 296 Q275 316 360 282 L360 400 L0 400 Z"
          fill="url(#meadowBack)"
        />

        {/* White Wooden Picket Fence */}
        <g id="garden-fence" opacity="0.92">
          <rect
            x="8"
            y="302"
            width="344"
            height="4.5"
            rx="2"
            fill="#FFFDF9"
            stroke="#D9B4C2"
            strokeWidth="1"
          />
          <rect
            x="8"
            y="315"
            width="344"
            height="4.5"
            rx="2"
            fill="#FFFDF9"
            stroke="#D9B4C2"
            strokeWidth="1"
          />
          <g fill="#FFFDF9" stroke="#D9B4C2" strokeWidth="1">
            <path d="M20 293 L25 288 L30 293 L30 326 L20 326 Z" />
            <path d="M44 293 L49 288 L54 293 L54 326 L44 326 Z" />
            <path d="M68 293 L73 288 L78 293 L78 326 L68 326 Z" />
            <path d="M92 293 L97 288 L102 293 L102 326 L92 326 Z" />
            <path d="M258 293 L263 288 L268 293 L268 326 L258 326 Z" />
            <path d="M282 293 L287 288 L292 293 L292 326 L282 326 Z" />
            <path d="M306 293 L311 288 L316 293 L316 326 L306 326 Z" />
            <path d="M330 293 L335 288 L340 293 L340 326 L330 326 Z" />
          </g>
        </g>

        {/* Foreground Meadow */}
        <ellipse cx="180" cy="382" rx="235" ry="74" fill="url(#meadowFront)" />

        {/* Stepping Stones */}
        <g fill="#FFF4EC" stroke="#E2BAC7" strokeWidth="1.5">
          <ellipse cx="180" cy="388" rx="22" ry="7" />
          <ellipse cx="164" cy="368" rx="16" ry="5.5" />
          <ellipse cx="184" cy="352" rx="13" ry="4.5" />
        </g>

        {/* Picnic Mat (Stage 4+) */}
        {stage >= 4 ? (
          <g id="picnic-mat" transform="translate(132, 344)">
            <ellipse
              cx="48"
              cy="14"
              rx="44"
              ry="13"
              fill="#FFE0EC"
              stroke="#FF9EBF"
              strokeWidth="1.8"
              strokeDasharray="4 3"
            />
            <ellipse cx="48" cy="14" rx="34" ry="8.5" fill="#FFF7FA" />
          </g>
        ) : null}

        {/* Cute Spotted Mushrooms */}
        <g transform="translate(298, 336)">
          <rect
            x="8"
            y="13"
            width="8"
            height="11"
            rx="3.5"
            fill="#FFF6EC"
            stroke="#5C374C"
            strokeWidth="1.6"
          />
          <path
            d="M2 15 Q12 1 22 15 Q12 17 2 15 Z"
            fill="#FF8FB8"
            stroke="#5C374C"
            strokeWidth="1.6"
          />
          <circle cx="8" cy="10" r="1.8" fill="#FFF" />
          <circle cx="15" cy="9" r="2" fill="#FFF" />
        </g>
        <g transform="translate(284, 345) scale(0.72)">
          <rect
            x="8"
            y="13"
            width="8"
            height="11"
            rx="3.5"
            fill="#FFF6EC"
            stroke="#5C374C"
            strokeWidth="1.8"
          />
          <path
            d="M2 15 Q12 1 22 15 Q12 17 2 15 Z"
            fill="#FFB7CE"
            stroke="#5C374C"
            strokeWidth="1.8"
          />
          <circle cx="11" cy="9" r="2" fill="#FFF" />
        </g>

        {/* Meadow Flowers */}
        <g>
          <path
            d="M46 355 V341"
            stroke="#5AA473"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M41 335 Q41 344 46 344 Q51 344 51 335 L48.5 338 L46 333 L43.5 338 Z"
            fill="#FF8FB8"
            stroke="#5C374C"
            strokeWidth="1.3"
          />
          <path
            d="M58 360 V347"
            stroke="#5AA473"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M53.5 341 Q53.5 349 58 349 Q62.5 349 62.5 341 L60 344 L58 339.5 L56 344 Z"
            fill="#FFE07D"
            stroke="#5C374C"
            strokeWidth="1.3"
          />
          <circle cx="326" cy="362" r="4.5" fill="#FFF" />
          <circle cx="326" cy="362" r="1.8" fill="#FFE07D" />
          <circle cx="98" cy="368" r="4" fill="#FFD1E1" />
          <circle cx="98" cy="368" r="1.5" fill="#FFE07D" />
        </g>

        {/* Falling Sakura Petals (Stage 4+ or Celebration) */}
        {showPetals ? (
          <g id="tree-petals">
            <path
              className="anim-petal-1"
              d="M98 128 c5-8 13-4 9 5 c-4 6-12 4-9-5z"
              fill="#FF9EBF"
            />
            <path
              className="anim-petal-2"
              d="M245 118 c5-8 13-4 9 5 c-4 6-12 4-9-5z"
              fill="#FFB7CE"
            />
            <path
              className="anim-petal-3"
              d="M174 102 c5-7 12-3 8 4 c-4 6-11 4-8-4z"
              fill="#FFF0F5"
            />
          </g>
        ) : null}

        {/* Stage 1: Sprout OR Stage 2+: Full Wishing Tree */}
        {stage === 1 ? (
          <g id="stage-1-gfx">
            <ellipse cx="180" cy="336" rx="22" ry="6" fill="#9ED8AB" opacity="0.6" />
            <path
              d="M180 335 Q180 300 180 282"
              fill="none"
              stroke="#5EB97E"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <path
              d="M180 294 Q154 274 148 290 Q158 306 180 298 Z"
              fill="#A5E3B8"
              stroke="#4A2C3A"
              strokeWidth="2"
            />
            <path
              d="M180 292 Q206 272 212 288 Q202 304 180 296 Z"
              fill="#8CD6A4"
              stroke="#4A2C3A"
              strokeWidth="2"
            />
            <circle
              cx="180"
              cy="279"
              r="5"
              fill="#FFB7CE"
              stroke="#4A2C3A"
              strokeWidth="1.6"
            />
            <WishTagLayer wishes={wishes} onSelectWish={onSelectWish} />
          </g>
        ) : (
          <g id="stage-tree-main">
            <ellipse
              cx="180"
              cy="340"
              rx="56"
              ry="12"
              fill="#94CEA0"
              opacity="0.48"
            />

            {/* Hanging Swing (Stage 3+) */}
            {stage >= 3 ? (
              <g id="tree-swing" transform="translate(88, 200)">
                <g className="anim-swing">
                  <line
                    x1="6"
                    y1="0"
                    x2="6"
                    y2="74"
                    stroke="#D9A37C"
                    strokeWidth="1.8"
                  />
                  <line
                    x1="30"
                    y1="0"
                    x2="30"
                    y2="74"
                    stroke="#D9A37C"
                    strokeWidth="1.8"
                  />
                  <rect
                    x="0"
                    y="72"
                    width="36"
                    height="8"
                    rx="3.5"
                    fill="#C98967"
                    stroke="#5C374C"
                    strokeWidth="1.8"
                  />
                  <circle cx="6" cy="64" r="3" fill="#FF8FB8" />
                  <circle cx="30" cy="64" r="3" fill="#FF8FB8" />
                </g>
              </g>
            ) : null}

            {/* Trunk & Branches */}
            <path
              d="M144 342 Q165 332 167 288 Q169 245 162 214 L198 214 Q191 245 193 288 Q195 332 216 342 Q196 339 180 343 Q164 339 144 342 Z"
              fill="url(#trunkGrad)"
              stroke="#5C374C"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              d="M168 234 Q130 212 86 196"
              fill="none"
              stroke="#8F5A4D"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M192 232 Q232 210 274 192"
              fill="none"
              stroke="#8F5A4D"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M180 226 Q180 185 182 152"
              fill="none"
              stroke="#8F5A4D"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M174 322 Q176 290 175 262"
              fill="none"
              stroke="#BE8A7A"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.65"
            />

            {/* Glowing Hollow Lantern (Stage 4+) */}
            {stage >= 4 ? (
              <g id="tree-hollow">
                <ellipse cx="181" cy="276" rx="10" ry="13" fill="#4A2C3A" />
                <circle
                  cx="181"
                  cy="278"
                  r="18"
                  fill="url(#lanternGlow)"
                  opacity="0.85"
                />
                <rect
                  x="177"
                  y="273"
                  width="8"
                  height="10"
                  rx="3"
                  fill="#FFE680"
                  stroke="#D98B2B"
                  strokeWidth="1.2"
                />
                <path
                  d="M178 273 Q181 269 184 273"
                  fill="none"
                  stroke="#D98B2B"
                  strokeWidth="1.2"
                />
              </g>
            ) : null}

            {/* Canopy Back (Stage 3+) */}
            {stage >= 3 ? (
              <g id="canopy-back">
                <circle cx="88" cy="176" r="46" fill="#F695B8" />
                <circle cx="272" cy="174" r="46" fill="#F695B8" />
                <circle cx="132" cy="118" r="50" fill="#F8A1C0" />
                <circle cx="228" cy="118" r="50" fill="#F8A1C0" />
                <circle cx="180" cy="96" r="54" fill="#F58EB4" />
              </g>
            ) : null}

            {/* Canopy Mid */}
            <g
              id="canopy-mid"
              transform={stage === 2 ? "translate(54, 48) scale(0.7)" : undefined}
            >
              <circle cx="114" cy="164" r="46" fill="#FFB8D0" />
              <circle cx="246" cy="164" r="46" fill="#FFB8D0" />
              <circle cx="180" cy="158" r="52" fill="#FFBCD3" />
              <circle cx="148" cy="116" r="44" fill="#FFC9DC" />
              <circle cx="214" cy="116" r="44" fill="#FFC9DC" />
            </g>

            {/* Canopy Front (Stage 3+) */}
            {stage >= 3 ? (
              <g id="canopy-front">
                <circle cx="180" cy="114" r="38" fill="#FFE2EC" />
                <circle cx="122" cy="144" r="28" fill="#FFDCE8" />
                <circle cx="238" cy="144" r="28" fill="#FFDCE8" />
                <g opacity="0.92">
                  <path
                    d="M72 204 Q68 224 72 242"
                    fill="none"
                    stroke="#F59BB9"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle cx="70" cy="218" r="4.5" fill="#FFE4EE" />
                  <circle cx="72" cy="235" r="3.8" fill="#FFB7CE" />
                  <path
                    d="M286 202 Q290 222 286 240"
                    fill="none"
                    stroke="#F59BB9"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle cx="288" cy="218" r="4.5" fill="#FFE4EE" />
                  <circle cx="286" cy="234" r="3.8" fill="#FFB7CE" />
                </g>
              </g>
            ) : null}

            {/* Canopy Blossoms (Stage 4+) */}
            {stage >= 4 ? (
              <g id="canopy-blossoms">
                {[
                  { x: 106, y: 156, center: "#FFE07D" },
                  { x: 154, y: 104, center: "#FFE07D" },
                  { x: 218, y: 108, center: "#FF9EBF" },
                  { x: 256, y: 156, center: "#FFE07D" },
                  { x: 182, y: 138, center: "#FF8FB8" },
                ].map((f, idx) => (
                  <g key={idx} transform={`translate(${f.x},${f.y})`}>
                    <circle cx="0" cy="-5" r="4.2" fill="#FFF" />
                    <circle cx="4.8" cy="-1.5" r="4.2" fill="#FFF" />
                    <circle cx="3" cy="4" r="4.2" fill="#FFF" />
                    <circle cx="-3" cy="4" r="4.2" fill="#FFF" />
                    <circle cx="-4.8" cy="-1.5" r="4.2" fill="#FFF" />
                    <circle r="2.6" fill={f.center} />
                  </g>
                ))}
              </g>
            ) : null}

            <WishTagLayer wishes={wishes} onSelectWish={onSelectWish} />
          </g>
        )}

        {/* Golden Sparkles / Stage 5 Magic */}
        {stage >= 5 || celebrating ? (
          <g id="tree-fireflies">
            {[
              { cx: 62, cy: 186, r: 4.5, inner: 2, delay: "0s" },
              { cx: 128, cy: 238, r: 5, inner: 2.2, delay: "0.6s" },
              { cx: 236, cy: 232, r: 4.5, inner: 2, delay: "1.2s" },
              { cx: 304, cy: 178, r: 5, inner: 2.2, delay: "1.8s" },
            ].map((dot, idx) => (
              <g key={idx}>
                <circle
                  className="anim-pop"
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill="url(#lanternGlow)"
                />
                <circle cx={dot.cx} cy={dot.cy} r={dot.inner} fill="#FFF6B3" />
              </g>
            ))}
          </g>
        ) : null}

        {/* Dew FX Drops */}
        {dewAnimating ? (
          <g id="dew-fx-layer" className="pointer-events-none">
            {DEW_DROP_XS.map((x, idx) => (
              <g
                key={x}
                className="anim-dew"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <path
                  d={`M${x} 248 C${x} 248 ${x - 5} 256 ${x - 5} 260 A5 5 0 0 0 ${x + 5} 260 C${x + 5} 256 ${x} 248 ${x} 248 Z`}
                  fill="#8CD5FF"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>
        ) : null}

        {/* 2 MVP Animals: Bunny (Thỏ Hoa) & Kitty (Mèo Dâu) */}
        <g
          id="animal-bunny"
          data-animal="bunny"
          role="button"
          tabIndex={0}
          aria-label="Trò chuyện với Thỏ Hoa"
          onClick={() => onTapAnimal("bunny")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onTapAnimal("bunny");
            }
          }}
          className="cursor-pointer focus:outline-none"
          transform="translate(82, 304)"
        >
          <ellipse cx="22" cy="44" rx="17" ry="4.5" fill="#92CCA0" opacity="0.45" />
          <ellipse
            cx="14"
            cy="7"
            rx="5.2"
            ry="11.5"
            fill="#FFF"
            stroke="#4A2C3A"
            strokeWidth="2.1"
          />
          <ellipse cx="14" cy="8" rx="2.3" ry="6.5" fill="#FFC1D6" />
          <ellipse
            cx="30"
            cy="7"
            rx="5.2"
            ry="11.5"
            fill="#FFF"
            stroke="#4A2C3A"
            strokeWidth="2.1"
          />
          <ellipse cx="30" cy="8" rx="2.3" ry="6.5" fill="#FFC1D6" />
          <ellipse
            cx="22"
            cy="29"
            rx="17"
            ry="14"
            fill="#FFF"
            stroke="#4A2C3A"
            strokeWidth="2.1"
          />
          <circle cx="15.5" cy="28" r="2" fill="#4A2C3A" />
          <circle cx="28.5" cy="28" r="2" fill="#4A2C3A" />
          <ellipse cx="11" cy="31.5" rx="3.2" ry="1.8" fill="#FF9EB5" opacity="0.8" />
          <ellipse cx="33" cy="31.5" rx="3.2" ry="1.8" fill="#FF9EB5" opacity="0.8" />
          <path
            d="M19.5 31.5 Q22 34 24.5 31.5"
            fill="none"
            stroke="#4A2C3A"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle
            cx="38"
            cy="31"
            r="4"
            fill="#FF9EBF"
            stroke="#4A2C3A"
            strokeWidth="1.3"
          />
          <circle cx="38" cy="31" r="1.6" fill="#FFE07D" />
        </g>

        <g
          id="animal-kitty"
          data-animal="kitty"
          role="button"
          tabIndex={0}
          aria-label="Trò chuyện với Mèo Dâu"
          onClick={() => onTapAnimal("kitty")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onTapAnimal("kitty");
            }
          }}
          className="cursor-pointer focus:outline-none"
          transform="translate(232, 308)"
        >
          <ellipse cx="20" cy="38" rx="14" ry="4" fill="#92CCA0" opacity="0.45" />
          <polygon
            points="8,18 10,6 19,14"
            fill="#FFF5F8"
            stroke="#4A2C3A"
            strokeWidth="2"
          />
          <polygon
            points="32,18 30,6 21,14"
            fill="#FFF5F8"
            stroke="#4A2C3A"
            strokeWidth="2"
          />
          <ellipse
            cx="20"
            cy="26"
            rx="14.5"
            ry="12"
            fill="#FFF5F8"
            stroke="#4A2C3A"
            strokeWidth="2"
          />
          <circle cx="14.5" cy="25" r="1.9" fill="#4A2C3A" />
          <circle cx="25.5" cy="25" r="1.9" fill="#4A2C3A" />
          <path
            d="M17.5 28.5 Q20 31 22.5 28.5"
            fill="none"
            stroke="#4A2C3A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <ellipse cx="11" cy="28" rx="2.6" ry="1.5" fill="#FF9EB5" opacity="0.8" />
          <ellipse cx="29" cy="28" rx="2.6" ry="1.5" fill="#FF9EB5" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
