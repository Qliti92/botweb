export type RegistrationErrorCategory =
  | "EMAIL_EXISTS"
  | "INVALID_INPUT"
  | "REFERRAL"
  | "NETWORK"
  | "RATE_LIMIT"
  | "SERVER"
  | "OTHER";

export function registrationErrorCategory(message: string, status?: number): RegistrationErrorCategory {
  const value = message.toLocaleLowerCase("vi");
  if (status === 429 || value.includes("quá nhanh") || value.includes("thử lại sau")) return "RATE_LIMIT";
  if (value.includes("email") && (value.includes("tồn tại") || value.includes("đã được") || value.includes("đã dùng") || value.includes("already"))) return "EMAIL_EXISTS";
  if (value.includes("giới thiệu") || value.includes("referral")) return "REFERRAL";
  if (value.includes("mạng") || value.includes("network") || value.includes("fetch") || value.includes("kết nối")) return "NETWORK";
  if (status && status >= 500) return "SERVER";
  if (value.includes("server") || value.includes("máy chủ") || value.includes("api") || value.includes("access token")) return "SERVER";
  if (
    value.includes("không hợp lệ")
    || value.includes("mật khẩu")
    || value.includes("định dạng")
    || value.includes("số điện thoại")
    || value.includes("họ tên")
    || value.includes("validation")
  ) return "INVALID_INPUT";
  return "OTHER";
}

export function registrationErrorCode(category: RegistrationErrorCategory, status?: number) {
  if (status === 429) return "AUTH_RATE_LIMITED";
  if (status && status >= 500) return "AUTH_SERVER_ERROR";
  return `AUTH_${category}`;
}
