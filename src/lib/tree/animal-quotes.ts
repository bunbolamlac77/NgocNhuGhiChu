export type MvpAnimalId = "bunny" | "kitty";

export const ANIMAL_QUOTES: Record<MvpAnimalId, readonly string[]> = {
  bunny: [
    "Thỏ Hoa: Tặng Ngọc Như một bông hoa anh đào may mắn nè!",
    "Thỏ Hoa: Mỗi ngày viết vài dòng nhỏ cũng làm khu vườn thêm rực rỡ đó!",
    "Thỏ Hoa: Cứ bình tĩnh bước từng chút một, Như làm tốt lắm luôn!",
  ],
  kitty: [
    "Mèo Dâu: Meo~ Nhớ tưới sương cho cây ước mỗi ngày nha Ngọc Như!",
    "Mèo Dâu: Gửi Như một ôm nắng ấm áp từ bãi cỏ anh đào!",
    "Mèo Dâu: Điều ước nhỏ hôm nay sẽ nở hoa thật xinh sớm thôi!",
  ],
};

export function pickAnimalQuote(animalId: MvpAnimalId, tapIndex: number): string {
  const quotes = ANIMAL_QUOTES[animalId];
  return quotes[Math.abs(tapIndex) % quotes.length] ?? quotes[0]!;
}
