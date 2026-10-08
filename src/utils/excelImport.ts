import * as XLSX from 'xlsx';
import { Transaction, TransactionType, PaymentMethod, CategoryItem } from '../types/finance';
import { normalizeVietnamese } from './formatters';

export interface ParsedTransaction {
  date: string;
  month: string;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  amount: number;
  payerOrReceiver: string;
  paymentMethod: PaymentMethod;
  note: string;
  rawRowIndex: number;
  isValid: boolean;
  validationError?: string;
}

export interface ParseResult {
  validTransactions: ParsedTransaction[];
  invalidRows: { rowNumber: number; data: any; reason: string }[];
  totalRows: number;
  totalIncome: number;
  totalExpense: number;
  thuCount: number;
  chiCount: number;
  allTransactions: ParsedTransaction[];
}

export interface ParseOptions {
  mode?: 'all' | 'thu' | 'chi';
  defaultTypeIfMissing?: 'thu' | 'chi';
}

/**
 * Convert Excel date serial or string to YYYY-MM-DD
 */
function parseDateString(raw: any): { date: string; month: string } | null {
  if (raw === undefined || raw === null || raw === '') return null;

  // Case 1: Excel Serial Number (e.g., 45570)
  if (typeof raw === 'number' && raw > 20000 && raw < 70000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + raw * 86400000);
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getUTCDate()).padStart(2, '0');
    return { date: `${y}-${m}-${d}`, month: `${y}-${m}` };
  }

  const str = String(raw).trim();

  // Case 2: YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return { date: `${y}-${m}-${d}`, month: `${y}-${m}` };
  }

  // Case 3: DD/MM/YYYY or DD-MM-YYYY
  const vnMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (vnMatch) {
    const d = vnMatch[1].padStart(2, '0');
    const m = vnMatch[2].padStart(2, '0');
    const y = vnMatch[3];
    return { date: `${y}-${m}-${d}`, month: `${y}-${m}` };
  }

  return null;
}

/**
 * Parse numeric amount
 */
function parseAmount(raw: any): number {
  if (typeof raw === 'number') return Math.abs(Math.round(raw));
  if (!raw) return 0;
  // Strip non-digits except period or minus
  const cleanStr = String(raw).replace(/[^\d]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Match Category from input text
 */
function matchCategory(
  catNameRaw: string,
  type: TransactionType,
  categories: CategoryItem[]
): { id: string; name: string } {
  const normInput = normalizeVietnamese(catNameRaw || '').trim();
  const candidates = categories.filter((c) => c.type === type);

  // 1. Exact or normalized match
  for (const c of candidates) {
    const normC = normalizeVietnamese(c.name).trim();
    if (normC === normInput || c.name.toLowerCase() === (catNameRaw || '').toLowerCase().trim()) {
      return { id: c.id, name: c.name };
    }
  }

  // 2. Substring match
  for (const c of candidates) {
    const normC = normalizeVietnamese(c.name).trim();
    if (normC.includes(normInput) || normInput.includes(normC)) {
      return { id: c.id, name: c.name };
    }
  }

  // 3. Fallback: return custom name with generic ID
  const cleanName = (catNameRaw || '').trim() || (type === 'thu' ? 'Thu khác' : 'Chi khác');
  return {
    id: candidates[0]?.id || (type === 'thu' ? 'thu_khac' : 'chi_khac'),
    name: cleanName,
  };
}

/**
 * Read Excel/CSV file and parse into structured transactions
 */
export async function parseTransactionsExcelFile(
  file: File,
  categories: CategoryItem[],
  options?: ParseOptions
): Promise<ParseResult> {
  const mode = options?.mode || 'all';
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Read first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Tệp Excel không chứa trang dữ liệu nào.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rows.length < 2) {
    throw new Error('Tệp Excel không có đủ dữ liệu để nhập.');
  }

  // Find header row by checking keywords
  let headerRowIndex = -1;
  let colMap = {
    date: -1,
    type: -1,
    category: -1,
    amount: -1,
    person: -1,
    method: -1,
    note: -1,
  };

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r];
    const rowStr = row.map((cell) => normalizeVietnamese(String(cell)).toLowerCase());

    const dateIdx = rowStr.findIndex((c) => c.includes('ngay') || c.includes('date') || c.includes('thoi gian'));
    const amountIdx = rowStr.findIndex((c) => c.includes('tien') || c.includes('amount') || c.includes('gia'));
    const typeIdx = rowStr.findIndex((c) => c.includes('loai') || c.includes('phan loai') || c.includes('type'));
    const catIdx = rowStr.findIndex((c) => c.includes('hang muc') || c.includes('danh muc') || c.includes('category') || c.includes('muc'));

    if (dateIdx !== -1 && amountIdx !== -1) {
      headerRowIndex = r;
      colMap.date = dateIdx;
      colMap.amount = amountIdx;
      colMap.type = typeIdx;
      colMap.category = catIdx;
      colMap.person = rowStr.findIndex((c) => c.includes('nguoi') || c.includes('doi tac') || c.includes('phu huynh') || c.includes('nhan vien'));
      colMap.method = rowStr.findIndex((c) => c.includes('phuong thuc') || c.includes('hinh thuc') || c.includes('method') || c.includes('tk'));
      colMap.note = rowStr.findIndex((c) => c.includes('ghi chu') || c.includes('noi dung') || c.includes('note') || c.includes('dien giai'));
      break;
    }
  }

  // If no header found, fallback to standard column indices: 0: Date, 1: Type, 2: Category, 3: Amount, 4: Person, 5: Method, 6: Note
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
    colMap = {
      date: 0,
      type: 1,
      category: 2,
      amount: 3,
      person: 4,
      method: 5,
      note: 6,
    };
  }

  const allParsed: ParsedTransaction[] = [];
  const invalidRows: { rowNumber: number; data: any; reason: string }[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    // Skip completely empty rows
    if (!row || row.every((c) => String(c).trim() === '')) continue;

    const rowNumber = r + 1;
    const rawDate = colMap.date !== -1 ? row[colMap.date] : row[0];
    const rawType = colMap.type !== -1 ? row[colMap.type] : undefined;
    const rawCat = colMap.category !== -1 ? row[colMap.category] : row[colMap.type === -1 ? 1 : 2];
    const rawAmt = colMap.amount !== -1 ? row[colMap.amount] : row[colMap.type === -1 ? 2 : 3];
    const rawPerson = colMap.person !== -1 ? row[colMap.person] : row[colMap.type === -1 ? 3 : 4];
    const rawMethod = colMap.method !== -1 ? row[colMap.method] : row[colMap.type === -1 ? 4 : 5];
    const rawNote = colMap.note !== -1 ? row[colMap.note] : row[colMap.type === -1 ? 5 : 6];

    // Validate Date
    const parsedDateObj = parseDateString(rawDate);
    if (!parsedDateObj) {
      invalidRows.push({
        rowNumber,
        data: row,
        reason: `Ngày không hợp lệ: "${String(rawDate)}" (Định dạng yêu cầu: YYYY-MM-DD hoặc DD/MM/YYYY)`,
      });
      continue;
    }

    // Validate Amount
    const amount = parseAmount(rawAmt);
    if (amount <= 0) {
      invalidRows.push({
        rowNumber,
        data: row,
        reason: `Số tiền không hợp lệ hoặc bằng 0: "${String(rawAmt)}"`,
      });
      continue;
    }

    // Parse Type (Thu vs Chi)
    let type: TransactionType = 'chi';

    if (rawType !== undefined && String(rawType).trim() !== '') {
      const typeStr = normalizeVietnamese(String(rawType)).toLowerCase().trim();
      if (
        typeStr === 'thu' ||
        typeStr.includes('thu tien') ||
        typeStr.includes('khoan thu') ||
        typeStr.includes('income') ||
        typeStr === 'in' ||
        typeStr === '+'
      ) {
        type = 'thu';
      } else {
        type = 'chi';
      }
    } else {
      // If no Type column found in the file:
      if (options?.defaultTypeIfMissing) {
        type = options.defaultTypeIfMissing;
      } else if (mode === 'thu') {
        type = 'thu';
      } else if (mode === 'chi') {
        type = 'chi';
      } else {
        // Smart inference from category name
        const normCat = normalizeVietnamese(String(rawCat || '')).toLowerCase();
        const isMatchIncomeCat = categories
          .filter((c) => c.type === 'thu')
          .some((c) => normalizeVietnamese(c.name).toLowerCase().includes(normCat) || normCat.includes(normalizeVietnamese(c.name).toLowerCase()));
        type = isMatchIncomeCat ? 'thu' : 'chi';
      }
    }

    // Match Category
    const { id: categoryId, name: categoryName } = matchCategory(String(rawCat), type, categories);

    // Parse Payment Method
    let paymentMethod: PaymentMethod = 'chuyen_khoan';
    const methodStr = normalizeVietnamese(String(rawMethod)).toLowerCase().trim();
    if (methodStr.includes('tien mat') || methodStr.includes('cash')) {
      paymentMethod = 'tien_mat';
    }

    const payerOrReceiver = String(rawPerson || '').trim();
    const note = String(rawNote || '').trim();

    allParsed.push({
      date: parsedDateObj.date,
      month: parsedDateObj.month,
      type,
      categoryId,
      categoryName,
      amount,
      payerOrReceiver,
      paymentMethod,
      note,
      rawRowIndex: rowNumber,
      isValid: true,
    });
  }

  // Filter valid transactions according to mode
  const validTransactions = allParsed.filter((t) => {
    if (mode === 'thu') return t.type === 'thu';
    if (mode === 'chi') return t.type === 'chi';
    return true;
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let thuCount = 0;
  let chiCount = 0;

  validTransactions.forEach((t) => {
    if (t.type === 'thu') {
      totalIncome += t.amount;
      thuCount++;
    } else {
      totalExpense += t.amount;
      chiCount++;
    }
  });

  return {
    validTransactions,
    invalidRows,
    totalRows: validTransactions.length + invalidRows.length,
    totalIncome,
    totalExpense,
    thuCount,
    chiCount,
    allTransactions: allParsed,
  };
}
