"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Redo2,
  Scissors,
  Trash2,
  Undo2,
} from "lucide-react";
import { renderStrokeCommand } from "@/lib/drawing/brushes";
import {
  clearDrawingHistory,
  createDrawingHistory,
  pushDrawCommand,
  redoDrawing,
  renderDrawCommands,
  undoDrawing,
} from "@/lib/drawing/commands";
import { findAlphaBoundingBox } from "@/lib/drawing/diecut";
import { renderShapeCommand } from "@/lib/drawing/shapes";
import { createId } from "@/lib/ids";
import type {
  BrushType,
  CanvasBgId,
  DrawPoint,
  ShapeType,
  StrokeCommand,
} from "@/types/drawing";
import type { LocalCustomStickerRecord } from "@/types/models";
import { AttachDrawingFlow } from "./AttachDrawingFlow";
import { BrushDock, type ActiveDrawTool } from "./BrushDock";
import { SaveStickerModal } from "./SaveStickerModal";

export const LOGICAL_CANVAS_WIDTH = 640;
export const LOGICAL_CANVAS_HEIGHT = 560;

interface DrawingStudioProps {
  targetNoteId?: string | null;
  onBackFromNote?: () => void;
  onStickerSaved?: (record: LocalCustomStickerRecord) => void;
  onDrawingAttached?: (noteId: string, drawingId: string) => void;
}

function getCanvasBgClasses(bgId: CanvasBgId): string {
  switch (bgId) {
    case "transparent":
      return "bg-[radial-gradient(#FFE0EC_1px,transparent_1px)] [background-size:14px_14px] bg-[#FFFDFE]";
    case "white":
      return "bg-white";
    case "heart-grid":
      return "paper-heart";
    case "sakura-dashed":
      return "paper-dashed";
    case "piggy-plaid":
      return "paper-plaid";
  }
}

export function DrawingStudio({
  targetNoteId = null,
  onBackFromNote,
  onStickerSaved,
  onDrawingAttached,
}: DrawingStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<StrokeCommand | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [history, setHistory] = useState(() => createDrawingHistory([]));
  const [activeTool, setActiveTool] = useState<ActiveDrawTool>("brush");
  const [brush, setBrush] = useState<BrushType>("ink");
  const [shape, setShape] = useState<ShapeType>("heart");
  const [color, setColor] = useState("#D63D76");
  const [size, setSize] = useState(10);
  const [alpha, setAlpha] = useState(1);
  const [canvasBg, setCanvasBg] = useState<CanvasBgId>("transparent");

  const [saveStickerOpen, setSaveStickerOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [studioNotice, setStudioNotice] = useState<string | null>(null);
  const [studioError, setStudioError] = useState<string | null>(null);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderDrawCommands(ctx, canvas.width, canvas.height, history.present);
    if (activeStrokeRef.current) {
      renderStrokeCommand(ctx, activeStrokeRef.current);
    }
  }, [history.present]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  function scheduleRedraw() {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      redrawCanvas();
    });
  }

  function toCanvasPoint(
    clientX: number,
    clientY: number,
    pressure?: number,
  ): DrawPoint {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: pressure ?? 0.5 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      pressure: pressure && pressure > 0 ? pressure : 0.5,
    };
  }

  function hasNonEmptyInk(): boolean {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return findAlphaBoundingBox(data.data, canvas.width, canvas.height, 8) !== null;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    setStudioError(null);
    setStudioNotice(null);

    const pt = toCanvasPoint(e.clientX, e.clientY, e.pressure);

    if (activeTool === "shape") {
      const cmd = {
        kind: "shape" as const,
        id: createId("shp"),
        shape,
        color,
        cx: pt.x,
        cy: pt.y,
        radius: Math.max(24, size * 3.2),
        alpha,
      };
      setHistory((prev) => pushDrawCommand(prev, cmd));
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        renderShapeCommand(ctx, cmd);
      }
      return;
    }

    activePointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);

    const newStroke: StrokeCommand = {
      kind: "stroke",
      id: createId("str"),
      brush,
      color,
      size,
      alpha,
      points: [pt],
    };
    activeStrokeRef.current = newStroke;
    scheduleRedraw();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (
      activePointerIdRef.current === null ||
      activePointerIdRef.current !== e.pointerId ||
      !activeStrokeRef.current
    ) {
      return;
    }
    const pt = toCanvasPoint(e.clientX, e.clientY, e.pressure);
    activeStrokeRef.current = {
      ...activeStrokeRef.current,
      points: [...activeStrokeRef.current.points, pt],
    };
    scheduleRedraw();
  }

  function finishActiveStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (
      activePointerIdRef.current === null ||
      activePointerIdRef.current !== e.pointerId ||
      !activeStrokeRef.current
    ) {
      return;
    }
    const finished = activeStrokeRef.current;
    activeStrokeRef.current = null;
    activePointerIdRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setHistory((prev) => pushDrawCommand(prev, finished));
  }

  function handleOpenSaveSticker() {
    setStudioError(null);
    if (!hasNonEmptyInk()) {
      setStudioError("Bạn hãy vẽ ít nhất một nét trước khi cắt sticker nhé!");
      return;
    }
    setSaveStickerOpen(true);
  }

  function handleOpenAttachDrawing() {
    setStudioError(null);
    if (!hasNonEmptyInk()) {
      setStudioError("Bạn hãy vẽ ít nhất một nét trước khi đính kèm nhé!");
      return;
    }
    setAttachOpen(true);
  }

  return (
    <div
      data-drawing-studio="true"
      className="flex-1 min-w-0 w-full flex flex-col px-3 pt-3 pb-4 gap-2.5"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {targetNoteId && onBackFromNote ? (
            <button
              type="button"
              onClick={onBackFromNote}
              aria-label="Quay lại ghi chú"
              className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-white border border-[#FFD1E1] flex items-center justify-center text-[#D63D76] shrink-0"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-[16px] font-extrabold text-[#4A2C3A] truncate">
              Studio Vẽ Tay
            </h2>
            <p className="text-[11px] font-semibold text-[#8C5A6E] truncate">
              {activeTool === "shape"
                ? "Chạm lên bảng để thả hình khối"
                : "Vẽ nét tự do · cắt sticker viền trắng"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-draw-undo="true"
            disabled={history.past.length === 0}
            onClick={() => setHistory((prev) => undoDrawing(prev))}
            aria-label="Hoàn tác nét vẽ"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-white border border-[#FFD1E1] flex items-center justify-center text-[#4A2C3A] disabled:opacity-40"
          >
            <Undo2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-draw-redo="true"
            disabled={history.future.length === 0}
            onClick={() => setHistory((prev) => redoDrawing(prev))}
            aria-label="Làm lại nét vẽ"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-white border border-[#FFD1E1] flex items-center justify-center text-[#4A2C3A] disabled:opacity-40"
          >
            <Redo2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-draw-clear="true"
            disabled={history.present.length === 0}
            onClick={() => setHistory((prev) => clearDrawingHistory(prev))}
            aria-label="Xóa sạch khung vẽ"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#B52A5E] disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {studioError ? (
        <div
          role="alert"
          className="px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
        >
          {studioError}
        </div>
      ) : null}

      {studioNotice ? (
        <div
          role="status"
          className="px-3 py-2 rounded-xl bg-[#F3FCF7] border border-[#3E9B77] text-xs font-bold text-[#2E7A5D]"
        >
          {studioNotice}
        </div>
      ) : null}

      {/* Drawing canvas box */}
      <div
        className={`relative rounded-[24px] border-2 border-[#FFD1E1] k-shadow-sm overflow-hidden aspect-[8/7] w-full ${getCanvasBgClasses(canvasBg)}`}
      >
        <canvas
          ref={canvasRef}
          width={LOGICAL_CANVAS_WIDTH}
          height={LOGICAL_CANVAS_HEIGHT}
          data-draw-canvas="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishActiveStroke}
          onPointerCancel={finishActiveStroke}
          className="w-full h-full block touch-none cursor-crosshair"
        />
      </div>

      {/* Output action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          data-open-save-sticker="true"
          onClick={handleOpenSaveSticker}
          className="btn-press cursor-pointer min-h-[46px] px-3 rounded-2xl bg-[#FFF4D6] border-2 border-[#F6C85F] text-[#7A5200] text-xs font-extrabold inline-flex items-center justify-center gap-1.5"
        >
          <Scissors className="w-4 h-4" aria-hidden="true" />
          <span>Cắt làm Sticker</span>
        </button>

        <button
          type="button"
          data-open-attach-drawing="true"
          onClick={handleOpenAttachDrawing}
          className="btn-press cursor-pointer min-h-[46px] px-3 rounded-2xl bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 k-shadow-sm"
        >
          <ImagePlus className="w-4 h-4" aria-hidden="true" />
          <span>Đính kèm ghi chú</span>
        </button>
      </div>

      <BrushDock
        activeTool={activeTool}
        brush={brush}
        shape={shape}
        color={color}
        size={size}
        alpha={alpha}
        canvasBg={canvasBg}
        onSelectBrush={setBrush}
        onSelectShape={setShape}
        onSelectTool={setActiveTool}
        onColorChange={setColor}
        onSizeChange={setSize}
        onAlphaChange={setAlpha}
        onCanvasBgChange={setCanvasBg}
      />

      <SaveStickerModal
        open={saveStickerOpen}
        sourceCanvas={canvasRef.current}
        onClose={() => setSaveStickerOpen(false)}
        onSaved={(record) => {
          setSaveStickerOpen(false);
          setStudioNotice(`Đã lưu sticker "${record.name}" vào tab Tự vẽ!`);
          onStickerSaved?.(record);
        }}
      />

      <AttachDrawingFlow
        open={attachOpen}
        sourceCanvas={canvasRef.current}
        canvasBg={canvasBg}
        preselectedNoteId={targetNoteId}
        onClose={() => setAttachOpen(false)}
        onAttached={(noteId, drawingId) => {
          setAttachOpen(false);
          setStudioNotice("Đã đính kèm tranh vẽ vào ghi chú!");
          onDrawingAttached?.(noteId, drawingId);
        }}
      />
    </div>
  );
}
