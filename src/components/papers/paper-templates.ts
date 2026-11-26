import type { PaperTemplateId } from "@/types/models";

export interface PaperTemplateSpec {
  id: PaperTemplateId;
  name: string;
  shortName: string;
  description: string;
  outerClass: string;
  innerClass: string;
  swatchClass: string;
}

export const PAPER_TEMPLATES: PaperTemplateSpec[] = [
  {
    id: "sakura-dashed",
    name: "Hoa Anh Đào Viền Nét Đứt",
    shortName: "Anh Đào",
    description: "Dòng kẻ hồng nhẹ kèm viền nét đứt cổ điển",
    outerClass: "bg-[#FFE6F0] border border-[#FFB7CE]",
    innerClass: "paper-sakura border-2 border-dashed border-[#A66A82]",
    swatchClass: "bg-[#FFF5F8] border-[#FFB7CE]",
  },
  {
    id: "piggy-plaid",
    name: "Caro Hồng Kem Heo Con",
    shortName: "Caro Heo",
    description: "Caro hồng sữa dịu mắt cho checklist mỗi ngày",
    outerClass: "paper-plaid-piggy border-2 border-[#FFD1E1]",
    innerClass: "bg-white/95 border-2 border-[#FF9EC0]",
    swatchClass: "bg-[#FFF4EC] border-[#FF9EC0]",
  },
  {
    id: "cloud-frame",
    name: "Khung Mây Bồng Bềnh",
    shortName: "Mây",
    description: "Gradient hồng kem dịu mắt cho ghi chú ngắn",
    outerClass: "paper-cloud border-2 border-[#FFD1E1]",
    innerClass: "bg-white border-2 border-[#FFB7CE]",
    swatchClass: "bg-[#FFEBF2] border-[#FFB7CE]",
  },
  {
    id: "botanical-garden",
    name: "Vườn Hoa Lá Nét Vẽ Tay",
    shortName: "Hoa Lá",
    description: "Chấm bi pastel nhẹ nhàng cùng cành lá xuân",
    outerClass: "bg-white border-2 border-[#FFD1E1]",
    innerClass: "paper-botanical border-[1.8px] border-[#E0A3BA]",
    swatchClass: "bg-[#FFF7FA] border-[#C8E6D2]",
  },
  {
    id: "strawberry-stripe",
    name: "Sọc Dâu Kem Gấu Bông",
    shortName: "Dâu Kem",
    description: "Sọc hồng dâu và kem bơ ấm áp dễ thương",
    outerClass: "paper-strawberry border-2 border-[#F5D3B3]",
    innerClass: "bg-white/85 border border-[#F5C6A5]",
    swatchClass: "bg-[#FFF9F2] border-[#F5C6A5]",
  },
  {
    id: "heart-grid",
    name: "Giấy Lưới Trái Tim",
    shortName: "Lưới Tim",
    description: "Ô vuông hồng mảnh phù hợp ghi chép tự do",
    outerClass: "bg-[#FFE8F1] border-2 border-[#FFB7CE]",
    innerClass: "paper-heart-grid border-2 border-[#FFB7CE]",
    swatchClass: "bg-white border-[#FFB7CE]",
  },
];

export function getPaperTemplate(id: PaperTemplateId): PaperTemplateSpec {
  return PAPER_TEMPLATES.find((t) => t.id === id) ?? PAPER_TEMPLATES[0]!;
}
