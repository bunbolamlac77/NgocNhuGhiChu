"use client";

import React, { useEffect, useState } from "react";
import { ImagePlus, Plus, X } from "lucide-react";
import {
  decryptNotePayload,
  encryptDrawingBlob,
  encryptNotePayload,
  getSessionDek,
} from "@/lib/crypto/session-keys";
import { saveLocalDrawing } from "@/lib/db/assets-repo";
import {
  createLocalNote,
  listActiveNotes,
  updateLocalNote,
} from "@/lib/db/notes-repo";
import { exportFlatDrawing } from "@/lib/drawing/diecut";
import { createId } from "@/lib/ids";
import type { CanvasBgId } from "@/types/drawing";
import type { LocalNoteRecord } from "@/types/models";

interface AttachDrawingFlowProps {
  open: boolean;
  sourceCanvas: HTMLCanvasElement | null;
  canvasBg: CanvasBgId;
  preselectedNoteId?: string | null;
  onClose: () => void;
  onAttached: (noteId: string, drawingId: string) => void;
}

export function AttachDrawingFlow({
  open,
  sourceCanvas,
  canvasBg,
  preselectedNoteId = null,
  onClose,
  onAttached,
}: AttachDrawingFlowProps) {
  const [notes, setNotes] = useState<LocalNoteRecord[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string>("__new__");
  const [newNoteTitle, setNewNoteTitle] = useState("Tranh vẽ mới");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    async function loadOptions() {
      const all = await listActiveNotes();
      if (!active) return;
      const dek = getSessionDek();
      const unlocked = all.filter(
        (item) =>
          (!item.isLocked && item.payload !== null) ||
          (item.isLocked && item.id === preselectedNoteId && dek !== null),
      );
      setNotes(unlocked);
      const firstUnlocked = unlocked[0];
      if (preselectedNoteId && unlocked.some((n) => n.id === preselectedNoteId)) {
        setSelectedNoteId(preselectedNoteId);
      } else if (firstUnlocked) {
        setSelectedNoteId(firstUnlocked.id);
      } else {
        setSelectedNoteId("__new__");
      }
      setError(null);
    }
    void loadOptions();
    return () => {
      active = false;
    };
  }, [open, preselectedNoteId]);

  if (!open) return null;

  async function handleConfirmAttach() {
    if (!sourceCanvas) return;
    setSaving(true);
    setError(null);

    try {
      const exported = await exportFlatDrawing(sourceCanvas, canvasBg);
      let targetNote: LocalNoteRecord;

      if (selectedNoteId === "__new__") {
        targetNote = await createLocalNote({
          templateId: "sakura-dashed",
          category: "draw",
          title: newNoteTitle.trim() || "Tranh vẽ mới",
          body: "",
        });
      } else {
        const found = notes.find((n) => n.id === selectedNoteId);
        if (!found) {
          throw new Error("Không tìm thấy ghi chú để đính kèm.");
        }
        targetNote = found;
      }

      if (targetNote.isLocked) {
        const dek = getSessionDek();
        if (!dek || !targetNote.encryptedPayload) {
          throw new Error("Cần mở khóa Ngăn Riêng Tư để đính kèm tranh.");
        }
        const drawingId = createId("drw");
        const encBlob = await encryptDrawingBlob(dek, drawingId, exported.blob);
        const drawing = await saveLocalDrawing({
          id: drawingId,
          noteId: targetNote.id,
          mime: "application/octet-stream",
          isEncrypted: true,
          blob: encBlob,
        });
        const plainPayload = await decryptNotePayload(
          dek,
          targetNote.contentId,
          targetNote.encryptedPayload,
        );
        const encryptedPayload = await encryptNotePayload(
          dek,
          targetNote.contentId,
          {
            ...plainPayload,
            drawingIds: [...plainPayload.drawingIds, drawing.id],
          },
        );
        await updateLocalNote(targetNote.id, {
          isLocked: true,
          payload: null,
          encryptedPayload,
        });
        setSaving(false);
        onAttached(targetNote.id, drawing.id);
        return;
      }

      const drawing = await saveLocalDrawing({
        noteId: targetNote.id,
        mime: exported.mime,
        isEncrypted: false,
        blob: exported.blob,
      });

      const prevPayload = targetNote.payload ?? {
        title: "",
        body: "",
        checklist: [],
        stickers: [],
        drawingIds: [],
      };
      await updateLocalNote(targetNote.id, {
        payload: {
          ...prevPayload,
          drawingIds: [...prevPayload.drawingIds, drawing.id],
        },
      });

      setSaving(false);
      onAttached(targetNote.id, drawing.id);
    } catch (err) {
      setSaving(false);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể đính kèm tranh vẽ vào ghi chú.",
      );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attach-drawing-title"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/45 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[360px] rounded-[28px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="attach-drawing-title"
            className="text-[16px] font-extrabold text-[#4A2C3A] flex items-center gap-2"
          >
            <ImagePlus className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
            <span>Đính kèm vào ghi chú</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại đính kèm tranh"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] flex items-center justify-center text-[#8C5A6E]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className="px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
          >
            {error}
          </div>
        ) : null}

        <div className="space-y-2 max-h-[240px] overflow-y-auto phone-scroll pr-0.5">
          <button
            type="button"
            data-attach-option="__new__"
            aria-pressed={selectedNoteId === "__new__"}
            onClick={() => setSelectedNoteId("__new__")}
            className={`btn-press cursor-pointer w-full min-h-[48px] px-3 py-2 rounded-2xl border text-left flex items-center gap-2 text-xs font-extrabold ${
              selectedNoteId === "__new__"
                ? "bg-[#FFF0F5] border-[#D63D76] text-[#B52A5E]"
                : "bg-[#FFF9FB] border-[#FFE0EC] text-[#4A2C3A]"
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Tạo ghi chú vẽ tay mới</span>
          </button>

          {selectedNoteId === "__new__" ? (
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Tiêu đề ghi chú mới..."
              aria-label="Tiêu đề ghi chú mới cho tranh vẽ"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A] focus:outline-none focus:border-[#D63D76]"
            />
          ) : null}

          {notes.map((n) => {
            const active = selectedNoteId === n.id;
            return (
              <button
                key={n.id}
                type="button"
                data-attach-option={n.id}
                aria-pressed={active}
                onClick={() => setSelectedNoteId(n.id)}
                className={`btn-press cursor-pointer w-full min-h-[48px] px-3 py-2 rounded-2xl border text-left transition ${
                  active
                    ? "bg-[#FFF0F5] border-[#D63D76] text-[#B52A5E]"
                    : "bg-white border-[#FFE0EC] text-[#4A2C3A]"
                }`}
              >
                <div className="text-xs font-extrabold truncate">
                  {n.payload?.title?.trim() || "(Chưa có tiêu đề)"}
                </div>
                <div className="text-[10px] font-semibold text-[#8C5A6E]">
                  {n.dateTag ?? "Ghi chú"} · {n.payload?.drawingIds.length ?? 0} tranh
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-press cursor-pointer flex-1 min-h-[44px] rounded-full bg-[#FFF0F5] text-[#8C5A6E] text-xs font-extrabold"
          >
            Hủy
          </button>
          <button
            type="button"
            data-attach-confirm="true"
            disabled={saving}
            onClick={() => void handleConfirmAttach()}
            className="btn-press cursor-pointer flex-[1.5] min-h-[44px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold disabled:opacity-45"
          >
            {saving ? "Đang lưu..." : "Đính kèm ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
