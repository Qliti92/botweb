import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-this-admin-password";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      name: "Administrator",
      passwordHash
    }
  });

  await prisma.apiConfig.upsert({
    where: { key: "cashback_link" },
    update: {
      name: "API tạo link hoàn tiền",
      endpoint: "https://hoantienmuahang.vn/api/v1/openapi/cashback/link",
      method: "POST",
      headers: "{}",
      bodySample: "{\"url\":\"{{input}}\"}",
      description: "Tạo link affiliate rút gọn cho sản phẩm Shopee/TikTok Shop và trả thông tin hoàn tiền."
    },
    create: {
      key: "cashback_link",
      name: "API tạo link hoàn tiền",
      endpoint: "https://hoantienmuahang.vn/api/v1/openapi/cashback/link",
      method: "POST",
      headers: "{}",
      bodySample: "{\"url\":\"{{input}}\"}",
      description: "Tạo link affiliate rút gọn cho sản phẩm Shopee/TikTok Shop và trả thông tin hoàn tiền."
    }
  });

  const flows = [
    {
      flowKey: "start",
      title: "Bắt đầu",
      triggerKeyword: "",
      botMessage: "Nếu bạn có tài khoản chọn 1\nChưa có tài khoản chọn 2",
      expectedInputType: "choice",
      nextFlowKey: null,
      actionType: "STATIC_MESSAGE",
      apiId: null
    },
    {
      flowKey: "auth_choice",
      title: "Chọn đăng nhập hoặc đăng ký",
      triggerKeyword: "",
      botMessage: "Chọn 1 để đăng nhập, hoặc 2 để đăng ký tài khoản mới.",
      expectedInputType: "choice",
      nextFlowKey: null,
      actionType: "STATIC_MESSAGE",
      apiId: null
    },
    {
      flowKey: "ask_register_name",
      title: "Nhập họ tên đăng ký",
      triggerKeyword: "",
      botMessage: "Vui lòng nhập họ tên.",
      expectedInputType: "text",
      nextFlowKey: null,
      actionType: "STATIC_MESSAGE",
      apiId: null
    },
    {
      flowKey: "ask_register_phone",
      title: "Nhập số điện thoại đăng ký",
      triggerKeyword: "",
      botMessage: "Vui lòng nhập số điện thoại.",
      expectedInputType: "phone",
      nextFlowKey: null,
      actionType: "STATIC_MESSAGE",
      apiId: null
    },
    {
      flowKey: "ask_register_password",
      title: "Nhập mật khẩu đăng ký",
      triggerKeyword: "",
      botMessage: "Vui lòng nhập mật khẩu.",
      expectedInputType: "password",
      nextFlowKey: null,
      actionType: "STATIC_MESSAGE",
      apiId: null
    },
    {
      flowKey: "ask_login_password",
      title: "Nhập mật khẩu đăng nhập",
      triggerKeyword: "",
      botMessage: "Vui lòng nhập mật khẩu để đăng nhập.",
      expectedInputType: "password",
      nextFlowKey: null,
      actionType: "STATIC_MESSAGE",
      apiId: null
    },
    {
      flowKey: "ready_for_link",
      title: "Nhận link sản phẩm",
      triggerKeyword: "",
      botMessage: "Bạn đã đăng nhập thành công. Hãy dán link sản phẩm Shopee hoặc TikTok Shop để tạo link hoàn tiền.",
      expectedInputType: "url",
      nextFlowKey: null,
      actionType: "STATIC_MESSAGE",
      apiId: null
    },
    {
      flowKey: "fallback",
      title: "Link không hợp lệ",
      triggerKeyword: "",
      botMessage: "Vui lòng gửi link sản phẩm Shopee hoặc TikTok Shop hợp lệ.",
      expectedInputType: "url",
      nextFlowKey: null,
      actionType: "STATIC_MESSAGE",
      apiId: null
    }
  ] as const;

  for (const flow of flows) {
    await prisma.conversationFlow.upsert({
      where: { flowKey: flow.flowKey },
      update: flow,
      create: flow
    });
  }

  await prisma.conversationFlow.updateMany({
    where: { flowKey: { notIn: flows.map((flow) => flow.flowKey) } },
    data: { isActive: false }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
