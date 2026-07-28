import type { Metadata } from "next";
import { SystemPage } from "@/components/system-page";

export const metadata: Metadata = {
  title: "Không có quyền truy cập",
  robots: { index: false, follow: false }
};

export default function ForbiddenPage() {
  return <SystemPage code="403" eyebrow="Truy cập bị giới hạn" title="Bạn không có quyền mở nội dung này" description="Hãy đăng nhập bằng đúng tài khoản được cấp quyền. Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ." />;
}
