import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#FFF5F8] flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-[360px] rounded-[28px] bg-white border-2 border-[#FFB7CE] p-6 k-shadow text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF0F5] border border-[#FFD1E1] flex items-center justify-center text-[#D63D76]">
          <WifiOff className="w-7 h-7" aria-hidden="true" />
        </div>
        <h1 className="text-[18px] font-extrabold text-[#4A2C3A]">
          Sổ đang ở chế độ ngoại tuyến
        </h1>
        <p className="text-xs font-semibold text-[#8C5A6E] leading-relaxed">
          Không có kết nối mạng lúc này. Khi có mạng hoặc mở lại từ màn hình
          chính, toàn bộ ghi chú lưu trên máy vẫn sẵn sàng.
        </p>
        <Link
          href="/"
          className="btn-press inline-flex items-center justify-center min-h-[44px] px-5 rounded-full bg-[#D63D76] text-white text-xs font-extrabold k-shadow-sm"
        >
          Mở lại Sổ Ngọc Như
        </Link>
      </section>
    </div>
  );
}
