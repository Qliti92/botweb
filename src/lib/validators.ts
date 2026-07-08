import { z } from "zod";

export const phoneSchema = z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không hợp lệ.");
export const emailSchema = z.string().trim().toLowerCase().email("Email không hợp lệ.");
export const passwordSchema = z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.");
export const urlSchema = z.string().trim().url("Link không hợp lệ.");

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập tài khoản admin."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu.")
});

export const chatMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().trim().min(1, "Tin nhắn không được để trống.").max(2000)
});

export const flowSchema = z.object({
  flowKey: z.string().trim().min(1),
  title: z.string().trim().min(1),
  triggerKeyword: z.string().trim().optional().nullable(),
  botMessage: z.string().trim().min(1),
  expectedInputType: z.string().trim().optional().nullable(),
  nextFlowKey: z.string().trim().optional().nullable(),
  actionType: z.enum(["CHECK_PHONE", "REGISTER_USER", "LOGIN_USER", "SHOW_MENU", "CONVERT_LINK", "API_CALL", "STATIC_MESSAGE"]).optional().nullable(),
  apiId: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
});

export const apiConfigSchema = z.object({
  name: z.string().trim().min(1),
  key: z.string().trim().min(1),
  endpoint: z.string().trim().min(1),
  method: z.enum(["GET", "POST"]),
  headers: z.string().trim().default("{}"),
  bodySample: z.string().trim().default("{}"),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true)
});

export const appNoticeSchema = z.object({
  title: z.string().trim().min(1, "Vui long nhap tieu de thong bao.").max(120),
  message: z.string().trim().min(1, "Vui long nhap noi dung thong bao.").max(1000),
  displaySeconds: z.coerce.number().int().min(1).max(3600).default(10),
  isActive: z.boolean().default(true)
});
