import { HomeThemeColor } from '../types/finance';

export interface ThemeDefinition {
  id: HomeThemeColor;
  name: string;
  shortName: string;
  tagline: string;
  hex: string;
  accentHex: string;
  // Header styling
  headerBorder: string;
  headerBrandTitle: string;
  headerBrandSub: string;
  headerLogoBg: string;
  headerLogoRing: string;
  modeActiveBtn: string;
  activeNavTab: string;
  inactiveNavHover: string;
  // Dashboard & Hero
  heroBanner: string;
  heroGlow: string;
  heroBadge: string;
  heroBadgeText: string;
  heroButtonPrimary: string;
  heroButtonSecondary: string;
  // KPI & accents
  summaryCardBorder: string;
  accentText: string;
  accentBgLight: string;
  accentBorderLight: string;
  badgeBg: string;
  badgeText: string;
  progressFill: string;
  ringFocus: string;
}

export const HOME_THEMES: Record<HomeThemeColor, ThemeDefinition> = {
  indigo: {
    id: 'indigo',
    name: 'Tím Indigo & Slate (Fintech Hiện Đại)',
    shortName: 'Indigo Hiện Đại',
    tagline: 'Phong cách ứng dụng tài chính cá nhân cao cấp, tối giản',
    hex: '#4f46e5',
    accentHex: '#7c3aed',
    headerBorder: 'border-b border-indigo-100',
    headerBrandTitle: 'text-indigo-900',
    headerBrandSub: 'text-indigo-600',
    headerLogoBg: 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white',
    headerLogoRing: 'ring-2 ring-indigo-100',
    modeActiveBtn: 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-700/20',
    activeNavTab: 'bg-indigo-700 text-white shadow-xs font-semibold',
    inactiveNavHover: 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70',
    heroBanner: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border-indigo-800/40',
    heroGlow: 'bg-indigo-500/25',
    heroBadge: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200',
    heroBadgeText: 'text-indigo-200',
    heroButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md',
    heroButtonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    summaryCardBorder: 'border-indigo-100 hover:border-indigo-300',
    accentText: 'text-indigo-700',
    accentBgLight: 'bg-indigo-50/70',
    accentBorderLight: 'border-indigo-100',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    progressFill: 'bg-indigo-600',
    ringFocus: 'focus:ring-indigo-500',
  },
  ocean: {
    id: 'ocean',
    name: 'Xanh Đại Dương & Navy (Chuẩn Sổ Kế Toán)',
    shortName: 'Xanh Đại Dương',
    tagline: 'Phong cách xanh dương chuẩn mực, thanh lịch & rõ ràng',
    hex: '#2563eb',
    accentHex: '#0284c7',
    headerBorder: 'border-b border-blue-100',
    headerBrandTitle: 'text-blue-900',
    headerBrandSub: 'text-blue-600',
    headerLogoBg: 'bg-gradient-to-tr from-blue-600 via-blue-700 to-sky-500 text-white',
    headerLogoRing: 'ring-2 ring-blue-100',
    modeActiveBtn: 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-700/20',
    activeNavTab: 'bg-blue-700 text-white shadow-xs font-semibold',
    inactiveNavHover: 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70',
    heroBanner: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 border-blue-800/40',
    heroGlow: 'bg-blue-500/25',
    heroBadge: 'bg-blue-500/20 border-blue-400/30 text-blue-200',
    heroBadgeText: 'text-blue-200',
    heroButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-md',
    heroButtonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    summaryCardBorder: 'border-blue-100 hover:border-blue-300',
    accentText: 'text-blue-700',
    accentBgLight: 'bg-blue-50/70',
    accentBorderLight: 'border-blue-100',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    progressFill: 'bg-blue-600',
    ringFocus: 'focus:ring-blue-500',
  },
  warm_sunset: {
    id: 'warm_sunset',
    name: 'Cam Hồng & San Hô (Tổ Ấm Gia Đình)',
    shortName: 'Tổ Ấm San Hô',
    tagline: 'Ấm áp, gắn kết, thân thiện dành cho tài chính gia đình',
    hex: '#e11d48',
    accentHex: '#f97316',
    headerBorder: 'border-b border-rose-100',
    headerBrandTitle: 'text-rose-950',
    headerBrandSub: 'text-rose-600',
    headerLogoBg: 'bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white',
    headerLogoRing: 'ring-2 ring-rose-100',
    modeActiveBtn: 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-700/20',
    activeNavTab: 'bg-rose-700 text-white shadow-xs font-semibold',
    inactiveNavHover: 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/70',
    heroBanner: 'bg-gradient-to-br from-stone-950 via-rose-950 to-amber-950 border-rose-900/40',
    heroGlow: 'bg-rose-500/25',
    heroBadge: 'bg-rose-500/20 border-rose-400/30 text-rose-200',
    heroBadgeText: 'text-rose-200',
    heroButtonPrimary: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md',
    heroButtonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    summaryCardBorder: 'border-rose-100 hover:border-rose-300',
    accentText: 'text-rose-700',
    accentBgLight: 'bg-rose-50/70',
    accentBorderLight: 'border-rose-100',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    progressFill: 'bg-rose-600',
    ringFocus: 'focus:ring-rose-500',
  },
  emerald: {
    id: 'emerald',
    name: 'Xanh Ngọc & Thảo Mộc (Tươi Mát Tự Nhiên)',
    shortName: 'Xanh Thảo Mộc',
    tagline: 'Mang lại sự an tâm, sinh sôi tài lộc và cân bằng ngân sách',
    hex: '#059669',
    accentHex: '#0d9488',
    headerBorder: 'border-b border-emerald-100',
    headerBrandTitle: 'text-emerald-900',
    headerBrandSub: 'text-emerald-600',
    headerLogoBg: 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white',
    headerLogoRing: 'ring-2 ring-emerald-100',
    modeActiveBtn: 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-700/20',
    activeNavTab: 'bg-emerald-700 text-white shadow-xs font-semibold',
    inactiveNavHover: 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70',
    heroBanner: 'bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 border-emerald-800/40',
    heroGlow: 'bg-emerald-500/25',
    heroBadge: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200',
    heroBadgeText: 'text-emerald-200',
    heroButtonPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md',
    heroButtonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    summaryCardBorder: 'border-emerald-100 hover:border-emerald-300',
    accentText: 'text-emerald-700',
    accentBgLight: 'bg-emerald-50/70',
    accentBorderLight: 'border-emerald-100',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    progressFill: 'bg-emerald-600',
    ringFocus: 'focus:ring-emerald-500',
  },
  mocha: {
    id: 'mocha',
    name: 'Nâu Mocha & Gỗ Mộc (Tối Giản Bắc Âu)',
    shortName: 'Nâu Mocha',
    tagline: 'Tinh tế, điềm tĩnh, phong cách sống tối giản và ấm áp',
    hex: '#78716c',
    accentHex: '#b45309',
    headerBorder: 'border-b border-stone-200',
    headerBrandTitle: 'text-stone-900',
    headerBrandSub: 'text-amber-800',
    headerLogoBg: 'bg-gradient-to-tr from-stone-700 via-amber-800 to-stone-600 text-white',
    headerLogoRing: 'ring-2 ring-stone-200',
    modeActiveBtn: 'bg-stone-800 text-white shadow-xs ring-1 ring-stone-900/20',
    activeNavTab: 'bg-stone-800 text-white shadow-xs font-semibold',
    inactiveNavHover: 'text-slate-600 hover:text-stone-900 hover:bg-stone-100/70',
    heroBanner: 'bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 border-stone-800/40',
    heroGlow: 'bg-amber-600/20',
    heroBadge: 'bg-stone-800/60 border-stone-700/50 text-amber-200',
    heroBadgeText: 'text-amber-200',
    heroButtonPrimary: 'bg-stone-800 hover:bg-stone-700 text-white shadow-md',
    heroButtonSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    summaryCardBorder: 'border-stone-200 hover:border-stone-400',
    accentText: 'text-stone-800',
    accentBgLight: 'bg-stone-100/70',
    accentBorderLight: 'border-stone-200',
    badgeBg: 'bg-stone-100',
    badgeText: 'text-stone-800',
    progressFill: 'bg-stone-700',
    ringFocus: 'focus:ring-stone-500',
  },
};

export const getThemeConfig = (themeKey?: HomeThemeColor): ThemeDefinition => {
  if (themeKey && HOME_THEMES[themeKey]) {
    return HOME_THEMES[themeKey];
  }
  return HOME_THEMES.indigo; // Default modern fintech indigo
};

export const THEME_OPTIONS: Array<{ id: HomeThemeColor; name: string; hex: string }> = [
  { id: 'indigo', name: 'Tím Indigo (Hiện Đại)', hex: '#4f46e5' },
  { id: 'ocean', name: 'Xanh Đại Dương (Navy)', hex: '#2563eb' },
  { id: 'warm_sunset', name: 'Cam San Hô (Ấm Áp)', hex: '#e11d48' },
  { id: 'emerald', name: 'Xanh Thảo Mộc (Tự Nhiên)', hex: '#059669' },
  { id: 'mocha', name: 'Nâu Mocha (Tối Giản)', hex: '#78716c' },
];
