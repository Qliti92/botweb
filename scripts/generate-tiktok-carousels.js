const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const size = 4096;
const outputRoot = path.join(root, "output", "social", "tiktok");

const sources = {
  shopeeCover: path.join(outputRoot, "sources", "shopee-cover-source.png"),
  tiktokCover: path.join(outputRoot, "sources", "tiktok-cover-source.png"),
  shopeeTutorial: path.join(root, "public", "images", "tutorials", "copy-link-shopee.png"),
  tiktokTutorial: path.join(root, "public", "images", "tutorials", "copy-link-tiktok-shop.png"),
  linkFlow: path.join(root, "public", "images", "seo", "tao-link-hoan-tien.webp"),
  tracking: path.join(root, "public", "images", "seo", "doi-soat-tien-hoan.webp"),
  withdrawal: path.join(root, "public", "images", "seo", "rut-tien-hoan.webp")
};

const palettes = {
  shopee: { accent: "#ee5b2b", pale: "#fff0e8", line: "#ffd2bf", badge: "#fff7f2" },
  tiktok: { accent: "#167f78", pale: "#e9f7f4", line: "#bfe4de", badge: "#f2fbf9" }
};

const commonFooter = "Em Ry là dịch vụ độc lập. Quyền lợi phụ thuộc điều kiện đơn hàng và kết quả đối soát.";

const sets = {
  shopee: {
    label: "SHOPEE",
    cover: sources.shopeeCover,
    tutorial: sources.shopeeTutorial,
    slides: [
      {
        file: "01-cover",
        type: "cover",
        eyebrow: "HƯỚNG DẪN TỪNG BƯỚC",
        title: ["LẤY LINK &", "MUA HÀNG SHOPEE"],
        body: "Thực hiện đúng quy trình với Em Ry"
      },
      {
        file: "02-chia-se-sao-chep-link",
        type: "tutorial",
        eyebrow: "BƯỚC 1",
        title: ["CHIA SẺ &", "SAO CHÉP LINK"],
        body: "Mở đúng trang sản phẩm trên Shopee, chạm Chia sẻ rồi chọn Sao chép đường dẫn.",
        note: "Dùng link sản phẩm, không dùng link Shopee Video."
      },
      {
        file: "03-dang-nhap-em-ry",
        type: "illustration",
        image: sources.linkFlow,
        eyebrow: "BƯỚC 2",
        title: ["ĐĂNG NHẬP", "EM RY"],
        body: "Mở qbot.vn. Tạo tài khoản miễn phí hoặc đăng nhập tài khoản đã có.",
        note: "Không cung cấp mật khẩu Shopee hoặc mã OTP cho bất kỳ ai."
      },
      {
        file: "04-dan-link-san-pham",
        type: "illustration",
        image: sources.linkFlow,
        eyebrow: "BƯỚC 3",
        title: ["DÁN LINK", "SẢN PHẨM"],
        body: "Dán link vừa sao chép vào khung chat. Em Ry kiểm tra và tạo link mua hàng.",
        note: "Mức tiền hoàn hiển thị là dự kiến."
      },
      {
        file: "05-quay-lai-san-mua-hang",
        type: "illustration",
        image: sources.shopeeCover,
        eyebrow: "BƯỚC 4",
        title: ["QUAY LẠI SÀN", "VÀ MUA HÀNG"],
        body: "Nhấn đúng link Em Ry gửi lại, quay về Shopee và hoàn tất mua hàng như bình thường.",
        note: "Không mở thêm link giới thiệu khác trước khi thanh toán."
      },
      {
        file: "06-don-hang-cap-nhat",
        type: "illustration",
        image: sources.tracking,
        eyebrow: "SAU KHI ĐẶT HÀNG",
        title: ["THEO DÕI", "TRẠNG THÁI ĐƠN"],
        body: "Đơn thường bắt đầu cập nhật trên Em Ry sau khoảng 24 giờ.",
        note: "Thời gian thực tế có thể thay đổi theo dữ liệu từ đối tác."
      },
      {
        file: "07-tien-hoan-vao-vi",
        type: "illustration",
        image: sources.withdrawal,
        eyebrow: "SAU KHI NHẬN HÀNG",
        title: ["TIỀN HOÀN", "ĐƯỢC CỘNG VÀO VÍ"],
        body: "Khi đơn hoàn tất, đủ điều kiện và được đối tác duyệt, tiền hoàn được cộng vào ví Em Ry.",
        note: "Bạn có thể yêu cầu rút khi số dư đạt điều kiện hiện hành."
      }
    ]
  },
  tiktok: {
    label: "TIKTOK SHOP",
    cover: sources.tiktokCover,
    tutorial: sources.tiktokTutorial,
    slides: [
      {
        file: "01-cover",
        type: "cover",
        eyebrow: "HƯỚNG DẪN TỪNG BƯỚC",
        title: ["LẤY LINK &", "MUA HÀNG TIKTOK SHOP"],
        body: "Thực hiện đúng quy trình với Em Ry"
      },
      {
        file: "02-chia-se-sao-chep-link",
        type: "tutorial",
        eyebrow: "BƯỚC 1",
        title: ["MỞ SẢN PHẨM &", "SAO CHÉP LINK"],
        body: "Từ video hoặc livestream, mở trang chi tiết sản phẩm, chạm Chia sẻ rồi Sao chép liên kết.",
        note: "Không dùng link video. Hãy sao chép link từ trang sản phẩm."
      },
      {
        file: "03-dang-nhap-em-ry",
        type: "illustration",
        image: sources.linkFlow,
        eyebrow: "BƯỚC 2",
        title: ["ĐĂNG NHẬP", "EM RY"],
        body: "Mở qbot.vn. Tạo tài khoản miễn phí hoặc đăng nhập tài khoản đã có.",
        note: "Không cung cấp mật khẩu TikTok hoặc mã OTP cho bất kỳ ai."
      },
      {
        file: "04-dan-link-san-pham",
        type: "illustration",
        image: sources.linkFlow,
        eyebrow: "BƯỚC 3",
        title: ["DÁN LINK", "SẢN PHẨM"],
        body: "Dán link sản phẩm vừa sao chép vào khung chat. Em Ry kiểm tra và tạo link mua hàng.",
        note: "Mức tiền hoàn hiển thị là dự kiến."
      },
      {
        file: "05-quay-lai-san-mua-hang",
        type: "illustration",
        image: sources.tiktokCover,
        eyebrow: "BƯỚC 4",
        title: ["QUAY LẠI SÀN", "VÀ MUA HÀNG"],
        body: "Nhấn đúng link Em Ry gửi lại, quay về TikTok Shop và hoàn tất mua hàng như bình thường.",
        note: "Không mở thêm link giới thiệu khác trước khi thanh toán."
      },
      {
        file: "06-don-hang-cap-nhat",
        type: "illustration",
        image: sources.tracking,
        eyebrow: "SAU KHI ĐẶT HÀNG",
        title: ["THEO DÕI", "TRẠNG THÁI ĐƠN"],
        body: "Đơn thường bắt đầu cập nhật trên Em Ry sau khoảng 24 giờ.",
        note: "Thời gian thực tế có thể thay đổi theo dữ liệu từ đối tác."
      },
      {
        file: "07-tien-hoan-vao-vi",
        type: "illustration",
        image: sources.withdrawal,
        eyebrow: "SAU KHI NHẬN HÀNG",
        title: ["TIỀN HOÀN", "ĐƯỢC CỘNG VÀO VÍ"],
        body: "Khi đơn hoàn tất, đủ điều kiện và được đối tác duyệt, tiền hoàn được cộng vào ví Em Ry.",
        note: "Bạn có thể yêu cầu rút khi số dư đạt điều kiện hiện hành."
      }
    ]
  }
};

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(lines, x, y, lineHeight, attrs) {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" ${attrs}>${escapeXml(line)}</text>`).join("");
}

function baseSvg(palette, platform, slide, index) {
  const titleSize = slide.title[1]?.length > 21 ? 225 : 260;
  const bodyLines = wrapText(slide.body, 47);
  const noteLines = slide.note ? wrapText(slide.note, 58) : [];
  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fffdf9"/>
          <stop offset="1" stop-color="${palette.pale}"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="36" stdDeviation="42" flood-color="#1f493d" flood-opacity=".12"/>
        </filter>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#bg)"/>
      <circle cx="3750" cy="280" r="570" fill="${palette.pale}" opacity=".9"/>
      <circle cx="210" cy="3810" r="620" fill="#e4f1ec" opacity=".8"/>
      <rect x="220" y="180" width="900" height="156" rx="78" fill="${palette.accent}"/>
      <text x="670" y="285" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="72" font-weight="800" fill="#fff" letter-spacing="5">${escapeXml(platform)}</text>
      <text x="3860" y="286" text-anchor="end" font-family="Segoe UI, Arial, sans-serif" font-size="72" font-weight="800" fill="#287a63">${String(index + 1).padStart(2, "0")}/07</text>
      <text x="2048" y="610" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="78" font-weight="800" fill="${palette.accent}" letter-spacing="8">${escapeXml(slide.eyebrow)}</text>
      ${textLines(slide.title, 2048, 930, 285, `text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${titleSize}" font-weight="900" fill="#30343b" letter-spacing="-7"`)}
      <rect x="280" y="1515" width="3536" height="1870" rx="150" fill="#fff" stroke="${palette.line}" stroke-width="10" filter="url(#shadow)"/>
      ${textLines(bodyLines, 2048, 3600, 118, `text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="94" font-weight="650" fill="#3e4744"`)}
      ${noteLines.length ? `<rect x="430" y="${3820 - noteLines.length * 42}" width="3236" height="${150 + noteLines.length * 78}" rx="60" fill="${palette.badge}" stroke="${palette.line}" stroke-width="6"/>${textLines(noteLines, 2048, 3885 - noteLines.length * 35, 92, `text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="70" font-weight="700" fill="${palette.accent}"`)}` : ""}
      <text x="2048" y="4015" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="50" font-weight="600" fill="#69736f">${escapeXml(commonFooter)}</text>
    </svg>
  `);
}

function coverSvg(palette, platform, slide) {
  const coverTitleSize = platform === "TIKTOK SHOP" ? 225 : 270;
  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="coverFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fffdf9" stop-opacity=".98"/>
          <stop offset=".42" stop-color="#fffdf9" stop-opacity=".76"/>
          <stop offset=".7" stop-color="#fffdf9" stop-opacity=".04"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="1840" fill="url(#coverFade)"/>
      <rect x="260" y="210" width="1040" height="170" rx="85" fill="${palette.accent}"/>
      <text x="780" y="325" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="78" font-weight="850" fill="#fff" letter-spacing="5">${escapeXml(platform)}</text>
      <text x="2048" y="660" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="82" font-weight="850" fill="${palette.accent}" letter-spacing="8">${escapeXml(slide.eyebrow)}</text>
      ${textLines(slide.title, 2048, 1020, 285, `text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="${coverTitleSize}" font-weight="900" fill="#30343b" letter-spacing="-7"`)}
      <rect x="690" y="1580" width="2716" height="190" rx="95" fill="#fff" fill-opacity=".94"/>
      <text x="2048" y="1705" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="88" font-weight="750" fill="#287a63">${escapeXml(slide.body)}</text>
      <rect x="960" y="3740" width="2176" height="170" rx="85" fill="#245f50"/>
      <text x="2048" y="3855" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="78" font-weight="800" fill="#fff">Vuốt để xem từng bước  →</text>
      <text x="2048" y="4020" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="48" font-weight="600" fill="#5f6d68">${escapeXml(commonFooter)}</text>
    </svg>
  `);
}

async function illustrationLayer(imagePath, type) {
  const width = type === "tutorial" ? 3190 : 3020;
  const height = type === "tutorial" ? 1600 : 1580;
  return sharp(imagePath)
    .resize(width, height, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
}

async function renderSlide(key, set, slide, index) {
  const palette = palettes[key];
  const destinationDir = path.join(outputRoot, key);
  fs.mkdirSync(destinationDir, { recursive: true });
  const destination = path.join(destinationDir, `${slide.file}.png`);
  if (fs.existsSync(destination) && fs.statSync(destination).size > 100000) return destination;

  if (slide.type === "cover") {
    const cover = await sharp(set.cover).resize(size, size, { fit: "cover" }).png().toBuffer();
    await sharp(cover).composite([{ input: coverSvg(palette, set.label, slide) }]).png({ compressionLevel: 9 }).toFile(destination);
    return destination;
  }

  const svg = baseSvg(palette, set.label, slide, index);
  const artPath = slide.type === "tutorial" ? set.tutorial : slide.image;
  const art = await illustrationLayer(artPath, slide.type);
  const artTop = slide.type === "tutorial" ? 1630 : 1660;
  const artLeft = Math.round((size - (slide.type === "tutorial" ? 3190 : 3020)) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#fffdf9" }
  })
    .composite([
      { input: svg, top: 0, left: 0 },
      { input: art, top: artTop, left: artLeft }
    ])
    .png({ compressionLevel: 9 })
    .toFile(destination);
  if (key === "tiktok" && slide.type === "tutorial") {
    const sanitized = `${destination}.sanitized.png`;
    const overlay = Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect x="2170" y="2210" width="1030" height="470" rx="55" fill="#ffffff"/>
        <text x="2685" y="2395" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="78" font-weight="800" fill="#202428">Mở trang sản phẩm</text>
        <text x="2685" y="2525" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="66" font-weight="650" fill="#4b5551">rồi chọn Chia sẻ</text>
      </svg>
    `);
    await sharp(destination).composite([{ input: overlay, top: 0, left: 0 }]).png({ compressionLevel: 9 }).toFile(sanitized);
    fs.renameSync(sanitized, destination);
  }
  return destination;
}

async function main() {
  const generated = [];
  for (const [key, set] of Object.entries(sets)) {
    for (let index = 0; index < set.slides.length; index += 1) {
      generated.push(await renderSlide(key, set, set.slides[index], index));
    }
  }
  console.log(JSON.stringify(generated, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
