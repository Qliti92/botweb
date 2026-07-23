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

export const knowledgeEntrySchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(4000),
  keywords: z.string().trim().max(500).default(""),
  category: z.string().trim().min(1).max(80).default("Chung"),
  sourceLabel: z.string().trim().min(1).max(120).default("Trung tâm trợ giúp"),
  sourceUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true)
});

export const supportTicketSchema = z.object({
  orderId: z.string().trim().max(100).optional().nullable(),
  category: z.enum(["MISSING_ORDER", "WRONG_CASHBACK", "DELAYED", "REJECTED", "ACCOUNT", "OTHER"]),
  subject: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(4000)
});

export const intentDefinitionSchema = z.object({
  name: z.string().trim().regex(/^[A-Z][A-Z0-9_]{2,60}$/),
  description: z.string().trim().max(500).optional().nullable(),
  examples: z.string().trim().default("[]"),
  keywords: z.string().trim().default("[]"),
  commandTemplate: z.string().trim().regex(/^\/[a-z0-9-]+(?:\s+[a-z0-9={}_-]+)*$/i),
  requiresAuth: z.boolean().default(true),
  requiresConfirm: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

export const proactiveNotificationSchema = z.object({
  accountKey: z.string().trim().optional().nullable(),
  sessionId: z.string().trim().optional().nullable(),
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().min(2).max(1000),
  actionUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  deliverAt: z.coerce.date().optional()
});

export const withdrawalFormSchema = z.object({
  amount: z.coerce.number().int().gt(10_000).max(1_000_000_000),
  bankName: z.string().trim().min(2).max(100),
  accountNumber: z.string().trim().regex(/^[0-9]{6,30}$/),
  accountName: z.string().trim().min(2).max(120)
});
