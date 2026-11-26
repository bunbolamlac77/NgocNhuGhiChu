import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ghi Chú Của Ngọc Như",
    short_name: "Sổ Ngọc Như",
    description:
      "Sổ tay ghi chú cá nhân kawaii: nhật ký, checklist trái tim, vẽ tay sticker die-cut và Cây Ước Nguyện.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF5F8",
    theme_color: "#FFE0EC",
    lang: "vi",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
