"use client";

import React, { useState } from "react";
import { Delete, ShieldCheck } from "lucide-react";
import { BunnyLockCover } from "@/components/mascots/BunnyLockCover";
import { isValidPin } from "@/lib/validation";

interface FirstTimeSetupProps {
  onComplete: (pin: string) => Promise<void>;
}

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [draftPin, setDraftPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeValue = step === "create" ? draftPin : confirmPin;

  function appendDigit(digit: string) {
    if (busy) return;
    setError(null);
    if (step === "create") {
      if (draftPin.length < 6) setDraftPin((prev) => prev + digit);
    } else if (confirmPin.length < 6) {
      setConfirmPin((prev) => prev + digit);
    }
  }

  function handleBackspace() {
    if (busy) return;
    setError(null);
    if (step === "create") {
      setDraftPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  }

  async function handleSubmit() {
    if (busy) return;
    setError(null);
    if (step === "create") {
      if (!isValidPin(draftPin)) {
        setError("Hãy chọn mã PIN gồm 4 đến 6 chữ số.");
        return;
      }
      setStep("confirm");
      return;
    }

    if (confirmPin !== draftPin) {
      setConfirmPin("");
      setError("Hai lần nhập PIN chưa khớp, thử lại nhé!");
      return;
    }

    setBusy(true);
    try {
      await onComplete(draftPin);
    } catch (err) {
      setBusy(false);
      setError(
        err instanceof Error ? err.message : "Không thể lưu mã PIN cục bộ.",
      );
    }
  }

  return (
    <div
      data-first-time-setup="true"
      className="min-h-[100dvh] w-full bg-gradient-to-b from-[#FFE4EE] via-[#FFF5F8] to-[#FFF9FB] flex flex-col items-center justify-center px-4 py-6"
    >
      <div className="w-full max-w-[360px] rounded-[30px] bg-white/95 border-2 border-[#FFB7CE] p-5 k-shadow flex flex-col items-center gap-3.5 text-center">
        <BunnyLockCover className="w-36 h-32" />

        <div className="space-y-1">
          <h1 className="text-[18px] font-extrabold text-[#4A2C3A]">
            {step === "create"
              ? "Đặt mã PIN cho Sổ Ngọc Như"
              : "Nhập lại mã PIN xác nhận"}
          </h1>
          <p className="text-xs font-semibold text-[#8C5A6E] leading-relaxed">
            PIN (4–6 số) dùng để khóa giao diện trên thiết bị này. Mỗi máy có thể
            đặt PIN riêng.
          </p>
        </div>

        {/* Dots indicator */}
        <div
          aria-label={`Đã nhập ${activeValue.length} chữ số`}
          className="flex items-center justify-center gap-2 py-1"
        >
          {Array.from({ length: 6 }, (_, i) => {
            const filled = i < activeValue.length;
            return (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 transition ${
                  filled
                    ? "bg-[#D63D76] border-[#B52A5E] scale-110"
                    : "bg-[#FFF5F8] border-[#FFB7CE]"
                }`}
              />
            );
          })}
        </div>

        {error ? (
          <div
            role="alert"
            className="w-full px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E] anim-shake"
          >
            {error}
          </div>
        ) : null}

        {/* Candy Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
          {KEYPAD_ROWS.flat().map((d) => (
            <button
              key={d}
              type="button"
              data-pin-digit={d}
              onClick={() => appendDigit(d)}
              className="btn-press cursor-pointer min-w-[56px] min-h-[52px] rounded-2xl bg-[#FFF5F8] border-2 border-[#FFD1E1] text-[18px] font-extrabold text-[#4A2C3A] k-shadow-sm hover:border-[#FFB7CE]"
            >
              {d}
            </button>
          ))}

          {step === "confirm" ? (
            <button
              type="button"
              onClick={() => {
                setStep("create");
                setConfirmPin("");
                setError(null);
              }}
              className="btn-press cursor-pointer min-w-[56px] min-h-[52px] rounded-2xl bg-[#FFF0F5] text-[11px] font-extrabold text-[#8C5A6E]"
            >
              Nhập lại
            </button>
          ) : (
            <div aria-hidden="true" />
          )}

          <button
            type="button"
            data-pin-digit="0"
            onClick={() => appendDigit("0")}
            className="btn-press cursor-pointer min-w-[56px] min-h-[52px] rounded-2xl bg-[#FFF5F8] border-2 border-[#FFD1E1] text-[18px] font-extrabold text-[#4A2C3A] k-shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            data-pin-backspace="true"
            onClick={handleBackspace}
            aria-label="Xóa một số"
            className="btn-press cursor-pointer min-w-[56px] min-h-[52px] rounded-2xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#B52A5E]"
          >
            <Delete className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          data-pin-submit="true"
          disabled={!isValidPin(activeValue) || busy}
          onClick={() => void handleSubmit()}
          className="btn-press cursor-pointer w-full min-h-[48px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 k-shadow-sm disabled:opacity-45"
        >
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>
            {step === "create"
              ? "Tiếp tục"
              : busy
                ? "Đang lưu..."
                : "Lưu mã PIN & mở sổ"}
          </span>
        </button>
      </div>
    </div>
  );
}
