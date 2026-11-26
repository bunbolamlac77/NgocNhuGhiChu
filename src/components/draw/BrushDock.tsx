"use client";

import React from "react";
import {
  Eraser,
  Highlighter,
  Minus,
  Palette,
  PenTool,
  Shapes,
} from "lucide-react";
import {
  BRUSH_OPTIONS,
  BRUSH_PALETTE,
  DRAW_CANVAS_BACKGROUNDS,
} from "@/lib/drawing/brushes";
import { SHAPE_OPTIONS } from "@/lib/drawing/shapes";
import type { BrushType, CanvasBgId, ShapeType } from "@/types/drawing";

export type ActiveDrawTool = "brush" | "shape";

interface BrushDockProps {
  activeTool: ActiveDrawTool;
  brush: BrushType;
  shape: ShapeType;
  color: string;
  size: number;
  alpha: number;
  canvasBg: CanvasBgId;
  onSelectBrush: (brush: BrushType) => void;
  onSelectShape: (shape: ShapeType) => void;
  onSelectTool: (tool: ActiveDrawTool) => void;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onAlphaChange: (alpha: number) => void;
  onCanvasBgChange: (bg: CanvasBgId) => void;
}

function renderBrushIcon(id: BrushType) {
  switch (id) {
    case "ink":
      return <PenTool className="w-4 h-4" aria-hidden="true" />;
    case "highlighter":
      return <Highlighter className="w-4 h-4" aria-hidden="true" />;
    case "dashed":
      return <Minus className="w-4 h-4" aria-hidden="true" />;
    case "eraser":
      return <Eraser className="w-4 h-4" aria-hidden="true" />;
  }
}

export function BrushDock({
  activeTool,
  brush,
  shape,
  color,
  size,
  alpha,
  canvasBg,
  onSelectBrush,
  onSelectShape,
  onSelectTool,
  onColorChange,
  onSizeChange,
  onAlphaChange,
  onCanvasBgChange,
}: BrushDockProps) {
  return (
    <div
      data-brush-dock="true"
      className="min-w-0 w-full rounded-[22px] bg-white border-2 border-[#FFD1E1] p-2.5 k-shadow-sm space-y-2"
    >
      {/* Row 1: Brushes + Shape mode toggle */}
      <div className="w-full min-w-0 flex items-center gap-1.5 overflow-x-auto pb-0.5 phone-scroll">
        {BRUSH_OPTIONS.map((opt) => {
          const active = activeTool === "brush" && brush === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              data-brush={opt.id}
              aria-pressed={active}
              onClick={() => {
                onSelectBrush(opt.id);
                onSelectTool("brush");
              }}
              className={`btn-press cursor-pointer shrink-0 min-h-[44px] px-2.5 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1.5 border transition ${
                active
                  ? "bg-[#D63D76] text-white border-[#B52A5E]"
                  : "bg-[#FFF5F8] text-[#4A2C3A] border-[#FFD1E1]"
              }`}
            >
              {renderBrushIcon(opt.id)}
              <span>{opt.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          data-tool-shapes="true"
          aria-pressed={activeTool === "shape"}
          onClick={() => onSelectTool(activeTool === "shape" ? "brush" : "shape")}
          className={`btn-press cursor-pointer shrink-0 min-h-[44px] px-2.5 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1.5 border transition ${
            activeTool === "shape"
              ? "bg-[#3E9B77] text-white border-[#2E7A5D]"
              : "bg-[#F3FCF7] text-[#3E9B77] border-[#BBE5CF]"
          }`}
        >
          <Shapes className="w-4 h-4" aria-hidden="true" />
          <span>Hình khối</span>
        </button>
      </div>

      {/* Optional row: 6 shape presets */}
      {activeTool === "shape" ? (
        <div
          role="group"
          aria-label="Chọn hình mẫu để chạm chèn lên khung vẽ"
          className="w-full min-w-0 flex items-center gap-1.5 overflow-x-auto pb-0.5 phone-scroll"
        >
          {SHAPE_OPTIONS.map((item) => {
            const active = shape === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-shape={item.id}
                aria-pressed={active}
                onClick={() => onSelectShape(item.id)}
                className={`btn-press cursor-pointer shrink-0 min-h-[44px] px-3 rounded-xl text-[11px] font-extrabold border transition ${
                  active
                    ? "bg-[#3E9B77] text-white border-[#2E7A5D]"
                    : "bg-[#FFF7FA] text-[#4A2C3A] border-[#FFD1E1]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Row 2: 16 pastel colors + free color picker */}
      <div className="w-full min-w-0 flex items-center gap-1 overflow-x-auto pb-0.5 phone-scroll">
        {BRUSH_PALETTE.map((swatch) => {
          const active = color.toLowerCase() === swatch.toLowerCase();
          return (
            <button
              key={swatch}
              type="button"
              data-color-swatch={swatch}
              aria-label={`Chọn màu ${swatch}`}
              aria-pressed={active}
              onClick={() => onColorChange(swatch)}
              className="btn-press cursor-pointer shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl"
            >
              <span
                className={`w-7 h-7 rounded-full border-2 transition ${
                  active
                    ? "border-[#4A2C3A] scale-110 ring-2 ring-[#D63D76]/30"
                    : "border-[#FFD1E1]"
                }`}
                style={{ backgroundColor: swatch }}
              />
            </button>
          );
        })}

        <label
          aria-label="Chọn màu tự do"
          className="relative btn-press cursor-pointer shrink-0 min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#D63D76]"
        >
          <Palette className="w-4 h-4" aria-hidden="true" />
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            aria-label="Bảng màu tự do"
            className="sr-only"
          />
        </label>
      </div>

      {/* Row 3: Size & Opacity sliders */}
      <div className="min-w-0 w-full grid grid-cols-2 gap-2.5 pt-0.5">
        <label className="min-w-0 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#8C5A6E]">
            <span>Cỡ nét</span>
            <span className="text-[#4A2C3A]">{size} px</span>
          </div>
          <input
            type="range"
            min={2}
            max={32}
            step={1}
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            aria-label="Cỡ nét vẽ"
            className="w-full min-w-0 accent-[#D63D76] h-7 cursor-pointer"
          />
        </label>

        <label className="min-w-0 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#8C5A6E]">
            <span>Độ đậm</span>
            <span className="text-[#4A2C3A]">{Math.round(alpha * 100)}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={100}
            step={5}
            value={Math.round(alpha * 100)}
            onChange={(e) => onAlphaChange(Number(e.target.value) / 100)}
            aria-label="Độ đậm nét vẽ"
            className="w-full min-w-0 accent-[#D63D76] h-7 cursor-pointer"
          />
        </label>
      </div>

      {/* Row 4: 5 canvas backgrounds */}
      <div className="w-full min-w-0 flex items-center gap-1.5 overflow-x-auto pt-0.5 phone-scroll">
        {DRAW_CANVAS_BACKGROUNDS.map((bg) => {
          const active = canvasBg === bg.id;
          return (
            <button
              key={bg.id}
              type="button"
              data-canvas-bg={bg.id}
              aria-pressed={active}
              onClick={() => onCanvasBgChange(bg.id)}
              className={`btn-press cursor-pointer shrink-0 min-h-[44px] px-2.5 rounded-xl text-[11px] font-bold border transition ${
                active
                  ? "bg-[#FFE8F1] border-[#D63D76] text-[#B52A5E]"
                  : "bg-[#FFF9FB] border-[#FFE0EC] text-[#8C5A6E]"
              }`}
            >
              {bg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
