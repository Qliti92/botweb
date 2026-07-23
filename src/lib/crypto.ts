import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { requireServerSecret } from "@/lib/secrets";

const prefix = "enc:v1:";

function key() {
  const secret = requireServerSecret("ENCRYPTION_SECRET");
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string) {
  if (!value || value.startsWith(prefix)) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${prefix}${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
}

export function decryptSecret(value: string) {
  if (!value.startsWith(prefix)) return value;
  const payload = Buffer.from(value.slice(prefix.length), "base64url");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
