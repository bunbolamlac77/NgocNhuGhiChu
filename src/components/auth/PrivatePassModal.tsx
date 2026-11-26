"use client";

import React, { useState } from "react";
import { Check, Copy, KeyRound, Lock, ShieldAlert, X } from "lucide-react";
import { createVaultAndDek, unwrapDekWithPassword } from "@/lib/crypto/vault";
import { setSessionDek } from "@/lib/crypto/session-keys";
import { setMetaValue } from "@/lib/db/meta-repo";
import { validateVaultPassword } from "@/lib/validation";
import type { VaultDocument } from "@/types/models";

interface PrivatePassModalProps {
  open: boolean;
  vaultSnapshot: VaultDocument | null;
  onClose: () => void;
  onSuccess: (dek: CryptoKey, newlyCreatedVault?: VaultDocument) => void;
  onOpenRecovery?: () => void;
}

export function PrivatePassModal({
  open,
  vaultSnapshot,
  onClose,
  onSuccess,
  onOpenRecovery,
}: PrivatePassModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createdVault, setCreatedVault] = useState<{
    vault: VaultDocument;
    recoveryCode: string;
    dek: CryptoKey;
  } | null>(null);
  const [ackRecovery, setAckRecovery] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleUnlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vaultSnapshot) return;
    setError(null);
    if (!password) {
      setError("Vui lòng nhập Mật khẩu sổ.");
      return;
    }

    setBusy(true);
    try {
      const dek = await unwrapDekWithPassword(vaultSnapshot, password);
      setSessionDek(dek);
      setPassword("");
      setBusy(false);
      onSuccess(dek);
    } catch {
      setBusy(false);
      setError("Mật khẩu sổ chưa đúng, hãy thử lại nhé!");
    }
  }

  async function handleCreateLocalVault(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const check = validateVaultPassword(password);
    if (!check.valid) {
      setError(check.reason);
      return;
    }
    if (password !== confirmPassword) {
      setError("Hai lần nhập Mật khẩu sổ chưa khớp.");
      return;
    }
    setBusy(true);
    try {
      const prepared = await createVaultAndDek(password);
      setCreatedVault(prepared);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tạo được khóa bảo mật.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveLocalVault() {
    if (!createdVault || !ackRecovery) return;
    setBusy(true);
    await setMetaValue("vaultSnapshot", createdVault.vault);
    setSessionDek(createdVault.dek);
    const { dek, vault } = createdVault;
    setCreatedVault(null);
    setPassword("");
    setConfirmPassword("");
    setAckRecovery(false);
    setBusy(false);
    onSuccess(dek, vault);
  }

  async function handleCopy() {
    if (!createdVault) return;
    try {
      await navigator.clipboard.writeText(createdVault.recoveryCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="private-pass-title"
      data-private-pass-modal="true"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[360px] rounded-[28px] bg-white border-2 border-[#FFB7CE] p-5 k-shadow space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="private-pass-title"
            className="text-[16px] font-extrabold text-[#4A2C3A] flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
            <span>
              {vaultSnapshot
                ? "Mở Ngăn Riêng Tư"
                : "Đặt Mật khẩu Ngăn Riêng Tư"}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại mật khẩu riêng tư"
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

        {createdVault ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#FFF4D6] border border-[#F6C85F] p-3 text-xs font-bold text-[#7A5200] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Lưu <strong>Mã khôi phục</strong> này để mở lại ghi chú khóa nếu
                quên Mật khẩu sổ:
              </span>
            </div>
            <div className="rounded-2xl bg-[#FFF7FA] border-2 border-dashed border-[#D63D76] p-3 font-mono text-xs font-bold text-[#4A2C3A] break-all select-all text-center">
              {createdVault.recoveryCode}
            </div>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="btn-press cursor-pointer w-full min-h-[44px] rounded-2xl bg-[#FFF0F5] border border-[#FFD1E1] text-[#B52A5E] text-xs font-extrabold inline-flex items-center justify-center gap-1.5"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>{copied ? "Đã chép!" : "Chép Mã khôi phục"}</span>
            </button>
            <label className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#FFF9FB] border border-[#FFD1E1] flex items-center gap-2 text-xs font-bold text-[#4A2C3A] cursor-pointer">
              <input
                type="checkbox"
                checked={ackRecovery}
                onChange={(e) => setAckRecovery(e.target.checked)}
                className="w-4 h-4 accent-[#D63D76]"
              />
              <span>Tôi đã lưu Mã khôi phục an toàn</span>
            </label>
            <button
              type="button"
              disabled={!ackRecovery || busy}
              onClick={() => void handleSaveLocalVault()}
              className="btn-press cursor-pointer w-full min-h-[46px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-45"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>Hoàn tất &amp; mở khóa ghi chú</span>
            </button>
          </div>
        ) : vaultSnapshot ? (
          <form
            onSubmit={(e) => void handleUnlockSubmit(e)}
            className="space-y-3"
          >
            <p className="text-xs text-[#8C5A6E] leading-relaxed">
              Ghi chú riêng tư được mã hóa đầu cuối bằng khóa chỉ giữ trong bộ
              nhớ tạm. Nhập <strong>Mật khẩu sổ</strong> để mở.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu sổ"
              aria-label="Mật khẩu sổ để mở Ngăn Riêng Tư"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-press cursor-pointer w-full min-h-[46px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold disabled:opacity-45"
            >
              {busy ? "Đang giải mã..." : "Mở Ngăn Riêng Tư"}
            </button>
            {onOpenRecovery ? (
              <button
                type="button"
                onClick={onOpenRecovery}
                className="btn-press cursor-pointer w-full min-h-[44px] rounded-full text-xs font-bold text-[#B52A5E] inline-flex items-center justify-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Quên Mật khẩu sổ?</span>
              </button>
            ) : null}
          </form>
        ) : (
          <form
            onSubmit={(e) => void handleCreateLocalVault(e)}
            className="space-y-3"
          >
            <p className="text-xs text-[#8C5A6E] leading-relaxed">
              Thiết lập <strong>Mật khẩu sổ</strong> (&gt;= 10 ký tự, không chỉ là
              chữ số) để mã hóa riêng cho Ngăn Riêng Tư.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu sổ (>= 10 ký tự)"
              aria-label="Mật khẩu sổ mới cho Ngăn Riêng Tư"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại Mật khẩu sổ"
              aria-label="Nhập lại Mật khẩu sổ mới"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-press cursor-pointer w-full min-h-[46px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold disabled:opacity-45"
            >
              {busy ? "Đang tạo khóa..." : "Tạo Mật khẩu sổ"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
