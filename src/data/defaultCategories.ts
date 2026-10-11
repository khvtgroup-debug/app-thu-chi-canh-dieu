import { CategoryItem } from '../types/finance';

export const DEFAULT_INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'hoc_phi', name: 'Học phí', type: 'thu', group: 'Khoản thu chính' },
  { id: 'tien_an', name: 'Tiền ăn', type: 'thu', group: 'Khoản thu chính' },
  { id: 'tien_csvc', name: 'Tiền CSVC', type: 'thu', group: 'Khoản thu định kỳ' },
  { id: 'thu_nang_khieu', name: 'Năng khiếu & Bán trú thêm', type: 'thu', group: 'Khoản thu khác' },
  { id: 'khac_thu', name: 'Khác', type: 'thu', group: 'Khoản thu khác' },
];

export const DEFAULT_EXPENSE_CATEGORIES: CategoryItem[] = [
  // Nhân sự & chế độ
  { id: 'luong_gv', name: 'Lương giáo viên ( GV + BM )', type: 'chi', group: 'Nhân sự & Phúc lợi', monthlyBudget: 40000000 },
  { id: 'bhxh', name: 'BH XH', type: 'chi', group: 'Nhân sự & Phúc lợi', monthlyBudget: 8000000 },
  { id: 'du_lich_he', name: 'Du lịch hè', type: 'chi', group: 'Nhân sự & Phúc lợi', monthlyBudget: 5000000 },
  { id: 'luong_thang_13', name: 'Lương tháng 13', type: 'chi', group: 'Nhân sự & Phúc lợi' },
  { id: 'thuc_pham_gv', name: 'Thực phẩm cho GV', type: 'chi', group: 'Nhân sự & Phúc lợi', monthlyBudget: 3000000 },
  
  // Giáo dục & Học thuật & Chuyên môn
  { id: 'hoan_hoc_phi', name: 'Hoàn học phí', type: 'chi', group: 'Đào tạo & Môn học' },
  { id: 'hoc_phi_can_thiep', name: 'Học Phí can Thiệp', type: 'chi', group: 'Đào tạo & Môn học', monthlyBudget: 4000000 },
  { id: 'tieng_anh', name: 'Tiếng ANH', type: 'chi', group: 'Đào tạo & Môn học', monthlyBudget: 5000000 },
  { id: 'aerobic', name: 'Aerobic', type: 'chi', group: 'Đào tạo & Môn học', monthlyBudget: 3000000 },
  { id: 'vo', name: 'Võ', type: 'chi', group: 'Đào tạo & Môn học', monthlyBudget: 3000000 },
  { id: 'dung_cu_hoc_tap', name: 'Dụng cụ học tập hàng tháng', type: 'chi', group: 'Học liệu & Sự kiện', monthlyBudget: 2500000 },
  { id: 'le_hoi_hang_thang', name: 'Lễ hội hàng tháng', type: 'chi', group: 'Học liệu & Sự kiện', monthlyBudget: 3000000 },
  { id: 'van_phong_pham', name: 'Văn phòng phẩm', type: 'chi', group: 'Học liệu & Sự kiện', monthlyBudget: 1500000 },

  // Thực phẩm & Bếp ăn bán trú
  { id: 'thuc_pham', name: 'Thực phẩm', type: 'chi', group: 'Bếp ăn & Thực phẩm', monthlyBudget: 18000000 },
  { id: 'gao', name: 'Gạo', type: 'chi', group: 'Bếp ăn & Thực phẩm', monthlyBudget: 2500000 },
  { id: 'nuoc_uong', name: 'Nước uống', type: 'chi', group: 'Bếp ăn & Thực phẩm', monthlyBudget: 1000000 },
  { id: 'gas', name: 'Gas', type: 'chi', group: 'Bếp ăn & Thực phẩm', monthlyBudget: 1200000 },

  // Vệ sinh & Tiện ích & Vận hành
  { id: 'hoa_pham', name: 'Hóa phẩm', type: 'chi', group: 'Vệ sinh & Cơ sở vật chất', monthlyBudget: 1500000 },
  { id: 'do_dung_ve_sinh', name: 'Đồ dùng phục vụ vệ sinh', type: 'chi', group: 'Vệ sinh & Cơ sở vật chất', monthlyBudget: 1200000 },
  { id: 'csvc', name: 'CSVC', type: 'chi', group: 'Vệ sinh & Cơ sở vật chất', monthlyBudget: 6000000 },
  { id: 'thue_nha', name: 'Tiền thuê nhà', type: 'chi', group: 'Mặt bằng & Tiện ích', monthlyBudget: 15000000 },
  { id: 'dien', name: 'Tiền điện', type: 'chi', group: 'Mặt bằng & Tiện ích', monthlyBudget: 4000000 },
  { id: 'nuoc_sinh_hoat', name: 'Tiền nước sinh hoạt', type: 'chi', group: 'Mặt bằng & Tiện ích', monthlyBudget: 800000 },
  { id: 'rac', name: 'Tiền rác', type: 'chi', group: 'Mặt bằng & Tiện ích', monthlyBudget: 300000 },
  { id: 'internet', name: 'Tiền Internet', type: 'chi', group: 'Mặt bằng & Tiện ích', monthlyBudget: 500000 },
  { id: 'dien_thoai', name: 'Tiền điện thoại', type: 'chi', group: 'Mặt bằng & Tiện ích', monthlyBudget: 300000 },

  // Nghĩa vụ tài chính & Khác
  { id: 'thue', name: 'Thuế', type: 'chi', group: 'Thuế & Chi phí khác', monthlyBudget: 2000000 },
  { id: 'khac_chi', name: 'Chi phí khác', type: 'chi', group: 'Thuế & Chi phí khác', monthlyBudget: 2000000 },
];

export const ALL_CATEGORIES = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
