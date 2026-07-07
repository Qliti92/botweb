# AI Chatbot Admin Website

Website chatbot mobile-first dùng Next.js App Router, Prisma, TailwindCSS, JWT cookie cho admin và bcrypt để mã hóa mật khẩu.

## Chức năng chính

- Chatbot dạng app chat, tối ưu mobile, input luôn ở dưới cùng.
- Đăng ký và đăng nhập user ngay trong luồng chat bằng số điện thoại.
- Mật khẩu user/admin được hash bằng bcrypt.
- Bot lấy câu trả lời từ bảng `conversation_flows`, admin có thể chỉnh mà không sửa code.
- Chuyển đổi link qua API cấu hình trong admin. Mặc định có `mock://convert-link` để chạy local ngay.
- Admin `/admin` quản lý user, kịch bản chatbot, API config và lịch sử chat.
- Middleware bảo vệ route admin, API login admin có rate limit đơn giản.

## Công nghệ

- Next.js + React
- API Routes của Next.js
- Prisma ORM
- SQLite mặc định để chạy local nhanh
- TailwindCSS
- JWT bằng `jose`
- bcrypt bằng `bcryptjs`

## Cài đặt

1. Cài dependency:

```bash
npm install
```

2. Tạo file môi trường:

```bash
cp .env.example .env
```

Trên Windows PowerShell có thể dùng:

```powershell
Copy-Item .env.example .env
```

3. Tạo database và seed dữ liệu:

```bash
npm run prisma:migrate -- --name init
npm run db:seed
```

Nếu Prisma schema engine trên Windows/Node hiện tại báo `Schema engine error`, dùng lệnh khởi tạo SQLite dự phòng:

```bash
npm run db:init
npm run db:seed
```

4. Chạy dev server:

```bash
npm run dev
```

Mở `http://localhost:3000`.

## Tài khoản admin mặc định

Seed đọc từ `.env`, mặc định:

- Email: `admin@example.com`
- Mật khẩu: `admin123456`

Sau khi đăng nhập admin tại `/admin`, bạn có thể đổi nội dung bot trong tab `Kịch bản` và cấu hình API thật trong tab `API`.

## Luồng chat mẫu

1. Bot hỏi số điện thoại.
2. Nếu số chưa tồn tại, bot hỏi có đăng ký không.
3. Nhập `có`, sau đó nhập user ID, email và mật khẩu.
4. Sau đăng ký thành công, bot hiển thị menu.
5. Chọn `1` hoặc nhập `Chuyển đổi link`.
6. Gửi một URL hợp lệ, bot trả về link đã chuyển đổi.

## Đổi sang PostgreSQL hoặc MySQL

Trong `prisma/schema.prisma`, đổi `datasource db.provider` sang `postgresql` hoặc `mysql`, sau đó cập nhật `DATABASE_URL` trong `.env`.

Ví dụ PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Sau đó chạy lại:

```bash
npm run prisma:migrate -- --name init
npm run db:seed
```

## Cấu trúc thư mục

```text
src/
  app/
    api/
    admin/
  components/
  lib/
  services/
  types/
prisma/
  schema.prisma
  seed.ts
```

## Ghi chú bảo mật

- Không đưa API key ra frontend. Lưu header/token trong `api_configs.headers`.
- Đổi `JWT_SECRET` trước khi dùng thật.
- SQLite chỉ phù hợp local/dev; production nên dùng PostgreSQL hoặc MySQL.
