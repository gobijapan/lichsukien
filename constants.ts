
export const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export const TRUC = ['Kiến', 'Trừ', 'Mãn', 'Bình', 'Định', 'Chấp', 'Phá', 'Nguy', 'Thành', 'Thu', 'Khai', 'Bế'];

export const TIET_KHI = [
  'Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng',
  'Hạ chí', 'Tiểu thử', 'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ',
  'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết', 'Đại tuyết',
  'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập'
];

export const BACKGROUNDS = [
  { 
    id: 'bg-1', 
    name: 'Sen Hồng Tinh Khiết', 
    url: 'https://images.unsplash.com/photo-1616489762694-8173595605d3?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-2', 
    name: 'Sắc Đào Ngày Tết', 
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-3', 
    name: 'Rừng Trúc Xanh', 
    url: 'https://images.unsplash.com/photo-1597910037310-7aa8d4381335?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-4', 
    name: 'Non Nước Ninh Bình', 
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-5', 
    name: 'Đèn Lồng Hội An', 
    url: 'https://images.unsplash.com/photo-1535571257404-586616016c21?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-6', 
    name: 'Giấy Dó Cổ Điển', 
    url: 'https://images.unsplash.com/photo-1586075010923-2dd45eeed8bd?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-7', 
    name: 'Ruộng Bậc Thang', 
    url: 'https://images.unsplash.com/photo-1533230626774-706788880d99?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-8', 
    name: 'Mặt Hồ Tĩnh Lặng', 
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-9', 
    name: 'Mây Núi Sapa', 
    url: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=1080&auto=format&fit=crop' 
  },
  { 
    id: 'bg-10', 
    name: 'Trừu Tượng Vàng Son', 
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1080&auto=format&fit=crop' 
  },
];

export const FONTS: Record<string, {name: string, class: string}> = {
  'inter': { name: 'Inter (Hiện đại)', class: 'font-sans' },
  'roboto': { name: 'Roboto', class: 'font-[Roboto]' },
  'merriweather': { name: 'Merriweather (Cổ điển)', class: 'font-[Merriweather]' },
  'playfair': { name: 'Playfair Display (Trang trọng)', class: 'font-[Playfair_Display]' },
  'dancing': { name: 'Dancing Script (Thư pháp)', class: 'font-[Dancing_Script]' },
  'be-vietnam': { name: 'Be Vietnam Pro', class: 'font-[Be_Vietnam_Pro]' },
  'open-sans': { name: 'Open Sans', class: 'font-[Open_Sans]' },
  'lato': { name: 'Lato', class: 'font-[Lato]' },
  'montserrat': { name: 'Montserrat', class: 'font-[Montserrat]' },
  'nunito': { name: 'Nunito', class: 'font-[Nunito]' },
  'oswald': { name: 'Oswald', class: 'font-[Oswald]' },
  'raleway': { name: 'Raleway', class: 'font-[Raleway]' },
  'lora': { name: 'Lora', class: 'font-[Lora]' },
  'josefin': { name: 'Josefin Sans', class: 'font-[Josefin_Sans]' },
  'comfortaa': { name: 'Comfortaa', class: 'font-[Comfortaa]' },
  'pacifico': { name: 'Pacifico', class: 'font-[Pacifico]' },
  'patrick': { name: 'Patrick Hand', class: 'font-[Patrick_Hand]' },
  'amatic': { name: 'Amatic SC', class: 'font-[Amatic_SC]' },
  'vt323': { name: 'VT323 (Pixel)', class: 'font-[VT323]' },
  'sedgwick': { name: 'Sedgwick Ave', class: 'font-[Sedgwick_Ave]' },
};

// Accurate Zodiac Hours Table (Giờ Hoàng Đạo)
const TY_NGO = [0, 1, 3, 6, 8, 9];    // Tý, Sửu, Mão, Ngọ, Thân, Dậu
const SUU_MUI = [2, 3, 5, 7, 9, 11];  // Dần, Mão, Tỵ, Thân, Tuất, Hợi
const DAN_THAN = [0, 1, 4, 5, 7, 8];  // Tý, Sửu, Thìn, Tỵ, Mùi, Tuất
const MAO_DAU = [0, 2, 3, 6, 8, 10];  // Tý, Dần, Mão, Ngọ, Mùi, Dậu
const THIN_TUAT = [2, 4, 5, 8, 9, 11];// Dần, Thìn, Tỵ, Thân, Dậu, Hợi
const TY_HOI = [1, 4, 6, 7, 10, 11];  // Sửu, Thìn, Ngọ, Mùi, Tuất, Hợi

export const GIO_HOANG_DAO_TABLE = [
  TY_NGO,      // Tý (0)
  SUU_MUI,     // Sửu (1)
  DAN_THAN,    // Dần (2)
  MAO_DAU,     // Mão (3)
  THIN_TUAT,   // Thìn (4)
  TY_HOI,      // Tỵ (5)
  TY_NGO,      // Ngọ (6)
  SUU_MUI,     // Mùi (7)
  DAN_THAN,    // Thân (8)
  MAO_DAU,     // Dậu (9)
  THIN_TUAT,   // Tuất (10)
  TY_HOI       // Hợi (11)
];

export const NAP_AM = [
  "Hải Trung Kim", "Hải Trung Kim", "Lư Trung Hỏa", "Lư Trung Hỏa", "Đại Lâm Mộc", "Đại Lâm Mộc",
  "Lộ Bàng Thổ", "Lộ Bàng Thổ", "Kiếm Phong Kim", "Kiếm Phong Kim", "Sơn Đầu Hỏa", "Sơn Đầu Hỏa",
  "Giản Hạ Thủy", "Giản Hạ Thủy", "Thành Đầu Thổ", "Thành Đầu Thổ", "Bạch Lạp Kim", "Bạch Lạp Kim",
  "Dương Liễu Mộc", "Dương Liễu Mộc", "Tuyền Trung Thủy", "Tuyền Trung Thủy", "Ốc Thượng Thổ", "Ốc Thượng Thổ",
  "Tích Lịch Hỏa", "Tích Lịch Hỏa", "Tùng Bách Mộc", "Tùng Bách Mộc", "Trường Lưu Thủy", "Trường Lưu Thủy",
  "Sa Trung Kim", "Sa Trung Kim", "Sơn Hạ Hỏa", "Sơn Hạ Hỏa", "Bình Địa Mộc", "Bình Địa Mộc",
  "Bích Thượng Thổ", "Bích Thượng Thổ", "Kim Bạch Kim", "Kim Bạch Kim", "Phúc Đăng Hỏa", "Phúc Đăng Hỏa",
  "Thiên Hà Thủy", "Thiên Hà Thủy", "Đại Trạch Thổ", "Đại Trạch Thổ", "Thoa Xuyến Kim", "Thoa Xuyến Kim",
  "Tang Đố Mộc", "Tang Đố Mộc", "Đại Khê Thủy", "Đại Khê Thủy", "Sa Trung Thổ", "Sa Trung Thổ",
  "Thiên Thượng Hỏa", "Thiên Thượng Hỏa", "Thạch Lựu Mộc", "Thạch Lựu Mộc", "Đại Hải Thủy", "Đại Hải Thủy"
];

export const HOLIDAYS_SOLAR = [
  { day: 1, month: 1, title: 'Tết Dương Lịch' },
  { day: 14, month: 2, title: 'Lễ Tình Nhân (Valentine)' },
  { day: 27, month: 2, title: 'Ngày Thầy Thuốc Việt Nam' },
  { day: 8, month: 3, title: 'Quốc Tế Phụ Nữ' },
  { day: 30, month: 4, title: 'Giải Phóng Miền Nam' },
  { day: 1, month: 5, title: 'Quốc Tế Lao Động' },
  { day: 1, month: 6, title: 'Quốc Tế Thiếu Nhi' },
  { day: 2, month: 9, title: 'Quốc Khánh Việt Nam' },
  { day: 20, month: 10, title: 'Ngày Phụ Nữ Việt Nam' },
  { day: 20, month: 11, title: 'Ngày Nhà Giáo Việt Nam' },
  { day: 22, month: 12, title: 'Ngày Quân Đội Nhân Dân' },
  { day: 25, month: 12, title: 'Lễ Giáng Sinh' },
];

export const HOLIDAYS_LUNAR = [
  { day: 1, month: 1, title: 'Mùng 1 Tết Nguyên Đán' },
  { day: 2, month: 1, title: 'Mùng 2 Tết Nguyên Đán' },
  { day: 3, month: 1, title: 'Mùng 3 Tết Nguyên Đán' },
  { day: 15, month: 1, title: 'Tết Nguyên Tiêu (Rằm Tháng Giêng)' },
  { day: 3, month: 3, title: 'Tết Hàn Thực' },
  { day: 10, month: 3, title: 'Giỗ Tổ Hùng Vương' },
  { day: 15, month: 4, title: 'Lễ Phật Đản' },
  { day: 5, month: 5, title: 'Tết Đoan Ngọ' },
  { day: 15, month: 7, title: 'Lễ Vu Lan' },
  { day: 15, month: 8, title: 'Tết Trung Thu' },
  { day: 23, month: 12, title: 'Ông Công Ông Táo' },
];
