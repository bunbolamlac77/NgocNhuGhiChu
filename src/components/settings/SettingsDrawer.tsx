"use client";

import React, { useRef, useState } from "react";
import {
  Cloud,
  Download,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { CustomTraySticker } from "@/components/editor/StickerTray";
import { changeLocalPin } from "@/lib/crypto/pin-lock";
import { derivePasswordProof, rotateVaultWithPassword } from "@/lib/crypto/vault";
import { exportBackupJson, type ImportBackupSummary } from "@/lib/db/backup";
import { getLocalDateString } from "@/lib/ids";
import { isValidPin, validateVaultPassword } from "@/lib/validation";
import type { SyncUiState } from "@/stores/useSyncStore";
import type { VaultDocument } from "@/types/models";

interface SettingsDrawerProps {
  open: boolean;
  storagePersisted?: boolean | null;
  deviceLinked?: boolean;
  syncStatus?: SyncUiState;
  lastSyncedAt?: number | null;
  vaultSnapshot?: VaultDocument | null;
  customStickers?: CustomTraySticker[];
  onClose: () => void;
  onImportBackup: (rawJson: string) => Promise<ImportBackupSummary>;
  onOpenSyncLink?: () => void;
  onSyncNow?: () => Promise<boolean>;
  onVaultUpdated?: (vault: VaultDocument, dek: CryptoKey) => Promise<void>;
  onDeleteCustomSticker?: (id: string) => Promise<void>;
}

export function SettingsDrawer({
  open,
  storagePersisted = null,
  deviceLinked = false,
  syncStatus = "unlinked",
  lastSyncedAt = null,
  vaultSnapshot = null,
  customStickers = [],
  onClose,
  onImportBackup,
  onOpenSyncLink,
  onSyncNow,
  onVaultUpdated,
  onDeleteCustomSticker,
}: SettingsDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [currentVaultPw, setCurrentVaultPw] = useState("");
  const [newVaultPw, setNewVaultPw] = useState("");
  const [confirmVaultPw, setConfirmVaultPw] = useState("");
  const [regenRecoveryChecked, setRegenRecoveryChecked] = useState(false);
  const [freshRecoveryCode, setFreshRecoveryCode] = useState<string | null>(null);

  if (!open) return null;

  async function handleExport() {
    setBusy(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const jsonText = await exportBackupJson();
      const blob = new Blob([jsonText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `so-ngoc-nhu-backup-${getLocalDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage("Đã xuất tệp sao lưu .json thành công.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể xuất tệp sao lưu.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const text = await file.text();
      const summary = await onImportBackup(text);
      setStatusMessage(
        `Đã khôi phục ${summary.notesImported} ghi chú, ${summary.wishesImported} điều ước, ${summary.stickersImported} sticker.`,
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Tệp sao lưu không hợp lệ.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!isValidPin(newPin)) {
      setErrorMessage("Mã PIN mới phải gồm 4 đến 6 chữ số.");
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage("Hai lần nhập PIN mới chưa khớp.");
      return;
    }

    setBusy(true);
    try {
      const res = await changeLocalPin(currentPin, newPin);
      if (!res.ok) {
        setErrorMessage(
          res.reason === "locked"
            ? "PIN đang tạm khóa 5 phút vì nhập sai quá 5 lần."
            : "Mã PIN hiện tại không đúng.",
        );
      } else {
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setStatusMessage("Đã đổi mã PIN cục bộ thành công.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRotateVault(e: React.FormEvent) {
    e.preventDefault();
    if (!vaultSnapshot) return;
    setStatusMessage(null);
    setErrorMessage(null);
    setFreshRecoveryCode(null);

    if (!currentVaultPw) {
      setErrorMessage("Vui lòng nhập Mật khẩu sổ hiện tại.");
      return;
    }
    if (newVaultPw) {
      const check = validateVaultPassword(newVaultPw);
      if (!check.valid) {
        setErrorMessage(check.reason);
        return;
      }
      if (newVaultPw !== confirmVaultPw) {
        setErrorMessage("Hai lần nhập Mật khẩu sổ mới chưa khớp.");
        return;
      }
    } else if (!regenRecoveryChecked) {
      setErrorMessage("Nhập Mật khẩu sổ mới hoặc chọn Tạo lại Mã khôi phục.");
      return;
    }

    setBusy(true);
    try {
      const rotated = await rotateVaultWithPassword(
        vaultSnapshot,
        currentVaultPw,
        {
          newPassword: newVaultPw || undefined,
          regenerateRecovery: regenRecoveryChecked,
        },
      );

      if (deviceLinked) {
        const currentProof = await derivePasswordProof(
          vaultSnapshot,
          currentVaultPw,
        );
        const res = await fetch("/api/auth/vault", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentProof,
            updatedVault: rotated.updatedVault,
          }),
        });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(d.error || "Không cập nhật được khóa trên Drive.");
        }
      }

      await onVaultUpdated?.(rotated.updatedVault, rotated.dek);
      if (rotated.newRecoveryCode) {
        setFreshRecoveryCode(rotated.newRecoveryCode);
      }
      setCurrentVaultPw("");
      setNewVaultPw("");
      setConfirmVaultPw("");
      setRegenRecoveryChecked(false);
      setStatusMessage("Đã cập nhật Mật khẩu sổ / Mã khôi phục thành công.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Không xác minh được Mật khẩu sổ hiện tại.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cài đặt sổ"
      className="fixed inset-0 z-50 bg-[#4A2C3A]/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-3"
    >
      <div className="bg-white rounded-[26px] border-2 border-[#FFB7CE] p-4 w-full max-w-[440px] max-h-[86vh] overflow-y-auto phone-scroll k-shadow anim-pop space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-[#4A2C3A]">
            Cài Đặt &amp; Sao Lưu
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cài đặt"
            className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-2xl bg-[#FFF0F5] flex items-center justify-center text-[#8C5A6E]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Storage persistence badge */}
        <div
          data-storage-persisted={
            storagePersisted === null ? "unknown" : storagePersisted ? "true" : "false"
          }
          className={`rounded-2xl border p-3 text-xs font-bold flex items-center gap-2 ${
            storagePersisted
              ? "bg-[#E9F8F0] border-[#BBE5CF] text-[#2F6B45]"
              : "bg-[#FFF4D6] border-[#F6C85F] text-[#7A5200]"
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {storagePersisted
              ? "Bộ nhớ bền vững (persisted): Đã bật trên trình duyệt"
              : "Bộ nhớ bền vững chưa bật · Hãy cài app ra Màn hình chính & sao lưu .json định kỳ"}
          </span>
        </div>

        {/* Cloud Sync Card */}
        {onOpenSyncLink ? (
          <div className="rounded-2xl bg-[#F4FAFF] border border-[#BEE3FF] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-[#1E568A] flex items-center gap-1.5">
                <Cloud className="w-4 h-4" aria-hidden="true" />
                <span>Đồng bộ đám mây</span>
              </div>
              <span className="text-[11px] font-bold text-[#1E568A]">
                {deviceLinked
                  ? syncStatus === "syncing"
                    ? "Đang đồng bộ..."
                    : syncStatus === "needs-auth"
                      ? "Cần xác thực lại"
                      : "Đã liên kết"
                  : "Chưa bật"}
              </span>
            </div>

            {lastSyncedAt ? (
              <div className="text-[11px] text-[#4B759C]">
                Lần đồng bộ gần nhất:{" "}
                {new Date(lastSyncedAt).toLocaleTimeString("vi-VN")}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                data-open-sync-link="true"
                onClick={onOpenSyncLink}
                className="btn-press cursor-pointer min-h-[44px] px-3 rounded-2xl bg-[#1E6BA8] text-white text-xs font-extrabold"
              >
                {deviceLinked
                  ? syncStatus === "needs-auth"
                    ? "Nhập lại Mật khẩu sổ"
                    : "Quản lý liên kết"
                  : "Bật đồng bộ / Liên kết"}
              </button>

              {deviceLinked && onSyncNow ? (
                <button
                  type="button"
                  data-sync-now-btn="true"
                  disabled={busy || syncStatus === "syncing"}
                  onClick={async () => {
                    setBusy(true);
                    setErrorMessage(null);
                    setStatusMessage(null);
                    const ok = await onSyncNow();
                    setBusy(false);
                    if (ok) {
                      setStatusMessage("Đã đồng bộ dữ liệu đám mây thành công.");
                    } else {
                      setErrorMessage("Chưa thể đồng bộ lúc này.");
                    }
                  }}
                  className="btn-press cursor-pointer min-h-[44px] px-3 rounded-2xl bg-white border-2 border-[#BEE3FF] text-[#1E6BA8] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Đồng bộ ngay</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Change Local PIN */}
        <form
          onSubmit={(e) => void handleChangePin(e)}
          className="rounded-2xl bg-[#FFF5F8] border border-[#FFD1E1] p-3.5 space-y-2.5"
        >
          <div className="text-xs font-extrabold text-[#4A2C3A] flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#D63D76]" aria-hidden="true" />
            <span>Đổi mã PIN cục bộ</span>
          </div>
          <p className="text-[11px] text-[#8C5A6E] leading-relaxed">
            PIN chỉ khóa giao diện trên thiết bị này (không bảo vệ dữ liệu nếu
            người khác đọc trực tiếp ổ đĩa).
          </p>
          <div className="grid grid-cols-1 gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="PIN hiện tại (4–6 số)"
              aria-label="PIN hiện tại"
              className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="PIN mới"
                aria-label="PIN mới"
                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Nhập lại PIN mới"
                aria-label="Nhập lại PIN mới"
                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy || !currentPin || !newPin || !confirmPin}
            className="btn-press cursor-pointer w-full min-h-[44px] rounded-2xl bg-white border-2 border-[#FFB7CE] text-[#B52A5E] text-xs font-extrabold disabled:opacity-50"
          >
            Cập nhật mã PIN
          </button>
        </form>

        {/* Rotate Vault Password & Recovery Code */}
        {vaultSnapshot ? (
          <form
            onSubmit={(e) => void handleRotateVault(e)}
            className="rounded-2xl bg-[#FFF5F8] border border-[#FFD1E1] p-3.5 space-y-2.5"
          >
            <div className="text-xs font-extrabold text-[#4A2C3A] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D63D76]" aria-hidden="true" />
              <span>Đổi Mật khẩu sổ &amp; Mã khôi phục</span>
            </div>
            <input
              type="password"
              value={currentVaultPw}
              onChange={(e) => setCurrentVaultPw(e.target.value)}
              placeholder="Mật khẩu sổ hiện tại"
              aria-label="Mật khẩu sổ hiện tại"
              className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            <input
              type="password"
              value={newVaultPw}
              onChange={(e) => setNewVaultPw(e.target.value)}
              placeholder="Mật khẩu sổ mới (để trống nếu chỉ đổi mã)"
              aria-label="Mật khẩu sổ mới trong cài đặt"
              className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
            />
            {newVaultPw ? (
              <input
                type="password"
                value={confirmVaultPw}
                onChange={(e) => setConfirmVaultPw(e.target.value)}
                placeholder="Nhập lại Mật khẩu sổ mới"
                aria-label="Nhập lại Mật khẩu sổ mới trong cài đặt"
                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#FFD1E1] text-xs font-semibold text-[#4A2C3A]"
              />
            ) : null}
            <label className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white border border-[#FFD1E1] flex items-center gap-2 text-xs font-bold text-[#4A2C3A] cursor-pointer">
              <input
                type="checkbox"
                checked={regenRecoveryChecked}
                onChange={(e) => setRegenRecoveryChecked(e.target.checked)}
                className="w-4 h-4 accent-[#D63D76]"
              />
              <span>Tạo lại Mã khôi phục 32 ký tự mới</span>
            </label>
            {freshRecoveryCode ? (
              <div className="rounded-xl bg-[#FFF4D6] border border-[#F6C85F] p-2.5 font-mono text-[11px] font-bold text-[#7A5200] break-all select-all">
                Mã mới: {freshRecoveryCode}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={busy || !currentVaultPw}
              className="btn-press cursor-pointer w-full min-h-[44px] rounded-2xl bg-white border-2 border-[#FFB7CE] text-[#B52A5E] text-xs font-extrabold disabled:opacity-50"
            >
              Cập nhật khóa Ngăn Riêng Tư
            </button>
          </form>
        ) : null}

        {/* Custom Stickers Management */}
        {customStickers.length > 0 && onDeleteCustomSticker ? (
          <div className="rounded-2xl bg-[#FFF5F8] border border-[#FFD1E1] p-3.5 space-y-2.5">
            <div className="text-xs font-extrabold text-[#4A2C3A]">
              Quản lý Sticker tự vẽ ({customStickers.length})
            </div>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto phone-scroll pr-0.5">
              {customStickers.map((stk) => (
                <div
                  key={stk.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white border border-[#FFE0EC] px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={stk.url}
                      alt={stk.name}
                      className="w-8 h-8 object-contain shrink-0"
                    />
                    <span className="text-xs font-bold text-[#4A2C3A] truncate">
                      {stk.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDeleteCustomSticker(stk.id)}
                    aria-label={`Xóa sticker ${stk.name}`}
                    className="btn-press cursor-pointer min-w-[44px] min-h-[44px] rounded-xl bg-[#FFF0F5] flex items-center justify-center text-[#B52A5E] shrink-0"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Backup export/import */}
        <div className="rounded-2xl bg-[#FFF5F8] border border-[#FFD1E1] p-3.5 space-y-2.5">
          <div className="text-xs font-extrabold text-[#4A2C3A]">
            Sao lưu cục bộ (.json)
          </div>
          <p className="text-[11px] text-[#8C5A6E] leading-relaxed">
            Xuất toàn bộ ghi chú, ảnh vẽ, sticker tự vẽ và điều ước để lưu dự
            phòng hoặc khôi phục lại vào máy.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleExport()}
              className="btn-press cursor-pointer min-h-[44px] px-3 rounded-2xl bg-[#D63D76] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 k-shadow-sm disabled:opacity-60"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Xuất sao lưu .json</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="btn-press cursor-pointer min-h-[44px] px-3 rounded-2xl bg-white border-2 border-[#FFB7CE] text-[#B52A5E] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>Nhập sao lưu .json</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => void handleFileChange(e)}
              aria-label="Chọn tệp sao lưu JSON"
              className="hidden"
            />
          </div>
        </div>

        {statusMessage ? (
          <div
            role="status"
            className="px-3 py-2 rounded-xl bg-[#C6EBD1]/45 border border-[#5AA473] text-xs font-bold text-[#2F6B45]"
          >
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="px-3 py-2 rounded-xl bg-[#FFE4EE] border border-[#D63D76] text-xs font-bold text-[#B52A5E]"
          >
            {errorMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
