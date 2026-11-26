"use client";

import React, { useRef } from "react";
import { BuiltinStickerSvg } from "@/components/stickers/builtin-stickers";
import { clamp } from "@/lib/validation";
import type { PlacedSticker } from "@/types/models";

interface StickerLayerProps {
  stickers: PlacedSticker[];
  mode: "text" | "sticker";
  selectedUid: string | null;
  customStickerUrls?: Record<string, string>;
  onSelect: (uid: string | null) => void;
  onMove: (uid: string, xPct: number, yPct: number) => void;
  onBringToFront: (uid: string) => void;
}

interface DragState {
  uid: string;
  offsetX: number;
  offsetY: number;
  rect: DOMRect;
}

export function StickerLayer({
  stickers,
  mode,
  selectedUid,
  customStickerUrls,
  onSelect,
  onMove,
  onBringToFront,
}: StickerLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  function handleBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "sticker") return;
    if (e.target === e.currentTarget) {
      onSelect(null);
    }
  }

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    sticker: PlacedSticker,
  ) {
    if (mode !== "sticker") return;
    e.stopPropagation();

    onSelect(sticker.uid);
    onBringToFront(sticker.uid);

    const layerRect = layerRef.current?.getBoundingClientRect();
    if (!layerRect || layerRect.width <= 0 || layerRect.height <= 0) return;

    const centerX = layerRect.left + (sticker.xPct / 100) * layerRect.width;
    const centerY = layerRect.top + (sticker.yPct / 100) * layerRect.height;

    dragRef.current = {
      uid: sticker.uid,
      offsetX: e.clientX - centerX,
      offsetY: e.clientY - centerY,
      rect: layerRect,
    };

    if (typeof e.currentTarget.setPointerCapture === "function") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Bỏ qua trong môi trường giả lập không có pointerId hợp lệ
      }
    }
  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLDivElement>,
    uid: string,
  ) {
    const drag = dragRef.current;
    if (!drag || drag.uid !== uid || mode !== "sticker") return;
    const rawX = ((e.clientX - drag.offsetX - drag.rect.left) / drag.rect.width) * 100;
    const rawY = ((e.clientY - drag.offsetY - drag.rect.top) / drag.rect.height) * 100;
    const xPct = Math.round(clamp(rawX, 4, 96) * 10) / 10;
    const yPct = Math.round(clamp(rawY, 4, 96) * 10) / 10;
    onMove(uid, xPct, yPct);
  }

  function stopDrag(e: React.PointerEvent<HTMLDivElement>, uid: string) {
    if (dragRef.current?.uid === uid) {
      dragRef.current = null;
    }
    if (typeof e.currentTarget.releasePointerCapture === "function") {
      try {
        if (
          typeof e.currentTarget.hasPointerCapture !== "function" ||
          e.currentTarget.hasPointerCapture(e.pointerId)
        ) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Không làm gián đoạn tương tác
      }
    }
  }

  return (
    <div
      ref={layerRef}
      data-sticker-layer="true"
      data-interact-mode={mode}
      onClick={handleBackgroundClick}
      className={`absolute inset-0 z-20 ${
        mode === "sticker" ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {stickers.map((st) => {
        const isSelected = mode === "sticker" && st.uid === selectedUid;
        const customUrl =
          st.source === "custom" ? customStickerUrls?.[st.assetId] : undefined;

        return (
          <div
            key={st.uid}
            data-placed-sticker={st.uid}
            data-sticker-source={st.source}
            data-sticker-asset={st.assetId}
            data-x-pct={String(st.xPct)}
            data-y-pct={String(st.yPct)}
            data-scale={String(st.scale)}
            data-rotation={String(st.rotation)}
            data-z-index={String(st.zIndex)}
            onPointerDown={(e) => handlePointerDown(e, st)}
            onPointerMove={(e) => handlePointerMove(e, st.uid)}
            onPointerUp={(e) => stopDrag(e, st.uid)}
            onPointerCancel={(e) => stopDrag(e, st.uid)}
            style={{
              left: `${st.xPct}%`,
              top: `${st.yPct}%`,
              zIndex: 10 + st.zIndex,
              transform: `translate(-50%, -50%) scale(${st.scale}) rotate(${st.rotation}deg)`,
            }}
            className={`floating-sticker ${isSelected ? "selected" : ""}`}
          >
            {st.source === "builtin" ? (
              <div className="diecut-shadow pointer-events-none">
                <BuiltinStickerSvg id={st.assetId} className="w-12 h-12" />
              </div>
            ) : customUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customUrl}
                alt="Sticker tự vẽ"
                draggable={false}
                className="w-14 h-14 object-contain diecut-shadow pointer-events-none"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl border border-dashed border-[#FFB7CE] bg-white/80 pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
}
