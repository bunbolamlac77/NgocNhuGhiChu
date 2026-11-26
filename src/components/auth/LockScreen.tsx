"use client";

import React, { useEffect, useState } from "react";
import { Delete, KeyRound, Unlock } from "lucide-react";
import { BunnyLockCover } from "@/components/mascots/BunnyLockCover";
import type { VerifyPinResult } from "@/lib/crypto/pin-lock";
import { isValidPin } from "@/lib/validation";

interface LockScreenProps {
  initialLockoutUntil: number | null;
  onUnlock: (pin: string) => Promise<VerifyPinResult>;
  onForgotPin?: () => void;
}

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

export function LockScreen({
  initialLockoutUntil,
  onUnlock,
  onForgotPin,
}: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shakeTick, setShakeTick] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(
    initialLockoutUntil,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  const lockedSecondsLeft =
    lockoutUntil && lockoutUntil > nowMs
      ? Math.ceil((lockoutUntil - nowMs) / 1000)
      : 0;

  useEffect(() => {
    if (!lockoutUntil || lockoutUntil <= Date.now()) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (current >= lockoutUntil) {
        setLockoutUntil(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  function appendDigit(digit: string) {
    if (busy || lockedSecondsLeft > 0) return;
    setError(null);
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  }

  function handleBackspace() {
    if (busy || lockedSecondsLeft > 0) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }

  async function handleSubmit() {
    if (busy || lockedSecondsLeft > 0) return;
    if (!isValidPin(pin)) {
      setError("Nhập đủ 4 đến 6 chữ số để mở khóa.");
      return;
    }

    setBusy(true);
    setError(null);
    const res = await onUnlock(pin);
    setBusy(false);

    if (!res.ok) {
      setPin("");
      setShakeTick((n) => n + 1);
      if (res.reason === "locked" && res.lockoutUntil) {
        setLockoutUntil(res.lockoutUntil);
        setNowMs(Date.now());
        setError("Nhập sai PIN 5 lần. Sổ tạm khóa 5 phút nhé!");
      } else {
        setError(
          `Sai mã PIN (còn ${res.remainingAttempts ?? 0} lần thử trước khi tạm khóa).`,
        );
      }
    }
  }

  const mm = String(Math.floor(lockedSecondsLeft / 60)).padStart(2, "0");
  const ss = String(lockedSecondsLeft % 60).padStart(2, "0");

  return (
    <div
      data-lock-screen="true"
      className="min-h-[100dvh] w-full bg-gradient-to-b from-[#FFE4EE] via-[#FFF5F8] to-[#FFF9FB] flex flex-col items-center justify-center px-4 py-6"
    >
      <div
        key={shakeTick}
        className={`w-full max-w-[360px] rounded-[30px] bg-white/95 border-2 border-[#FFB7CE] p-5 k-shadow flex flex-col items-center gap-3.5 text-center ${
          shakeTick > 0 ? "anim-shake" : ""
        }`}
      >
        <BunnyLockCover className="w-36 h-32" />

        <div className="space-y-1">
          <h1 className="text-[18px] font-extrabold text-[#4A2C3A]">
            Sổ Nhỏ Ngọc Như
          </h1>
          <p className="text-xs font-semibold text-[#8C5A6E]">
            Nhập mã PIN (4–6 số) để mở trang sổ hôm nay
          </p>
        </div>

        {/* PIN dots */}
        <div
          aria-label={`Đã nhập ${pin.length} chữ số`}
          className="flex items-center justify-center gap-2 py-1"
        >
          {Array.from({ length: 6 }, (_, i) => {
            const filled = i < pin.length;
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

        {lockedSecondsLeft > 0 ? (
          <div
            role="alert"
            data-pin-lockout="true"
            className="w-full px-3 py-2.5 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-extrabold text-[#B52A5E]"
          >
            Tạm khóa vì sai PIN 5 lần · Thử lại sau {mm}:{ss}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="w-full px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
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
              disabled={lockedSecondsLeft > 0}
              onClick={() => appendDigit(d)}
              className="btn-press cursor-pointer min-w-[56px] min-h-[52px] rounded-2xl bg-[#FFF5F8] border-2 border-[#FFD1E1] text-[18px] font-extrabold text-[#4A2C3A] k-shadow-sm disabled:opacity-45"
            >
              {d}
            </button>
          ))}

          <div aria-hidden="true" />

          <button
            type="button"
            data-pin-digit="0"
            disabled={lockedSecondsLeft > 0}
            onClick={() => appendDigit("0")}
            className="btn-press cursor-pointer min-w-[56px] min-h-[52px] rounded-2xl bg-[#FFF5F8] border-2 border-[#FFD1E1] text-[18px] font-extrabold text-[#4A2C3A] k-shadow-sm disabled:opacity-45"
          >
            0
          </button>

          <button
            type="button"
            data-pin-backspace="true"
            disabled={lockedSecondsLeft > 0}
            onClick={handleBackspace}
            aria-label="Xóa một số"
            className="btn-press cursor-pointer min-w-[56px] min-h-[52px] rounded-2xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#B52A5E] disabled:opacity-45"
          >
            <Delete className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          data-pin-submit="true"
          disabled={!isValidPin(pin) || busy || lockedSecondsLeft > 0}
          onClick={() => void handleSubmit()}
          className="btn-press cursor-pointer w-full min-h-[48px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 k-shadow-sm disabled:opacity-45"
        >
          <Unlock className="w-4 h-4" aria-hidden="true" />
          <span>{busy ? "Đang kiểm tra..." : "Mở sổ ngay"}</span>
        </button>

        {onForgotPin ? (
          <button
            type="button"
            onClick={onForgotPin}
            className="btn-press cursor-pointer min-h-[44px] px-3 rounded-full text-xs font-bold text-[#B52A5E] inline-flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Quên mã PIN?</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
