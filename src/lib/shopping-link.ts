export type ShoppingPlatform = "shopee" | "tiktok";

export type ShoppingLinkClassification =
  | { kind: "empty" }
  | { kind: "text" }
  | { kind: "invalid-url" }
  | { kind: "unsupported"; url: string }
  | { kind: "supported"; url: string; platform: ShoppingPlatform };

const URL_LIKE_PATTERN = /^(?:https?:\/\/|www\.)/i;
const trackingParameters = new Set(["fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid"]);

function normalizeShoppingUrl(url: URL) {
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || trackingParameters.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
}

export function classifyShoppingLink(value: string): ShoppingLinkClassification {
  const input = value.trim();
  if (!input) return { kind: "empty" };
  if (!URL_LIKE_PATTERN.test(input)) return { kind: "text" };

  try {
    const url = new URL(/^www\./i.test(input) ? `https://${input}` : input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { kind: "invalid-url" };

    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (host === "shopee.vn" || host.endsWith(".shopee.vn") || host === "shp.ee" || host.endsWith(".shp.ee")) {
      return { kind: "supported", url: normalizeShoppingUrl(url), platform: "shopee" };
    }
    if (
      host === "tiktok.com" ||
      host.endsWith(".tiktok.com") ||
      host === "tiktokshop.com" ||
      host.endsWith(".tiktokshop.com")
    ) {
      return { kind: "supported", url: normalizeShoppingUrl(url), platform: "tiktok" };
    }
    return { kind: "unsupported", url: url.toString() };
  } catch {
    return { kind: "invalid-url" };
  }
}

export function shoppingPlatformLabel(platform: ShoppingPlatform) {
  return platform === "shopee" ? "Shopee" : "TikTok Shop";
}
