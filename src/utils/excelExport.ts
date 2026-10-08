import * as XLSX from 'xlsx';
import { Transaction, SchoolConfig, CategoryItem } from '../types/finance';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../data/defaultCategories';
import { formatMonthVN, formatVND } from './formatters';

/**
 * Xuất Báo Cáo Tháng Toàn Diện Sang Tệp Excel (.xlsx) Đa Trang (Multi-sheet)
 */
export function exportMonthlyReportExcel(
  monthStr: string,
  transactions: Transaction[],
  schoolConfig: SchoolConfig,
  categories?: CategoryItem[]
) {
  const currentMonthTx = transactions.filter((t) => t.month === monthStr);
  const incomeCategories = categories
    ? categories.filter((c) => c.type === 'thu')
    : DEFAULT_INCOME_CATEGORIES;
  const expenseCategories = categories
    ? categories.filter((c) => c.type === 'chi')
    : DEFAULT_EXPENSE_CATEGORIES;

  // Calculate category totals
  const categoryTotals: Record<string, { total: number; count: number }> = {};
  let totalRevenue = 0;
  let totalExpense = 0;

  currentMonthTx.forEach((tx) => {
    if (!categoryTotals[tx.categoryId]) {
      categoryTotals[tx.categoryId] = { total: 0, count: 0 };
    }
    categoryTotals[tx.categoryId].total += tx.amount;
    categoryTotals[tx.categoryId].count += 1;

    if (tx.type === 'thu') {
      totalRevenue += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  });

  const profit = totalRevenue - totalExpense;
  const marginPercent = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : '0.00';

  // ================= SHEET 1: BẢNG TỔNG HỢP =================
  const summaryRows: (string | number)[][] = [
    [schoolConfig.schoolName.toUpperCase(), '', '', ''],
    [schoolConfig.branchName || 'Luyện nhân cách ươm mầm tài năng', '', '', ''],
    [`Địa chỉ: ${schoolConfig.address} - Hotline: ${schoolConfig.phone}`, '', '', ''],
    [],
    ['BÁO CÁO TỔNG HỢP THU CHI & DOANH THU', '', '', ''],
    [`Kỳ báo cáo: ${formatMonthVN(monthStr)}`, '', '', ''],
    [],
    ['1. DOANH THU (KHOẢN THU)', 'Số giao dịch', 'Số tiền (VNĐ)', 'Tỷ trọng (%)'],
  ];

  incomeCategories.forEach((cat) => {
    const amt = categoryTotals[cat.id]?.total || 0;
    const count = categoryTotals[cat.id]?.count || 0;
    const share = totalRevenue > 0 ? ((amt / totalRevenue) * 100).toFixed(1) : '0.0';
    summaryRows.push([cat.name, count, amt, `${share}%`]);
  });
  summaryRows.push(['TỔNG DOANH THU', currentMonthTx.filter((t) => t.type === 'thu').length, totalRevenue, '100.0%']);
  summaryRows.push([]);

  summaryRows.push(['2. CHI PHÍ (KHOẢN CHI)', 'Số giao dịch', 'Số tiền (VNĐ)', 'Tỷ trọng (%)']);
  expenseCategories.forEach((cat) => {
    const amt = categoryTotals[cat.id]?.total || 0;
    const count = categoryTotals[cat.id]?.count || 0;
    const share = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : '0.0';
    summaryRows.push([cat.name, count, amt, `${share}%`]);
  });
  summaryRows.push(['TỔNG CHI PHÍ', currentMonthTx.filter((t) => t.type === 'chi').length, totalExpense, '100.0%']);
  summaryRows.push([]);

  summaryRows.push(['3. KẾT QUẢ HOẠT ĐỘNG', '', 'Số tiền (VNĐ)', 'Đánh giá']);
  summaryRows.push(['LỜI / LỖ (THẶNG DƯ)', '', profit, profit >= 0 ? 'Thặng dư an toàn' : 'Chi vượt thu']);
  summaryRows.push(['% TRÊN DOANH THU', '', `${marginPercent}%`, 'Tỷ suất lợi nhuận']);
  summaryRows.push([]);
  summaryRows.push([]);
  summaryRows.push(['Người lập biểu (Thủ quỹ)', '', '', 'Hiệu trưởng / Chủ trường']);
  summaryRows.push([schoolConfig.treasurerName || 'Thủ quỹ', '', '', schoolConfig.principalName || 'Hiệu trưởng']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 36 }, { wch: 15 }, { wch: 22 }, { wch: 20 }];

  // ================= SHEET 2: CHI TIẾT GIAO DỊCH =================
  const detailHeaders = [
    'STT',
    'Mã Giao Dịch',
    'Ngày (YYYY-MM-DD)',
    'Phân Loại',
    'Hạng Mục',
    'Số Tiền (VNĐ)',
    'Người Nộp / Nhận',
    'Phương Thức',
    'Ghi Chú Chi Tiết',
  ];

  const sortedTx = [...currentMonthTx].sort((a, b) => a.date.localeCompare(b.date));
  const detailRows = sortedTx.map((tx, idx) => [
    idx + 1,
    tx.id,
    tx.date,
    tx.type === 'thu' ? 'Thu' : 'Chi',
    tx.categoryName,
    tx.amount,
    tx.payerOrReceiver || '',
    tx.paymentMethod === 'chuyen_khoan'
      ? 'Chuyển khoản'
      : tx.paymentMethod === 'tien_mat'
      ? 'Tiền mặt'
      : 'Khác',
    tx.note || '',
  ]);

  const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  wsDetail['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 26 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 35 },
  ];

  // Create Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Hop_Thu_Chi');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Chi_Tiet_Giao_Dich');

  const safeSchoolName = (schoolConfig.schoolName || 'Mam_Non_Canh_Dieu').replace(/\s+/g, '_');
  const filename = `Bao_Cao_Thu_Chi_${monthStr}_${safeSchoolName}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Xuất Danh Sách Giao Dịch Sang File Excel (.xlsx)
 */
export function exportTransactionsExcel(
  transactions: Transaction[],
  filename: string = 'Danh_Sach_Giao_Dich.xlsx'
) {
  const headers = [
    'STT',
    'Mã GD',
    'Ngày',
    'Tháng',
    'Loại',
    'Hạng Mục',
    'Số Tiền (VNĐ)',
    'Người Nộp / Nhận',
    'Phương Thức',
    'Nội Dung Ghi Chú',
  ];

  const rows = transactions.map((tx, idx) => [
    idx + 1,
    tx.id,
    tx.date,
    tx.month,
    tx.type === 'thu' ? 'Thu' : 'Chi',
    tx.categoryName,
    tx.amount,
    tx.payerOrReceiver || '',
    tx.paymentMethod === 'chuyen_khoan'
      ? 'Chuyển khoản'
      : tx.paymentMethod === 'tien_mat'
      ? 'Tiền mặt'
      : 'Khác',
    tx.note || '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 24 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Giao_Dich');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Tải File Mẫu Excel Chuẩn Để Người Dùng Nhập Thu - Chi
 * Hỗ trợ tải mẫu riêng cho Khoản Thu, riêng cho Khoản Chi, hoặc mẫu Chung
 */
export function downloadTransactionImportTemplate(
  categories?: CategoryItem[],
  templateType: 'all' | 'thu' | 'chi' = 'all'
) {
  const activeCats = categories && categories.length > 0
    ? categories
    : [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

  let headers: string[] = [];
  let sampleRows: (string | number)[][] = [];
  let filename = 'Mau_Nhap_Thu_Chi_Mam_Non.xlsx';
  let sheetName = 'Mau_Nhap_Lieu';
  let filteredCats = activeCats;

  if (templateType === 'thu') {
    filename = 'Mau_Nhap_Khoan_Thu_Mam_Non.xlsx';
    sheetName = 'Mau_Khoan_Thu';
    headers = [
      'Ngày (YYYY-MM-DD)',
      'Loại (Thu)',
      'Hạng Mục Thu',
      'Số Tiền (VNĐ)',
      'Người Nộp (Phụ huynh / Học sinh)',
      'Phương Thức (Tiền mặt / Chuyển khoản)',
      'Ghi Chú Chi Tiết',
    ];
    sampleRows = [
      [
        '2026-10-05',
        'Thu',
        'Học phí',
        3500000,
        'PH bé Nguyễn Hoàng Nam (Lớp Mầm)',
        'Chuyển khoản',
        'Đóng học phí tháng 10',
      ],
      [
        '2026-10-06',
        'Thu',
        'Tiền ăn bán trú',
        990000,
        'PH bé Lê Mai Anh (Lớp Chồi)',
        'Tiền mặt',
        'Đóng tiền ăn bán trú tháng 10',
      ],
      [
        '2026-10-07',
        'Thu',
        'Đồng phục & balo',
        450000,
        'PH bé Trần Gia Hưng (Lớp Lá)',
        'Chuyển khoản',
        'Mua 2 bộ đồng phục và balo mới',
      ],
      [
        '2026-10-09',
        'Thu',
        'Tiền dã ngoại / ngoại khóa',
        300000,
        'PH bé Đỗ Minh Quân (Lớp Mầm)',
        'Tiền mặt',
        'Phí tham quan nông trại tháng 10',
      ],
    ];
    filteredCats = activeCats.filter((c) => c.type === 'thu');
  } else if (templateType === 'chi') {
    filename = 'Mau_Nhap_Khoan_Chi_Mam_Non.xlsx';
    sheetName = 'Mau_Khoan_Chi';
    headers = [
      'Ngày (YYYY-MM-DD)',
      'Loại (Chi)',
      'Hạng Mục Chi',
      'Số Tiền (VNĐ)',
      'Người Nhận (Đơn vị / Cửa hàng / Nhân viên)',
      'Phương Thức (Tiền mặt / Chuyển khoản)',
      'Ghi Chú Chi Tiết',
    ];
    sampleRows = [
      [
        '2026-10-05',
        'Chi',
        'Thực phẩm & dinh dưỡng',
        1850000,
        'Cửa hàng thực phẩm sạch Minh Tâm',
        'Chuyển khoản',
        'Mua thịt bò, rau củ và sữa tươi tuần 1',
      ],
      [
        '2026-10-08',
        'Chi',
        'Văn phòng phẩm & đồ chơi',
        650000,
        'Nhà sách FAHASA',
        'Tiền mặt',
        'Mua giấy vẽ A4, bút sáp, đất nặn cho các lớp',
      ],
      [
        '2026-10-10',
        'Chi',
        'Điện, nước, internet',
        1250000,
        'Công ty Điện lực EVN',
        'Chuyển khoản',
        'Thanh toán tiền điện trường tháng trước',
      ],
      [
        '2026-10-12',
        'Chi',
        'Sửa chữa & bảo trì CSVC',
        450000,
        'Thợ điện nước Tuấn Hưng',
        'Tiền mặt',
        'Thay bóng đèn led và vòi nước phòng vệ sinh',
      ],
    ];
    filteredCats = activeCats.filter((c) => c.type === 'chi');
  } else {
    // All
    filename = 'Mau_Nhap_Thu_Chi_Mam_Non.xlsx';
    sheetName = 'Mau_Thu_Chi';
    headers = [
      'Ngày (YYYY-MM-DD)',
      'Loại (Thu hoặc Chi)',
      'Hạng Mục',
      'Số Tiền (VNĐ)',
      'Người Nộp / Nhận',
      'Phương Thức (Tiền mặt / Chuyển khoản)',
      'Ghi Chú',
    ];
    sampleRows = [
      [
        '2026-10-05',
        'Thu',
        'Học phí',
        3500000,
        'PH bé Nguyễn Hoàng Nam (Lớp Mầm)',
        'Chuyển khoản',
        'Đóng học phí tháng 10',
      ],
      [
        '2026-10-06',
        'Thu',
        'Tiền ăn bán trú',
        990000,
        'PH bé Lê Mai Anh (Lớp Chồi)',
        'Tiền mặt',
        'Đóng tiền ăn tháng 10',
      ],
      [
        '2026-10-08',
        'Chi',
        'Thực phẩm & dinh dưỡng',
        1850000,
        'Cửa hàng thực phẩm sạch Minh Tâm',
        'Chuyển khoản',
        'Mua thịt bò và rau củ quả tuần 1',
      ],
      [
        '2026-10-10',
        'Chi',
        'Văn phòng phẩm & đồ chơi',
        650000,
        'Nhà sách FAHASA',
        'Tiền mặt',
        'Mua giấy màu, bút vẽ, đất nặn',
      ],
      [
        '2026-10-12',
        'Chi',
        'Điện, nước, internet',
        1200000,
        'Điện lực EVN',
        'Chuyển khoản',
        'Thanh toán tiền điện tháng 9',
      ],
    ];
  }

  const wsTemplate = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  wsTemplate['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 18 },
    { wch: 35 },
    { wch: 35 },
    { wch: 38 },
  ];

  // Sheet 2: Danh sách hạng mục hợp lệ để tham khảo
  const catHeaders = ['Tên Hạng Mục', 'Phân Loại', 'Nhóm Hạng Mục'];
  const catRows = filteredCats.map((c) => [
    c.name,
    c.type === 'thu' ? 'Khoản Thu' : 'Khoản Chi',
    c.group || '',
  ]);

  const wsCats = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  wsCats['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 25 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsTemplate, sheetName);
  XLSX.utils.book_append_sheet(wb, wsCats, 'Danh_Muc_Tham_Khao');

  XLSX.writeFile(wb, filename);
}

/**
 * Xuất Riêng Các Khoản Thu Sang Tệp Excel (.xlsx)
 */
export function exportIncomeOnlyExcel(
  transactions: Transaction[],
  monthStr: string,
  schoolConfig?: SchoolConfig
) {
  const incomeTxs = transactions
    .filter((t) => t.type === 'thu')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);

  const titleRows: (string | number)[][] = [];
  if (schoolConfig) {
    titleRows.push([schoolConfig.schoolName.toUpperCase()]);
    if (schoolConfig.address) titleRows.push([`Địa chỉ: ${schoolConfig.address}`]);
    titleRows.push([]);
  }
  titleRows.push([`DANH SÁCH CHI TIẾT CÁC KHOẢN THU - KỲ BÁO CÁO: ${formatMonthVN(monthStr)}`]);
  titleRows.push([`Tổng số khoản thu: ${incomeTxs.length} giao dịch | Tổng số tiền: ${formatVND(totalIncome)}`]);
  titleRows.push([]);

  const headers = [
    'STT',
    'Mã GD',
    'Ngày Thu',
    'Hạng Mục Thu',
    'Số Tiền Thu (VNĐ)',
    'Người Nộp (Phụ huynh / Học sinh)',
    'Hình Thức',
    'Ghi Chú',
  ];

  const dataRows = incomeTxs.map((tx, idx) => [
    idx + 1,
    tx.id,
    tx.date,
    tx.categoryName,
    tx.amount,
    tx.payerOrReceiver || '',
    tx.paymentMethod === 'chuyen_khoan'
      ? 'Chuyển khoản'
      : tx.paymentMethod === 'tien_mat'
      ? 'Tiền mặt'
      : 'Khác',
    tx.note || '',
  ]);

  // Bottom Total Row
  const totalRow = ['TỔNG CỘNG', '', '', '', totalIncome, '', '', ''];

  const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...dataRows, [], totalRow]);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 22 },
    { wch: 14 },
    { wch: 28 },
    { wch: 20 },
    { wch: 32 },
    { wch: 16 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Khoan_Thu');
  XLSX.writeFile(wb, `Danh_Sach_Khoan_Thu_${monthStr}.xlsx`);
}

/**
 * Xuất Riêng Các Khoản Chi Sang Tệp Excel (.xlsx)
 */
export function exportExpenseOnlyExcel(
  transactions: Transaction[],
  monthStr: string,
  schoolConfig?: SchoolConfig
) {
  const expenseTxs = transactions
    .filter((t) => t.type === 'chi')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

  const titleRows: (string | number)[][] = [];
  if (schoolConfig) {
    titleRows.push([schoolConfig.schoolName.toUpperCase()]);
    if (schoolConfig.address) titleRows.push([`Địa chỉ: ${schoolConfig.address}`]);
    titleRows.push([]);
  }
  titleRows.push([`DANH SÁCH CHI TIẾT CÁC KHOẢN CHI - KỲ BÁO CÁO: ${formatMonthVN(monthStr)}`]);
  titleRows.push([`Tổng số khoản chi: ${expenseTxs.length} giao dịch | Tổng chi phí: ${formatVND(totalExpense)}`]);
  titleRows.push([]);

  const headers = [
    'STT',
    'Mã GD',
    'Ngày Chi',
    'Hạng Mục Chi',
    'Số Tiền Chi (VNĐ)',
    'Người Nhận / Đơn Vị Cung Cấp',
    'Hình Thức',
    'Ghi Chú',
  ];

  const dataRows = expenseTxs.map((tx, idx) => [
    idx + 1,
    tx.id,
    tx.date,
    tx.categoryName,
    tx.amount,
    tx.payerOrReceiver || '',
    tx.paymentMethod === 'chuyen_khoan'
      ? 'Chuyển khoản'
      : tx.paymentMethod === 'tien_mat'
      ? 'Tiền mặt'
      : 'Khác',
    tx.note || '',
  ]);

  // Bottom Total Row
  const totalRow = ['TỔNG CỘNG', '', '', '', totalExpense, '', '', ''];

  const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...dataRows, [], totalRow]);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 22 },
    { wch: 14 },
    { wch: 28 },
    { wch: 20 },
    { wch: 32 },
    { wch: 16 },
    { wch: 35 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Khoan_Chi');
  XLSX.writeFile(wb, `Danh_Sach_Khoan_Chi_${monthStr}.xlsx`);
}

/**
 * Backward compatibility: Giữ nguyên hàm exportMonthlySpreadsheetCSV nếu có nơi gọi
 */
export function exportMonthlySpreadsheetCSV(
  monthStr: string,
  transactions: Transaction[],
  schoolConfig: SchoolConfig,
  categories?: CategoryItem[]
) {
  // Xuất Excel .xlsx chuẩn thay vì chỉ csv thô sơ
  exportMonthlyReportExcel(monthStr, transactions, schoolConfig, categories);
}
