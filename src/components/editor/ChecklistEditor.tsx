"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { HeartTickIcon } from "@/components/home/NoteCard";
import { createId } from "@/lib/ids";
import type { ChecklistItem } from "@/types/models";

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const doneCount = items.filter((i) => i.checked).length;

  function handleAddItem() {
    onChange([...items, { id: createId("chk"), text: "", checked: false }]);
  }

  function handleToggle(id: string) {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  }

  function handleTextChange(id: string, text: string) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  }

  function handleDelete(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-1.5 pt-2 border-t border-[#F6CADB]/60">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-[#B52A5E]">
          Checklist trái tim ({doneCount}/{items.length})
        </span>
        <button
          type="button"
          onClick={handleAddItem}
          className="btn-press cursor-pointer min-h-[44px] px-3 rounded-full bg-white/90 border border-[#FFB7CE] text-[11px] font-extrabold text-[#D63D76] inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Thêm mục</span>
        </button>
      </div>

      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-center gap-1.5 bg-white/75 rounded-xl px-1.5 border border-[#FFE0EC]"
            >
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                aria-pressed={item.checked}
                aria-label={`Đánh dấu mục ${idx + 1}`}
                className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              >
                <HeartTickIcon checked={item.checked} />
              </button>
              <input
                type="text"
                value={item.text}
                onChange={(e) => handleTextChange(item.id, e.target.value)}
                placeholder={`Việc nhỏ #${idx + 1}...`}
                aria-label={`Nội dung mục checklist ${idx + 1}`}
                className={`flex-1 min-w-0 bg-transparent text-xs py-2 focus:outline-none ${
                  item.checked
                    ? "line-through text-[#8C5A6E]"
                    : "text-[#4A2C3A] font-semibold"
                }`}
              />
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                aria-label={`Xóa mục checklist ${idx + 1}`}
                className="cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8C5A6E] hover:text-[#D63D76] shrink-0"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
