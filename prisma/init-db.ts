import { PrismaClient } from "@prisma/client";
import { encryptSecret } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      state TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS api_configs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'POST',
      headers TEXT NOT NULL DEFAULT '{}',
      body_sample TEXT NOT NULL DEFAULT '{}',
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS conversation_flows (
      id TEXT PRIMARY KEY NOT NULL,
      flow_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      trigger_keyword TEXT,
      bot_message TEXT NOT NULL,
      expected_input_type TEXT,
      next_flow_key TEXT,
      action_type TEXT,
      api_id TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL,
      CONSTRAINT conversation_flows_api_id_fkey FOREIGN KEY (api_id) REFERENCES api_configs (id) ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id TEXT PRIMARY KEY NOT NULL,
      api_id TEXT,
      session_id TEXT,
      request TEXT NOT NULL,
      response TEXT,
      status_code INTEGER,
      error TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT api_logs_api_id_fkey FOREIGN KEY (api_id) REFERENCES api_configs (id) ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS short_links (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      original_url TEXT NOT NULL,
      title TEXT,
      click_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_notices (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      display_seconds INTEGER NOT NULL DEFAULT 10,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      outcome TEXT NOT NULL DEFAULT 'SUCCESS',
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_actor_type_actor_id_created_at_idx ON audit_logs(actor_type, actor_id, created_at)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS audit_logs_action_created_at_idx ON audit_logs(action, created_at)`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id TEXT PRIMARY KEY NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Chung',
      source_label TEXT NOT NULL DEFAULT 'Trung tâm trợ giúp',
      source_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS knowledge_entries_is_active_updated_at_idx ON knowledge_entries(is_active, updated_at)`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS unrecognized_messages (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT,
      content TEXT NOT NULL,
      normalized TEXT NOT NULL,
      is_resolved BOOLEAN NOT NULL DEFAULT false,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS unrecognized_messages_is_resolved_created_at_idx ON unrecognized_messages(is_resolved, created_at)`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY NOT NULL, session_id TEXT, account_key TEXT, order_id TEXT,
      category TEXT NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW', priority TEXT NOT NULL DEFAULT 'NORMAL',
      assigned_to TEXT, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS support_tickets_status_priority_updated_at_idx ON support_tickets(status, priority, updated_at)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS support_tickets_account_key_updated_at_idx ON support_tickets(account_key, updated_at)`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id TEXT PRIMARY KEY NOT NULL, ticket_id TEXT NOT NULL, sender TEXT NOT NULL, content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT support_ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS support_ticket_messages_ticket_id_created_at_idx ON support_ticket_messages(ticket_id, created_at)`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS intent_definitions (
      id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, description TEXT,
      examples TEXT NOT NULL DEFAULT '[]', keywords TEXT NOT NULL DEFAULT '[]', command_template TEXT NOT NULL,
      requires_auth BOOLEAN NOT NULL DEFAULT true, requires_confirm BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS job_queue (
      id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 3,
      run_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, locked_at DATETIME, last_error TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS job_queue_status_run_at_idx ON job_queue(status, run_at)`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS proactive_notifications (
      id TEXT PRIMARY KEY NOT NULL, account_key TEXT, session_id TEXT, title TEXT NOT NULL, message TEXT NOT NULL,
      action_url TEXT, deliver_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, delivered_at DATETIME, read_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS proactive_notifications_account_key_delivered_at_deliver_at_idx ON proactive_notifications(account_key, delivered_at, deliver_at)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS proactive_notifications_session_id_delivered_at_deliver_at_idx ON proactive_notifications(session_id, delivered_at, deliver_at)`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS web_push_subscriptions (
      id TEXT PRIMARY KEY NOT NULL, endpoint TEXT NOT NULL UNIQUE, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
      account_key TEXT, user_agent TEXT, enabled BOOLEAN NOT NULL DEFAULT true, is_admin BOOLEAN NOT NULL DEFAULT false,
      quiet_start TEXT NOT NULL DEFAULT '22:00', quiet_end TEXT NOT NULL DEFAULT '08:00',
      timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
      categories TEXT NOT NULL DEFAULT '["REMINDER","ORDER","CASHBACK","SUPPORT"]',
      last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);
  for (const statement of [
    `ALTER TABLE web_push_subscriptions ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE web_push_subscriptions ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE web_push_subscriptions ADD COLUMN quiet_start TEXT NOT NULL DEFAULT '22:00'`,
    `ALTER TABLE web_push_subscriptions ADD COLUMN quiet_end TEXT NOT NULL DEFAULT '08:00'`,
    `ALTER TABLE web_push_subscriptions ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh'`,
    `ALTER TABLE web_push_subscriptions ADD COLUMN categories TEXT NOT NULL DEFAULT '["REMINDER","ORDER","CASHBACK","SUPPORT"]'`,
    `ALTER TABLE web_push_subscriptions ADD COLUMN last_seen_at DATETIME`
  ]) {
    try { await prisma.$executeRawUnsafe(statement); } catch {}
  }
  await prisma.$executeRawUnsafe(`UPDATE web_push_subscriptions SET last_seen_at = COALESCE(last_seen_at, updated_at, created_at, CURRENT_TIMESTAMP)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS web_push_subscriptions_account_key_updated_at_idx ON web_push_subscriptions(account_key, updated_at)`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS push_campaigns (
      id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, action_url TEXT,
      recurrence TEXT NOT NULL DEFAULT 'ONCE', scheduled_at DATETIME NOT NULL, next_run_at DATETIME,
      last_sent_at DATETIME, status TEXT NOT NULL DEFAULT 'ACTIVE', sent_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0, segment TEXT NOT NULL DEFAULT 'ALL',
      category TEXT NOT NULL DEFAULT 'REMINDER', target_account_key TEXT, max_per_day INTEGER NOT NULL DEFAULT 2,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL
    )
  `);
  for (const statement of [
    `ALTER TABLE push_campaigns ADD COLUMN segment TEXT NOT NULL DEFAULT 'ALL'`,
    `ALTER TABLE push_campaigns ADD COLUMN category TEXT NOT NULL DEFAULT 'REMINDER'`,
    `ALTER TABLE push_campaigns ADD COLUMN target_account_key TEXT`,
    `ALTER TABLE push_campaigns ADD COLUMN max_per_day INTEGER NOT NULL DEFAULT 2`
  ]) {
    try { await prisma.$executeRawUnsafe(statement); } catch {}
  }
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS push_campaigns_status_next_run_at_idx ON push_campaigns(status, next_run_at)`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS push_deliveries (
      id TEXT PRIMARY KEY NOT NULL, campaign_id TEXT, subscription_id TEXT NOT NULL, status TEXT NOT NULL,
      error TEXT, action_url TEXT, sent_at DATETIME, clicked_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS push_deliveries_campaign_id_created_at_idx ON push_deliveries(campaign_id, created_at)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS push_deliveries_subscription_id_sent_at_idx ON push_deliveries(subscription_id, sent_at)`);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS push_cron_runs (
      id TEXT PRIMARY KEY NOT NULL, status TEXT NOT NULL, processed INTEGER NOT NULL DEFAULT 0,
      error TEXT, started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ended_at DATETIME
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS push_cron_runs_started_at_idx ON push_cron_runs(started_at)`);

  const knowledgeEntries = [
        {
          question: "Làm thế nào để đơn hàng được ghi nhận hoàn tiền?",
          answer: "Để đơn dễ được ghi nhận, bạn làm giúp Ry 3 bước nhé:\n1. Để giỏ hàng trống trước khi mở link.\n2. Mua sản phẩm từ đúng link Ry đã tạo.\n3. Hoàn tất mua hàng trên cùng một thiết bị, không mở thêm link quảng cáo khác.",
          keywords: "ghi nhận đơn hoàn tiền giỏ hàng link shopee tiktok",
          category: "Đơn hàng",
          sourceLabel: "Hướng dẫn sử dụng"
        },
        {
          question: "Bao lâu tiền hoàn được duyệt?",
          answer: "Mỗi sàn có thời gian đối soát khác nhau nên đơn có thể chưa được duyệt ngay. Bạn hỏi Ry “đơn hàng của tôi” để xem trạng thái mới nhất nhé. Nếu đơn chờ lâu hơn thời gian hiển thị, Ry sẽ hướng dẫn bạn liên hệ hỗ trợ bằng mã đơn.",
          keywords: "bao lâu duyệt đối soát chờ tiền hoàn trạng thái",
          category: "Đối soát",
          sourceLabel: "Chính sách đối soát"
        },
        {
          question: "Vì sao đơn hàng không được ghi nhận?",
          answer: "Ry hiểu việc không thấy đơn sẽ khiến bạn lo. Một số nguyên nhân thường gặp là giỏ hàng đã có sản phẩm, bạn mua qua link khác, đổi thiết bị khi mua hoặc sàn chưa gửi dữ liệu. Bạn gửi mã đơn cho đội hỗ trợ nếu cần tra soát nhé.",
          keywords: "không ghi nhận không thấy đâu mất đơn thiếu đơn thất lạc chưa hiện chưa có từ chối",
          category: "Đơn hàng",
          sourceLabel: "Trung tâm trợ giúp"
        },
        {
          question: "Qbot hoàn tiền hoạt động như thế nào?",
          answer: "Qbot tạo một link mua hàng có thể theo dõi từ link sản phẩm bạn gửi. Bạn vẫn chọn hàng, đăng nhập và thanh toán trực tiếp trên Shopee hoặc TikTok Shop. Khi giao dịch đủ điều kiện được đối tác ghi nhận và đối soát, một phần hoa hồng giới thiệu được chia lại thành tiền hoàn cho bạn.",
          keywords: "qbot em ry là gì cashback hoạt động tiền hoàn từ đâu hoa hồng giới thiệu",
          category: "Giới thiệu",
          sourceLabel: "Cách hoạt động của Qbot"
        },
        {
          question: "Cách tạo link hoàn tiền Shopee hoặc TikTok Shop?",
          answer: "Bạn mở đúng trang chi tiết sản phẩm trên Shopee hoặc TikTok Shop, chọn Chia sẻ rồi Sao chép liên kết và gửi link đó cho Ry. Khi Ry tạo xong, hãy mở sản phẩm bằng nút quay lại sàn trong kết quả và hoàn tất mua hàng trong cùng phiên.",
          keywords: "tạo link hoàn tiền cách dùng gửi link sao chép liên kết shopee tiktok shop mua hàng",
          category: "Tạo link",
          sourceLabel: "Hướng dẫn sử dụng"
        },
        {
          question: "Qbot hỗ trợ những loại link nào?",
          answer: "Qbot hỗ trợ link trang chi tiết sản phẩm Shopee và TikTok Shop. Link trang chủ, trang tìm kiếm, gian hàng, video hoặc livestream có thể không đủ thông tin để tạo link; bạn hãy mở sản phẩm cụ thể rồi sao chép lại liên kết.",
          keywords: "hỗ trợ link nào link hợp lệ video livestream gian hàng trang chủ sản phẩm shopee tiktok",
          category: "Tạo link",
          sourceLabel: "Hướng dẫn lấy link"
        },
        {
          question: "Tiền hoàn dự kiến có phải số tiền cuối cùng không?",
          answer: "Không. Số tiền hiển thị lúc tạo link chỉ là dự kiến. Số cuối cùng phụ thuộc giá trị giao dịch hợp lệ, trạng thái đơn, voucher, sản phẩm bị trả hoặc hoàn, chính sách hoa hồng và kết quả đối soát của đối tác. Chỉ số dư đã duyệt hoặc khả dụng mới có thể rút.",
          keywords: "tiền hoàn dự kiến cuối cùng chênh lệch ít hơn thay đổi hoa hồng số dư khả dụng",
          category: "Tiền hoàn",
          sourceLabel: "Chính sách đối soát"
        },
        {
          question: "Tiền hoàn và hoa hồng được tính như thế nào?",
          answer: "Mức hiển thị được lấy từ dữ liệu giá và hoa hồng mà đối tác cung cấp cho sản phẩm tại thời điểm tạo link, sau đó áp dụng chính sách chia sẻ của Qbot. Không có một tỷ lệ cố định cho mọi sản phẩm. Voucher, phí vận chuyển, thuế, giá trị hàng hợp lệ và điều chỉnh khi đối soát có thể làm số cuối cùng thay đổi.",
          keywords: "cách tính tiền hoàn hoa hồng bao nhiêu phần trăm tỷ lệ công thức cashback",
          category: "Tiền hoàn",
          sourceLabel: "Cách tính tiền hoàn"
        },
        {
          question: "Hủy đơn hoặc trả hàng có được tiền hoàn không?",
          answer: "Đơn bị hủy, không nhận hàng hoặc được hoàn lại toàn bộ thường không đủ điều kiện nhận tiền hoàn. Nếu chỉ trả một phần, giá trị hợp lệ và tiền hoàn có thể được điều chỉnh theo dữ liệu đối soát cuối cùng. Nếu đặt lại, bạn nên tạo một link mới từ Qbot.",
          keywords: "hủy đơn trả hàng hoàn hàng không nhận hàng đặt lại tiền hoàn bị trừ",
          category: "Đơn hàng",
          sourceLabel: "Chính sách đối soát"
        },
        {
          question: "Khi nào tôi có thể rút tiền hoàn?",
          answer: "Bạn chỉ có thể rút phần tiền đã được đối soát và chuyển thành số dư khả dụng. Khoản đang chờ hoặc tạm tính chưa thể rút. Bạn có thể hỏi Ry “số dư của tôi” để kiểm tra, sau đó chọn rút tiền và xác nhận thông tin nhận tiền.",
          keywords: "khi nào rút tiền số dư khả dụng tối thiểu tài khoản ngân hàng đang chờ tạm tính",
          category: "Rút tiền",
          sourceLabel: "Hướng dẫn rút tiền"
        },
        {
          question: "Mua hàng qua Qbot có mất phí hoặc làm tăng giá không?",
          answer: "Qbot không cộng phí vào giá sản phẩm. Bạn vẫn xem giá, voucher, phí vận chuyển và thanh toán trực tiếp trên Shopee hoặc TikTok Shop. Tiền hoàn hình thành từ một phần hoa hồng của giao dịch đủ điều kiện, không phải khoản cộng thêm vào giá mua.",
          keywords: "mất phí miễn phí tăng giá đắt hơn phụ phí thanh toán giá sản phẩm",
          category: "Chi phí",
          sourceLabel: "Cách hoạt động của Qbot"
        },
        {
          question: "Dùng Qbot có an toàn không và có cần mật khẩu hoặc OTP không?",
          answer: "Qbot không cần mật khẩu, OTP, mã PIN Shopee, TikTok Shop hoặc ngân hàng của bạn. Bạn chỉ đăng nhập và thanh toán trên ứng dụng hoặc website chính thức của sàn. Khi cần tra soát, chỉ gửi thông tin liên quan như mã đơn và ảnh trạng thái đã che dữ liệu riêng tư.",
          keywords: "an toàn lừa đảo mật khẩu otp mã pin ngân hàng bảo mật thông tin thanh toán",
          category: "An toàn",
          sourceLabel: "Chính sách an toàn"
        },
        {
          question: "Có thể dùng voucher của Shopee hoặc TikTok Shop không?",
          answer: "Bạn có thể chọn voucher và ưu đãi trực tiếp trên sàn. Tuy nhiên voucher, phí, thuế và giá trị hợp lệ có thể làm số tiền hoàn thực tế khác số dự kiến. Hãy kiểm tra tổng thanh toán trên sàn trước khi đặt hàng.",
          keywords: "voucher mã giảm giá xu khuyến mãi freeship phí vận chuyển tiền hoàn",
          category: "Tiền hoàn",
          sourceLabel: "Cách tính tiền hoàn"
        },
        {
          question: "Mua nhiều sản phẩm trong một đơn có được hoàn tiền không?",
          answer: "Khả năng ghi nhận từng sản phẩm phụ thuộc dữ liệu đối tác và nguồn giới thiệu của phiên mua. Để giảm rủi ro, hãy tạo link cho sản phẩm chính và mua từ đúng link Qbot. Với nhiều sản phẩm quan trọng, bạn nên tạo link và mua theo các phiên riêng; số cuối cùng vẫn theo kết quả đối soát.",
          keywords: "nhiều sản phẩm chung đơn giỏ hàng nhiều món mua cùng lúc hoàn tiền",
          category: "Đơn hàng",
          sourceLabel: "Hướng dẫn sử dụng"
        },
        {
          question: "Cần cung cấp gì khi tra soát đơn hàng?",
          answer: "Nếu đơn chưa xuất hiện sau thời gian đồng bộ được hiển thị, bạn hãy chuẩn bị mã đơn, nền tảng mua hàng, ngày giờ mua và ảnh trạng thái đơn. Hãy che địa chỉ, số điện thoại và thông tin thanh toán không liên quan; không gửi mật khẩu hoặc OTP.",
          keywords: "tra soát khiếu nại hỗ trợ mất đơn thiếu đơn mã đơn ảnh trạng thái ngày mua",
          category: "Tra soát",
          sourceLabel: "Trung tâm trợ giúp"
        }
  ];

  for (const entry of knowledgeEntries) {
    const existing = await prisma.knowledgeEntry.findFirst({ where: { question: entry.question }, select: { id: true } });
    if (existing) {
      await prisma.knowledgeEntry.update({ where: { id: existing.id }, data: { ...entry, isActive: true } });
    } else {
      await prisma.knowledgeEntry.create({ data: entry });
    }
  }

  const sessions = await prisma.chatSession.findMany({ select: { id: true, state: true } });
  for (const session of sessions) {
    try {
      const state = JSON.parse(session.state || "{}") as { register?: { password?: string }; step?: string };
      if (!state.register?.password) continue;
      delete state.register.password;
      if (state.step === "register_password_confirmation") state.step = "auth_choice";
      await prisma.chatSession.update({ where: { id: session.id }, data: { state: JSON.stringify(state) } });
    } catch {
      // Ignore malformed legacy state; the application already treats it as empty.
    }
  }

  const apiConfigs = await prisma.apiConfig.findMany({ select: { id: true, headers: true } });
  for (const api of apiConfigs) {
    const encryptedHeaders = encryptSecret(api.headers);
    if (encryptedHeaders !== api.headers) {
      await prisma.apiConfig.update({ where: { id: api.id }, data: { headers: encryptedHeaders } });
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  });
