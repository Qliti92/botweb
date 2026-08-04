import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { htmlToText } from "@/lib/html-to-text";
import { getSiteSettings } from "@/services/site-settings";

const endpoint = "https://hoantienmuahang.vn/api/v1/openapi/pages";
const localFallbackPages: Record<string, Record<string, unknown>> = {
  "chinh-sach-bao-mat": {
    title: "Chính sách bảo mật",
    meta_description: "Cách Em Ry thu thập, sử dụng, bảo vệ và lưu trữ dữ liệu khi bạn sử dụng dịch vụ.",
    content: `1. Dữ liệu được thu thập
Em Ry có thể xử lý thông tin tài khoản bạn cung cấp, link sản phẩm, lịch sử trò chuyện, dữ liệu đơn hàng do đối tác trả về, yêu cầu hỗ trợ và thông tin kỹ thuật cần thiết để bảo vệ phiên đăng nhập.

2. Mục đích sử dụng
Dữ liệu được dùng để tạo và theo dõi link mua hàng, ghi nhận đơn và tiền hoàn, hỗ trợ rút tiền, bảo vệ tài khoản, xử lý yêu cầu hỗ trợ và cải thiện chất lượng dịch vụ.

3. Chia sẻ và xử lý dữ liệu
Thông tin chỉ được chuyển tới nhà cung cấp hạ tầng hoặc đối tác cần thiết để thực hiện chức năng bạn yêu cầu. Em Ry không yêu cầu mật khẩu, OTP hoặc mã PIN của tài khoản Shopee, TikTok Shop hay ngân hàng.

4. Thời gian lưu trữ
Thời gian lưu phụ thuộc loại dữ liệu, trạng thái tài khoản, yêu cầu hỗ trợ và nghĩa vụ đối soát. Dữ liệu không còn cần thiết sẽ được xóa hoặc ẩn danh theo cấu hình vận hành.

5. Quyền của bạn
Bạn có thể yêu cầu kiểm tra, cập nhật hoặc xóa thông tin tài khoản trong phạm vi hệ thống hỗ trợ. Một số dữ liệu giao dịch có thể cần được giữ lại để đối soát hoặc giải quyết khiếu nại.

6. Bảo vệ tài khoản
Không chia sẻ mật khẩu Em Ry, OTP ngân hàng hoặc mật khẩu tài khoản mua sắm. Hãy đăng xuất khỏi thiết bị dùng chung và báo ngay khi phát hiện truy cập bất thường.

7. Liên hệ
Nếu có câu hỏi về dữ liệu cá nhân, hãy sử dụng mục Hỗ trợ trong Em Ry hoặc liên hệ theo thông tin công bố trên website.`
  },
  "dieu-khoan-dich-vu": {
    title: "Điều khoản dịch vụ",
    meta_description: "Các điều kiện áp dụng khi sử dụng Em Ry để tạo link, theo dõi đơn hàng và nhận tiền hoàn.",
    content: `1. Phạm vi dịch vụ
Em Ry hỗ trợ xử lý link sản phẩm từ các nền tảng được công bố, theo dõi dữ liệu do đối tác cung cấp và hiển thị tiền hoàn của giao dịch đủ điều kiện.

2. Tài khoản người dùng
Bạn cần cung cấp thông tin chính xác, bảo vệ thông tin đăng nhập và chịu trách nhiệm với thao tác phát sinh từ tài khoản của mình. Mỗi người nên sử dụng tài khoản riêng để việc ghi nhận được chính xác.

3. Điều kiện ghi nhận
Bạn cần bắt đầu phiên mua từ link Em Ry tạo và hoàn tất thanh toán trên sàn. Đơn bị hủy, trả hàng, hoàn tiền, sai nguồn giới thiệu hoặc không được đối tác xác nhận có thể không đủ điều kiện.

4. Giá trị dự kiến
Giá sản phẩm và hoa hồng hiển thị ban đầu chỉ là dữ liệu dự kiến. Kết quả cuối cùng phụ thuộc trạng thái đơn hàng, chính sách nền tảng, thuế và kết quả đối soát của đối tác.

5. Hành vi không được phép
Không sử dụng dịch vụ để gian lận, tạo giao dịch giả, xâm nhập hệ thống, phát tán nội dung độc hại hoặc gây ảnh hưởng tới người dùng khác.

6. Gián đoạn dịch vụ
Dịch vụ có thể tạm gián đoạn do bảo trì, mất kết nối hoặc hệ thống đối tác. Em Ry sẽ cố gắng khôi phục và bảo toàn dữ liệu đang chờ xử lý trong phạm vi kỹ thuật cho phép.

7. Thay đổi điều khoản
Điều khoản có thể được cập nhật để phù hợp với tính năng và chính sách đối tác. Phiên bản được công bố trên website là phiên bản đang áp dụng.`
  }
};

async function getPublicPage(slug: string) {
  if (!/^[a-z0-9-]{1,100}$/i.test(slug)) return null;
  try {
    const response = await fetch(`${endpoint}/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!response.ok) return localFallbackPages[slug] ?? null;
    const json = await response.json();
    if (json.success === false || !json.data) return localFallbackPages[slug] ?? null;
    return json.data as Record<string, unknown>;
  } catch {
    return localFallbackPages[slug] ?? null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPublicPage(slug), getSiteSettings()]);
  if (!page) return { title: "Không tìm thấy trang", robots: { index: false, follow: false } };
  const title = String(page.title ?? "Thông tin");
  const description = String(page.meta_description ?? htmlToText(page.content).slice(0, 160));
  const canonical = `/thong-tin/${encodeURIComponent(slug)}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      siteName: settings.siteName,
      locale: "vi_VN"
    },
    twitter: { card: "summary", title, description }
  };
}

export default async function PublicInformationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPublicPage(slug), getSiteSettings()]);
  if (!page) notFound();
  const base = settings.canonicalUrl.replace(/\/+$/, "");
  const title = String(page.title ?? "Thông tin");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: String(page.meta_description ?? ""),
    url: `${base}/thong-tin/${encodeURIComponent(slug)}`,
    inLanguage: "vi-VN",
    isPartOf: { "@id": `${base}/#website` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: base },
        { "@type": "ListItem", position: 2, name: title }
      ]
    },
    dateModified: page.updated_at ? String(page.updated_at) : undefined
  };

  return (
    <main className="min-h-dvh bg-[#fafaf8] px-4 py-8 text-[#30343b] sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-[#d9dde3] bg-white shadow-[0_14px_40px_rgba(48,52,59,.07)]">
        <header className="border-b border-[#e7e9ed] bg-[#f1f7f4] px-5 py-5 sm:px-8">
          <a href="/" className="text-xs font-medium text-[#287a63]">← Quay lại trang chủ</a>
          <h1 className="mt-3 text-2xl font-bold tracking-[-.02em] sm:text-3xl">{title}</h1>
          {page.meta_description ? <p className="mt-2 text-sm leading-6 text-neutral-500">{String(page.meta_description)}</p> : null}
        </header>
        <div className="whitespace-pre-line px-5 py-6 text-sm leading-7 text-neutral-700 sm:px-8">{htmlToText(page.content)}</div>
        {page.updated_at ? <footer className="border-t border-[#e7e9ed] px-5 py-3 text-xs text-neutral-400 sm:px-8">Cập nhật: {new Date(String(page.updated_at)).toLocaleString("vi-VN")}</footer> : null}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    </main>
  );
}
