import { prisma } from "@/lib/prisma";

const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(length = 7) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function isShopeeMarketingUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return host.includes("shopee.") || host === "s.shopee.vn" || host.endsWith(".shopee.vn");
  } catch {
    return false;
  }
}

export async function createShortLink(originalUrl: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeCode();
    try {
      return await prisma.shortLink.create({
        data: {
          code,
          originalUrl,
          updatedAt: new Date()
        }
      });
    } catch {
      continue;
    }
  }

  throw new Error("Không thể tạo mã rút gọn lúc này.");
}

export async function resolveShortLink(code: string) {
  const link = await prisma.shortLink.findUnique({ where: { code } });
  if (!link) return null;

  await prisma.shortLink.update({
    where: { code },
    data: { clickCount: { increment: 1 } }
  });

  return link;
}
