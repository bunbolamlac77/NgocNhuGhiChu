"use client";

import React, { useEffect, useState } from "react";
import { Check, Cloud, Copy, KeyRound, ShieldAlert, X } from "lucide-react";
import {
  createVaultAndDek,
  derivePasswordProof,
  unwrapDekWithPassword,
} from "@/lib/crypto/vault";
import { isValidPin, validateVaultPassword } from "@/lib/validation";
import type { AuthStatusResponse, AuthUnlockResponse } from "@/types/api";
import type { VaultDocument } from "@/types/models";

interface DeviceLinkScreenProps {
  open: boolean;
  mode: "sync-link" | "forgot-pin";
  localVaultSnapshot?: VaultDocument | null;
  onClose: () => void;
  onSyncLinked: (vault: VaultDocument, dek: CryptoKey) => Promise<void>;
  onResetPinSuccess?: (newPin: string, dek: CryptoKey) => Promise<void>;
  onOpenRecovery: () => void;
}

export function DeviceLinkScreen({
  open,
  mode,
  localVaultSnapshot = null,
  onClose,
  onSyncLinked,
  onResetPinSuccess,
  onOpenRecovery,
}: DeviceLinkScreenProps) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [remoteInitialized, setRemoteInitialized] = useState(false);
  const [passwordSaltVerifier, setPasswordSaltVerifier] = useState<string | null>(
    null,
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [createdVault, setCreatedVault] = useState<{
    vault: VaultDocument;
    recoveryCode: string;
    dek: CryptoKey;
  } | null>(null);
  const [savedRecoveryAck, setSavedRecoveryAck] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setError(null);
    setCreatedVault(null);
    setSavedRecoveryAck(false);
    setCopiedCode(false);
    setPassword("");
    setConfirmPassword("");
    setNewPin("");

    async function probeServerStatus() {
      setStatusLoading(true);
      try {
        const res = await fetch("/api/auth/status");
        if (!res.ok) throw new Error("status failed");
        const data = (await res.json()) as AuthStatusResponse;
        if (!active) return;
        setRemoteInitialized(Boolean(data.initialized));
        setPasswordSaltVerifier(data.passwordSaltVerifier ?? null);
      } catch {
        if (!active) return;
        if (localVaultSnapshot) {
          setRemoteInitialized(true);
          setPasswordSaltVerifier(localVaultSnapshot.password.saltVerifier);
        } else {
          setRemoteInitialized(false);
          setPasswordSaltVerifier(null);
        }
      } finally {
        if (active) setStatusLoading(false);
      }
    }

    void probeServerStatus();
    return () => {
      active = false;
    };
  }, [open, localVaultSnapshot]);

  if (!open) return null;

  async function handlePrepareNewVault(e: React.FormEvent) {
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
        err instanceof Error ? err.message : "Không tạo được khóa đồng bộ.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleFinishSetup() {
    if (!createdVault || !savedRecoveryAck) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vault: createdVault.vault }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errBody.error || "Không khởi tạo được kho đồng bộ.");
      }
      await onSyncLinked(createdVault.vault, createdVault.dek);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi gửi khóa lên máy chủ đồng bộ.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlockAndLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) {
      setError("Vui lòng nhập Mật khẩu sổ.");
      return;
    }
    if (mode === "forgot-pin" && !isValidPin(newPin)) {
      setError("Vui lòng nhập mã PIN mới (4–6 số).");
      return;
    }

    setBusy(true);
    try {
      let vaultToUse: VaultDocument | null = localVaultSnapshot;
      if (passwordSaltVerifier) {
        try {
          const fakeVaultShell = {
            kdf: { iterations: localVaultSnapshot?.kdf.iterations ?? 600000 },
            password: { saltVerifier: passwordSaltVerifier },
          } as VaultDocument;
          const proof = await derivePasswordProof(fakeVaultShell, password);
          const res = await fetch("/api/auth/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ proof }),
          });
          if (res.status === 429) {
            const d = (await res.json()) as { lockoutUntil?: number };
            const mins = d.lockoutUntil
              ? Math.max(1, Math.ceil((d.lockoutUntil - Date.now()) / 60000))
              : 5;
            throw new Error(`Thử sai quá 5 lần. Vui lòng đợi khoảng ${mins} phút.`);
          }
          if (res.status === 401) {
            const d = (await res.json()) as { remainingAttempts?: number };
            throw new Error(
              `Sai Mật khẩu sổ (còn ${d.remainingAttempts ?? 0} lần thử).`,
            );
          }
          if (res.ok) {
            const data = (await res.json()) as AuthUnlockResponse;
            vaultToUse = data.vault;
          }
        } catch (networkOrAuthErr) {
          if (
            mode !== "forgot-pin" ||
            !localVaultSnapshot ||
            (networkOrAuthErr instanceof Error &&
              (networkOrAuthErr.message.includes("Sai Mật khẩu") ||
                networkOrAuthErr.message.includes("Thử sai quá 5 lần")))
          ) {
            throw networkOrAuthErr;
          }
        }
      }

      if (!vaultToUse) {
        throw new Error(
          "Chưa tìm thấy thông tin vault trên máy hoặc máy chủ.",
        );
      }

      const dek = await unwrapDekWithPassword(vaultToUse, password);
      if (mode === "forgot-pin" && onResetPinSuccess) {
        await onResetPinSuccess(newPin, dek);
        onClose();
      } else {
        await onSyncLinked(vaultToUse, dek);
        onClose();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không mở khóa được bằng Mật khẩu sổ.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyRecovery() {
    if (!createdVault) return;
    try {
      await navigator.clipboard.writeText(createdVault.recoveryCode);
      setCopiedCode(true);
    } catch {
      setCopiedCode(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-link-title"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[380px] rounded-[28px] bg-white border-2 border-[#FFD1E1] p-5 k-shadow space-y-4 max-h-[90vh] overflow-y-auto phone-scroll">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="device-link-title"
            className="text-[16px] font-extrabold text-[#4A2C3A] flex items-center gap-2"
          >
            {mode === "forgot-pin" ? (
              <KeyRound className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
            ) : (
              <Cloud className="w-4 h-4 text-[#D63D76]" aria-hidden="true" />
            )}
            <span>
              {mode === "forgot-pin"
                ? "Khôi phục mã PIN"
                : remoteInitialized
                  ? "Liên kết thiết bị với kho đám mây"
                  : "Bật đồng bộ đám mây"}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại liên kết"
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

        {statusLoading ? (
          <p className="text-xs font-bold text-[#8C5A6E] py-4 text-center">
            Đang kiểm tra trạng thái kho đồng bộ...
          </p>
        ) : createdVault ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#FFF4D6] border border-[#F6C85F] p-3 text-xs font-bold text-[#7A5200] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Hãy chép lại hoặc chụp màn hình <strong>Mã khôi phục</strong>{" "}
                dưới đây. Nếu quên Mật khẩu sổ, chỉ mã này mới mở được ghi chú
                riêng tư!
              </span>
            </div>

            <div
              data-recovery-code-display="true"
              className="rounded-2xl bg-[#FFF7FA] border-2 border-dashed border-[#D63D76] p-3 font-mono text-[13px] font-bold text-[#4A2C3A] text-center break-all select-all"
            >
              {createdVault.recoveryCode}
            </div>

            <button
              type="button"
              onClick={() => void handleCopyRecovery()}
              className="btn-press cursor-pointer w-full min-h-[44px] rounded-2xl bg-[#FFF0F5] border border-[#FFD1E1] text-[#B52A5E] text-xs font-extrabold inline-flex items-center justify-center gap-1.5"
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              <span>
                {copiedCode ? "Đã chép Mã khôi phục!" : "Chép Mã khôi phục"}
              </span>
            </button>

            <label className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#FFF9FB] border border-[#FFD1E1] flex items-center gap-2 text-xs font-bold text-[#4A2C3A] cursor-pointer">
              <input
                type="checkbox"
                checked={savedRecoveryAck}
                onChange={(e) => setSavedRecoveryAck(e.target.checked)}
                className="w-4 h-4 accent-[#D63D76]"
              />
              <span>Tôi đã lưu Mã khôi phục ở nơi an toàn</span>
            </label>

            <button
              type="button"
              data-finish-vault-setup="true"
              disabled={!savedRecoveryAck || busy}
              onClick={() => void handleFinishSetup()}
              className="btn-press cursor-pointer w-full min-h-[48px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-45"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>
                {busy
                  ? "Đang khởi tạo & đồng bộ..."
                  : "Hoàn tất & đẩy dữ liệu lên đám mây"}
              </span>
            </button>
          </div>
        ) : !remoteInitialized && mode === "sync-link" ? (
          <form
            onSubmit={(e) => void handlePrepareNewVault(e)}
            className="space-y-3"
          >
            <p className="text-xs text-[#8C5A6E] leading-relaxed">
              Tạo <strong>Mật khẩu sổ</strong> (tối thiểu 10 ký tự, không chỉ là
              chữ số) để bảo vệ đồng bộ đa thiết bị và Ngăn Riêng Tư.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu sổ (>= 10 ký tự)"
              aria-label="Mật khẩu sổ mới"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại Mật khẩu sổ"
              aria-label="Xác nhận Mật khẩu sổ"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <button
              type="submit"
              disabled={busy}
              className="btn-press cursor-pointer w-full min-h-[46px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold disabled:opacity-45"
            >
              {busy ? "Đang tạo khóa bảo mật (PBKDF2)..." : "Tạo Mật khẩu sổ & lấy Mã khôi phục"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => void handleUnlockAndLink(e)}
            className="space-y-3"
          >
            <p className="text-xs text-[#8C5A6E] leading-relaxed">
              {mode === "forgot-pin"
                ? "Nhập Mật khẩu sổ để xác minh và đặt mã PIN mới cho thiết bị này."
                : "Nhập Mật khẩu sổ đã thiết lập để liên kết thiết bị này với kho đồng bộ."}
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu sổ"
              aria-label="Mật khẩu sổ"
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            {mode === "forgot-pin" ? (
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Mã PIN mới (4–6 chữ số)"
                aria-label="Mã PIN mới"
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#FFF7FA] border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
              />
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="btn-press cursor-pointer w-full min-h-[46px] rounded-full bg-[#D63D76] text-white text-xs font-extrabold disabled:opacity-45"
            >
              {busy
                ? "Đang mở khóa..."
                : mode === "forgot-pin"
                  ? "Đặt lại PIN ngay"
                  : "Liên kết & đồng bộ ngay"}
            </button>
            <button
              type="button"
              onClick={onOpenRecovery}
              className="btn-press cursor-pointer w-full min-h-[44px] rounded-full text-xs font-bold text-[#B52A5E]"
            >
              Quên Mật khẩu sổ? Dùng Mã khôi phục
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
