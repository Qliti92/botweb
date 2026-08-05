import assert from "node:assert/strict";
import { detectIntent, normalizeVietnamese } from "../src/services/intent";
import { classifyShoppingLink } from "../src/lib/shopping-link";
import { redactIntentText } from "../src/services/intent-fallback";

const cases: Array<[string, string, string]> = [
  ["Ví của tôi còn bao nhiêu tiền?", "BALANCE", "/taikhoan"],
  ["Cho tôi xem đơn Shopee đang chờ", "ORDERS", "/donhang status=pending platform=shopee"],
  ["Tôi muốn rút tiền", "WITHDRAW", "/ruttien"],
  ["Các lần rút tiền trước", "WITHDRAWALS", "/lichsurut"],
  ["Tôi cần gặp nhân viên", "SUPPORT", "/hotro"],
  ["Hỗ trợ tôi", "SUPPORT", "/hotro"],
  ["Liên hệ với ai?", "SUPPORT", "/hotro"],
  ["Tôi muốn tra soát đơn", "ORDER_DISPUTE", "/trasoat category=MISSING_ORDER"],
  ["Đơn chưa ghi nhận", "ORDER_DISPUTE", "/trasoat category=MISSING_ORDER"],
  ["Tiền hoàn bị sai", "ORDER_DISPUTE", "/trasoat category=WRONG_CASHBACK"],
  ["Đơn chờ quá lâu", "ORDER_DISPUTE", "/trasoat category=DELAYED"],
  ["Đơn bị từ chối cần kiểm tra", "ORDER_DISPUTE", "/trasoat category=REJECTED"],
  ["Cho tôi xem chính sách bảo mật", "STATIC_PAGE", "/page chinh-sach-bao-mat"],
  ["Điều khoản sử dụng", "STATIC_PAGE", "/page dieu-khoan-dich-vu"],
  ["Giới thiệu về hệ thống", "BOT_IDENTITY", "/ry-la-ai"],
  ["Thiết bị nào đang đăng nhập?", "SESSIONS", "/phien"],
  ["Hướng dẫn tôi cách sử dụng", "GUIDE", "/huongdan"],
  ["Cài ứng dụng trên iPhone thế nào?", "INSTALL_GUIDE", "/caidat"],
  ["Đưa Em Ry ra màn hình chính", "INSTALL_GUIDE", "/caidat"],
  ["Lấy link Shopee ở đâu?", "LINK_GUIDE", "/laylink shopee"],
  ["Cách sao chép liên kết TikTok Shop", "LINK_GUIDE", "/laylink tiktok"],
  ["lấy link thế nào", "LINK_GUIDE", "/laylink"],
  ["cách lấy link", "LINK_GUIDE", "/laylink"],
  ["lấy link shoppe", "LINK_GUIDE", "/laylink shopee"],
  ["link shope", "LINK_GUIDE", "/laylink shopee"],
  ["cài app", "INSTALL_GUIDE", "/caidat"],
  ["cài app trên iphone", "INSTALL_GUIDE", "/caidat"],
  ["cài trên iphone", "INSTALL_GUIDE", "/caidat"],
  ["xóa chat", "CLEAR_CHAT", "/xoachat"],
  ["xoá chát", "CLEAR_CHAT", "/xoachat"],
  ["dọn cuộc trò chuyện", "CLEAR_CHAT", "/xoachat"],
  ["xóa tài khoản", "DELETE_ACCOUNT", "/xoataikhoan"],
  ["đóng tài khoản", "DELETE_ACCOUNT", "/xoataikhoan"],
  ["xóa", "DELETE_AMBIGUOUS", "/lamro-xoa"],
  ["tôi muốn xóa", "DELETE_AMBIGUOUS", "/lamro-xoa"],
  ["không xóa nữa", "CANCEL", "/huy"],
  ["thôi không xóa", "CANCEL", "/huy"],
  ["xin chào", "GREETING", "/chao"],
  ["cảm ơn Ry", "THANKS", "/camon"],
  ["Ry là ai?", "BOT_IDENTITY", "/ry-la-ai"],
  ["đọc tất cả thông báo", "MARK_NOTIFICATIONS_READ", "/doctatca"],
  ["đăng xuất thiết bị khác", "REVOKE_OTHER_SESSIONS", "/phien revoke-others"]
  ,["đổi pass", "CHANGE_PASSWORD", "/doimatkhau"]
  ,["thay mật khẩu", "CHANGE_PASSWORD", "/doimatkhau"]
  ,["cập nhật thông tin", "UPDATE_PROFILE", "/capnhat"]
  ,["đổi số điện thoại", "UPDATE_PROFILE", "/capnhat"]
];

for (const [input, intent, command] of cases) {
  const result = detectIntent(input);
  assert.ok(result, `Không nhận ra ý định: ${input}`);
  assert.equal(result.intent, intent);
  assert.equal(result.command, command);
  assert.ok(result.confidence >= 0.9);
}

assert.equal(detectIntent("https://shopee.vn/product/123"), null);
assert.deepEqual(classifyShoppingLink("https://shopee.vn/product/123"), {
  kind: "supported",
  url: "https://shopee.vn/product/123",
  platform: "shopee"
});
assert.equal(classifyShoppingLink("https://vt.tiktok.com/abc").kind, "supported");
assert.equal(classifyShoppingLink("https://example.com/product").kind, "unsupported");
assert.equal(classifyShoppingLink("https://shopee.vn.evil.example/product").kind, "unsupported");
assert.equal(classifyShoppingLink("https://").kind, "invalid-url");
assert.equal(detectIntent("/donhang"), null);
assert.equal(normalizeVietnamese("Đơn HÀNG đã duyệt"), "don hang da duyet");
assert.equal(
  redactIntentText("email abc@example.com, số 0912 345 678, mã DH12345678"),
  "email [EMAIL ĐÃ ẨN], số [SỐ ĐÃ ẨN], mã [MÃ ĐÃ ẨN]"
);

const amountCases: Array<[string, number]> = [
  ["rút 200k", 200_000],
  ["rút tiền 1 triệu", 1_000_000],
  ["chuyển tiền về ngân hàng 500 nghìn", 500_000],
  ["rut tienn 750k", 750_000]
];
for (const [input, amount] of amountCases) {
  const result = detectIntent(input);
  assert.equal(result?.intent, "WITHDRAW");
  assert.equal(result?.parameters?.amount, amount);
}

const typoCases: Array<[string, string]> = [
  ["xem đơn han", "ORDERS"],
  ["đơn shoppe đang chờ", "ORDERS"],
  ["đơn tik tok đã duyệt", "ORDERS"],
  ["xem số dưu", "BALANCE"]
];
for (const [input, intent] of typoCases) assert.equal(detectIntent(input)?.intent, intent);

console.log(`Intent tests passed: ${cases.length + 3 + amountCases.length * 2 + typoCases.length}`);
