const insecureDefaults = new Set(["", "dev-secret-change-me", "change-me", "secret"]);

export function requireServerSecret(name: "JWT_SECRET" | "ENCRYPTION_SECRET") {
  const fallback = name === "ENCRYPTION_SECRET" ? process.env.JWT_SECRET : undefined;
  const value = process.env[name] ?? fallback ?? (process.env.NODE_ENV === "production" ? "" : "local-development-only-secret");

  if (process.env.NODE_ENV === "production" && (value.length < 32 || insecureDefaults.has(value.toLowerCase()))) {
    throw new Error(`${name} phải có ít nhất 32 ký tự và không được dùng giá trị mặc định.`);
  }

  return value;
}
