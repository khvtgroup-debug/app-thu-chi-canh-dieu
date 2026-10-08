import { CategoryItem } from '../types/finance';

export const HOME_DEFAULT_INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'luong_chong', name: 'Lương chồng', type: 'thu', group: 'Thu nhập cố định', description: 'Tiền lương chính hàng tháng của chồng' },
  { id: 'luong_vo', name: 'Lương vợ', type: 'thu', group: 'Thu nhập cố định', description: 'Tiền lương chính hàng tháng của vợ' },
  { id: 'thuong_lamthem', name: 'Thưởng & Làm thêm ngoài giờ', type: 'thu', group: 'Thu nhập linh hoạt', description: 'Tiền thưởng hiệu quả, KPI, freelance, làm thêm' },
  { id: 'kinh_doanh_online', name: 'Kinh doanh phụ & Bán hàng', type: 'thu', group: 'Thu nhập linh hoạt', description: 'Thu nhập bán hàng online hoặc dịch vụ cá nhân' },
  { id: 'tien_lai_dautu', name: 'Lãi tiết kiệm & Đầu tư / Cho thuê', type: 'thu', group: 'Đầu tư & Tích lũy', description: 'Lãi gửi ngân hàng, cổ tức, cho thuê bất động sản' },
  { id: 'khac_thu_home', name: 'Thu nhập khác & Biếu tặng', type: 'thu', group: 'Khác', description: 'Được bố mẹ/người thân biếu tặng, hoàn thuế...' },
];

export const HOME_DEFAULT_EXPENSE_CATEGORIES: CategoryItem[] = [
  // 1. Bếp ăn & Thực phẩm hàng ngày
  { id: 'di_cho_sieu_thi', name: 'Đi chợ & Siêu thị thực phẩm', type: 'chi', group: 'Bếp ăn & Thực phẩm', description: 'Thực phẩm tươi sống, rau củ quả, thịt cá hàng ngày' },
  { id: 'an_ngoai_cafe', name: 'Ăn ngoài & Cafe gia đình', type: 'chi', group: 'Bếp ăn & Thực phẩm', description: 'Ăn tối cuối tuần, họp mặt bạn bè, cafe ăn sáng' },
  { id: 'gia_vi_do_kho', name: 'Gia vị, gạo & Đồ khô', type: 'chi', group: 'Bếp ăn & Thực phẩm', description: 'Gạo thơm, gia vị, dầu ăn, nước mắm, đồ hộp' },

  // 2. Nhà cửa & Hóa đơn tiện ích
  { id: 'tien_nha', name: 'Tiền thuê nhà / Trả góp nhà', type: 'chi', group: 'Nhà cửa & Tiện ích', description: 'Tiền thuê căn hộ hoặc tiền gốc lãi trả góp ngân hàng' },
  { id: 'dien_home', name: 'Tiền điện sinh hoạt', type: 'chi', group: 'Nhà cửa & Tiện ích', description: 'Hóa đơn tiền điện EVN hàng tháng' },
  { id: 'nuoc_home', name: 'Tiền nước sinh hoạt', type: 'chi', group: 'Nhà cửa & Tiện ích', description: 'Hóa đơn tiền nước sạch' },
  { id: 'internet_home', name: 'Internet, TV & Điện thoại', type: 'chi', group: 'Nhà cửa & Tiện ích', description: 'Cước mạng cáp quang, gói 4G di động của 2 vợ chồng' },
  { id: 'gas_nuoc_uong', name: 'Gas & Nước khoáng đóng bình', type: 'chi', group: 'Nhà cửa & Tiện ích', description: 'Đổi bình gas bếp, nước uống bình Lavie/Ion' },
  { id: 'phi_chung_cu_rac', name: 'Phí dịch vụ chung cư & Tiền rác', type: 'chi', group: 'Nhà cửa & Tiện ích', description: 'Phí quản lý tòa nhà, phí vệ sinh thu gom rác' },

  // 3. Con cái & Giáo dục
  { id: 'hoc_phi_con', name: 'Học phí & Tiền trường cho con', type: 'chi', group: 'Con cái & Giáo dục', description: 'Học phí mầm non/tiểu học, tiền ăn bán trú' },
  { id: 'sua_ta_bim', name: 'Sữa, bỉm & Đồ dùng của bé', type: 'chi', group: 'Con cái & Giáo dục', description: 'Sữa chua, sữa hạt/sữa bột, tã dán, khăn ướt' },
  { id: 'hoc_them_nang_khieu', name: 'Học thêm & Năng khiếu của con', type: 'chi', group: 'Con cái & Giáo dục', description: 'Tiếng Anh, bơi lội, hội họa, sách vở học tập' },

  // 4. Đi lại & Phương tiện
  { id: 'xang_xe', name: 'Xăng xe máy & Ô tô', type: 'chi', group: 'Đi lại & Phương tiện', description: 'Đổ xăng hàng tuần cho các phương tiện' },
  { id: 'gui_xe_phi_cau', name: 'Gửi xe & Phí cầu đường', type: 'chi', group: 'Đi lại & Phương tiện', description: 'Gửi xe chung cư, cơ quan, phí ETC qua trạm' },
  { id: 'bao_duong_xe', name: 'Bảo dưỡng, rửa xe & Sửa chữa', type: 'chi', group: 'Đi lại & Phương tiện', description: 'Thay nhớt, bảo dưỡng định kỳ, sửa xe, rửa xe' },
  { id: 'taxi_grab', name: 'Taxi, Grab & Xe công nghệ', type: 'chi', group: 'Đi lại & Phương tiện', description: 'Đi lại những ngày mưa hoặc di chuyển đường dài' },

  // 5. Sức khỏe & Y tế
  { id: 'thuoc_men_kham', name: 'Thuốc men & Khám bệnh', type: 'chi', group: 'Sức khỏe & Y tế', description: 'Khám nhi khoa, thuốc cảm sốt, vitamin thực phẩm bổ sung' },
  { id: 'bao_hiem_suc_khoe', name: 'Bảo hiểm nhân thọ & Y tế', type: 'chi', group: 'Sức khỏe & Y tế', description: 'Phí bảo hiểm sức khỏe gia đình định kỳ' },

  // 6. Mua sắm & Đời sống gia đình
  { id: 'quan_ao_thoi_trang', name: 'Quần áo & Giày dép', type: 'chi', group: 'Mua sắm & Đời sống', description: 'Mua sắm trang phục cho bố mẹ và các con' },
  { id: 'do_gia_dung', name: 'Đồ gia dụng & Thiết bị gia đình', type: 'chi', group: 'Mua sắm & Đời sống', description: 'Nồi chiên, máy giặt, quạt, đồ dùng nhà bếp' },
  { id: 'my_pham_lam_dep', name: 'Mỹ phẩm & Chăm sóc cá nhân', type: 'chi', group: 'Mua sắm & Đời sống', description: 'Sữa tắm, dầu gội, mỹ phẩm, cắt tóc gội đầu' },
  { id: 'du_lich_giai_tri', name: 'Du lịch, vui chơi & Giải trí', type: 'chi', group: 'Mua sắm & Đời sống', description: 'Vé xem phim, đưa con đi khu vui chơi, du lịch' },

  // 7. Đối ngoại, Hiếu hỉ & Tích lũy
  { id: 'hieu_hi_dam_tiec', name: 'Đám cưới, thôi nôi & Sinh nhật', type: 'chi', group: 'Đối ngoại & Tích lũy', description: 'Tiền mừng cưới, thăm hỏi người thân bạn bè' },
  { id: 'bieu_bo_me', name: 'Biếu bố mẹ hai bên', type: 'chi', group: 'Đối ngoại & Tích lũy', description: 'Tiền biếu ông bà nội ngoại hàng tháng' },
  { id: 'tiet_kiem_tich_luy', name: 'Gửi tiết kiệm & Quỹ dự phòng', type: 'chi', group: 'Đối ngoại & Tích lũy', description: 'Trích gửi tiết kiệm ngân hàng, quỹ khẩn cấp' },
  { id: 'khac_chi_home', name: 'Chi tiêu phát sinh khác', type: 'chi', group: 'Đối ngoại & Tích lũy', description: 'Các khoản lặt vặt khác trong gia đình' },
];

export const HOME_ALL_CATEGORIES: CategoryItem[] = [
  ...HOME_DEFAULT_INCOME_CATEGORIES,
  ...HOME_DEFAULT_EXPENSE_CATEGORIES,
];
