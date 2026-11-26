import React from "react";
import { PaperCanvas } from "@/components/papers/PaperCanvas";
import { BuiltinStickerSvg } from "@/components/stickers/builtin-stickers";
import type { LocalNoteRecord } from "@/types/models";

interface NoteCardProps {
  note: LocalNoteRecord;
  onOpen: (id: string) => void;
  onToggleChecklist: (noteId: string, itemId: string) => void;
}

function formatShortDate(dateTag: string | null, createdAt: number): string {
  if (dateTag && /^\d{4}-\d{2}-\d{2}$/.test(dateTag)) {
    const [, month, day] = dateTag.split("-");
    return `${day}/${month}`;
  }
  const d = new Date(createdAt);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

export function HeartTickIcon({ checked }: { checked: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="w-4 h-4 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M10 17 C4.5 13 2.5 9.6 2.5 7 A4 4 0 0 1 10 5 A4 4 0 0 1 17.5 7 C17.5 9.6 15.5 13 10 17 Z"
        fill={checked ? "#FF8FB8" : "#FFFFFF"}
        stroke={checked ? "#D63D76" : "#B6748F"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NoteCard({
  note,
  onOpen,
  onToggleChecklist,
}: NoteCardProps) {
  const shortDate = formatShortDate(note.dateTag, note.createdAt);

  if (note.isLocked || !note.payload) {
    return (
      <article
        data-note-card={note.id}
        data-note-locked="true"
        className="rounded-[22px] bg-gradient-to-br from-[#FFE0EC] to-[#FFF2F7] p-3 k-shadow border-2 border-[#FFB7CE] min-h-[164px] flex flex-col justify-between"
      >
        <button
          type="button"
          onClick={() => onOpen(note.id)}
          className="btn-press cursor-pointer w-full flex-1 flex flex-col justify-between text-left focus-visible:outline-none"
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="px-2 py-0.5 rounded-full bg-white text-[11px] font-extrabold text-[#D63D76] border border-[#FFB7CE]">
              Riêng tư
            </span>
            <span className="text-[11px] font-bold text-[#8C5A6E]">
              {shortDate}
            </span>
          </div>
          <div className="my-2 flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-2xl bg-white border-2 border-[#FFB7CE] flex items-center justify-center k-shadow-sm">
              <BuiltinStickerSvg id="heartlock" className="w-7 h-7" />
            </div>
            <div className="text-[12px] font-extrabold text-[#4A2C3A] mt-1.5">
              Ghi chú riêng tư
            </div>
            <div className="text-[11px] text-[#8C5A6E]">Chạm để mở khóa</div>
          </div>
        </button>
      </article>
    );
  }

  const { title, body, checklist, stickers } = note.payload;
  const doneCount = checklist.filter((item) => item.checked).length;
  const totalCount = checklist.length;
  const previewChecklist = checklist.slice(0, 3);
  const displayTitle = title.trim() || "Ghi chú chưa đặt tên";
  const displayBody = body.trim();

  return (
    <article
      data-note-card={note.id}
      data-note-category={note.category}
      className="h-full"
    >
      <PaperCanvas
        templateId={note.templateId}
        className="h-full"
        innerClassName="min-h-[164px] h-full flex flex-col justify-between"
      >
        <div className="flex flex-col flex-1">
          <button
            type="button"
            onClick={() => onOpen(note.id)}
            className="cursor-pointer w-full text-left pr-5 focus-visible:outline-none"
          >
            <div className="text-[13px] font-extrabold text-[#4A2C3A] leading-snug line-clamp-2">
              {displayTitle}
            </div>
            {displayBody ? (
              <p className="text-[11px] text-[#6B4657] leading-relaxed mt-1 line-clamp-3 whitespace-pre-line">
                {displayBody}
              </p>
            ) : null}
          </button>

          {previewChecklist.length > 0 ? (
            <div className="mt-1.5 space-y-0.5">
              {previewChecklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleChecklist(note.id, item.id)}
                  aria-pressed={item.checked}
                  className="cursor-pointer w-full min-h-[44px] py-1 px-1 -mx-1 rounded-xl flex items-center gap-1.5 text-left hover:bg-white/60 transition"
                >
                  <HeartTickIcon checked={item.checked} />
                  <span
                    className={`text-[11px] leading-tight line-clamp-1 ${
                      item.checked
                        ? "line-through text-[#8C5A6E]"
                        : "text-[#4A2C3A] font-medium"
                    }`}
                  >
                    {item.text || "Mục việc nhỏ"}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onOpen(note.id)}
          className="cursor-pointer w-full flex items-center justify-between gap-1.5 pt-2 mt-1 text-left focus-visible:outline-none"
        >
          <span className="px-2 py-0.5 rounded-full bg-white/90 text-[11px] font-bold text-[#B52A5E]">
            {shortDate}
          </span>
          <span className="text-[11px] font-bold text-[#8C5A6E] truncate">
            {totalCount > 0
              ? `${doneCount}/${totalCount} trái tim`
              : stickers.length > 0
                ? `${stickers.length} sticker`
                : note.category === "draw"
                  ? "Vẽ tay"
                  : "Nhật ký"}
          </span>
        </button>
      </PaperCanvas>
    </article>
  );
}
