export type IntentResult = {
  intent:
    | "LOGIN"
    | "REGISTER"
    | "BALANCE"
    | "ORDERS"
    | "WITHDRAWALS"
    | "WITHDRAW"
    | "NOTIFICATIONS"
    | "TASKS"
    | "REFERRALS"
    | "BALANCE_LOGS"
    | "ACTIVITY_LOGS"
    | "SECURITY"
    | "SESSIONS"
    | "GUIDE"
    | "SUPPORT"
    | "ORDER_DISPUTE"
    | "STATIC_PAGE"
    | "CLEAR_CHAT"
    | "DELETE_ACCOUNT"
    | "DELETE_AMBIGUOUS"
    | "CANCEL"
    | "GREETING"
    | "THANKS"
    | "BOT_IDENTITY"
    | "MARK_NOTIFICATIONS_READ"
    | "REVOKE_OTHER_SESSIONS";
  command: string;
  confidence: number;
  parameters?: {
    amount?: number;
    platform?: "shopee" | "tiktok";
    status?: "approved" | "pending";
    pageSlug?: string;
  };
};

export function normalizeVietnamese(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:/._?=&-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized
    .replace(/\bdon han\b/g, "don hang")
    .replace(/\bso duu\b/g, "so du")
    .replace(/\brut tienn\b/g, "rut tien")
    .replace(/\btik tok\b/g, "tiktok")
    .replace(/\bshoppe\b/g, "shopee");
}

function hasAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function extractAmount(text: string) {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin|ngan|d|dong)?\b/);
  if (!match) return undefined;
  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value)) return undefined;
  const unit = match[2];
  if (unit === "trieu" || unit === "tr") return Math.round(value * 1_000_000);
  if (unit === "k" || unit === "nghin" || unit === "ngan") return Math.round(value * 1_000);
  return Math.round(value);
}

export function detectIntent(input: string): IntentResult | null {
  const text = normalizeVietnamese(input);
  if (!text || text.startsWith("/") || /^https?:\/\//.test(text)) return null;

  if (["chao", "xin chao", "hello", "hi", "alo", "chao ry", "ry oi"].includes(text)) {
    return { intent: "GREETING", command: "/chao", confidence: 0.99 };
  }
  if (hasAny(text, ["cam on", "thank you", "thanks", "tot lam", "gioi qua"])) {
    return { intent: "THANKS", command: "/camon", confidence: 0.98 };
  }
  if (hasAny(text, ["ban la ai", "ry la ai", "ten gi", "lam duoc gi", "giup duoc gi"])) {
    return { intent: "BOT_IDENTITY", command: "/ry-la-ai", confidence: 0.97 };
  }
  if (hasAny(text, ["khong xoa nua", "thoi khong xoa", "huy xoa", "dung xoa", "bo qua", "huy thao tac"])) {
    return { intent: "CANCEL", command: "/huy", confidence: 0.98 };
  }
  if (hasAny(text, ["xoa tai khoan", "dong tai khoan", "huy tai khoan", "khong dung tai khoan nua"])) {
    return { intent: "DELETE_ACCOUNT", command: "/xoataikhoan", confidence: 0.98 };
  }
  if (hasAny(text, ["xoa chat", "xoa tro chuyen", "xoa cuoc tro chuyen", "don chat", "don cuoc tro chuyen", "lam moi chat", "xoa tin nhan"])) {
    return { intent: "CLEAR_CHAT", command: "/xoachat", confidence: 0.98 };
  }
  if (["xoa", "xoa di", "toi muon xoa"].includes(text)) {
    return { intent: "DELETE_AMBIGUOUS", command: "/lamro-xoa", confidence: 0.99 };
  }
  if (hasAny(text, ["dang nhap", "vao tai khoan", "login"]) && !hasAny(text, ["thiet bi", "phien", "o dau"])) return { intent: "LOGIN", command: "1", confidence: 0.98 };
  if (hasAny(text, ["dang ky", "tao tai khoan", "mo tai khoan"])) return { intent: "REGISTER", command: "2", confidence: 0.98 };
  if (hasAny(text, ["can ho tro", "gap nhan vien", "noi chuyen nhan vien", "lien he ho tro"])) return { intent: "SUPPORT", command: "/hotro", confidence: 0.97 };
  if (hasAny(text, ["chinh sach bao mat", "bao mat thong tin", "quyen rieng tu", "privacy policy"])) {
    return { intent: "STATIC_PAGE", command: "/page chinh-sach-bao-mat", confidence: 0.99, parameters: { pageSlug: "chinh-sach-bao-mat" } };
  }
  if (hasAny(text, ["dieu khoan su dung", "dieu khoan dich vu", "terms of service", "quy dinh su dung"])) {
    return { intent: "STATIC_PAGE", command: "/page dieu-khoan-dich-vu", confidence: 0.99, parameters: { pageSlug: "dieu-khoan-dich-vu" } };
  }
  if (hasAny(text, ["gioi thieu ve he thong", "gioi thieu website", "ve chung toi", "thong tin cong ty"])) {
    return { intent: "BOT_IDENTITY", command: "/ry-la-ai", confidence: 0.97 };
  }
  if (hasAny(text, ["huong dan", "cach su dung", "dung nhu the nao"])) return { intent: "GUIDE", command: "/huongdan", confidence: 0.95 };
  if (hasAny(text, ["tra soat", "khieu nai don", "kiem tra lai don", "don chua ghi nhan", "khong thay don", "mat don", "sai tien hoan", "tien hoan bi sai", "don cho qua lau", "don bi tu choi"])) {
    const category = hasAny(text, ["sai tien hoan", "tien hoan bi sai"]) ? "WRONG_CASHBACK"
      : hasAny(text, ["cho qua lau", "cham", "lau chua"]) ? "DELAYED"
      : hasAny(text, ["tu choi", "rejected"]) ? "REJECTED"
      : "MISSING_ORDER";
    return { intent: "ORDER_DISPUTE", command: `/trasoat category=${category}`, confidence: 0.98 };
  }
  if (hasAny(text, ["rut tien", "rut ", "chuyen tien ve ngan hang"]) && !hasAny(text, ["lich su rut", "lan rut tien", "yeu cau rut"])) {
    return { intent: "WITHDRAW", command: "/ruttien", confidence: 0.94, parameters: { amount: extractAmount(text) } };
  }
  if (hasAny(text, ["lich su rut", "lan rut tien", "yeu cau rut"])) return { intent: "WITHDRAWALS", command: "/lichsurut", confidence: 0.93 };
  if (hasAny(text, ["don hang", "don shopee", "don tiktok", "tien hoan cua don"])) {
    const platform = text.includes("shopee") ? " platform=shopee" : text.includes("tiktok") ? " platform=tiktok" : "";
    const status = hasAny(text, ["da duyet", "thanh cong"]) ? " status=approved" : hasAny(text, ["dang cho", "cho duyet"]) ? " status=pending" : "";
    return {
      intent: "ORDERS",
      command: `/donhang${status}${platform}`,
      confidence: 0.93,
      parameters: {
        platform: text.includes("shopee") ? "shopee" : text.includes("tiktok") ? "tiktok" : undefined,
        status: hasAny(text, ["da duyet", "thanh cong"]) ? "approved" : hasAny(text, ["dang cho", "cho duyet"]) ? "pending" : undefined
      }
    };
  }
  if (hasAny(text, ["so du", "con bao nhieu tien", "tien trong vi", "vi cua toi", "kiem tra vi", "xem vi", "vi con tien khong"])) return { intent: "BALANCE", command: "/taikhoan", confidence: 0.94 };
  if (hasAny(text, ["thong bao", "tin moi"]) && !hasAny(text, ["doc tat ca", "danh dau da doc", "xoa thong bao chua doc"])) {
    return { intent: "NOTIFICATIONS", command: "/thongbao", confidence: 0.91 };
  }
  if (hasAny(text, ["doc tat ca thong bao", "danh dau da doc", "xoa thong bao chua doc"])) {
    return { intent: "MARK_NOTIFICATIONS_READ", command: "/doctatca", confidence: 0.97 };
  }
  if (hasAny(text, ["nhiem vu", "phan thuong", "nhan thuong", "lam nhiem vu", "tien do nhiem vu"])) return { intent: "TASKS", command: "/nhiemvu", confidence: 0.9 };
  if (hasAny(text, ["gioi thieu", "ma gioi thieu", "hoa hong f1", "hoa hong f2", "moi ban", "link moi ban"])) return { intent: "REFERRALS", command: "/gioithieu", confidence: 0.91 };
  if (hasAny(text, ["bien dong so du", "lich su vi", "cong tru tien"])) return { intent: "BALANCE_LOGS", command: "/biendongsodu", confidence: 0.92 };
  if (hasAny(text, ["nhat ky", "hoat dong tai khoan"])) return { intent: "ACTIVITY_LOGS", command: "/nhatky", confidence: 0.9 };
  if (hasAny(text, ["bao mat", "xac thuc 2 lop", "2fa", "otp"])) return { intent: "SECURITY", command: "/baomat", confidence: 0.9 };
  if ((hasAny(text, ["thiet bi dang nhap", "phien dang nhap", "dang nhap o dau"]) || (text.includes("thiet bi") && text.includes("dang nhap"))) && !hasAny(text, ["thiet bi khac", "may khac", "phien khac"])) {
    return { intent: "SESSIONS", command: "/phien", confidence: 0.92 };
  }
  if (hasAny(text, ["dang xuat thiet bi khac", "dang xuat cac may khac", "thu hoi phien khac", "xoa phien khac"])) {
    return { intent: "REVOKE_OTHER_SESSIONS", command: "/phien revoke-others", confidence: 0.98 };
  }
  return null;
}
