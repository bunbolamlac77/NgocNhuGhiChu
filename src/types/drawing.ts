export type BrushType = "ink" | "highlighter" | "dashed" | "eraser";

export type ShapeType =
  | "heart"
  | "star"
  | "flower"
  | "cloud"
  | "circle"
  | "speech-bubble";

export type CanvasBgId =
  | "transparent"
  | "white"
  | "heart-grid"
  | "sakura-dashed"
  | "piggy-plaid";

export interface DrawPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface StrokeCommand {
  kind: "stroke";
  id: string;
  brush: BrushType;
  color: string;
  size: number;
  alpha: number;
  points: DrawPoint[];
}

export interface ShapeCommand {
  kind: "shape";
  id: string;
  shape: ShapeType;
  color: string;
  cx: number;
  cy: number;
  radius: number;
  alpha: number;
}

export type DrawCommand = StrokeCommand | ShapeCommand;

export interface DieCutOptions {
  borderEnabled: boolean;
  shadowEnabled: boolean;
  maxDimension?: number;
  padding?: number;
  borderRadius?: number;
}

export interface DieCutResult {
  blob: Blob;
  mime: "image/webp" | "image/png";
  width: number;
  height: number;
  sizeBytes: number;
}
