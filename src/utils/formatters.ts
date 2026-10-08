export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatMonthVN(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return `Tháng ${parseInt(month, 10)}/${year}`;
}

export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getCurrentDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert amount to Vietnamese words for receipts (Phiếu thu / Phiếu chi)
const UNITS = ['', 'nghìn', 'triệu', 'tỉ', 'nghìn tỉ', 'triệu tỉ'];
const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readGroup(group: number, showZero: boolean): string {
  const hundreds = Math.floor(group / 100);
  const tens = Math.floor((group % 100) / 10);
  const units = group % 10;
  let result = '';

  if (hundreds > 0 || showZero) {
    result += `${DIGITS[hundreds]} trăm `;
  }

  if (tens > 1) {
    result += `${DIGITS[tens]} mươi `;
    if (units === 1) result += 'mốt ';
    else if (units === 5) result += 'lăm ';
    else if (units > 0) result += `${DIGITS[units]} `;
  } else if (tens === 1) {
    result += 'mười ';
    if (units === 5) result += 'lăm ';
    else if (units > 0) result += `${DIGITS[units]} `;
  } else if (units > 0) {
    if (hundreds > 0 || showZero) result += 'lẻ ';
    result += `${DIGITS[units]} `;
  }

  return result.trim();
}

export function numberToVietnameseWords(amount: number): string {
  if (amount === 0) return 'Không đồng chẵn';
  const isNegative = amount < 0;
  let absAmount = Math.abs(Math.round(amount));

  const groups: number[] = [];
  while (absAmount > 0) {
    groups.push(absAmount % 1000);
    absAmount = Math.floor(absAmount / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal > 0) {
      const showZero = i < groups.length - 1;
      const groupText = readGroup(groupVal, showZero);
      const unitText = UNITS[i];
      parts.push(`${groupText} ${unitText}`.trim());
    }
  }

  let finalWords = parts.join(' ').trim();
  if (finalWords.length > 0) {
    finalWords = finalWords.charAt(0).toUpperCase() + finalWords.slice(1);
    finalWords += ' đồng chẵn';
  } else {
    finalWords = 'Không đồng';
  }

  return isNegative ? `Âm ${finalWords.toLowerCase()}` : finalWords;
}

export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}
