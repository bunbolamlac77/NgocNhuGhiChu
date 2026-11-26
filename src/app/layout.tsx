import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { headers } from "next/headers";
import "@/styles/kawaii.css";

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ghi Chú Của Ngọc Như",
  description:
    "Sổ tay ghi chú cá nhân kawaii Local-First: viết nhật ký, checklist trái tim, vẽ tay sticker die-cut và chăm sóc Cây Ước Nguyện.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sổ Ngọc Như",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFE0EC",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const nonce = headerStore.get("x-nonce") ?? undefined;

  return (
    <html lang="vi" data-theme="pastel" className={nunito.variable}>
      <body data-csp-nonce={nonce} className="antialiased">
        {children}
      </body>
    </html>
  );
}
