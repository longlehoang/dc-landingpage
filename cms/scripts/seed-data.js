'use strict';

// Initial content, copied from https://www.dragoncapital.com.vn/vi/
const BASE = 'https://www.dragoncapital.com.vn';

const files = {
  // Strapi blocks SVG uploads by default (XSS risk), so the logo is the site's 2x PNG.
  logo: { file: 'logo.png', mime: 'image/png', alt: 'Dragon Capital' },
  favicon: { file: 'logo.png', mime: 'image/png', alt: 'Dragon Capital' },
  heroAnimation: { file: 'hero-lottie.json', mime: 'application/json', alt: 'Hero animation' },
  aboutImage: { file: 'about.jpg', mime: 'image/jpeg', alt: 'Tiên phong trong lĩnh vực quản lý quỹ' },
  contactImage: { file: 'team.jpg', mime: 'image/jpeg', alt: 'Đội ngũ Dragon Capital' },
};

const global = {
  siteName: 'Dragon Capital',
  contactButtonLabel: 'Liên hệ',
  journeyTitle: 'Bắt đầu hành trình của bạn:',
  journeyPrimaryLinks: [
    { label: 'Khách hàng cá nhân', url: `${BASE}/individual/vi/` },
    { label: 'Khách hàng tổ chức', url: `${BASE}/institution/vi/` },
  ],
  journeyOtherTitle: 'Các thông tin khác',
  journeySecondaryLinks: [
    { label: 'Về Chúng Tôi', url: `${BASE}/individual/vi/about` },
    { label: 'Công bố thông tin', url: `${BASE}/regulatory/vi/` },
  ],
  footerColumns: [
    {
      title: 'Khách hàng',
      links: [
        { label: 'Tổ chức', url: `${BASE}/institution` },
        { label: 'Cá nhân', url: `${BASE}/individual` },
      ],
    },
    {
      title: 'Hỗ trợ',
      links: [{ label: 'Liên hệ', url: `${BASE}/contact` }],
    },
  ],
  legalLinks: [
    { label: 'Điều khoản sử dụng', url: `${BASE}/terms` },
    { label: 'Chính sách bảo mật', url: `${BASE}/policy` },
  ],
  copyright: '©️ 2024 Dragon Capital',
};

const homepage = {
  seo: {
    metaTitle: 'Công ty Quản lý quỹ đầu tư hàng đầu tại Việt Nam | Dragon Capital',
    metaDescription:
      'Dragon Capital – Công ty quản lý quỹ đầu tư hàng đầu tại Việt Nam, kết nối Việt Nam với thị trường đầu tư toàn cầu.',
  },
  heroHeadline: [
    { text: 'Kết nối Việt Nam ', tone: 'light' },
    { text: 'với thị trường', tone: 'gold' },
    { text: ' đầu tư toàn cầu', tone: 'ivory' },
  ],
  aboutEyebrow: 'Về Chúng Tôi',
  aboutTitle: 'Tiên phong trong lĩnh vực quản lý quỹ',
  missionTitle: 'Sứ mệnh của chúng tôi',
  missionText:
    'Chúng tôi đầu tư vào tương lai của Việt Nam, với sự am hiểu về thị trường nội địa kết hợp với những thông lệ quốc tế tốt nhất.',
  whyEyebrow: 'Vì sao chọn Dragon Capital?',
  features: [
    { icon: 'award', text: 'Dẫn đầu thị trường về hiệu quả đầu tư' },
    { icon: 'assets', text: 'Quản lý tổng tài sản lớn nhất Việt Nam' },
    { icon: 'flag', text: 'Hơn 30 năm kinh nghiệm vững chắc' },
  ],
  contactEyebrow: 'Đăng ký tư vấn',
  contactTitle: 'Liên Hệ Ngay',
  contactNameLabel: 'Tên',
  contactEmailLabel: 'Email',
  contactMessageLabel: 'Lời nhắn',
  contactOptInLabel: 'Tôi muốn nhận các thông tin liên quan đến sản phẩm và thị trường từ Dragon Capital.',
  contactSubmitLabel: 'Đăng ký',
  contactConsent:
    'Bằng việc đăng ký, tôi xác nhận rằng những thông tin trên là dữ liệu cá nhân của tôi và Dragon Capital có thể sử dụng và xử lý dữ liệu đó cho các mục đích liên quan phù hợp với',
  contactPolicyLink: { label: 'chính sách bảo mật', url: `${BASE}/policy` },
  contactSuccessMessage: 'Cảm ơn bạn! Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.',
};

module.exports = { files, global, homepage };
