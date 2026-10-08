import { Transaction, StudentTuition, SchoolConfig, FamilyConfig, CategoryItem, AppMode } from '../types/finance';
import { ALL_CATEGORIES } from '../data/defaultCategories';
import { HOME_ALL_CATEGORIES } from '../data/homeDefaultCategories';
import { INITIAL_TRANSACTIONS, INITIAL_STUDENTS_TUITION, DEFAULT_SCHOOL_CONFIG } from '../data/sampleData';
import { INITIAL_HOME_TRANSACTIONS, DEFAULT_FAMILY_CONFIG } from '../data/homeSampleData';

const STORAGE_KEYS = {
  ACTIVE_MODE: 'app_active_mode_v1',
  // Chế độ 1: Doanh nghiệp / Trường mầm non (Business)
  TRANSACTIONS: 'mamnon_transactions_v1',
  STUDENTS: 'mamnon_students_v1',
  CATEGORIES: 'mamnon_categories_v1',
  CONFIG: 'mamnon_school_config_v1',
  // Chế độ 2: Gia đình / Chi tiêu cá nhân (Home)
  HOME_TRANSACTIONS: 'home_transactions_v1',
  HOME_CATEGORIES: 'home_categories_v1',
  HOME_CONFIG: 'home_config_v1',
};

// ================= APP MODE SWITCHER =================
export function loadActiveMode(): AppMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODE);
    if (raw === 'home' || raw === 'business') {
      return raw;
    }
    return 'business';
  } catch (err) {
    console.error('Error loading active mode', err);
    return 'business';
  }
}

export function saveActiveMode(mode: AppMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODE, mode);
  } catch (err) {
    console.error('Error saving active mode', err);
  }
}

// ================= BUSINESS (TRƯỜNG MẦM NON) STORAGE =================
export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading transactions', err);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving transactions', err);
  }
}

export function loadStudents(): StudentTuition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      saveStudents(INITIAL_STUDENTS_TUITION);
      return INITIAL_STUDENTS_TUITION;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading students', err);
    return INITIAL_STUDENTS_TUITION;
  }
}

export function saveStudents(students: StudentTuition[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.error('Error saving students', err);
  }
}

export function loadCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      saveCategories(ALL_CATEGORIES);
      return ALL_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading categories', err);
    return ALL_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories', err);
  }
}

export function loadSchoolConfig(): SchoolConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) {
      saveSchoolConfig(DEFAULT_SCHOOL_CONFIG);
      return DEFAULT_SCHOOL_CONFIG;
    }
    const parsed = JSON.parse(raw);
    if (parsed.schoolName === 'Mầm Non Tuổi Thơ Xanh' || !parsed.schoolName) {
      const migrated = {
        ...parsed,
        schoolName: DEFAULT_SCHOOL_CONFIG.schoolName,
        branchName: DEFAULT_SCHOOL_CONFIG.branchName,
      };
      saveSchoolConfig(migrated);
      return migrated;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading config', err);
    return DEFAULT_SCHOOL_CONFIG;
  }
}

export function saveSchoolConfig(config: SchoolConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving config', err);
  }
}

// ================= HOME (THU CHI GIA ĐÌNH) STORAGE =================
export function loadHomeTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOME_TRANSACTIONS);
    if (!raw) {
      saveHomeTransactions(INITIAL_HOME_TRANSACTIONS);
      return INITIAL_HOME_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading home transactions', err);
    return INITIAL_HOME_TRANSACTIONS;
  }
}

export function saveHomeTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOME_TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving home transactions', err);
  }
}

export function loadHomeCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOME_CATEGORIES);
    if (!raw) {
      saveHomeCategories(HOME_ALL_CATEGORIES);
      return HOME_ALL_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading home categories', err);
    return HOME_ALL_CATEGORIES;
  }
}

export function saveHomeCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOME_CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving home categories', err);
  }
}

export function loadHomeConfig(): FamilyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOME_CONFIG);
    if (!raw) {
      saveHomeConfig(DEFAULT_FAMILY_CONFIG);
      return DEFAULT_FAMILY_CONFIG;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading home config', err);
    return DEFAULT_FAMILY_CONFIG;
  }
}

export function saveHomeConfig(config: FamilyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOME_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving home config', err);
  }
}

// ================= RESET & BACKUP =================
export function resetBusinessDataToDefault(): void {
  saveTransactions(INITIAL_TRANSACTIONS);
  saveStudents(INITIAL_STUDENTS_TUITION);
  saveCategories(ALL_CATEGORIES);
  saveSchoolConfig(DEFAULT_SCHOOL_CONFIG);
}

export function resetHomeDataToDefault(): void {
  saveHomeTransactions(INITIAL_HOME_TRANSACTIONS);
  saveHomeCategories(HOME_ALL_CATEGORIES);
  saveHomeConfig(DEFAULT_FAMILY_CONFIG);
}

export function resetAllDataToDefault(): void {
  resetBusinessDataToDefault();
  resetHomeDataToDefault();
}

export function exportAllDataAsJSON(mode?: AppMode): string {
  const data = {
    activeMode: mode || loadActiveMode(),
    exportDate: new Date().toISOString(),
    version: '2.0',
    business: {
      schoolConfig: loadSchoolConfig(),
      categories: loadCategories(),
      transactions: loadTransactions(),
      students: loadStudents(),
    },
    home: {
      familyConfig: loadHomeConfig(),
      categories: loadHomeCategories(),
      transactions: loadHomeTransactions(),
    },
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    // V2 Format with nested business and home
    if (data.business || data.home) {
      if (data.business) {
        if (Array.isArray(data.business.transactions)) saveTransactions(data.business.transactions);
        if (Array.isArray(data.business.students)) saveStudents(data.business.students);
        if (Array.isArray(data.business.categories)) saveCategories(data.business.categories);
        if (data.business.schoolConfig) saveSchoolConfig(data.business.schoolConfig);
      }
      if (data.home) {
        if (Array.isArray(data.home.transactions)) saveHomeTransactions(data.home.transactions);
        if (Array.isArray(data.home.categories)) saveHomeCategories(data.home.categories);
        if (data.home.familyConfig) saveHomeConfig(data.home.familyConfig);
      }
      if (data.activeMode) {
        saveActiveMode(data.activeMode);
      }
      return true;
    }

    // V1 Format legacy fallback
    if (data.transactions && Array.isArray(data.transactions)) {
      saveTransactions(data.transactions);
    }
    if (data.students && Array.isArray(data.students)) {
      saveStudents(data.students);
    }
    if (data.categories && Array.isArray(data.categories)) {
      saveCategories(data.categories);
    }
    if (data.schoolConfig) {
      saveSchoolConfig(data.schoolConfig);
    }
    return true;
  } catch (err) {
    console.error('Error importing data', err);
    return false;
  }
}

