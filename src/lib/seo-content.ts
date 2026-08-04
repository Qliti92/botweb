export type ContentSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type SeoContent = {
  slug: string;
  title: string;
  description: string;
  keyword: string;
  intro: string;
  sections: ContentSection[];
  related: string[];
  faqs?: { question: string; answer: string }[];
  updatedAt?: string;
};

export type SeoImage = {
  src: string;
  alt: string;
  caption: string;
};

const landing = (
  slug: string,
  title: string,
  description: string,
  keyword: string,
  intro: string,
  sections: ContentSection[],
  related: string[],
  faqs: { question: string; answer: string }[]
): SeoContent => ({ slug, title, description, keyword, intro, sections, related, faqs });

const article = (
  slug: string,
  title: string,
  description: string,
  keyword: string,
  intro: string,
  sections: ContentSection[],
  related: string[],
  faqs: { question: string; answer: string }[] = []
): SeoContent => ({ slug, title, description, keyword, intro, sections, related, faqs, updatedAt: "2026-07-28" });

export const landingPages: SeoContent[] = [
  landing(
    "hoan-tien-shopee",
    "Hoàn tiền Shopee: Dán link, mua hàng và nhận tiền hoàn",
    "Hướng dẫn nhận hoàn tiền Shopee với Em Ry: sao chép link sản phẩm, tạo link mua hàng, theo dõi đơn và rút tiền về tài khoản.",
    "hoàn tiền Shopee",
    "Em Ry giúp bạn kiểm tra mức hoàn dự kiến trước khi mua hàng Shopee. Bạn chỉ cần gửi đúng link sản phẩm, mở link Em Ry tạo và hoàn tất đơn hàng theo hướng dẫn.",
    [
      { heading: "Cách nhận hoàn tiền Shopee", body: "Quy trình được thiết kế để bạn vẫn mua hàng trên ứng dụng Shopee như bình thường. Điểm quan trọng là bắt đầu phiên mua từ liên kết do Em Ry tạo.", bullets: ["Mở đúng sản phẩm trên Shopee và chọn Chia sẻ.", "Sao chép đường dẫn rồi gửi cho Em Ry.", "Mở link mua hàng Em Ry trả về.", "Thêm sản phẩm, thanh toán và theo dõi trạng thái đơn."] },
      { heading: "Điều kiện để đơn được ghi nhận", body: "Việc ghi nhận phụ thuộc dữ liệu đối soát từ nền tảng và đối tác liên kết. Giá trị hiển thị ban đầu là dự kiến, chưa phải số tiền đã được duyệt.", bullets: ["Không mua từ link chia sẻ khác sau khi mở link Em Ry.", "Không dùng link Shopee Video thay cho link sản phẩm.", "Đơn phải hoàn tất và không bị hủy hoặc hoàn trả.", "Thông tin cuối cùng căn cứ kết quả đối soát của sàn."] },
      { heading: "Theo dõi tiền hoàn", body: "Sau khi đặt hàng, đơn có thể cần thời gian mới xuất hiện. Bạn có thể mở mục Đơn hàng trong Em Ry để xem trạng thái tạm tính, chờ duyệt hoặc đã duyệt." },
      { heading: "Bắt đầu với một link sản phẩm", body: "Không cần cung cấp mật khẩu Shopee. Hãy quay lại trang chủ, đăng nhập Em Ry và dán link sản phẩm muốn mua để kiểm tra." }
    ],
    ["hoan-tien-shopee-la-gi", "cach-lay-link-shopee", "cach-tao-link-hoan-tien-shopee", "shopee-khong-ghi-nhan-hoan-tien"],
    [
      { question: "Dùng Em Ry có làm giá sản phẩm tăng không?", answer: "Không. Bạn vẫn xem giá và thanh toán trực tiếp trên Shopee; tiền hoàn phụ thuộc hoa hồng được đối tác xác nhận." },
      { question: "Có cần mật khẩu Shopee không?", answer: "Không. Em Ry chỉ cần link sản phẩm và không yêu cầu mật khẩu tài khoản Shopee." },
      { question: "Đơn bị hủy có được hoàn tiền không?", answer: "Không. Đơn hủy, trả hàng hoặc hoàn tiền thường không đủ điều kiện nhận tiền hoàn." }
    ]
  ),
  landing(
    "hoan-tien-tiktok-shop",
    "Hoàn tiền TikTok Shop: Hướng dẫn từ link sản phẩm",
    "Cách nhận hoàn tiền TikTok Shop: lấy đúng link sản phẩm, tạo link qua Em Ry, đặt hàng và theo dõi kết quả đối soát.",
    "hoàn tiền TikTok Shop",
    "Bạn có thể mua sản phẩm trên TikTok Shop và nhận lại một phần hoa hồng đủ điều kiện. Em Ry giúp chuyển link sản phẩm thành link mua hàng có thể theo dõi.",
    [
      { heading: "Quy trình hoàn tiền TikTok Shop", body: "Hãy mở trang chi tiết của sản phẩm thay vì chỉ sao chép đường dẫn video. Sau khi Em Ry xử lý link, bạn cần quay lại TikTok Shop bằng đúng nút mua hàng được cung cấp.", bullets: ["Mở sản phẩm trong giỏ hàng của video hoặc gian hàng.", "Chọn Chia sẻ và sao chép liên kết sản phẩm.", "Dán link vào Em Ry và mở link được tạo.", "Đặt hàng trong cùng phiên truy cập."] },
      { heading: "Phân biệt link video và link sản phẩm", body: "Link video chỉ dẫn tới nội dung và có thể không xác định được sản phẩm cần mua. Nếu đang xem video, hãy chạm vào thẻ sản phẩm hoặc giỏ hàng trước, mở chi tiết sản phẩm rồi mới sao chép link." },
      { heading: "Khi nào tiền hoàn được xác nhận?", body: "Đơn cần hoàn tất giao hàng và trải qua đối soát. Thời gian thực tế thay đổi theo kỳ dữ liệu của TikTok Shop; Em Ry chỉ cộng số dư khả dụng sau khi nhận được kết quả hợp lệ." },
      { heading: "Kiểm tra trước khi thanh toán", body: "Đảm bảo sản phẩm, biến thể và shop trên trang thanh toán đúng với sản phẩm bạn đã mở từ link Em Ry. Nếu đổi sang sản phẩm khác, hãy tạo lại link." }
    ],
    ["hoan-tien-tiktok-shop-la-gi", "cach-lay-link-tiktok-shop", "cach-tao-link-hoan-tien-tiktok-shop", "link-tiktok-video-co-hoan-tien-duoc-khong"],
    [
      { question: "Link TikTok Video có dùng được không?", answer: "Không nên. Bạn cần mở sản phẩm trong video rồi sao chép đường dẫn từ trang chi tiết sản phẩm." },
      { question: "Có phải đăng nhập TikTok trong Em Ry không?", answer: "Không. Bạn đăng nhập và thanh toán trên ứng dụng TikTok như bình thường." },
      { question: "Tiền dự kiến có thể thay đổi không?", answer: "Có. Mức cuối cùng phụ thuộc sản phẩm, giá trị hợp lệ và kết quả đối soát." }
    ]
  ),
  landing(
    "tao-link-hoan-tien",
    "Tạo link hoàn tiền Shopee và TikTok Shop",
    "Dán link sản phẩm Shopee hoặc TikTok Shop để Em Ry kiểm tra và tạo link mua hàng có khả năng nhận tiền hoàn.",
    "tạo link hoàn tiền",
    "Công cụ tạo link hoàn tiền của Em Ry hỗ trợ đường dẫn sản phẩm Shopee và TikTok Shop. Bạn có thể kiểm tra link trước khi bắt đầu mua hàng.",
    [
      { heading: "Chuẩn bị đúng đường dẫn", body: "Link cần dẫn trực tiếp đến trang chi tiết sản phẩm. Link trang chủ, trang tìm kiếm, video hoặc nội dung ngoài Shopee và TikTok Shop sẽ không được gửi đi." },
      { heading: "Ba bước tạo link", body: "Quá trình chỉ mất khoảng một phút và không thay đổi giá sản phẩm trên sàn.", bullets: ["Sao chép link sản phẩm từ ứng dụng mua sắm.", "Dán link vào khung chat Em Ry.", "Mở link kết quả để quay lại sàn và mua hàng."] },
      { heading: "Sau khi tạo link", body: "Không chia sẻ thông tin đăng nhập và không thanh toán trên Em Ry. Mọi thao tác chọn biến thể, địa chỉ và thanh toán vẫn diễn ra trên Shopee hoặc TikTok Shop." },
      { heading: "Nếu link không được chấp nhận", body: "Hãy kiểm tra tên miền, mở lại trang chi tiết sản phẩm và sao chép đường dẫn mới. Với link rút gọn, Em Ry sẽ kiểm tra nền tảng trước khi xử lý." }
    ],
    ["cach-tao-link-hoan-tien-shopee", "cach-tao-link-hoan-tien-tiktok-shop", "cach-lay-link-shopee", "cach-lay-link-tiktok-shop"],
    [
      { question: "Tạo link có mất phí không?", answer: "Không. Việc đăng ký và tạo link trên Em Ry không thu phí." },
      { question: "Có thể tạo link cho sản phẩm nào?", answer: "Em Ry hiện hỗ trợ link sản phẩm hợp lệ từ Shopee và TikTok Shop." },
      { question: "Có thể mua sản phẩm khác sau khi mở link không?", answer: "Bạn nên tạo link mới cho đúng sản phẩm muốn mua để giảm nguy cơ đơn không được ghi nhận." }
    ]
  ),
  landing(
    "cach-hoat-dong",
    "Dịch vụ hoàn tiền mua hàng hoạt động như thế nào?",
    "Tìm hiểu quy trình tạo link, ghi nhận đơn, đối soát hoa hồng và nhận tiền hoàn khi mua hàng qua Em Ry.",
    "cách hoàn tiền khi mua hàng online",
    "Hoàn tiền mua hàng dựa trên cơ chế ghi nhận giới thiệu. Khi một giao dịch đủ điều kiện tạo ra hoa hồng, Em Ry chia lại phần hoa hồng theo chính sách hiển thị trong hệ thống.",
    [
      { heading: "Từ link sản phẩm đến đơn hàng", body: "Link Em Ry tạo chứa thông tin giúp đối tác xác định nguồn giới thiệu. Bạn vẫn mua hàng và thanh toán trực tiếp với sàn thương mại điện tử." },
      { heading: "Ba mốc trạng thái quan trọng", body: "Một đơn thường đi qua các giai đoạn ghi nhận, chờ sàn xác nhận và trở thành số dư khả dụng. Trạng thái tạm tính không đồng nghĩa tiền đã có thể rút." },
      { heading: "Cách tính tiền hoàn", body: "Mức dự kiến phụ thuộc hoa hồng của từng sản phẩm. Số tiền cuối cùng được tính từ hoa hồng được duyệt sau thuế và tỷ lệ chia sẻ được công bố trong Em Ry." },
      { heading: "Trách nhiệm của người mua", body: "Người mua cần bắt đầu từ đúng link, hoàn tất giao dịch hợp lệ và không thực hiện hành vi làm sai lệch ghi nhận. Đơn hủy hoặc hoàn trả không tạo tiền hoàn." }
    ],
    ["cashback-hoat-dong-nhu-the-nao", "trang-thai-tien-hoan-la-gi", "tien-hoan-ve-bao-lau", "tien-hoan-khac-du-kien"],
    [
      { question: "Em Ry có bán sản phẩm không?", answer: "Không. Em Ry hỗ trợ tạo link và theo dõi tiền hoàn; sản phẩm được bán và thanh toán trên sàn." },
      { question: "Tiền hoàn có được đảm bảo không?", answer: "Không thể đảm bảo trước đối soát. Kết quả cuối cùng phụ thuộc dữ liệu và điều kiện của đối tác." },
      { question: "Tại sao cần chờ đối soát?", answer: "Sàn cần xác nhận đơn đã hoàn tất, không hủy hoặc hoàn trả và đủ điều kiện hoa hồng." }
    ]
  ),
  landing(
    "rut-tien-hoan-tien",
    "Rút tiền hoàn về tài khoản ngân hàng",
    "Hướng dẫn kiểm tra số dư khả dụng, tạo yêu cầu rút tiền hoàn và theo dõi trạng thái xử lý trong Em Ry.",
    "rút tiền hoàn tiền",
    "Sau khi hoa hồng được duyệt và chuyển thành số dư khả dụng, bạn có thể tạo yêu cầu rút tiền trong Em Ry. Tiền tạm tính hoặc chờ duyệt chưa thể rút.",
    [
      { heading: "Điều kiện tạo yêu cầu rút", body: "Tài khoản cần có số dư khả dụng đạt mức tối thiểu được hiển thị tại thời điểm yêu cầu. Thông tin chủ tài khoản phải chính xác để tránh giao dịch bị trả lại." },
      { heading: "Các bước rút tiền", body: "Mở mục Ví trong Em Ry, kiểm tra số dư, chọn Rút tiền và xác nhận tài khoản nhận. Luôn đọc lại tên ngân hàng, số tài khoản và tên chủ tài khoản trước khi gửi." },
      { heading: "Theo dõi trạng thái", body: "Yêu cầu có thể ở trạng thái mới, đang xử lý, hoàn tất hoặc bị từ chối. Nếu thông tin nhận tiền sai, hãy liên hệ hỗ trợ và không gửi nhiều yêu cầu trùng nhau." },
      { heading: "Bảo vệ thông tin tài khoản", body: "Em Ry không yêu cầu mã OTP ngân hàng, mật khẩu ngân hàng hoặc mã PIN. Chỉ cung cấp thông tin cần thiết tại giao diện chính thức của hệ thống." }
    ],
    ["cach-rut-tien-hoan-ve-ngan-hang", "trang-thai-tien-hoan-la-gi", "tien-hoan-ve-bao-lau", "mua-hang-hoan-tien-co-an-toan-khong"],
    [
      { question: "Tiền tạm tính có rút được không?", answer: "Không. Chỉ số dư đã được duyệt và chuyển thành khả dụng mới có thể dùng để tạo yêu cầu rút." },
      { question: "Em Ry có hỏi OTP ngân hàng không?", answer: "Không. Không cung cấp OTP, mật khẩu hoặc mã PIN cho bất kỳ ai." },
      { question: "Nhập sai tài khoản phải làm gì?", answer: "Liên hệ hỗ trợ sớm nhất và cung cấp mã yêu cầu; khả năng sửa phụ thuộc trạng thái xử lý." }
    ]
  ),
  landing(
    "gioi-thieu-ban-be",
    "Giới thiệu bạn bè và nhận hoa hồng",
    "Chia sẻ Em Ry đúng cách, theo dõi người được giới thiệu và nhận hoa hồng khi phát sinh giao dịch đủ điều kiện.",
    "giới thiệu bạn bè nhận hoa hồng",
    "Chương trình giới thiệu giúp người dùng nhận thêm quyền lợi khi bạn bè đăng ký và phát sinh giao dịch hợp lệ. Mọi khoản ghi nhận đều tuân theo chính sách đang hiển thị trong Em Ry.",
    [
      { heading: "Cách lấy link giới thiệu", body: "Đăng nhập Em Ry và mở mục Giới thiệu bạn bè để lấy đúng mã hoặc liên kết cá nhân. Không tự chỉnh sửa tham số trong đường dẫn." },
      { heading: "Khi nào phát sinh hoa hồng?", body: "Việc đăng ký tài khoản không mặc nhiên tạo ra tiền thưởng. Hoa hồng chỉ được tính khi điều kiện chương trình được đáp ứng và giao dịch liên quan được duyệt." },
      { heading: "Chia sẻ minh bạch", body: "Hãy nói rõ đây là liên kết giới thiệu và không hứa hẹn mức thu nhập cố định. Không gửi tin nhắn hàng loạt, giả mạo thương hiệu hoặc sử dụng nội dung gây hiểu nhầm." },
      { heading: "Theo dõi kết quả", body: "Số liệu người giới thiệu và quyền lợi được hiển thị trong tài khoản. Các giao dịch hủy, gian lận hoặc không đủ điều kiện có thể bị loại khi đối soát." }
    ],
    ["cashback-hoat-dong-nhu-the-nao", "mua-hang-hoan-tien-co-an-toan-khong", "trang-thai-tien-hoan-la-gi", "don-hang-bi-tu-choi-hoan-tien"],
    [
      { question: "Chỉ cần bạn bè đăng ký là có tiền không?", answer: "Không nhất thiết. Quyền lợi phụ thuộc điều kiện chương trình được công bố tại thời điểm tham gia." },
      { question: "Có được tự tạo nhiều tài khoản không?", answer: "Không. Tài khoản hoặc giao dịch có dấu hiệu gian lận có thể bị loại khỏi chương trình." },
      { question: "Hoa hồng giới thiệu rút thế nào?", answer: "Khoản đã duyệt được cộng vào số dư theo chính sách và có thể rút khi đạt điều kiện hiện hành." }
    ]
  )
];

export const articles: SeoContent[] = [
  article("hoan-tien-shopee-la-gi", "Hoàn tiền Shopee là gì? Cách nhận tiền hoàn khi mua hàng", "Giải thích hoàn tiền Shopee, cách tạo link, điều kiện ghi nhận và thời điểm tiền hoàn được duyệt.", "hoàn tiền Shopee là gì", "Hoàn tiền Shopee là việc người mua nhận lại một phần hoa hồng phát sinh từ giao dịch đủ điều kiện. Đây không phải hoàn trả tiền do lỗi đơn hàng và cũng không phải Shopee Xu.", [
    { heading: "Cơ chế hoàn tiền", body: "Người mua mở Shopee từ một liên kết có thể theo dõi. Khi đơn hoàn tất và đối tác xác nhận hoa hồng, hệ thống chia lại một phần cho người dùng." },
    { heading: "Các bước thực hiện", body: "Sao chép link sản phẩm, gửi cho Em Ry, mở link được tạo rồi đặt hàng. Không cần cung cấp mật khẩu Shopee cho Em Ry." },
    { heading: "Điều kiện quan trọng", body: "Đơn cần được mua từ đúng liên kết, giao thành công và không hủy hoặc hoàn trả. Mức hiển thị trước khi mua chỉ là dự kiến." },
    { heading: "Khác gì với hoàn trả đơn hàng?", body: "Hoàn trả là sàn trả lại tiền thanh toán khi đơn bị hủy hoặc có tranh chấp. Tiền hoàn cashback đến từ hoa hồng giới thiệu của một đơn thành công." }
  ], ["hoan-tien-shopee", "hoan-tien-va-hoan-xu-shopee", "cashback-hoat-dong-nhu-the-nao"]),
  article("cach-lay-link-shopee", "Cách lấy link sản phẩm Shopee trên điện thoại", "Hướng dẫn mở đúng sản phẩm, chọn Chia sẻ và sao chép link Shopee để gửi cho Em Ry.", "cách lấy link Shopee", "Bạn cần sao chép đường dẫn từ trang chi tiết sản phẩm, không phải link video, trang tìm kiếm hoặc trang chủ Shopee.", [
    { heading: "Lấy link trong ứng dụng Shopee", body: "Mở sản phẩm muốn mua, chạm biểu tượng Chia sẻ rồi chọn Sao chép đường dẫn. Tên nút có thể thay đổi nhẹ theo phiên bản ứng dụng." },
    { heading: "Kiểm tra link trước khi gửi", body: "Link hợp lệ thường mở lại đúng sản phẩm trên Shopee. Hãy thử mở link nếu bạn không chắc mình đã sao chép đúng." },
    { heading: "Link Shopee Video không phù hợp", body: "Nếu đang xem video, hãy mở thẻ sản phẩm trong video trước. Chỉ sao chép link sau khi màn hình đã hiển thị trang chi tiết sản phẩm." },
    { heading: "Dán link vào Em Ry", body: "Quay lại Em Ry, dán link vào ô chat và gửi. Hệ thống sẽ kiểm tra nền tảng trước khi tạo link mua hàng." }
  ], ["hoan-tien-shopee", "cach-tao-link-hoan-tien-shopee", "nhung-loi-can-tranh-khi-mua-hang-hoan-tien"]),
  article("cach-tao-link-hoan-tien-shopee", "Cách tạo link hoàn tiền Shopee từng bước", "Bốn bước tạo link hoàn tiền Shopee qua Em Ry và những lưu ý giúp đơn được ghi nhận.", "cách tạo link hoàn tiền Shopee", "Sau khi có link sản phẩm Shopee, Em Ry sẽ kiểm tra và trả lại liên kết để bạn bắt đầu phiên mua hàng có thể ghi nhận.", [
    { heading: "Bước 1: Sao chép sản phẩm", body: "Chọn đúng sản phẩm và biến thể bạn dự định mua. Sao chép liên kết từ nút Chia sẻ trên trang chi tiết." },
    { heading: "Bước 2: Gửi link cho Em Ry", body: "Đăng nhập, dán link vào chat và chờ kết quả kiểm tra. Link ngoài nền tảng hoặc link video sẽ bị từ chối." },
    { heading: "Bước 3: Mở link kết quả", body: "Nhấn nút quay lại Shopee trong tin nhắn kết quả. Không mở thêm link giới thiệu khác trước khi thanh toán." },
    { heading: "Bước 4: Theo dõi đơn", body: "Sau khi mua, chờ dữ liệu đồng bộ và kiểm tra mục Đơn hàng. Đừng tạo khiếu nại ngay nếu đơn chưa xuất hiện tức thì." }
  ], ["tao-link-hoan-tien", "cach-lay-link-shopee", "shopee-khong-ghi-nhan-hoan-tien"]),
  article("shopee-khong-ghi-nhan-hoan-tien", "Vì sao đơn Shopee không được ghi nhận hoàn tiền?", "Các nguyên nhân phổ biến khiến đơn Shopee chưa xuất hiện hoặc bị từ chối tiền hoàn và cách kiểm tra.", "Shopee không ghi nhận hoàn tiền", "Đơn chưa xuất hiện ngay không đồng nghĩa đã thất bại. Dữ liệu có thể đến chậm, nhưng một số thao tác trong phiên mua cũng có thể làm mất dấu ghi nhận.", [
    { heading: "Dữ liệu chưa đồng bộ", body: "Hãy chờ đủ thời gian được thông báo trong Em Ry. Đối tác thường gửi dữ liệu theo lô thay vì ngay sau khi thanh toán." },
    { heading: "Link bị ghi đè", body: "Việc mở link từ KOL, quảng cáo hoặc nguồn khác sau link Em Ry có thể thay đổi nguồn giới thiệu cuối cùng." },
    { heading: "Sản phẩm hoặc đơn không đủ điều kiện", body: "Một số sản phẩm không có hoa hồng; đơn hủy, hoàn trả, gian lận hoặc giá trị không hợp lệ có thể bị loại." },
    { heading: "Cách gửi yêu cầu hỗ trợ", body: "Chuẩn bị mã đơn, thời điểm mở link và ảnh trạng thái đơn. Không gửi mật khẩu, OTP hoặc dữ liệu thanh toán nhạy cảm." }
  ], ["hoan-tien-shopee", "kiem-tra-don-hoan-tien", "don-hang-bi-tu-choi-hoan-tien"]),
  article("mua-nhieu-san-pham-co-duoc-hoan-tien", "Mua nhiều sản phẩm trong một đơn có được hoàn tiền không?", "Giải thích cách xử lý khi giỏ hàng có nhiều sản phẩm và cách giảm rủi ro mất ghi nhận tiền hoàn.", "mua nhiều sản phẩm có được hoàn tiền", "Một đơn có nhiều sản phẩm có thể được ghi nhận, nhưng điều kiện và mức hoa hồng có thể khác nhau ở từng dòng sản phẩm.", [
    { heading: "Mỗi sản phẩm có điều kiện riêng", body: "Không nên lấy tỷ lệ của một sản phẩm để nhân cho toàn bộ giỏ hàng. Sản phẩm không tham gia hoa hồng có thể có mức hoàn bằng không." },
    { heading: "Cách an toàn nhất", body: "Tạo link cho sản phẩm chính, mở link rồi thêm đúng sản phẩm đó. Với nhiều sản phẩm quan trọng, cân nhắc tạo và mua theo phiên riêng." },
    { heading: "Voucher và phí vận chuyển", body: "Giá trị hoa hồng thường không tính theo toàn bộ số tiền thanh toán. Voucher, thuế, phí và phần bị hoàn có thể làm giá trị hợp lệ thay đổi." },
    { heading: "Đọc kết quả đối soát", body: "Số tiền cuối cùng chỉ được xác định sau khi sàn gửi dữ liệu từng sản phẩm hoặc từng đơn." }
  ], ["hoan-tien-shopee", "tien-hoan-khac-du-kien", "nhung-loi-can-tranh-khi-mua-hang-hoan-tien"]),
  article("huy-don-shopee-co-duoc-hoan-tien-khong", "Hủy đơn hoặc trả hàng Shopee có được nhận tiền hoàn không?", "Tìm hiểu tác động của hủy đơn, trả hàng, hoàn tiền và đặt lại đơn đối với cashback Shopee.", "hủy đơn Shopee có được hoàn tiền không", "Tiền hoàn chỉ phát sinh từ giao dịch thành công. Khi đơn bị hủy hoặc giá trị được hoàn lại, hoa hồng liên quan thường bị hủy theo.", [
    { heading: "Đơn hủy trước khi giao", body: "Đơn không hoàn tất sẽ không đủ điều kiện. Khoản tạm tính nếu đã xuất hiện có thể bị điều chỉnh về không." },
    { heading: "Trả một phần đơn hàng", body: "Phần sản phẩm bị trả thường không được tính. Phần còn lại có được duyệt hay không phụ thuộc dữ liệu đối soát." },
    { heading: "Đặt lại sau khi hủy", body: "Hãy quay lại Em Ry và tạo phiên mua mới từ link sản phẩm. Không đặt lại trực tiếp từ lịch sử đơn cũ." },
    { heading: "Khi trạng thái cập nhật chậm", body: "Số dư tạm tính có thể còn hiển thị trước khi kết quả hủy được đồng bộ. Không xem đây là số tiền đã được duyệt." }
  ], ["hoan-tien-shopee", "trang-thai-tien-hoan-la-gi", "don-hang-bi-tu-choi-hoan-tien"]),
  article("hoan-tien-va-hoan-xu-shopee", "Phân biệt hoàn tiền và Hoàn Xu Shopee", "So sánh cashback bằng tiền với voucher Hoàn Xu Shopee để tránh nhầm quyền lợi và cách sử dụng.", "hoàn tiền và hoàn xu Shopee", "Hoàn Xu Shopee và tiền hoàn từ Em Ry là hai cơ chế khác nhau. Một bên trả quyền lợi bằng Shopee Xu theo voucher; bên còn lại chia sẻ hoa hồng được duyệt.", [
    { heading: "Hoàn Xu Shopee", body: "Người mua áp voucher đủ điều kiện và nhận Shopee Xu theo chính sách của Shopee. Xu được sử dụng trong hệ sinh thái Shopee theo điều kiện hiện hành." },
    { heading: "Tiền hoàn từ Em Ry", body: "Khoản này dựa trên hoa hồng giới thiệu của đơn đủ điều kiện và được theo dõi trong ví Em Ry sau đối soát." },
    { heading: "Có thể nhận cả hai không?", body: "Khả năng kết hợp phụ thuộc điều kiện voucher, sản phẩm và chương trình liên kết tại thời điểm mua. Không nên mặc định mọi đơn đều nhận cả hai." },
    { heading: "Cách đọc thông tin đúng", body: "Kiểm tra voucher trên Shopee và mức hoàn dự kiến trên Em Ry riêng biệt. Số tiền cuối cùng luôn dựa trên kết quả thực tế." }
  ], ["hoan-tien-shopee-la-gi", "tien-hoan-khac-du-kien", "cashback-hoat-dong-nhu-the-nao"]),
  article("hoan-tien-tiktok-shop-la-gi", "Hoàn tiền TikTok Shop là gì? Hướng dẫn cho người mới", "Giải thích cashback TikTok Shop, quy trình lấy link sản phẩm, mua hàng và chờ đối soát.", "hoàn tiền TikTok Shop là gì", "Hoàn tiền TikTok Shop giúp người mua nhận lại một phần hoa hồng của giao dịch đủ điều kiện. Bạn vẫn đặt hàng và thanh toán trên TikTok Shop.", [
    { heading: "Cách giao dịch được ghi nhận", body: "Em Ry tạo liên kết mua hàng từ sản phẩm bạn gửi. Đối tác dùng thông tin trong liên kết để xác định nguồn giới thiệu." },
    { heading: "Quy trình cho người mới", body: "Mở sản phẩm, sao chép link, gửi Em Ry, mở link kết quả và đặt hàng. Hãy thực hiện liên tục trên cùng thiết bị." },
    { heading: "Khi nào được nhận tiền?", body: "Đơn cần giao thành công và qua kỳ đối soát. Trạng thái ban đầu chỉ giúp theo dõi chứ chưa phải số dư có thể rút." },
    { heading: "Điều cần tránh", body: "Không dùng link video thay link sản phẩm, không mở link quảng bá khác và không đặt lại trực tiếp sau khi hủy đơn." }
  ], ["hoan-tien-tiktok-shop", "cach-lay-link-tiktok-shop", "tiktok-shop-doi-soat-bao-lau"]),
  article("cach-lay-link-tiktok-shop", "Cách sao chép link sản phẩm TikTok Shop", "Hướng dẫn lấy đúng link sản phẩm TikTok Shop từ video, livestream hoặc gian hàng để gửi Em Ry.", "cách lấy link TikTok Shop", "Dù bắt đầu từ video hay livestream, bạn cần mở trang chi tiết sản phẩm trước khi dùng nút Chia sẻ.", [
    { heading: "Từ video TikTok", body: "Chạm vào thẻ sản phẩm hoặc biểu tượng giỏ hàng trong video, chọn sản phẩm muốn mua và mở trang chi tiết." },
    { heading: "Từ livestream", body: "Mở danh sách sản phẩm của phiên live, chọn đúng mặt hàng rồi chuyển tới trang chi tiết trước khi sao chép." },
    { heading: "Từ gian hàng", body: "Chọn sản phẩm trong tab cửa hàng, nhấn Chia sẻ và Sao chép liên kết. Kiểm tra link mở lại đúng sản phẩm." },
    { heading: "Gửi link cho Em Ry", body: "Dán đường dẫn vào chat. Nếu hệ thống báo đây là link video, hãy quay lại sản phẩm và thực hiện lại." }
  ], ["hoan-tien-tiktok-shop", "link-tiktok-video-co-hoan-tien-duoc-khong", "cach-tao-link-hoan-tien-tiktok-shop"]),
  article("cach-tao-link-hoan-tien-tiktok-shop", "Cách tạo link hoàn tiền TikTok Shop", "Các bước chuyển link sản phẩm TikTok Shop qua Em Ry và mua hàng đúng phiên ghi nhận.", "tạo link hoàn tiền TikTok Shop", "Tạo link hoàn tiền bắt đầu bằng đường dẫn của một sản phẩm cụ thể. Em Ry không xử lý link video chung vì không xác định chắc sản phẩm.", [
    { heading: "Lấy link đúng sản phẩm", body: "Mở chi tiết sản phẩm từ video, livestream hoặc gian hàng rồi sao chép bằng nút Chia sẻ." },
    { heading: "Chuyển link với Em Ry", body: "Dán link vào khung chat. Sau khi kiểm tra, Em Ry hiển thị thông tin và nút quay lại TikTok Shop." },
    { heading: "Hoàn tất phiên mua", body: "Nhấn đúng nút kết quả, chọn biến thể và thanh toán. Tránh mở thêm liên kết giới thiệu khác trong quá trình này." },
    { heading: "Theo dõi sau khi mua", body: "Chờ dữ liệu đơn đồng bộ. Chỉ số tiền được duyệt sau đối soát mới chuyển thành số dư khả dụng." }
  ], ["tao-link-hoan-tien", "cach-lay-link-tiktok-shop", "tiktok-shop-khong-ghi-nhan-don"]),
  article("tiktok-shop-khong-ghi-nhan-don", "Vì sao đơn TikTok Shop không được ghi nhận?", "Kiểm tra nguyên nhân đơn TikTok Shop chưa xuất hiện, mất nguồn giới thiệu hoặc không đủ điều kiện tiền hoàn.", "TikTok Shop không ghi nhận đơn hoàn tiền", "Dữ liệu TikTok Shop có thể không xuất hiện ngay sau khi thanh toán. Trước khi báo lỗi, hãy kiểm tra thời gian đồng bộ và cách bạn bắt đầu phiên mua.", [
    { heading: "Chưa đến kỳ đồng bộ", body: "Theo dõi thông báo thời gian trong Em Ry. Dữ liệu đơn và dữ liệu hoa hồng có thể được gửi ở các thời điểm khác nhau." },
    { heading: "Dùng nhầm link video", body: "Link video không đại diện chắc chắn cho sản phẩm. Bạn cần mở thẻ sản phẩm và tạo link từ trang chi tiết." },
    { heading: "Nguồn giới thiệu bị thay đổi", body: "Một link quảng bá khác được mở sau link Em Ry có thể trở thành nguồn cuối cùng được ghi nhận." },
    { heading: "Thông tin cần gửi hỗ trợ", body: "Cung cấp mã đơn, thời gian mua, sản phẩm và ảnh trạng thái. Tuyệt đối không gửi OTP hay mật khẩu TikTok." }
  ], ["hoan-tien-tiktok-shop", "kiem-tra-don-hoan-tien", "don-hang-bi-tu-choi-hoan-tien"]),
  article("link-tiktok-video-co-hoan-tien-duoc-khong", "Link TikTok Video có dùng để hoàn tiền được không?", "Giải thích vì sao cần link sản phẩm TikTok Shop thay cho link video và cách lấy lại đúng đường dẫn.", "link TikTok video và link sản phẩm", "Link video dẫn đến nội dung TikTok, trong khi một video có thể chứa nhiều sản phẩm hoặc không có sản phẩm. Vì vậy Em Ry cần link trang chi tiết sản phẩm.", [
    { heading: "Cách nhận biết link video", body: "Khi mở link, nếu màn hình phát video thay vì hiển thị tên, giá và lựa chọn sản phẩm, đó chưa phải đường dẫn phù hợp." },
    { heading: "Mở sản phẩm trong video", body: "Chạm vào biểu tượng giỏ hàng hoặc thẻ sản phẩm, chọn đúng mặt hàng rồi mở trang chi tiết." },
    { heading: "Sao chép lại đường dẫn", body: "Dùng nút Chia sẻ trên trang sản phẩm và chọn Sao chép liên kết. Sau đó quay lại Em Ry." },
    { heading: "Nếu video có nhiều sản phẩm", body: "Tạo link riêng cho đúng sản phẩm bạn sẽ thanh toán. Không dùng một link chung cho toàn bộ danh sách." }
  ], ["cach-lay-link-tiktok-shop", "cach-tao-link-hoan-tien-tiktok-shop", "hoan-tien-tiktok-shop"]),
  article("tiktok-shop-doi-soat-bao-lau", "TikTok Shop đối soát hoa hồng và tiền hoàn trong bao lâu?", "Các giai đoạn từ ghi nhận đơn TikTok Shop đến duyệt hoa hồng và số dư tiền hoàn khả dụng.", "TikTok Shop đối soát bao lâu", "Không có một thời gian cố định cho mọi đơn. Tiến độ phụ thuộc giao hàng, thời hạn đổi trả và kỳ dữ liệu của đối tác.", [
    { heading: "Giai đoạn ghi nhận", body: "Thông tin đơn có thể xuất hiện sau khi dữ liệu được đồng bộ. Đây mới là xác nhận theo dõi ban đầu." },
    { heading: "Giai đoạn chờ duyệt", body: "Sau khi giao, sàn vẫn cần kiểm tra hủy, hoàn trả và điều kiện hoa hồng. Số tiền ở giai đoạn này chưa thể rút." },
    { heading: "Giai đoạn khả dụng", body: "Khi đối tác duyệt, Em Ry cập nhật số tiền cuối cùng vào số dư khả dụng theo chính sách." },
    { heading: "Khi nào cần liên hệ?", body: "Chỉ nên gửi hỗ trợ khi đã quá mốc thời gian hiển thị trong hệ thống và bạn có đầy đủ mã đơn, ngày mua." }
  ], ["hoan-tien-tiktok-shop", "tien-hoan-ve-bao-lau", "trang-thai-tien-hoan-la-gi"]),
  article("tien-hoan-ve-bao-lau", "Tiền hoàn về trong bao lâu?", "Hiểu thời gian ghi nhận, chờ duyệt và chuyển tiền hoàn thành số dư khả dụng.", "tiền hoàn về bao lâu", "Thời gian tiền hoàn phụ thuộc chu kỳ của từng nền tảng và trạng thái giao dịch. Đơn giao xong chưa đồng nghĩa hoa hồng được duyệt ngay.", [
    { heading: "Ba mốc không nên nhầm", body: "Ngày mua, ngày đơn xuất hiện và ngày tiền khả dụng là ba thời điểm khác nhau. Em Ry hiển thị trạng thái để bạn theo dõi từng mốc." },
    { heading: "Yếu tố ảnh hưởng", body: "Giao hàng chậm, thời hạn đổi trả, ngày lễ và lịch gửi dữ liệu có thể kéo dài thời gian xử lý." },
    { heading: "Tiền tạm tính", body: "Khoản tạm tính giúp tham khảo nhưng có thể tăng, giảm hoặc bị loại. Không dùng khoản này như số dư chắc chắn." },
    { heading: "Cách kiểm tra", body: "Mở mục Đơn hàng và Ví trong Em Ry. Liên hệ hỗ trợ khi đã quá mốc dự kiến được hiển thị cho đơn." }
  ], ["cach-hoat-dong", "trang-thai-tien-hoan-la-gi", "kiem-tra-don-hoan-tien"]),
  article("kiem-tra-don-hoan-tien", "Cách kiểm tra đơn hàng đã được ghi nhận", "Hướng dẫn xem lịch sử đơn, đọc trạng thái và chuẩn bị thông tin khi đơn chưa xuất hiện trong Em Ry.", "kiểm tra đơn hoàn tiền", "Sau khi mua qua link Em Ry, bạn có thể kiểm tra mục Đơn hàng. Hãy dùng mã đơn trên sàn để đối chiếu khi cần hỗ trợ.", [
    { heading: "Mở lịch sử đơn", body: "Đăng nhập đúng tài khoản Em Ry đã dùng lúc tạo link và mở chức năng Đơn hàng trong menu chat." },
    { heading: "Đối chiếu thông tin", body: "Kiểm tra nền tảng, thời gian, mã đơn, giá trị và trạng thái. Một số dữ liệu có thể được cập nhật theo lô." },
    { heading: "Đơn chưa xuất hiện", body: "Chờ đủ thời gian thông báo, kiểm tra bạn có mở đúng link và không hủy đơn. Không tạo nhiều tài khoản để tìm đơn." },
    { heading: "Gửi yêu cầu tra soát", body: "Cung cấp mã đơn và ảnh trạng thái giao hàng. Che thông tin thanh toán, địa chỉ và dữ liệu không cần thiết." }
  ], ["tien-hoan-ve-bao-lau", "shopee-khong-ghi-nhan-hoan-tien", "tiktok-shop-khong-ghi-nhan-don"]),
  article("trang-thai-tien-hoan-la-gi", "Trạng thái tạm tính, chờ duyệt và khả dụng nghĩa là gì?", "Giải thích các trạng thái tiền hoàn trong Em Ry và thời điểm người dùng có thể rút tiền.", "trạng thái tiền hoàn", "Mỗi trạng thái phản ánh một mức độ xác nhận khác nhau. Chỉ số dư khả dụng mới là khoản đã hoàn tất đối soát để yêu cầu rút.", [
    { heading: "Tạm tính", body: "Hệ thống đã nhận tín hiệu ban đầu và ước tính quyền lợi. Giá trị vẫn có thể thay đổi." },
    { heading: "Chờ duyệt", body: "Đơn đang chờ đối tác xác nhận đủ điều kiện. Hủy, trả hàng hoặc điều chỉnh giá trị có thể ảnh hưởng kết quả." },
    { heading: "Khả dụng", body: "Khoản được duyệt đã vào ví và có thể dùng cho yêu cầu rút khi đạt mức tối thiểu hiện hành." },
    { heading: "Bị từ chối", body: "Đơn không tạo hoa hồng hợp lệ. Xem lý do hiển thị hoặc gửi tra soát nếu có bằng chứng mua từ đúng link." }
  ], ["rut-tien-hoan-tien", "cach-rut-tien-hoan-ve-ngan-hang", "don-hang-bi-tu-choi-hoan-tien"]),
  article("cach-rut-tien-hoan-ve-ngan-hang", "Cách rút tiền hoàn về tài khoản ngân hàng", "Các bước kiểm tra số dư, nhập tài khoản nhận và theo dõi yêu cầu rút tiền hoàn.", "cách rút tiền hoàn", "Bạn chỉ nên tạo yêu cầu khi số dư đã chuyển sang khả dụng. Kiểm tra kỹ thông tin ngân hàng vì sai một ký tự có thể làm giao dịch thất bại.", [
    { heading: "Chuẩn bị trước khi rút", body: "Kiểm tra mức rút tối thiểu, tên ngân hàng, số tài khoản và tên chủ tài khoản theo giao diện Em Ry." },
    { heading: "Tạo yêu cầu", body: "Mở Ví, chọn Rút tiền, nhập số tiền và xác nhận thông tin nhận. Chụp lại mã yêu cầu để tiện đối chiếu." },
    { heading: "Theo dõi xử lý", body: "Không tạo yêu cầu trùng khi trạng thái đang xử lý. Nếu bị từ chối, đọc lý do và cập nhật thông tin theo hướng dẫn." },
    { heading: "Phòng tránh lừa đảo", body: "Không ai cần OTP, mật khẩu ngân hàng hoặc mã PIN để chuyển tiền hoàn cho bạn." }
  ], ["rut-tien-hoan-tien", "trang-thai-tien-hoan-la-gi", "mua-hang-hoan-tien-co-an-toan-khong"]),
  article("tien-hoan-khac-du-kien", "Vì sao số tiền hoàn thực tế khác số tiền dự kiến?", "Các nguyên nhân làm tiền hoàn thay đổi sau đối soát: sản phẩm, voucher, thuế, hủy một phần và chính sách hoa hồng.", "tiền hoàn khác dự kiến", "Mức trước khi mua là ước tính từ dữ liệu hiện có. Số cuối cùng chỉ được xác định khi đối tác duyệt giá trị giao dịch và hoa hồng.", [
    { heading: "Giá trị hợp lệ khác số thanh toán", body: "Phí vận chuyển, voucher, thuế và các khoản không tính hoa hồng có thể bị loại khỏi cơ sở tính." },
    { heading: "Tỷ lệ theo từng sản phẩm", body: "Các sản phẩm trong cùng đơn có thể có tỷ lệ khác nhau hoặc không phát sinh hoa hồng." },
    { heading: "Đổi trả một phần", body: "Giá trị sản phẩm bị trả hoặc hoàn tiền sẽ được điều chỉnh. Dữ liệu cập nhật có thể đến sau trạng thái giao hàng." },
    { heading: "Kết quả đối soát là căn cứ", body: "Em Ry chia sẻ hoa hồng thực nhận theo chính sách, không tự quyết định tỷ lệ do sàn xác nhận." }
  ], ["cach-hoat-dong", "mua-nhieu-san-pham-co-duoc-hoan-tien", "trang-thai-tien-hoan-la-gi"]),
  article("don-hang-bi-tu-choi-hoan-tien", "Những trường hợp đơn hàng bị từ chối tiền hoàn", "Danh sách nguyên nhân phổ biến khiến đơn không đủ điều kiện nhận cashback và cách giảm rủi ro.", "đơn hàng bị từ chối hoàn tiền", "Đơn bị từ chối khi đối tác không xác nhận hoa hồng hợp lệ. Nguyên nhân có thể đến từ trạng thái đơn, sản phẩm hoặc cách bắt đầu phiên mua.", [
    { heading: "Đơn không hoàn tất", body: "Hủy, không nhận hàng, trả hàng hoặc được hoàn tiền là các nguyên nhân phổ biến." },
    { heading: "Nguồn giới thiệu không phải Em Ry", body: "Mở link quảng cáo, KOL hoặc nền tảng khác sau link Em Ry có thể ghi đè nguồn." },
    { heading: "Sản phẩm không có hoa hồng", body: "Không phải mọi danh mục và sản phẩm đều tham gia. Mức dự kiến có thể bằng không hoặc thay đổi." },
    { heading: "Dấu hiệu bất thường", body: "Tài khoản trùng lặp, giao dịch tự tạo hoặc hành vi vi phạm chính sách có thể bị loại khỏi chương trình." }
  ], ["nhung-loi-can-tranh-khi-mua-hang-hoan-tien", "kiem-tra-don-hoan-tien", "cashback-hoat-dong-nhu-the-nao"]),
  article("mua-hang-hoan-tien-co-tang-gia-khong", "Mua hàng hoàn tiền có làm tăng giá sản phẩm không?", "Giải thích giá thanh toán trên sàn và nguồn hình thành tiền hoàn khi mua qua Em Ry.", "mua hàng hoàn tiền có tăng giá không", "Việc mở sản phẩm qua link Em Ry không tự cộng thêm phí vào giá niêm yết. Bạn vẫn kiểm tra và thanh toán giá hiển thị trực tiếp trên Shopee hoặc TikTok Shop.", [
    { heading: "Giá do sàn hiển thị", body: "Sản phẩm, biến thể, voucher và phí vận chuyển được xác nhận trên màn hình thanh toán của sàn." },
    { heading: "Tiền hoàn đến từ đâu?", body: "Khoản hoàn đến từ phần hoa hồng giới thiệu được duyệt, không phải khoản phụ thu người mua trả cho Em Ry." },
    { heading: "Cách tự kiểm tra", body: "Luôn xem tổng tiền trên sàn trước khi xác nhận. Nếu sản phẩm hoặc giá không đúng, dừng lại và mở lại đúng link." },
    { heading: "Không có cam kết hoàn cố định", body: "Mức tiền hoàn phụ thuộc hoa hồng thực tế và có thể thay đổi sau đối soát." }
  ], ["cach-hoat-dong", "cashback-hoat-dong-nhu-the-nao", "tien-hoan-khac-du-kien"]),
  article("cashback-hoat-dong-nhu-the-nao", "Cashback hoạt động như thế nào? Giải thích dễ hiểu", "Giải thích cashback, link giới thiệu, hoa hồng, đối soát và cách tiền được chia lại cho người mua.", "cashback hoạt động như thế nào", "Cashback là cơ chế chia sẻ lại một phần lợi ích từ giao dịch đủ điều kiện. Người mua không nhận tiền ngay lúc thanh toán mà phải chờ xác nhận.", [
    { heading: "Vai trò của liên kết", body: "Liên kết giúp đối tác xác định giao dịch bắt nguồn từ Em Ry. Vì vậy phiên mua cần bắt đầu từ đúng link." },
    { heading: "Vai trò của sàn", body: "Sàn bán sản phẩm, nhận thanh toán, giao hàng và quyết định giao dịch có đủ điều kiện hoa hồng hay không." },
    { heading: "Vai trò của Em Ry", body: "Em Ry tạo link, nhận dữ liệu đối soát, hiển thị trạng thái và chia phần hoa hồng theo chính sách." },
    { heading: "Vai trò của người mua", body: "Người mua hoàn tất giao dịch hợp lệ, không hủy hoặc trả hàng và cung cấp thông tin rút tiền chính xác." }
  ], ["cach-hoat-dong", "mua-hang-hoan-tien-co-an-toan-khong", "mua-hang-hoan-tien-co-tang-gia-khong"]),
  article("mua-hang-hoan-tien-co-an-toan-khong", "Mua hàng hoàn tiền có an toàn không?", "Các dấu hiệu nhận biết dịch vụ hoàn tiền an toàn và cách bảo vệ tài khoản Shopee, TikTok, ngân hàng.", "mua hàng hoàn tiền có an toàn không", "Mua hàng hoàn tiền an toàn hơn khi bạn thanh toán trên sàn chính thức, không chia sẻ mật khẩu và kiểm tra rõ chính sách đơn hàng.", [
    { heading: "Không cung cấp thông tin đăng nhập", body: "Dịch vụ hợp lệ không cần mật khẩu Shopee, TikTok, mật khẩu ngân hàng, OTP hoặc mã PIN." },
    { heading: "Thanh toán đúng nơi", body: "Chỉ nhập thông tin thanh toán trong ứng dụng hoặc website chính thức của sàn và ngân hàng." },
    { heading: "Đọc điều khoản", body: "Kiểm tra cách tính tiền, thời gian đối soát, mức rút và quy trình hỗ trợ trước khi sử dụng." },
    { heading: "Cảnh giác cam kết bất thường", body: "Không tin lời hứa hoàn tiền chắc chắn, lợi nhuận cố định hoặc yêu cầu chuyển phí để mở khóa tiền hoàn." }
  ], ["rut-tien-hoan-tien", "co-can-mat-khau-shopee-tiktok-khong", "cashback-hoat-dong-nhu-the-nao"]),
  article("co-can-mat-khau-shopee-tiktok-khong", "Hoàn tiền có cần mật khẩu Shopee hoặc TikTok không?", "Em Ry không yêu cầu mật khẩu, OTP hay mã PIN; tìm hiểu dữ liệu nào thực sự cần để tạo link và hỗ trợ đơn.", "hoàn tiền có cần mật khẩu Shopee không", "Bạn không cần cung cấp mật khẩu Shopee hoặc TikTok để tạo link hoàn tiền. Em Ry xử lý đường dẫn sản phẩm, còn đăng nhập và thanh toán diễn ra trên sàn.", [
    { heading: "Dữ liệu cần để tạo link", body: "Thông thường chỉ cần link sản phẩm hợp lệ và tài khoản Em Ry để gắn lịch sử đơn với người dùng." },
    { heading: "Dữ liệu không được chia sẻ", body: "Không gửi mật khẩu, OTP, mã PIN, mã khôi phục hoặc ảnh đầy đủ thẻ ngân hàng." },
    { heading: "Khi cần tra soát", body: "Hỗ trợ có thể cần mã đơn, ngày mua và ảnh trạng thái. Hãy che địa chỉ và thông tin thanh toán không liên quan." },
    { heading: "Nếu ai đó hỏi OTP", body: "Dừng trao đổi, không bấm link lạ và liên hệ kênh hỗ trợ chính thức được công bố trên website." }
  ], ["mua-hang-hoan-tien-co-an-toan-khong", "cashback-hoat-dong-nhu-the-nao", "tao-link-hoan-tien"]),
  article("nhung-loi-can-tranh-khi-mua-hang-hoan-tien", "Những lỗi cần tránh để đơn hàng được ghi nhận", "Checklist trước và sau khi mua giúp giảm nguy cơ mất ghi nhận tiền hoàn Shopee hoặc TikTok Shop.", "lưu ý khi mua hàng hoàn tiền", "Phần lớn lỗi ghi nhận xảy ra khi dùng sai link hoặc thay đổi nguồn giới thiệu trong phiên mua. Checklist dưới đây giúp bạn thao tác nhất quán.", [
    { heading: "Trước khi tạo link", body: "Mở đúng trang chi tiết sản phẩm, kiểm tra nền tảng được hỗ trợ và không dùng link video." },
    { heading: "Trong khi mua", body: "Bắt đầu bằng link Em Ry, dùng cùng thiết bị và không mở link quảng bá khác trước khi thanh toán." },
    { heading: "Sau khi đặt hàng", body: "Không hủy rồi đặt lại trực tiếp. Nếu cần mua lại, hãy tạo một phiên mới từ Em Ry." },
    { heading: "Khi theo dõi đơn", body: "Chờ đủ thời gian đồng bộ, giữ mã đơn và ảnh trạng thái. Không gửi OTP hoặc mật khẩu khi yêu cầu hỗ trợ." }
  ], ["hoan-tien-shopee", "hoan-tien-tiktok-shop", "don-hang-bi-tu-choi-hoan-tien"]),
  article(
    "cach-kiem-tra-tien-hoan-truoc-khi-mua",
    "Cách kiểm tra tiền hoàn trước khi mua Shopee, TikTok Shop",
    "Hướng dẫn kiểm tra tiền hoàn dự kiến từ link sản phẩm trước khi đặt hàng trên Shopee hoặc TikTok Shop, kèm lưu ý để đơn được ghi nhận.",
    "kiểm tra tiền hoàn trước khi mua",
    "Kiểm tra tiền hoàn trước khi mua giúp bạn biết sản phẩm có thể phát sinh quyền lợi hay không và bắt đầu phiên mua từ đúng liên kết. Mức hiển thị ban đầu chỉ là dự kiến; số tiền cuối cùng phụ thuộc đơn hàng hợp lệ và kết quả đối soát.",
    [
      { heading: "Kiểm tra tiền hoàn là gì?", body: "Đây là bước gửi đường dẫn sản phẩm vào Qbot để hệ thống tạo một liên kết mua hàng có thể theo dõi. Khi dữ liệu đối tác có sẵn, Qbot hiển thị giá sản phẩm và tiền hoàn dự kiến. Việc kiểm tra không làm thay đổi giá niêm yết trên sàn và không đồng nghĩa đơn chắc chắn được duyệt." },
      { heading: "Chuẩn bị đúng link sản phẩm", body: "Đường dẫn nên mở trực tiếp trang chi tiết của đúng sản phẩm bạn định mua. Link trang chủ, trang tìm kiếm, video hoặc livestream có thể không đủ thông tin để xử lý.", bullets: ["Mở sản phẩm trong ứng dụng Shopee hoặc TikTok Shop.", "Chạm Chia sẻ và chọn Sao chép liên kết.", "Thử mở lại link để chắc chắn nó dẫn tới đúng sản phẩm.", "Không gửi ảnh chụp màn hình thay cho đường dẫn."] },
      { heading: "Các bước kiểm tra trên Qbot", body: "Mở trang chủ Qbot, dán đường dẫn vào ô kiểm tra và đăng ký tài khoản miễn phí nếu bạn chưa có tài khoản. Tài khoản được dùng để gắn link, lịch sử đơn và số dư với đúng người nhận. Sau khi xử lý thành công, hãy dùng nút quay lại sàn trong kết quả." },
      { heading: "Cách đọc kết quả dự kiến", body: "Giá sản phẩm là dữ liệu tham khảo tại thời điểm xử lý. Tiền hoàn dự kiến được tính từ thông tin hoa hồng đối tác cung cấp và chính sách chia sẻ đang áp dụng. Voucher, biến thể, giá trị hợp lệ, thuế và thay đổi chính sách có thể khiến số cuối cùng khác với số ban đầu." },
      { heading: "Mua hàng thế nào để giảm rủi ro mất ghi nhận?", body: "Sau khi mở link Qbot tạo, nên hoàn tất việc chọn sản phẩm và thanh toán trong cùng phiên. Hạn chế mở liên kết quảng cáo, KOL hoặc link giới thiệu khác trước khi đặt hàng vì nguồn giới thiệu có thể bị thay đổi.", bullets: ["Kiểm tra đúng shop, sản phẩm và biến thể.", "Không chuyển sang thiết bị khác giữa phiên nếu không cần thiết.", "Không hủy rồi đặt lại trực tiếp từ lịch sử sàn.", "Nếu đổi sản phẩm, quay lại Qbot để tạo link mới."] },
      { heading: "Khi nào tiền hoàn được xác nhận?", body: "Sau khi đặt hàng, dữ liệu có thể chưa xuất hiện ngay. Đơn cần giao thành công, qua thời hạn đổi trả và được đối tác xác nhận đủ điều kiện. Chỉ số dư đã duyệt hoặc khả dụng mới là số tiền có thể rút; trạng thái tạm tính chưa phải cam kết thanh toán." },
      { heading: "Nếu kết quả không có tiền hoàn", body: "Một số sản phẩm, danh mục hoặc thời điểm không phát sinh hoa hồng. Bạn có thể kiểm tra lại link, thử đúng trang chi tiết sản phẩm hoặc chọn sản phẩm khác. Không nên tin công cụ tự ước tính một tỷ lệ cố định cho mọi mặt hàng." },
      { heading: "Checklist 30 giây trước khi thanh toán", body: "Trước khi bấm đặt hàng, hãy xác nhận bạn đã mở sản phẩm từ đúng nút Qbot cung cấp, giá và biến thể trên sàn là chính xác, đồng thời không mở thêm nguồn giới thiệu khác. Lưu mã đơn sau khi mua để thuận tiện kiểm tra hoặc tra soát." }
    ],
    ["tao-link-hoan-tien", "cach-lay-link-shopee", "cach-lay-link-tiktok-shop", "nhung-loi-can-tranh-khi-mua-hang-hoan-tien"],
    [
      { question: "Kiểm tra tiền hoàn có mất phí không?", answer: "Không. Qbot không thu phí đăng ký hoặc phí kiểm tra link sản phẩm." },
      { question: "Số tiền dự kiến có chắc chắn nhận được không?", answer: "Không. Số cuối cùng phụ thuộc trạng thái đơn, giá trị hợp lệ, chính sách hoa hồng và kết quả đối soát của đối tác." },
      { question: "Có cần cung cấp mật khẩu Shopee hoặc TikTok không?", answer: "Không. Bạn chỉ đăng nhập và thanh toán trên ứng dụng hoặc website chính thức của sàn." }
    ]
  ),
  article(
    "tien-hoan-mua-hang-den-tu-dau",
    "Tiền hoàn mua hàng đến từ đâu? Cơ chế cashback dễ hiểu",
    "Giải thích nguồn tiền hoàn, vai trò của link giới thiệu, hoa hồng, thuế và đối soát khi mua hàng online.",
    "tiền hoàn mua hàng đến từ đâu",
    "Tiền hoàn không phải khoản Qbot cộng thêm vào giá sản phẩm và cũng không phải tiền hoàn trả do lỗi đơn hàng. Khoản này hình thành khi một giao dịch hợp lệ tạo ra hoa hồng giới thiệu và một phần hoa hồng được chia lại cho người mua.",
    [
      { heading: "Ba bên trong một giao dịch hoàn tiền", body: "Sàn thương mại điện tử bán hàng và xử lý thanh toán; đối tác liên kết cung cấp cơ chế ghi nhận nguồn giới thiệu; Qbot tạo link, nhận dữ liệu đối soát và hiển thị quyền lợi cho người dùng. Người mua vẫn giao dịch trực tiếp với sàn." },
      { heading: "Vì sao cần một liên kết riêng?", body: "Liên kết chứa thông tin giúp hệ thống xác định giao dịch bắt đầu từ Qbot. Nếu người mua vào sản phẩm từ một nguồn khác sau đó, nguồn ghi nhận có thể bị thay thế. Đây là lý do nút quay lại sàn trong kết quả kiểm tra rất quan trọng." },
      { heading: "Hoa hồng khác tiền hoàn như thế nào?", body: "Hoa hồng là khoản đối tác xác nhận cho nguồn giới thiệu khi giao dịch đủ điều kiện. Tiền hoàn là phần quyền lợi Qbot chia lại cho người dùng theo chính sách. Hai con số có thể khác nhau do thuế, tỷ lệ chia sẻ và điều chỉnh sau đối soát." },
      { heading: "Tại sao không thể cam kết một tỷ lệ cố định?", body: "Mức hoa hồng có thể khác giữa ngành hàng, shop, sản phẩm, thời điểm và chương trình. Giá trị tính hoa hồng cũng có thể không gồm phí vận chuyển, voucher hoặc phần hàng bị hoàn. Vì vậy lấy một tỷ lệ chung nhân với tổng thanh toán thường cho kết quả sai." },
      { heading: "Đối soát quyết định số tiền cuối cùng", body: "Sàn và đối tác cần xác minh đơn đã giao, không bị hủy hoặc trả hàng, không vi phạm chính sách và có nguồn giới thiệu hợp lệ. Dữ liệu ban đầu có thể ở trạng thái tạm tính; chỉ kết quả đã duyệt mới là căn cứ cộng số dư khả dụng." },
      { heading: "Tiền hoàn có làm sản phẩm đắt hơn không?", body: "Qbot không thay đổi giá sản phẩm trên sàn. Bạn vẫn xem giá, voucher, phí vận chuyển và tổng thanh toán trong ứng dụng chính thức. Nếu tổng tiền không phù hợp, bạn có thể dừng giao dịch như một đơn mua hàng thông thường." },
      { heading: "Những dấu hiệu cần cảnh giác", body: "Không chuyển phí để mở khóa tiền hoàn, không cung cấp OTP hoặc mật khẩu, và không tin lời hứa lợi nhuận chắc chắn. Dịch vụ minh bạch phải giải thích rõ trạng thái dự kiến, thời gian đối soát và điều kiện từ chối.", bullets: ["Thanh toán chỉ trên sàn chính thức.", "Không cung cấp mật khẩu hoặc OTP.", "Không có mức hoàn cố định cho mọi sản phẩm.", "Có điều khoản và kênh hỗ trợ rõ ràng."] }
    ],
    ["cach-hoat-dong", "cashback-hoat-dong-nhu-the-nao", "mua-hang-hoan-tien-co-tang-gia-khong", "tien-hoan-khac-du-kien"],
    [
      { question: "Tiền hoàn có phải Shopee Xu không?", answer: "Không. Shopee Xu và tiền hoàn từ hoa hồng giới thiệu là hai cơ chế khác nhau, có điều kiện và cách sử dụng riêng." },
      { question: "Qbot có thu thêm tiền từ đơn hàng không?", answer: "Không. Bạn thanh toán giá hiển thị trực tiếp trên sàn; Qbot không cộng phụ phí vào sản phẩm." },
      { question: "Vì sao phải chờ lâu mới rút được?", answer: "Đơn cần hoàn tất và được đối tác đối soát. Khoản tạm tính chưa thể rút cho đến khi chuyển thành số dư khả dụng." }
    ]
  ),
  article(
    "checklist-mua-hang-hoan-tien-khong-mat-don",
    "Checklist mua hàng hoàn tiền để hạn chế mất ghi nhận đơn",
    "Danh sách kiểm tra trước, trong và sau khi mua giúp giảm lỗi mất nguồn giới thiệu và chuẩn bị thông tin tra soát.",
    "checklist mua hàng hoàn tiền",
    "Không có thao tác nào đảm bảo tuyệt đối một đơn sẽ được duyệt, nhưng một quy trình nhất quán giúp giảm các lỗi phổ biến như dùng sai link, đổi nguồn giới thiệu hoặc đặt lại đơn không qua Qbot.",
    [
      { heading: "Trước khi sao chép link", body: "Xác định đúng sản phẩm, shop và nền tảng. Nếu sản phẩm nằm trong video hoặc livestream, hãy mở trang chi tiết sản phẩm trước khi chọn Chia sẻ. Link cần mở lại đúng mặt hàng, không phải trang chủ hoặc trang tìm kiếm." },
      { heading: "Trước khi mở link mua", body: "Đóng bớt các trang quảng cáo hoặc link giới thiệu không cần thiết. Dán link vào Qbot, chờ hệ thống trả kết quả và chỉ dùng nút quay lại sàn trong thẻ kết quả.", bullets: ["Dùng đúng tài khoản Qbot của bạn.", "Kiểm tra nền tảng và tên sản phẩm.", "Đọc mức tiền hoàn dưới dạng dự kiến.", "Không chia sẻ link kết quả nếu link gắn với tài khoản cá nhân."] },
      { heading: "Trong phiên mua hàng", body: "Giữ cùng thiết bị và hạn chế chuyển qua lại nhiều nguồn. Bạn có thể chọn biến thể, voucher và địa chỉ trên sàn, nhưng nếu chuyển sang một sản phẩm hoàn toàn khác thì nên quay lại Qbot tạo link mới." },
      { heading: "Ngay trước khi thanh toán", body: "Kiểm tra tổng tiền, shop, biến thể và số lượng trong ứng dụng chính thức. Qbot không thu tiền mua hàng. Nếu trang yêu cầu OTP, mật khẩu hoặc chuyển khoản ngoài sàn dưới danh nghĩa hoàn tiền, hãy dừng lại." },
      { heading: "Sau khi đặt hàng", body: "Lưu mã đơn và thời điểm đặt. Không lo lắng nếu đơn chưa xuất hiện ngay vì dữ liệu thường được đồng bộ theo kỳ. Tránh hủy và đặt lại trực tiếp; nếu cần mua lại, hãy bắt đầu một phiên mới từ Qbot." },
      { heading: "Khi đơn bị hủy hoặc trả hàng", body: "Đơn không hoàn tất thường không phát sinh hoa hồng. Nếu chỉ hoàn một phần, giá trị hợp lệ và tiền hoàn có thể được điều chỉnh. Hãy chờ trạng thái cuối cùng thay vì dựa vào con số tạm tính ban đầu." },
      { heading: "Chuẩn bị tra soát đúng cách", body: "Khi đã qua thời gian đồng bộ dự kiến mà chưa thấy đơn, hãy chuẩn bị mã đơn, ngày giờ mua, nền tảng và ảnh trạng thái đơn. Che địa chỉ, số điện thoại và thông tin thanh toán không liên quan; tuyệt đối không gửi OTP hoặc mật khẩu." },
      { heading: "Bản kiểm tra nhanh có thể lưu lại", body: "Đúng link sản phẩm; mở sàn từ nút Qbot; không mở nguồn quảng cáo khác; mua trong cùng phiên; lưu mã đơn; chờ đủ kỳ đồng bộ. Sáu điểm này bao quát phần lớn lỗi thao tác mà người mua có thể chủ động phòng tránh." }
    ],
    ["nhung-loi-can-tranh-khi-mua-hang-hoan-tien", "shopee-khong-ghi-nhan-hoan-tien", "tiktok-shop-khong-ghi-nhan-don", "kiem-tra-don-hoan-tien"],
    [
      { question: "Mở thêm link quảng cáo có ảnh hưởng không?", answer: "Có thể. Nguồn giới thiệu cuối cùng có thể thay đổi, vì vậy nên hoàn tất phiên mua từ đúng link Qbot cung cấp." },
      { question: "Có cần mua ngay sau khi tạo link không?", answer: "Nên hoàn tất trong cùng phiên và tránh mở nguồn khác. Thời hạn ghi nhận cụ thể phụ thuộc cơ chế của đối tác." },
      { question: "Đơn chưa hiện ngay có phải mất đơn không?", answer: "Chưa chắc. Dữ liệu có thể đồng bộ chậm; hãy chờ đủ thời gian được Qbot thông báo trước khi tra soát." }
    ]
  )
];

export const landingPageMap = new Map(landingPages.map((item) => [item.slug, item]));
export const articleMap = new Map(articles.map((item) => [item.slug, item]));

export function getSeoImage(content: SeoContent): SeoImage {
  const slug = content.slug;
  if (slug === "cach-kiem-tra-tien-hoan-truoc-khi-mua" || slug === "tien-hoan-mua-hang-den-tu-dau") {
    return {
      src: "/images/seo/quy-trinh-hoan-tien-qbot.png",
      alt: "Quy trình sao chép link sản phẩm, theo dõi đơn và nhận tiền hoàn qua Qbot",
      caption: "Qbot tạo liên kết mua hàng có thể theo dõi; tiền hoàn cuối cùng phụ thuộc kết quả đối soát."
    };
  }
  if (slug === "checklist-mua-hang-hoan-tien-khong-mat-don") {
    return {
      src: "/images/seo/mua-hang-hoan-tien-an-toan.png",
      alt: "Người mua kiểm tra liên kết và trạng thái đơn hàng hoàn tiền an toàn",
      caption: "Kiểm tra đúng link, mua trên sàn chính thức và lưu mã đơn để thuận tiện theo dõi."
    };
  }
  if (slug.includes("shopee")) {
    return {
      src: "/images/seo/hoan-tien-shopee.webp",
      alt: "Người mua gửi link sản phẩm Shopee cho trợ lý Em Ry và theo dõi tiền hoàn",
      caption: "Minh họa quy trình lấy link sản phẩm, gửi Em Ry và mua hàng trên Shopee."
    };
  }
  if (slug.includes("tiktok")) {
    return {
      src: "/images/seo/hoan-tien-tiktok-shop.webp",
      alt: "Phân biệt link video và link sản phẩm TikTok Shop trước khi gửi Em Ry",
      caption: "Hãy mở trang chi tiết sản phẩm từ video hoặc livestream trước khi sao chép link."
    };
  }
  if (slug.includes("rut-tien")) {
    return {
      src: "/images/seo/rut-tien-hoan.webp",
      alt: "Người dùng chuyển số dư tiền hoàn đã duyệt về tài khoản ngân hàng",
      caption: "Chỉ số dư khả dụng sau đối soát mới có thể tạo yêu cầu rút tiền."
    };
  }
  if (slug.includes("an-toan") || slug.includes("mat-khau")) {
    return {
      src: "/images/seo/bao-mat-tai-khoan.webp",
      alt: "Mật khẩu và thông tin đăng nhập được bảo vệ khi người dùng gửi link sản phẩm",
      caption: "Em Ry cần link sản phẩm, không cần mật khẩu, OTP hoặc mã PIN của người dùng."
    };
  }
  if (
    slug.includes("don-hang") ||
    slug.includes("tien-hoan") ||
    slug.includes("doi-soat") ||
    slug.includes("trang-thai") ||
    slug.includes("kiem-tra")
  ) {
    return {
      src: "/images/seo/doi-soat-tien-hoan.webp",
      alt: "Các giai đoạn ghi nhận đơn, chờ đối soát và duyệt số dư tiền hoàn",
      caption: "Đơn hàng đi qua nhiều trạng thái trước khi tiền hoàn trở thành số dư khả dụng."
    };
  }
  return {
    src: "/images/seo/tao-link-hoan-tien.webp",
    alt: "Năm bước chuyển link sản phẩm thành link mua hàng có thể theo dõi",
    caption: "Quy trình từ link sản phẩm đến đơn hàng được ghi nhận trong Em Ry."
  };
}
