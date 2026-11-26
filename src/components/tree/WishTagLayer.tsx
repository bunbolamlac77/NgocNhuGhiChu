"use client";

import React from "react";
import { WISH_BRANCH_SLOTS } from "@/lib/tree/progression";
import type { LocalWishRecord, WishCardStyle } from "@/types/models";

interface WishTagLayerProps {
  wishes: readonly LocalWishRecord[];
  onSelectWish: (wish: LocalWishRecord) => void;
}

function renderTagBody(style: WishCardStyle, done: boolean) {
  switch (style) {
    case "heart":
      return (
        <path
          d="M16 34 C6 26 4 19 4 15 A6.2 6.2 0 0 1 16 12 A6.2 6.2 0 0 1 28 15 C28 19 26 26 16 34 Z"
          fill={done ? "#FFE48A" : "#FF9EBF"}
          stroke={done ? "#D99416" : "#4A2C3A"}
          strokeWidth="1.8"
        />
      );
    case "star":
      return (
        <polygon
          points="16,5 19.5,14 29,14.5 21.5,20.5 24,30 16,24.5 8,30 10.5,20.5 3,14.5 12.5,14"
          fill={done ? "#FFE066" : "#FFF1A8"}
          stroke={done ? "#D99416" : "#4A2C3A"}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      );
    case "lantern":
      return (
        <g>
          <rect
            x="7"
            y="8"
            width="18"
            height="24"
            rx="8"
            fill={done ? "#FFE082" : "#FFD4E5"}
            stroke={done ? "#D99416" : "#D63D76"}
            strokeWidth="1.8"
          />
          <rect x="11" y="6" width="10" height="3.5" rx="1.5" fill="#4A2C3A" />
          <rect x="11" y="31" width="10" height="3.5" rx="1.5" fill="#4A2C3A" />
          <line
            x1="16"
            y1="34.5"
            x2="16"
            y2="41"
            stroke="#D63D76"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      );
    case "ema":
      return (
        <g>
          <path
            d="M4 9 L16 2 L28 9 L28 34 Q28 37 25 37 L7 37 Q4 37 4 34 Z"
            fill={done ? "#FFF0B8" : "#FFF7FA"}
            stroke={done ? "#D99416" : "#D63D76"}
            strokeWidth="1.9"
          />
          <path
            d="M16 17c-1.5-2-4.2-.6-3.4 1.6.6 1.7 3.4 3.5 3.4 3.5s2.8-1.8 3.4-3.5c.8-2.2-1.9-3.6-3.4-1.6z"
            fill={done ? "#E09F24" : "#FF79A8"}
          />
        </g>
      );
  }
}

export function WishTagLayer({ wishes, onSelectWish }: WishTagLayerProps) {
  const visible = wishes.slice(0, WISH_BRANCH_SLOTS.length);

  return (
    <g id="wish-tags-layer">
      {visible.map((wish, index) => {
        const slot = WISH_BRANCH_SLOTS[index] ?? WISH_BRANCH_SLOTS[0]!;
        return (
          <g
            key={wish.id}
            data-wish-tag={wish.id}
            data-wish-done={wish.done ? "true" : "false"}
            role="button"
            tabIndex={0}
            aria-label={`Điều ước: ${wish.text}`}
            onClick={() => onSelectWish(wish)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectWish(wish);
              }
            }}
            className="cursor-pointer focus:outline-none"
            transform={`translate(${slot.x - 16}, ${slot.y})`}
          >
            <rect x="-2" y="-6" width="36" height="46" fill="transparent" />
            <g
              className="anim-sway"
              style={{ animationDelay: `${index * 0.55}s` }}
            >
              {wish.done ? (
                <circle
                  cx="16"
                  cy="21"
                  r="22"
                  fill="url(#lanternGlow)"
                  opacity="0.92"
                />
              ) : null}
              <line
                x1="16"
                y1="-12"
                x2="16"
                y2="5"
                stroke="#D63D76"
                strokeWidth="1.6"
              />
              {renderTagBody(wish.style, wish.done)}
            </g>
          </g>
        );
      })}
    </g>
  );
}
