import type { Metadata } from "next";
import { SystemPage } from "@/components/system-page";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  robots: { index: false, follow: false }
};

export default function NotFound() {
  return <SystemPage code="404" eyebrow="Không tìm thấy" title="Trang này không tồn tại" description="Đường dẫn có thể đã thay đổi, hết hiệu lực hoặc được nhập chưa chính xác. Bạn có thể trở về trang chủ hoặc mở Em Ry để tiếp tục." />;
}
