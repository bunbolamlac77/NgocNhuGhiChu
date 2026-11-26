import type { CanvasBgId, DrawCommand } from "@/types/drawing";
import { renderStrokeCommand } from "./brushes";
import { renderShapeCommand } from "./shapes";

export const MAX_UNDO_HISTORY = 40;

export interface DrawingHistoryState {
  past: DrawCommand[][];
  present: DrawCommand[];
  future: DrawCommand[][];
}

export function createDrawingHistory(
  initial: DrawCommand[] = [],
): DrawingHistoryState {
  return {
    past: [],
    present: initial,
    future: [],
  };
}

export function pushDrawCommand(
  history: DrawingHistoryState,
  command: DrawCommand,
): DrawingHistoryState {
  const nextPast = [...history.past, history.present];
  if (nextPast.length > MAX_UNDO_HISTORY) {
    nextPast.shift();
  }
  return {
    past: nextPast,
    present: [...history.present, command],
    future: [],
  };
}

export function undoDrawing(history: DrawingHistoryState): DrawingHistoryState {
  const previous = history.past[history.past.length - 1];
  if (!previous) return history;
  const nextPast = history.past.slice(0, -1);
  return {
    past: nextPast,
    present: previous,
    future: [history.present, ...history.future].slice(0, MAX_UNDO_HISTORY),
  };
}

export function redoDrawing(history: DrawingHistoryState): DrawingHistoryState {
  const [next, ...restFuture] = history.future;
  if (!next) return history;
  const nextPast = [...history.past, history.present].slice(-MAX_UNDO_HISTORY);
  return {
    past: nextPast,
    present: next,
    future: restFuture,
  };
}

export function clearDrawingHistory(
  history: DrawingHistoryState,
): DrawingHistoryState {
  if (history.present.length === 0) return history;
  const nextPast = [...history.past, history.present].slice(-MAX_UNDO_HISTORY);
  return {
    past: nextPast,
    present: [],
    future: [],
  };
}

export function paintCanvasBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgId: CanvasBgId,
): void {
  if (bgId === "transparent") return;

  ctx.save();
  try {
    if (bgId === "white") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      return;
    }

    if (bgId === "heart-grid") {
      ctx.fillStyle = "#FFF7FA";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(214, 61, 118, 0.16)";
      for (let y = 14; y < height; y += 22) {
        for (let x = 14; x < width; x += 22) {
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    if (bgId === "sakura-dashed") {
      ctx.fillStyle = "#FFF5F8";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255, 138, 179, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      for (let y = 28; y < height; y += 26) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(width - 10, y);
        ctx.stroke();
      }
      return;
    }

    ctx.fillStyle = "#FFFAFC";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 173, 200, 0.25)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } finally {
    ctx.restore();
  }
}

export function renderDrawCommands(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  commands: readonly DrawCommand[],
): void {
  ctx.clearRect(0, 0, width, height);
  for (const cmd of commands) {
    if (cmd.kind === "stroke") {
      renderStrokeCommand(ctx, cmd);
    } else {
      renderShapeCommand(ctx, cmd);
    }
  }
}
