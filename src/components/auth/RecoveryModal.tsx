"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, X } from "lucide-react";
import {
  deriveRecoveryProof,
  resetVaultPasswordWithRecovery,
} from "@/lib/crypto/vault";
import { isValidRecoveryCode, validateVaultPassword } from "@/lib/validation";
import type { AuthStatusResponse, RecoverVerifyResponse } from "@/types/api";
import type { VaultDocument } from "@/types/models";

interface RecoveryModalProps {
  open: boolean;
  onClose: () => void;
  onRecovered: (updatedVault: VaultDocument, dek: CryptoKey) => Promise<void>;
}

export function RecoveryModal({
  open,
  onClose,
  onRecovered,
}: RecoveryModalProps) {
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [verifiedVault, setVerifiedVault] = useState<VaultDocument | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regenCode, setRegenCode] = useState(false);
  const [nextRecoveryDisplay, setNextRecoveryDisplay] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidRecoveryCode(recoveryCode)) {
      setError("Mã khôi phục gồm 32 ký tự chữ in và số 2–7.");
      return;
    }

    setBusy(true);
    try {
      const statusRes = await fetch("/api/auth/status");
      const status = (await statusRes.json()) as AuthStatusResponse;
      if (!status.initialized || !status.recoverySaltVerifier) {
        throw new Error("Kho đồng bộ chưa có Mã khôi phục.");
      }

      const proofShell = {
        kdf: { iterations: 600000 },
        recovery: { saltVerifier: status.recoverySaltVerifier },
      } as VaultDocument;
      const recoveryProof = await deriveRecoveryProof(proofShell, recoveryCode);

      const res = await fetch("/api/auth/recover/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryProof }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody.error || "Mã khôi phục chưa chính xác.");
      }

      const data = (await res.json()) as RecoverVerifyResponse;
      setRecoveryToken(data.recoveryToken);
      setVerifiedVault(data.vault);
      setStep("reset");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không xác minh được Mã khôi phục.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!verifiedVault || !recoveryToken) return;
    setError(null);

    const check = validateVaultPassword(newPassword);
    if (!check.valid) {
      setError(check.reason);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Hai lần nhập Mật khẩu sổ mới chưa khớp.");
      return;
    }

    setBusy(true);
    try {
      const rotated = await resetVaultPasswordWithRecovery(
        verifiedVault,
        recoveryCode,
        newPassword,
        regenCode,
      );

      const res = await fetch("/api/auth/recover/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoveryToken,
          updatedVault: rotated.updatedVault,
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errBody.error || "Không đặt lại được Mật khẩu sổ mới.",
        );
      }

      await onRecovered(rotated.updatedVault, rotated.dek);
      if (rotated.newRecoveryCode) {
        setNextRecoveryDisplay(rotated.newRecoveryCode);
      } else {
        onClose();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi đặt lại Mật khẩu sổ.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[360px] rounded-[28px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="recovery-modal-title"
            className="text-[16px] font-extrabold text-[#4A2C3A] flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
            <span>Khôi phục bằng Mã dự phòng</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại khôi phục"
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

        {nextRecoveryDisplay ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#E9F8F0] border border-[#BBE5CF] p-3 text-xs font-bold text-[#2E7A5D] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Đã đổi Mật khẩu sổ và tạo Mã khôi phục mới:</span>
            </div>
            <div className="rounded-2xl bg-[#FFF7FA] border border-[#D63D76] p-3 font-mono text-xs font-bold text-[#4A2C3A] break-all select-all">
              {nextRecoveryDisplay}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-press cursor-pointer w-full min-h-[44px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold"
            >
              Xong
            </button>
          </div>
        ) : step === "verify" ? (
          <form onSubmit={(e) => void handleVerifyCode(e)} className="space-y-3">
            <p className="text-xs text-[#8C5A6E] leading-relaxed">
              Nhập Mã khôi phục 32 ký tự để giữ toàn bộ ghi chú riêng tư và đặt
              lại Mật khẩu sổ mới.
            </p>
            <textarea
              rows={2}
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX-..."
              aria-label="Mã khôi phục 32 ký tự"
              className="w-full rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] p-3 font-mono text-xs font-bold text-[#4A2C3A]"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-press cursor-pointer w-full min-h-[44px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold disabled:opacity-45"
            >
              {busy ? "Đang xác minh..." : "Xác minh Mã khôi phục"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => void handleResetPassword(e)}
            className="space-y-3"
          >
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu sổ mới (>= 10 ký tự)"
              aria-label="Mật khẩu sổ mới"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại Mật khẩu sổ mới"
              aria-label="Nhập lại Mật khẩu sổ mới"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <label className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#FFD1E1] flex items-center gap-2 text-xs font-bold text-[#4A2C3A] cursor-pointer">
              <input
                type="checkbox"
                checked={regenCode}
                onChange={(e) => setRegenCode(e.target.checked)}
                className="w-4 h-4 accent-[#D63D76]"
              />
              <span>Tạo Mã khôi phục mới sau khi đặt lại</span>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="btn-press cursor-pointer w-full min-h-[44px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold disabled:opacity-45"
            >
              {busy ? "Đang cập nhật..." : "Đặt lại Mật khẩu sổ"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
