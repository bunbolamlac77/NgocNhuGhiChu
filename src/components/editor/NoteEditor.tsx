"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Calendar, Check, Trash2 } from "lucide-react";
import { PaperCanvas } from "@/components/papers/PaperCanvas";
import { PAPER_TEMPLATES } from "@/components/papers/paper-templates";
import type { UpdateNotePatch } from "@/lib/db/notes-repo";
import type {
  ChecklistItem,
  LocalNoteRecord,
  NoteCategory,
  PaperTemplateId,
} from "@/types/models";
import { ChecklistEditor } from "./ChecklistEditor";

interface NoteEditorProps {
  note: LocalNoteRecord;
  onSave: (id: string, patch: UpdateNotePatch) => Promise<LocalNoteRecord>;
  onDelete: (id: string) => Promise<void>;
  onBack: () => void;
}

const CATEGORY_OPTIONS: { id: NoteCategory; label: string }[] = [
  { id: "diary", label: "Nhật ký" },
  { id: "checklist", label: "Checklist" },
  { id: "draw", label: "Vẽ tay" },
  { id: "private", label: "Riêng tư" },
];

export function NoteEditor({
  note,
  onSave,
  onDelete,
  onBack,
}: NoteEditorProps) {
  const initialPayload = note.payload ?? {
    title: "",
    body: "",
    checklist: [],
    stickers: [],
    drawingIds: [],
  };

  const [templateId, setTemplateId] = useState<PaperTemplateId>(note.templateId);
  const [category, setCategory] = useState<NoteCategory>(note.category);
  const [dateTag, setDateTag] = useState<string>(note.dateTag ?? "");
  const [title, setTitle] = useState<string>(initialPayload.title);
  const [body, setBody] = useState<string>(initialPayload.body);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initialPayload.checklist,
  );
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">(
    "saved",
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirtyRef = useRef(false);
  const deletedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPatchRef = useRef<UpdateNotePatch>({
    templateId: note.templateId,
    category: note.category,
    dateTag: note.dateTag,
    payload: initialPayload,
  });

  useEffect(() => {
    latestPatchRef.current = {
      templateId,
      category,
      dateTag: dateTag || null,
      payload: {
        title,
        body,
        checklist,
        stickers: initialPayload.stickers,
        drawingIds: initialPayload.drawingIds,
      },
    };
  }, [
    templateId,
    category,
    dateTag,
    title,
    body,
    checklist,
    initialPayload.stickers,
    initialPayload.drawingIds,
  ]);

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
      await onSave(note.id, latestPatchRef.current);
      setSaveState("saved");
    } catch (err) {
      dirtyRef.current = true;
      setSaveState("dirty");
      setSaveError(
        err instanceof Error ? err.message : "Không thể lưu ghi chú.",
      );
    }
  }, [note.id, onSave]);

  function scheduleAutosave(nextPatch: UpdateNotePatch) {
    latestPatchRef.current = nextPatch;
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
        void onSave(note.id, latestPatchRef.current);
      }
    };
  }, [note.id, onSave]);

  function updateDraft(fields: {
    templateId?: PaperTemplateId;
    category?: NoteCategory;
    dateTag?: string;
    title?: string;
    body?: string;
    checklist?: ChecklistItem[];
  }) {
    const nextTemplate = fields.templateId ?? templateId;
    const nextCategory = fields.category ?? category;
    const nextDate = fields.dateTag !== undefined ? fields.dateTag : dateTag;
    const nextTitle = fields.title !== undefined ? fields.title : title;
    const nextBody = fields.body !== undefined ? fields.body : body;
    const nextChecklist = fields.checklist ?? checklist;

    if (fields.templateId !== undefined) setTemplateId(fields.templateId);
    if (fields.category !== undefined) setCategory(fields.category);
    if (fields.dateTag !== undefined) setDateTag(fields.dateTag);
    if (fields.title !== undefined) setTitle(fields.title);
    if (fields.body !== undefined) setBody(fields.body);
    if (fields.checklist !== undefined) setChecklist(fields.checklist);

    scheduleAutosave({
      templateId: nextTemplate,
      category: nextCategory,
      dateTag: nextDate || null,
      payload: {
        title: nextTitle,
        body: nextBody,
        checklist: nextChecklist,
        stickers: initialPayload.stickers,
        drawingIds: initialPayload.drawingIds,
      },
    });
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

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-[#FFE0EC] bg-white/90">
        <button
          type="button"
          onClick={() => void handleBackClick()}
          className="btn-press cursor-pointer min-h-[44px] min-w-[44px] px-2.5 rounded-2xl text-xs font-extrabold text-[#4A2C3A] inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Quay lại</span>
        </button>

        <span
          data-save-status={saveState}
          className="text-[11px] font-bold text-[#8C5A6E]"
        >
          {saveState === "saving"
            ? "Đang lưu..."
            : saveState === "dirty"
              ? "Chưa lưu"
              : "Đã lưu máy"}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleDeleteClick()}
            aria-label="Xóa ghi chú"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#B52A5E]"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => void flushSave()}
            className="btn-press cursor-pointer min-h-[44px] min-w-[44px] px-3.5 rounded-full bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
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

      <div className="flex-1 px-3 py-3 space-y-3">
        <PaperCanvas
          templateId={templateId}
          innerClassName="min-h-[300px] flex flex-col justify-between space-y-2.5"
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
        </PaperCanvas>

        <div className="space-y-1.5">
          <div className="text-[11px] font-extrabold text-[#8C5A6E]">
            Chọn mẫu giấy
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 phone-scroll">
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
      </div>
    </div>
  );
}
