import { prisma } from "@/lib/prisma";
import { normalizeVietnamese } from "@/services/intent";

const allowedCommands = new Set([
  "/taikhoan", "/sodu", "/donhang", "/thongbao", "/doctatca", "/lichsurut",
  "/ruttien", "/nhiemvu", "/gioithieu", "/biendongsodu", "/nhatky", "/baomat",
  "/phien", "/hotro", "/huongdan", "/xoachat", "/xoataikhoan"
]);

function stringArray(raw: string) {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function findDynamicIntentCommand(content: string, authenticated: boolean) {
  const input = normalizeVietnamese(content);
  if (!input) return null;
  const definitions = await prisma.intentDefinition.findMany({ where: { isActive: true }, take: 100 });
  for (const definition of definitions) {
    if (definition.requiresAuth && !authenticated) continue;
    const command = definition.commandTemplate.split(/\s+/, 1)[0];
    if (!allowedCommands.has(command)) continue;
    const examples = stringArray(definition.examples).map(normalizeVietnamese);
    const keywords = stringArray(definition.keywords).map(normalizeVietnamese);
    if (examples.includes(input) || keywords.some((keyword) => keyword.length > 2 && input.includes(keyword))) {
      return definition.commandTemplate;
    }
  }
  return null;
}
