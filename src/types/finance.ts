export type TransactionType = 'thu' | 'chi';

export type PaymentMethod = 'tien_mat' | 'chuyen_khoan' | 'khac';

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  group?: string;
  description?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  amount: number;
  note?: string;
  payerOrReceiver?: string; // Tên phụ huynh/người nộp hoặc giáo viên/nhà cung cấp
  paymentMethod: PaymentMethod;
  studentId?: string;
  studentName?: string;
  referenceCode?: string;
  createdAt: number;
}

export interface StudentTuition {
  id: string;
  month: string; // YYYY-MM
  studentName: string;
  className: string;
  parentPhone?: string;
  tuitionFee: number; // Học phí
  mealFee: number; // Tiền ăn
  facilityFee: number; // Tiền CSVC
  extraActivitiesFee: number; // Năng khiếu (Anh văn, Aerobic, Võ...)
  otherFee: number; // Khác
  discount: number; // Giảm trừ
  total: number;
  isPaid: boolean;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
}

export type AppMode = 'business' | 'home';

export interface SchoolConfig {
  schoolName: string;
  branchName: string;
  address: string;
  phone: string;
  principalName: string;
  treasurerName: string; // Thủ quỹ
}

export type HomeThemeColor = 'indigo' | 'ocean' | 'warm_sunset' | 'emerald' | 'mocha';

export interface FamilyConfig {
  familyName: string; // Tên sổ / Tên gia đình (e.g. "Tổ Ấm Gia Đình")
  subTitle: string; // Ghi chú / Phương châm (e.g. "Sổ Thu Chi & Kế Hoạch Tài Chính")
  address: string;
  phone: string;
  managerName: string; // Người ghi chép / Quản lý chi tiêu (e.g. "Chồng" hoặc tên cụ thể)
  approverName: string; // Người phối hợp / Vợ / Chồng
  themeColor?: HomeThemeColor; // Tông màu giao diện gia đình
}
