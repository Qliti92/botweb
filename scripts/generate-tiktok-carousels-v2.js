const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const outputRoot = path.join(root, "output", "social", "tiktok");
const size = 4096;
const brand = "#287a63";
const ink = "#30343b";
const ivory = "#fafaf8";

const assets = {
  logo: path.join(outputRoot, "website-captures", "qbot-logo"),
  website: path.join(outputRoot, "website-captures", "qbot-home-mobile.png"),
  shopeeTutorial: path.join(root, "public", "images", "tutorials", "copy-link-shopee.png"),
  tiktokTutorial: path.join(root, "public", "images", "tutorials", "copy-link-tiktok-shop.png")
};

const content = {
  shopee: {
    platform: "SHOPEE",
    accent: "#ef5b2a",
    pale: "#fff0e9",
    tutorial: assets.shopeeTutorial,
    slides: [
      ["01-cover", "HƯỚNG DẪN", ["TIẾT KIỆM TIỀN", "KHI MUA HÀNG VỚI", "SHOPEE"], "Thao tác cùng Em Ry trên qbot.vn", "cover"],
      ["02-copy-link", "BƯỚC 1", ["CHIA SẺ", "SAO CHÉP LINK"], "Mở đúng sản phẩm → Chia sẻ → Sao chép đường dẫn", "tutorial"],
      ["03-login", "BƯỚC 2", ["ĐĂNG NHẬP", "EM RY"], "Tạo tài khoản miễn phí hoặc đăng nhập tại qbot.vn", "login"],
      ["04-paste", "BƯỚC 3", ["DÁN LINK", "SẢN PHẨM"], "Dán link vừa sao chép vào khung chat rồi gửi", "paste"],
      ["05-buy", "BƯỚC 4", ["QUAY LẠI SÀN", "MUA HÀNG"], "Nhấn đúng link Em Ry gửi lại và mua như bình thường", "buy"],
      ["06-track", "SAU KHI ĐẶT HÀNG", ["KIỂM TRA", "TRẠNG THÁI ĐƠN"], "Đơn thường bắt đầu cập nhật sau khoảng 24 giờ", "track"],
      ["07-wallet", "SAU KHI NHẬN HÀNG", ["NHẬN TIỀN HOÀN", "VÀ RÚT TIỀN"], "Áp dụng khi đơn đủ điều kiện và được đối tác duyệt", "wallet"]
    ]
  },
  tiktok: {
    platform: "TIKTOK SHOP",
    accent: "#16877f",
    pale: "#e9f7f4",
    tutorial: assets.tiktokTutorial,
    slides: [
      ["01-cover", "HƯỚNG DẪN", ["TIẾT KIỆM TIỀN", "KHI MUA HÀNG VỚI", "TIKTOK SHOP"], "Thao tác cùng Em Ry trên qbot.vn", "cover"],
      ["02-copy-link", "BƯỚC 1", ["MỞ SẢN PHẨM", "SAO CHÉP LINK"], "Từ video hoặc live → mở sản phẩm → Sao chép liên kết", "tutorial"],
      ["03-login", "BƯỚC 2", ["ĐĂNG NHẬP", "EM RY"], "Tạo tài khoản miễn phí hoặc đăng nhập tại qbot.vn", "login"],
      ["04-paste", "BƯỚC 3", ["DÁN LINK", "SẢN PHẨM"], "Dán link sản phẩm vừa sao chép vào khung chat rồi gửi", "paste"],
      ["05-buy", "BƯỚC 4", ["QUAY LẠI SÀN", "MUA HÀNG"], "Nhấn đúng link Em Ry gửi lại và mua như bình thường", "buy"],
      ["06-track", "SAU KHI ĐẶT HÀNG", ["KIỂM TRA", "TRẠNG THÁI ĐƠN"], "Đơn thường bắt đầu cập nhật sau khoảng 24 giờ", "track"],
      ["07-wallet", "SAU KHI NHẬN HÀNG", ["NHẬN TIỀN HOÀN", "VÀ RÚT TIỀN"], "Áp dụng khi đơn đủ điều kiện và được đối tác duyệt", "wallet"]
    ]
  }
};

function esc(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function lines(values, y, sizePx, gap, color = ink) {
  return values.map((value, index) =>
    `<text x="2048" y="${y + index * gap}" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="${sizePx}" font-weight="900" letter-spacing="-6" fill="${color}">${esc(value)}</text>`
  ).join("");
}

function frameSvg(set, slide, index) {
  const [, eyebrow, title, subtitle] = slide;
  const threeLineTitle = title.length === 3;
  const titleSize = threeLineTitle ? 190 : title.some((line) => line.length > 20) ? 230 : 270;
  const titleY = threeLineTitle ? 760 : 870;
  const titleGap = threeLineTitle ? 220 : 285;
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff"/>
          <stop offset="1" stop-color="${set.pale}"/>
        </linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="28" stdDeviation="35" flood-color="#214b3e" flood-opacity=".13"/></filter>
      </defs>
      <rect width="4096" height="4096" fill="url(#bg)"/>
      <circle cx="3890" cy="140" r="620" fill="${set.pale}"/>
      <rect x="460" y="178" width="730" height="150" rx="75" fill="${set.accent}"/>
      <text x="825" y="280" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="68" font-weight="850" letter-spacing="3" fill="#fff">${esc(set.platform)}</text>
      <text x="3800" y="282" text-anchor="end" font-family="Segoe UI,Arial,sans-serif" font-size="70" font-weight="850" fill="${brand}">${String(index + 1).padStart(2, "0")}/07</text>
      <text x="2048" y="560" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="88" font-weight="850" letter-spacing="8" fill="${set.accent}">${esc(eyebrow)}</text>
      ${lines(title, titleY, titleSize, titleGap)}
      <text x="2048" y="1510" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="110" font-weight="700" fill="#4c5753">${esc(subtitle)}</text>
      <rect x="310" y="1680" width="3476" height="1840" rx="145" fill="#fff" stroke="${set.accent}" stroke-opacity=".23" stroke-width="9" filter="url(#shadow)"/>
      <rect x="450" y="3650" width="3196" height="230" rx="115" fill="${brand}"/>
      <text x="2048" y="3795" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="82" font-weight="800" fill="#fff">${index < 5 ? "Vuốt sang trái để xem bước tiếp theo  →" : index === 5 ? "Thời gian thực tế có thể thay đổi theo đối tác" : "Có thể yêu cầu rút khi đạt điều kiện hiện hành"}</text>
    </svg>
  `);
}

function uiSvg(type, platform, accent) {
  if (type === "cover") return Buffer.from(`
    <svg width="3000" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="3000" height="1500" rx="100" fill="#f6f8f7"/>
      <rect x="120" y="100" width="2760" height="1300" rx="90" fill="#fff" stroke="#dce5e1" stroke-width="8"/>
      <rect x="120" y="100" width="2760" height="220" rx="90" fill="${brand}"/>
      <circle cx="300" cy="210" r="72" fill="#fff"/>
      <text x="300" y="240" text-anchor="middle" font-family="Segoe UI,Arial" font-size="80" font-weight="900" fill="${brand}">R</text>
      <text x="430" y="195" font-family="Segoe UI,Arial" font-size="82" font-weight="900" fill="#fff">Em Ry trên qbot.vn</text>
      <text x="430" y="270" font-family="Segoe UI,Arial" font-size="48" fill="#d9eee7">Hỗ trợ tạo link và theo dõi đơn hàng</text>
      <rect x="260" y="460" width="1100" height="270" rx="80" fill="${accent}" fill-opacity=".10" stroke="${accent}" stroke-width="7"/>
      <text x="810" y="565" text-anchor="middle" font-family="Segoe UI,Arial" font-size="54" font-weight="700" fill="#58635f">1. Sao chép link trên</text>
      <text x="810" y="665" text-anchor="middle" font-family="Segoe UI,Arial" font-size="76" font-weight="900" fill="${accent}">${esc(platform)}</text>
      <path d="M1420 595 H1580 M1510 525 L1580 595 L1510 665" fill="none" stroke="${brand}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="1640" y="460" width="1100" height="270" rx="80" fill="#e8f3ef" stroke="${brand}" stroke-width="7"/>
      <text x="2190" y="565" text-anchor="middle" font-family="Segoe UI,Arial" font-size="54" font-weight="700" fill="#58635f">2. Dán link vào</text>
      <text x="2190" y="665" text-anchor="middle" font-family="Segoe UI,Arial" font-size="76" font-weight="900" fill="${brand}">EM RY</text>
      <rect x="260" y="860" width="1100" height="270" rx="80" fill="#e8f3ef" stroke="${brand}" stroke-width="7"/>
      <text x="810" y="965" text-anchor="middle" font-family="Segoe UI,Arial" font-size="54" font-weight="700" fill="#58635f">3. Mở link Em Ry gửi</text>
      <text x="810" y="1065" text-anchor="middle" font-family="Segoe UI,Arial" font-size="70" font-weight="900" fill="${brand}">MUA NHƯ BÌNH THƯỜNG</text>
      <path d="M1420 995 H1580 M1510 925 L1580 995 L1510 1065" fill="none" stroke="${brand}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="1640" y="860" width="1100" height="270" rx="80" fill="${accent}" fill-opacity=".10" stroke="${accent}" stroke-width="7"/>
      <text x="2190" y="965" text-anchor="middle" font-family="Segoe UI,Arial" font-size="54" font-weight="700" fill="#58635f">4. Theo dõi đơn và ví</text>
      <text x="2190" y="1065" text-anchor="middle" font-family="Segoe UI,Arial" font-size="72" font-weight="900" fill="${accent}">TRÊN QBOT.VN</text>
      <text x="1500" y="1285" text-anchor="middle" font-family="Segoe UI,Arial" font-size="55" font-weight="650" fill="#68726e">Tiền hoàn áp dụng với đơn đủ điều kiện và được đối tác duyệt</text>
    </svg>
  `);
  if (type === "paste") return Buffer.from(`
    <svg width="3000" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="3000" height="1500" rx="100" fill="#f6f8f7"/>
      <rect x="0" y="0" width="3000" height="250" rx="100" fill="${brand}"/>
      <circle cx="185" cy="125" r="72" fill="#fff"/><text x="185" y="155" text-anchor="middle" font-family="Arial" font-size="82" font-weight="900" fill="${brand}">R</text>
      <text x="300" y="112" font-family="Segoe UI,Arial" font-size="86" font-weight="850" fill="#fff">Em Ry</text>
      <text x="300" y="190" font-family="Segoe UI,Arial" font-size="48" fill="#d9eee7">Trợ lý hoàn tiền</text>
      <rect x="760" y="430" width="1960" height="270" rx="95" fill="#fff" stroke="#d7dfdc" stroke-width="7"/>
      <text x="900" y="590" font-family="Segoe UI,Arial" font-size="76" font-weight="650" fill="#68716e">https://.../san-pham</text>
      <rect x="280" y="850" width="2440" height="260" rx="90" fill="#fff" stroke="${accent}" stroke-width="10"/>
      <text x="440" y="1010" font-family="Segoe UI,Arial" font-size="76" font-weight="650" fill="#69736f">Dán link sản phẩm vào đây</text>
      <circle cx="2550" cy="980" r="92" fill="${brand}"/><path d="M2515 930 L2600 980 L2515 1030 Z" fill="#fff"/>
      <rect x="980" y="1215" width="1040" height="150" rx="75" fill="#e5f2ed"/><text x="1500" y="1315" text-anchor="middle" font-family="Segoe UI,Arial" font-size="66" font-weight="800" fill="${brand}">KIỂM TRA &amp; TẠO LINK</text>
    </svg>
  `);
  if (type === "buy") return Buffer.from(`
    <svg width="3000" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="3000" height="1500" rx="100" fill="#f6f8f7"/>
      <rect x="220" y="150" width="2560" height="890" rx="110" fill="#fff" stroke="#dce3e0" stroke-width="8"/>
      <circle cx="470" cy="400" r="120" fill="#e3f1ec"/><path d="M410 400 L470 460 L560 340" fill="none" stroke="${brand}" stroke-width="38" stroke-linecap="round"/>
      <text x="680" y="365" font-family="Segoe UI,Arial" font-size="88" font-weight="850" fill="${ink}">Link đã sẵn sàng</text>
      <text x="680" y="485" font-family="Segoe UI,Arial" font-size="62" fill="#66716d">Mở đúng link bên dưới để tiếp tục</text>
      <rect x="410" y="650" width="2180" height="210" rx="105" fill="${accent}"/>
      <text x="1500" y="785" text-anchor="middle" font-family="Segoe UI,Arial" font-size="82" font-weight="850" fill="#fff">QUAY LẠI ${esc(platform)} MUA HÀNG  →</text>
      <text x="1500" y="1190" text-anchor="middle" font-family="Segoe UI,Arial" font-size="76" font-weight="750" fill="${brand}">Chọn sản phẩm và thanh toán trên sàn</text>
      <text x="1500" y="1300" text-anchor="middle" font-family="Segoe UI,Arial" font-size="56" fill="#69736f">Không thanh toán trên Em Ry</text>
    </svg>
  `);
  if (type === "track") return Buffer.from(`
    <svg width="3000" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="3000" height="1500" rx="100" fill="#fff"/>
      <text x="220" y="210" font-family="Segoe UI,Arial" font-size="92" font-weight="900" fill="${ink}">Đơn hàng của bạn</text>
      <rect x="180" y="340" width="2640" height="760" rx="100" fill="#f5f8f7" stroke="#dbe3df" stroke-width="8"/>
      <rect x="350" y="530" width="430" height="430" rx="70" fill="${setColor(accent, .12)}"/><path d="M450 650 H680 V850 H450 Z M450 650 L565 570 L680 650" fill="none" stroke="${accent}" stroke-width="28"/>
      <text x="920" y="590" font-family="Segoe UI,Arial" font-size="70" font-weight="750" fill="#5c6662">${esc(platform)} · Đơn mới</text>
      <text x="920" y="750" font-family="Segoe UI,Arial" font-size="110" font-weight="900" fill="${ink}">Đang chờ cập nhật</text>
      <rect x="920" y="850" width="1230" height="120" rx="60" fill="#fff1d8"/><text x="1535" y="930" text-anchor="middle" font-family="Segoe UI,Arial" font-size="60" font-weight="800" fill="#a96a00">THƯỜNG SAU KHOẢNG 24 GIỜ</text>
      <text x="1500" y="1290" text-anchor="middle" font-family="Segoe UI,Arial" font-size="72" font-weight="750" fill="${brand}">Mở mục “Đơn hàng” trong Em Ry để theo dõi</text>
    </svg>
  `);
  return Buffer.from(`
    <svg width="3000" height="1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="3000" height="1500" rx="100" fill="#f6f8f7"/>
      <text x="220" y="200" font-family="Segoe UI,Arial" font-size="92" font-weight="900" fill="${ink}">Ví Em Ry</text>
      <rect x="180" y="300" width="2640" height="820" rx="100" fill="${brand}"/>
      <circle cx="470" cy="570" r="145" fill="#ffffff" fill-opacity=".16"/>
      <path d="M390 570 L455 635 L565 490" fill="none" stroke="#fff" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="720" y="485" font-family="Segoe UI,Arial" font-size="66" fill="#d9eee7">Khi đơn được đối tác duyệt</text>
      <text x="720" y="650" font-family="Segoe UI,Arial" font-size="112" font-weight="900" fill="#fff">TIỀN HOÀN VÀO VÍ</text>
      <rect x="720" y="775" width="1640" height="190" rx="95" fill="#fff"/>
      <text x="1540" y="900" text-anchor="middle" font-family="Segoe UI,Arial" font-size="72" font-weight="900" fill="${brand}">YÊU CẦU RÚT TIỀN</text>
      <text x="1500" y="1280" text-anchor="middle" font-family="Segoe UI,Arial" font-size="72" font-weight="800" fill="${ink}">Kiểm tra số tiền có thể rút ngay trong ví</text>
      <text x="1500" y="1390" text-anchor="middle" font-family="Segoe UI,Arial" font-size="54" fill="#69736f">Điều kiện và thời gian xử lý có thể thay đổi theo đối tác</text>
    </svg>
  `);
}

function setColor(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

async function visualBuffer(set, type) {
  if (type === "tutorial") {
    return sharp(set.tutorial).resize(3100, 1560, { fit: "contain", background: "#fff" }).png().toBuffer();
  }
  if (type === "website" || type === "login") {
    return sharp(assets.website)
      .extract(type === "login" ? { left: 0, top: 0, width: 1080, height: 900 } : { left: 0, top: 0, width: 1080, height: 1100 })
      .resize(3100, 1560, { fit: "contain", background: "#fff" })
      .png()
      .toBuffer();
  }
  return sharp(uiSvg(type, set.platform, set.accent)).resize(3100, 1560, { fit: "contain" }).png().toBuffer();
}

async function renderSet(key, set) {
  const destination = path.join(outputRoot, `${key}-v2`);
  fs.mkdirSync(destination, { recursive: true });
  for (let index = 0; index < set.slides.length; index += 1) {
    const slide = set.slides[index];
    const outputFile = path.join(destination, `${slide[0]}.png`);
    if (fs.existsSync(outputFile) && fs.statSync(outputFile).size > 100000) continue;
    const visual = await visualBuffer(set, slide[4]);
    await sharp({ create: { width: size, height: size, channels: 4, background: ivory } })
      .composite([
        { input: frameSvg(set, slide, index), top: 0, left: 0 },
        { input: await sharp(assets.logo).resize(180, 180).png().toBuffer(), top: 162, left: 220 },
        { input: visual, top: 1810, left: 498 }
      ])
      .png({ compressionLevel: 9 })
      .toFile(outputFile);

    if (key === "tiktok" && slide[4] === "tutorial") {
      const sanitizedFile = `${outputFile}.sanitized.png`;
      const notice = Buffer.from(`
        <svg width="4096" height="4096" xmlns="http://www.w3.org/2000/svg">
          <rect x="2160" y="2380" width="1030" height="470" rx="55"
                fill="#ffffff" stroke="#e5e7eb" stroke-width="8"/>
          <text x="2675" y="2570" text-anchor="middle"
                font-family="Arial, sans-serif" font-size="92" font-weight="800" fill="#171717">
            Mở trang sản phẩm
          </text>
          <text x="2675" y="2710" text-anchor="middle"
                font-family="Arial, sans-serif" font-size="78" font-weight="650" fill="#287a63">
            rồi chọn Chia sẻ
          </text>
        </svg>
      `);
      await sharp(outputFile)
        .composite([{ input: notice, top: 0, left: 0 }])
        .png({ compressionLevel: 9 })
        .toFile(sanitizedFile);
      fs.renameSync(sanitizedFile, outputFile);
    }
  }
}

async function main() {
  for (const [key, set] of Object.entries(content)) await renderSet(key, set);
  console.log("Generated V2 carousel sets.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
