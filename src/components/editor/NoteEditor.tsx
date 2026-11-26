"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  Lock,
  PenTool,
  Trash2,
  Unlock,
} from "lucide-react";
import { PaperCanvas } from "@/components/papers/PaperCanvas";
import { PAPER_TEMPLATES } from "@/components/papers/paper-templates";
import {
  decryptDrawingBlob,
  encryptDrawingBlob,
  encryptNotePayload,
  getSessionDek,
} from "@/lib/crypto/session-keys";
import {
  deleteLocalDrawing,
  listDrawingsByNote,
  saveLocalDrawing,
} from "@/lib/db/assets-repo";
import type { UpdateNotePatch } from "@/lib/db/notes-repo";
import { createId } from "@/lib/ids";
import { fetchRemoteAssetBlob } from "@/lib/sync/sync-engine";
import { clampPlacedSticker, MAX_STICKERS_PER_NOTE } from "@/lib/validation";
import type {
  ChecklistItem,
  LocalNoteRecord,
  NoteCategory,
  NotePayload,
  PaperTemplateId,
  PlacedSticker,
} from "@/types/models";
import { ChecklistEditor } from "./ChecklistEditor";
import { StickerControlsBar } from "./StickerControlsBar";
import { StickerLayer } from "./StickerLayer";
import { StickerTray, type CustomTraySticker } from "./StickerTray";

interface NoteEditorProps {
  note: LocalNoteRecord;
  initialDecryptedPayload?: NotePayload | null;
  customStickers?: CustomTraySticker[];
  onSave: (id: string, patch: UpdateNotePatch) => Promise<LocalNoteRecord>;
  onDelete: (id: string) => Promise<void>;
  onBack: () => void;
  onOpenDrawForNote?: (noteId: string) => void;
  onRequestSessionDek?: () => Promise<CryptoKey | null>;
}

const CATEGORY_OPTIONS: { id: NoteCategory; label: string }[] = [
  { id: "diary", label: "Nhật ký" },
  { id: "checklist", label: "Checklist" },
  { id: "draw", label: "Vẽ tay" },
  { id: "private", label: "Riêng tư" },
];

export function NoteEditor({
  note,
  initialDecryptedPayload = null,
  customStickers = [],
  onSave,
  onDelete,
  onBack,
  onOpenDrawForNote,
  onRequestSessionDek,
}: NoteEditorProps) {
  const initialPayload: NotePayload =
    (note.isLocked ? initialDecryptedPayload : note.payload) ?? {
      title: "",
      body: "",
      checklist: [],
      stickers: [],
      drawingIds: [],
    };

  const [isLocked, setIsLocked] = useState<boolean>(note.isLocked);
  const [templateId, setTemplateId] = useState<PaperTemplateId>(note.templateId);
  const [category, setCategory] = useState<NoteCategory>(note.category);
  const [dateTag, setDateTag] = useState<string>(note.dateTag ?? "");
  const [title, setTitle] = useState<string>(initialPayload.title);
  const [body, setBody] = useState<string>(initialPayload.body);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialPayload.checklist,
  );
  const [stickers, setStickers] = useState<PlacedSticker[]>(
    initialPayload.stickers,
  );
  const [drawingIds, setDrawingIds] = useState<string[]>(
    initialPayload.drawingIds,
  );
  const [drawingPreviews, setDrawingPreviews] = useState<
    Array<{ id: string; url: string }>
  >([]);
  const [interactMode, setInteractMode] = useState<"text" | "sticker">("text");
  const [selectedStickerUid, setSelectedStickerUid] = useState<string | null>(
    null,
  );
  const [stickerNotice, setStickerNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">(
    "saved",
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirtyRef = useRef(false);
  const deletedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  interface DraftSnapshot {
    isLocked: boolean;
    templateId: PaperTemplateId;
    category: NoteCategory;
    dateTag: string | null;
    payload: NotePayload;
  }

  const latestDraftRef = useRef<DraftSnapshot>({
    isLocked: note.isLocked,
    templateId: note.templateId,
    category: note.category,
    dateTag: note.dateTag,
    payload: initialPayload,
  });

  const buildSavePatch = useCallback(
    async (draft: DraftSnapshot): Promise<UpdateNotePatch> => {
      if (!draft.isLocked) {
        return {
          isLocked: false,
          templateId: draft.templateId,
          category: draft.category,
          dateTag: draft.dateTag,
          payload: draft.payload,
          encryptedPayload: null,
        };
      }
      const dek = getSessionDek();
      if (!dek) {
        throw new Error(
          "Khóa Ngăn Riêng Tư chưa mở trong phiên hiện tại. Không thể lưu bản rõ.",
        );
      }
      const encryptedPayload = await encryptNotePayload(
        dek,
        note.contentId,
        draft.payload,
      );
      return {
        isLocked: true,
        templateId: draft.templateId,
        category: draft.category,
        dateTag: draft.dateTag,
        payload: null,
        encryptedPayload,
      };
    },
    [note.contentId],
  );

  const customStickerUrls = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of customStickers) {
      map[s.id] = s.url;
    }
    return map;
  }, [customStickers]);

  useEffect(() => {
    latestDraftRef.current = {
      isLocked,
      templateId,
      category,
      dateTag: dateTag || null,
      payload: {
        title,
        body,
        checklist,
        stickers,
        drawingIds,
      },
    };
  }, [
    isLocked,
    templateId,
    category,
    dateTag,
    title,
    body,
    checklist,
    stickers,
    drawingIds,
  ]);

  useEffect(() => {
    let active = true;
    const createdUrls: string[] = [];

    async function loadDrawings() {
      if (drawingIds.length === 0) {
        setDrawingPreviews([]);
        return;
      }
      const records = await listDrawingsByNote(note.id);
      if (!active) return;
      const byId = new Map(records.map((r) => [r.id, r]));
      const next: Array<{ id: string; url: string }> = [];
      const dek = getSessionDek();

      for (const id of drawingIds) {
        let rec = byId.get(id);
        if (!rec) {
          try {
            const downloaded = await fetchRemoteAssetBlob("drawings", id);
            if (downloaded) {
              rec = await saveLocalDrawing({
                id,
                noteId: note.id,
                mime: downloaded.mime,
                isEncrypted: downloaded.isEncrypted,
                blob: downloaded.blob,
              });
            }
          } catch {
            // Keep resilient when offline
          }
        }
        if (!rec || !(rec.blob instanceof Blob)) continue;

        if (!rec.isEncrypted) {
          const url = URL.createObjectURL(rec.blob);
          createdUrls.push(url);
          next.push({ id, url });
        } else if (dek) {
          try {
            const plainBlob = await decryptDrawingBlob(dek, rec.id, rec.blob);
            const url = URL.createObjectURL(plainBlob);
            createdUrls.push(url);
            next.push({ id, url });
          } catch {
            // Ignore unreadable corrupted drawing
          }
        }
      }
      if (active) {
        setDrawingPreviews(next);
      }
    }

    void loadDrawings();

    return () => {
      active = false;
      for (const url of createdUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [note.id, drawingIds, isLocked]);

  const flushSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!dirtyRef.current || deletedRef.current) return;
    dirtyRef.current = false;
    setSaveState("saving");
    setSaveError(null);
    try {
      const patch = await buildSavePatch(latestDraftRef.current);
      await onSave(note.id, patch);
      setSaveState("saved");
    } catch (err) {
      dirtyRef.current = true;
      setSaveState("dirty");
      setSaveError(
        err instanceof Error ? err.message : "Không thể lưu ghi chú.",
      );
    }
  }, [note.id, onSave, buildSavePatch]);

  function scheduleAutosave(nextDraft: DraftSnapshot) {
    latestDraftRef.current = nextDraft;
    dirtyRef.current = true;
    setSaveState("dirty");
    setSaveError(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void flushSave();
    }, 400);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (dirtyRef.current && !deletedRef.current) {
        void buildSavePatch(latestDraftRef.current)
          .then((patch) => onSave(note.id, patch))
          .catch(() => undefined);
      }
    };
  }, [note.id, onSave, buildSavePatch]);

  function updateDraft(fields: {
    isLocked?: boolean;
    templateId?: PaperTemplateId;
    category?: NoteCategory;
    dateTag?: string;
    title?: string;
    body?: string;
    checklist?: ChecklistItem[];
    stickers?: PlacedSticker[];
    drawingIds?: string[];
  }) {
    const nextLocked = fields.isLocked !== undefined ? fields.isLocked : isLocked;
    const nextTemplate = fields.templateId ?? templateId;
    const nextCategory = fields.category ?? category;
    const nextDate = fields.dateTag !== undefined ? fields.dateTag : dateTag;
    const nextTitle = fields.title !== undefined ? fields.title : title;
    const nextBody = fields.body !== undefined ? fields.body : body;
    const nextChecklist = fields.checklist ?? checklist;
    const nextStickers = fields.stickers ?? stickers;
    const nextDrawingIds = fields.drawingIds ?? drawingIds;

    if (fields.isLocked !== undefined) setIsLocked(fields.isLocked);
    if (fields.templateId !== undefined) setTemplateId(fields.templateId);
    if (fields.category !== undefined) setCategory(fields.category);
    if (fields.dateTag !== undefined) setDateTag(fields.dateTag);
    if (fields.title !== undefined) setTitle(fields.title);
    if (fields.body !== undefined) setBody(fields.body);
    if (fields.checklist !== undefined) setChecklist(fields.checklist);
    if (fields.stickers !== undefined) setStickers(fields.stickers);
    if (fields.drawingIds !== undefined) setDrawingIds(fields.drawingIds);

    scheduleAutosave({
      isLocked: nextLocked,
      templateId: nextTemplate,
      category: nextCategory,
      dateTag: nextDate || null,
      payload: {
        title: nextTitle,
        body: nextBody,
        checklist: nextChecklist,
        stickers: nextStickers,
        drawingIds: nextDrawingIds,
      },
    });
  }

  async function handleTogglePrivate() {
    setSaveError(null);
    const dek =
      getSessionDek() ??
      (onRequestSessionDek ? await onRequestSessionDek() : null);
    if (!dek) {
      return;
    }

    const turningOn = !isLocked;
    const drawings = await listDrawingsByNote(note.id);
    if (turningOn) {
      for (const drw of drawings) {
        if (!drw.isEncrypted && drw.blob instanceof Blob) {
          const encBlob = await encryptDrawingBlob(dek, drw.id, drw.blob);
          await saveLocalDrawing({
            id: drw.id,
            noteId: note.id,
            mime: "application/octet-stream",
            isEncrypted: true,
            blob: encBlob,
          });
        }
      }
      const nextDraft: DraftSnapshot = {
        ...latestDraftRef.current,
        isLocked: true,
        category: "private",
      };
      setIsLocked(true);
      setCategory("private");
      latestDraftRef.current = nextDraft;
      dirtyRef.current = true;
      await flushSave();
    } else {
      for (const drw of drawings) {
        if (drw.isEncrypted && drw.blob instanceof Blob) {
          const plainBlob = await decryptDrawingBlob(dek, drw.id, drw.blob);
          await saveLocalDrawing({
            id: drw.id,
            noteId: note.id,
            mime: "image/webp",
            isEncrypted: false,
            blob: plainBlob,
          });
        }
      }
      const nextCat = category === "private" ? "diary" : category;
      const nextDraft: DraftSnapshot = {
        ...latestDraftRef.current,
        isLocked: false,
        category: nextCat,
      };
      setIsLocked(false);
      setCategory(nextCat);
      latestDraftRef.current = nextDraft;
      dirtyRef.current = true;
      await flushSave();
    }
  }

  async function handleRemoveDrawing(drawingId: string) {
    await deleteLocalDrawing(drawingId);
    updateDraft({
      drawingIds: drawingIds.filter((id) => id !== drawingId),
    });
  }

  async function handleOpenDraw() {
    if (!onOpenDrawForNote) return;
    await flushSave();
    onOpenDrawForNote(note.id);
  }

  function handleAddSticker(source: "builtin" | "custom", assetId: string) {
    if (stickers.length >= MAX_STICKERS_PER_NOTE) {
      setStickerNotice(
        `Tối đa ${MAX_STICKERS_PER_NOTE} sticker cho mỗi ghi chú.`,
      );
      return;
    }
    setStickerNotice(null);
    const maxZ = stickers.reduce((max, item) => Math.max(max, item.zIndex), 0);
    const newSticker = clampPlacedSticker({
      uid: createId("pstk"),
      source,
      assetId,
      xPct: 35 + ((stickers.length * 11) % 30),
      yPct: 35 + ((stickers.length * 13) % 30),
      scale: 1,
      rotation: 0,
      zIndex: maxZ + 1,
    });
    const next = [...stickers, newSticker];
    setInteractMode("sticker");
    setSelectedStickerUid(newSticker.uid);
    updateDraft({ stickers: next });
  }

  function handleMoveSticker(uid: string, xPct: number, yPct: number) {
    const next = stickers.map((st) =>
      st.uid === uid ? clampPlacedSticker({ ...st, xPct, yPct }) : st,
    );
    updateDraft({ stickers: next });
  }

  function handleBringToFront(uid: string) {
    const target = stickers.find((st) => st.uid === uid);
    if (!target) return;
    const maxZ = stickers.reduce((max, item) => Math.max(max, item.zIndex), 0);
    if (target.zIndex >= maxZ && maxZ > 0) return;
    const next = stickers.map((st) =>
      st.uid === uid ? { ...st, zIndex: maxZ + 1 } : st,
    );
    updateDraft({ stickers: next });
  }

  function handleScaleSelected(delta: number) {
    if (!selectedStickerUid) return;
    const next = stickers.map((st) =>
      st.uid === selectedStickerUid
        ? clampPlacedSticker({ ...st, scale: st.scale + delta })
        : st,
    );
    updateDraft({ stickers: next });
  }

  function handleRotateSelected(delta: number) {
    if (!selectedStickerUid) return;
    const next = stickers.map((st) =>
      st.uid === selectedStickerUid
        ? clampPlacedSticker({ ...st, rotation: st.rotation + delta })
        : st,
    );
    updateDraft({ stickers: next });
  }

  function handleDeleteSelected() {
    if (!selectedStickerUid) return;
    setStickerNotice(null);
    const next = stickers.filter((st) => st.uid !== selectedStickerUid);
    const lastRemaining = next[next.length - 1];
    setSelectedStickerUid(lastRemaining ? lastRemaining.uid : null);
    updateDraft({ stickers: next });
  }

  async function handleBackClick() {
    await flushSave();
    onBack();
  }

  async function handleDeleteClick() {
    deletedRef.current = true;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await onDelete(note.id);
  }

  const selectedSticker =
    stickers.find((st) => st.uid === selectedStickerUid) ?? null;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-2.5 py-2 flex items-center justify-between gap-1.5 border-b border-[#FFE0EC] bg-white/90">
        <button
          type="button"
          onClick={() => void handleBackClick()}
          className="btn-press cursor-pointer min-h-[44px] min-w-[44px] px-2 rounded-2xl text-xs font-extrabold text-[#4A2C3A] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Quay lại</span>
        </button>

        <span
          data-save-status={saveState}
          className="text-[11px] font-bold text-[#8C5A6E] whitespace-nowrap truncate min-w-0"
        >
          {saveState === "saving"
            ? "Đang lưu..."
            : saveState === "dirty"
              ? "Chưa lưu"
              : "Đã lưu máy"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-toggle-private="true"
            data-private-locked={isLocked ? "true" : "false"}
            onClick={() => void handleTogglePrivate()}
            aria-label={isLocked ? "Bỏ khóa riêng tư" : "Bật khóa riêng tư"}
            aria-pressed={isLocked}
            className={`btn-press cursor-pointer min-h-[44px] px-2 rounded-2xl border text-[11px] font-extrabold inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
              isLocked
                ? "bg-[#FFE0EC] border-[#D63D76] text-[#B52A5E]"
                : "bg-[#FFF5F8] border-[#FFD1E1] text-[#8C5A6E]"
            }`}
          >
            {isLocked ? (
              <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Unlock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>Khóa riêng</span>
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteClick()}
            aria-label="Xóa ghi chú"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#B52A5E] shrink-0"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => void flushSave()}
            className="btn-press cursor-pointer min-h-[44px] min-w-[44px] px-2.5 rounded-full bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Lưu</span>
          </button>
        </div>
      </div>

      {saveError ? (
        <div
          role="alert"
          className="mx-3 mt-2 px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
        >
          {saveError}
        </div>
      ) : null}

      <div className="flex-1 px-3 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div
            role="group"
            aria-label="Chế độ tương tác trên giấy"
            className="inline-flex rounded-full p-1 bg-white border border-[#FFD1E1] k-shadow-sm"
          >
            <button
              type="button"
              data-editor-mode="text"
              aria-pressed={interactMode === "text"}
              onClick={() => {
                setInteractMode("text");
                setSelectedStickerUid(null);
              }}
              className={`btn-press cursor-pointer min-h-[44px] px-3.5 rounded-full text-xs font-extrabold transition ${
                interactMode === "text"
                  ? "bg-[#D63D76] text-white"
                  : "text-[#8C5A6E]"
              }`}
            >
              Sửa chữ
            </button>
            <button
              type="button"
              data-editor-mode="sticker"
              aria-pressed={interactMode === "sticker"}
              onClick={() => setInteractMode("sticker")}
              className={`btn-press cursor-pointer min-h-[44px] px-3.5 rounded-full text-xs font-extrabold transition ${
                interactMode === "sticker"
                  ? "bg-[#D63D76] text-white"
                  : "text-[#8C5A6E]"
              }`}
            >
              Kéo Sticker
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenDrawForNote ? (
              <button
                type="button"
                data-editor-draw-attach="true"
                onClick={() => void handleOpenDraw()}
                aria-label="Vẽ tranh đính kèm vào ghi chú"
                className="btn-press cursor-pointer min-h-[44px] px-3 rounded-full bg-[#FFF4D6] border border-[#F6C85F] text-[#7A5200] text-[11px] font-extrabold inline-flex items-center gap-1"
              >
                <PenTool className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vẽ tay</span>
              </button>
            ) : null}
            <span className="text-[11px] font-bold text-[#8C5A6E]">
              {stickers.length}/{MAX_STICKERS_PER_NOTE} sticker
            </span>
          </div>
        </div>

        <PaperCanvas
          templateId={templateId}
          innerClassName="min-h-[300px] flex flex-col justify-between"
          overlay={
            <StickerLayer
              stickers={stickers}
              mode={interactMode}
              selectedUid={selectedStickerUid}
              customStickerUrls={customStickerUrls}
              onSelect={setSelectedStickerUid}
              onMove={handleMoveSticker}
              onBringToFront={handleBringToFront}
            />
          }
        >
          <div
            className={
              interactMode === "sticker"
                ? "pointer-events-none select-none space-y-2.5"
                : "space-y-2.5"
            }
          >
            <div className="flex flex-wrap items-center gap-2 pr-6">
              <label className="inline-flex items-center gap-1.5 px-2.5 min-h-[44px] rounded-xl bg-white/90 border border-[#FFD1E1] text-[11px] font-bold text-[#B52A5E]">
                <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <input
                  type="date"
                  value={dateTag}
                  onChange={(e) => updateDraft({ dateTag: e.target.value })}
                  aria-label="Ngày gắn trên ghi chú"
                  className="bg-transparent text-[11px] font-bold text-[#B52A5E] focus:outline-none"
                />
              </label>

              <label className="inline-flex items-center min-h-[44px] px-2.5 rounded-xl bg-white/90 border border-[#FFD1E1] text-[11px] font-bold text-[#4A2C3A]">
                <span className="sr-only">Danh mục ghi chú</span>
                <select
                  value={category}
                  onChange={(e) =>
                    updateDraft({ category: e.target.value as NoteCategory })
                  }
                  aria-label="Danh mục ghi chú"
                  className="bg-transparent text-[11px] font-bold text-[#4A2C3A] focus:outline-none cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="Tiêu đề ghi chú..."
              aria-label="Tiêu đề ghi chú"
              className="w-full bg-transparent text-[16px] font-extrabold text-[#4A2C3A] placeholder:text-[#8C5A6E]/70 focus:outline-none"
            />

            <textarea
              rows={6}
              value={body}
              onChange={(e) => updateDraft({ body: e.target.value })}
              placeholder="Viết điều Ngọc Như muốn giữ lại hôm nay..."
              aria-label="Nội dung ghi chú"
              className="w-full bg-transparent text-xs text-[#4A2C3A] leading-[26px] placeholder:text-[#8C5A6E]/70 focus:outline-none resize-y"
            />

            <ChecklistEditor
              items={checklist}
              onChange={(next) => updateDraft({ checklist: next })}
            />

            {drawingPreviews.length > 0 ? (
              <div
                data-attached-drawings="true"
                className="pt-2 space-y-2 border-t border-dashed border-[#FFD1E1]"
              >
                <div className="text-[11px] font-extrabold text-[#B52A5E]">
                  Tranh vẽ đính kèm ({drawingPreviews.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {drawingPreviews.map((item) => (
                    <div
                      key={item.id}
                      data-attached-drawing={item.id}
                      className="relative rounded-2xl border border-[#FFD1E1] bg-white/90 p-2 k-shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt="Tranh vẽ tay đính kèm"
                        className="w-full max-h-[220px] object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => void handleRemoveDrawing(item.id)}
                        aria-label="Xóa tranh vẽ đính kèm"
                        className="btn-press cursor-pointer absolute top-2 right-2 min-w-[44px] min-h-[44px] rounded-xl bg-white/95 border border-[#FFD1E1] flex items-center justify-center text-[#B52A5E]"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </PaperCanvas>

        {stickerNotice ? (
          <div
            role="status"
            className="px-3 py-2 rounded-xl bg-[#FFF4D6] border border-[#F6C85F] text-xs font-bold text-[#7A5200]"
          >
            {stickerNotice}
          </div>
        ) : null}

        <StickerControlsBar
          selectedSticker={interactMode === "sticker" ? selectedSticker : null}
          stickerCount={stickers.length}
          maxStickers={MAX_STICKERS_PER_NOTE}
          onScaleChange={handleScaleSelected}
          onRotateChange={handleRotateSelected}
          onBringToFront={() => {
            if (selectedStickerUid) handleBringToFront(selectedStickerUid);
          }}
          onDelete={handleDeleteSelected}
        />

        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold text-[#8C5A6E]">
            Chọn mẫu giấy
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {PAPER_TEMPLATES.map((tpl) => {
              const active = tpl.id === templateId;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  data-select-template={tpl.id}
                  aria-pressed={active}
                  onClick={() => updateDraft({ templateId: tpl.id })}
                  className={`btn-press cursor-pointer shrink-0 min-h-[44px] px-3 rounded-xl text-[11px] font-extrabold transition ${
                    tpl.swatchClass
                  } ${
                    active
                      ? "border-2 border-[#D63D76] text-[#B52A5E]"
                      : "border text-[#4A2C3A]"
                  }`}
                >
                  {tpl.shortName}
                </button>
              );
            })}
          </div>
        </div>

        <StickerTray
          customStickers={customStickers}
          onAddSticker={handleAddSticker}
        />
      </div>
    </div>
  );
}
