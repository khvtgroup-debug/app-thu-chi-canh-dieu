/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { MonthSelector } from './components/MonthSelector';
import { KPICards } from './components/KPICards';
import { DashboardView } from './components/DashboardView';
import { SpreadsheetView } from './components/SpreadsheetView';
import { TransactionList } from './components/TransactionList';
import { StatsView } from './components/StatsView';
import { TransactionModal } from './components/TransactionModal';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { CategoryQuickModal } from './components/CategoryQuickModal';
import { ImportExcelModal } from './components/ImportExcelModal';

import {
  Transaction,
  SchoolConfig,
  FamilyConfig,
  CategoryItem,
  PaymentMethod,
  TransactionType,
  AppMode,
  HomeThemeColor,
} from './types/finance';
import {
  loadActiveMode,
  saveActiveMode,
  loadTransactions,
  saveTransactions,
  loadSchoolConfig,
  saveSchoolConfig,
  loadCategories,
  saveCategories,
  loadHomeTransactions,
  saveHomeTransactions,
  loadHomeCategories,
  saveHomeCategories,
  loadHomeConfig,
  saveHomeConfig,
} from './utils/storage';
import { ALL_CATEGORIES } from './data/defaultCategories';
import { HOME_ALL_CATEGORIES } from './data/homeDefaultCategories';
import { getCurrentMonthStr } from './utils/formatters';
import {
  exportMonthlyReportExcel,
  exportTransactionsExcel,
  exportIncomeOnlyExcel,
  exportExpenseOnlyExcel,
} from './utils/excelExport';

import { useAuth } from './firebase/AuthContext';
import {
  syncUserProfile,
  subscribeUserTransactions,
  subscribeUserCategories,
  subscribeUserSettings,
  saveUserTransactionToFirestore,
  deleteUserTransactionFromFirestore,
  saveUserCategoryToFirestore,
  deleteUserCategoryFromFirestore,
  saveUserSettingsToFirestore,
  initializeUserCloudDataIfEmpty,
} from './firebase/firestoreService';

type TabType = 'dashboard' | 'bang_tinh' | 'giao_dich' | 'thong_ke';

interface NavState {
  tab: TabType;
  categoryFilter: string;
}

export default function App() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Dual Mode System: 'business' (Trường học) | 'home' (Gia đình)
  const [mode, setModeState] = useState<AppMode>(() => loadActiveMode());
  const isBusiness = mode === 'business';

  // 2. Business Data State (Trường học / Doanh nghiệp)
  const [bizTransactions, setBizTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig>(() => loadSchoolConfig());
  const [bizCategories, setBizCategories] = useState<CategoryItem[]>(() => loadCategories());

  // 3. Home Data State (Thu chi Gia đình - Hoàn toàn độc lập)
  const [homeTransactions, setHomeTransactions] = useState<Transaction[]>(() => loadHomeTransactions());
  const [familyConfig, setFamilyConfig] = useState<FamilyConfig>(() => loadHomeConfig());
  const [homeCategories, setHomeCategories] = useState<CategoryItem[]>(() => loadHomeCategories());

  // Real-time synchronization when user is signed in with Google
  useEffect(() => {
    if (!user) return;

    // Save profile
    syncUserProfile(user.uid, {
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
      activeMode: mode,
    });

    // Check & seed cloud data from current local state if cloud database is empty
    initializeUserCloudDataIfEmpty(user.uid, {
      transactions: bizTransactions,
      homeTransactions: homeTransactions,
      categories: bizCategories,
      homeCategories: homeCategories,
      schoolConfig: schoolConfig,
      familyConfig: familyConfig,
      activeMode: mode,
    });

    // Subscribe to transactions real-time
    const unsubTx = subscribeUserTransactions(user.uid, (cloudTxs) => {
      // Split into business and home transactions based on recorded mode or ID
      const bizList = cloudTxs.filter((t) => t.mode !== 'home' && !t.id.includes('home'));
      const homeList = cloudTxs.filter((t) => t.mode === 'home' || t.id.includes('home'));
      
      if (bizList.length > 0) {
        setBizTransactions(bizList);
        saveTransactions(bizList);
      }
      if (homeList.length > 0) {
        setHomeTransactions(homeList);
        saveHomeTransactions(homeList);
      }
    });

    // Subscribe to categories real-time
    const unsubCat = subscribeUserCategories(user.uid, (cloudCats) => {
      if (cloudCats.length > 0) {
        const bizCats = cloudCats.filter((c) => c.mode !== 'home');
        const homeCats = cloudCats.filter((c) => c.mode === 'home');
        if (bizCats.length > 0) {
          setBizCategories(bizCats);
          saveCategories(bizCats);
        }
        if (homeCats.length > 0) {
          setHomeCategories(homeCats);
          saveHomeCategories(homeCats);
        }
      }
    });

    // Subscribe to settings
    const unsubSettings = subscribeUserSettings(user.uid, (cloudSettings) => {
      if (cloudSettings.schoolConfig) {
        setSchoolConfig(cloudSettings.schoolConfig);
        saveSchoolConfig(cloudSettings.schoolConfig);
      }
      if (cloudSettings.familyConfig) {
        setFamilyConfig(cloudSettings.familyConfig);
        saveHomeConfig(cloudSettings.familyConfig);
      }
      if (cloudSettings.activeMode) {
        setModeState(cloudSettings.activeMode);
        saveActiveMode(cloudSettings.activeMode);
      }
    });

    return () => {
      unsubTx();
      unsubCat();
      unsubSettings();
    };
  }, [user]);

  // Manual sync trigger
  const handleSyncNow = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await initializeUserCloudDataIfEmpty(user.uid, {
        transactions: bizTransactions,
        homeTransactions: homeTransactions,
        categories: bizCategories,
        homeCategories: homeCategories,
        schoolConfig: schoolConfig,
        familyConfig: familyConfig,
        activeMode: mode,
      });
      // Save current settings
      await saveUserSettingsToFirestore(user.uid, {
        schoolConfig,
        familyConfig,
        activeMode: mode,
      });
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Active pointers depending on mode
  const transactions = isBusiness ? bizTransactions : homeTransactions;
  const categories = isBusiness ? bizCategories : homeCategories;

  // 5. Global View State
  const [currentMonth, setCurrentMonth] = useState<string>(() => getCurrentMonthStr());
  const [activeTab, setActiveTabState] = useState<TabType>('dashboard');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Navigation History Stack for Back Button
  const [navHistory, setNavHistory] = useState<NavState[]>([]);

  // Function to navigate with history tracking
  const navigateTo = (newTab: TabType, newCatFilter: string = 'all') => {
    if (activeTab !== newTab || categoryFilter !== newCatFilter) {
      setNavHistory((prev) => [...prev, { tab: activeTab, categoryFilter }]);
    }
    setActiveTabState(newTab);
    setCategoryFilter(newCatFilter);
  };

  const handleGoBack = () => {
    if (navHistory.length === 0) return;
    const previous = navHistory[navHistory.length - 1];
    setNavHistory((prev) => prev.slice(0, -1));
    setActiveTabState(previous.tab);
    setCategoryFilter(previous.categoryFilter);
  };

  // Switch between Business & Home modes
  const handleSwitchMode = (newMode: AppMode) => {
    if (newMode === mode) return;
    setModeState(newMode);
    saveActiveMode(newMode);
    setCategoryFilter('all');
    if (user) {
      saveUserSettingsToFirestore(user.uid, { activeMode: newMode });
    }
  };

  // Change theme color for family mode
  const handleChangeTheme = (color: HomeThemeColor) => {
    const updated = { ...familyConfig, themeColor: color };
    setFamilyConfig(updated);
    saveHomeConfig(updated);
    if (user) {
      saveUserSettingsToFirestore(user.uid, { familyConfig: updated });
    }
  };

  // Modal controls
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<CategoryItem | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('chi');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [importInitialType, setImportInitialType] = useState<'all' | 'thu' | 'chi'>('all');

  // Quick Category Add/Edit Modal
  const [isCategoryQuickModalOpen, setIsCategoryQuickModalOpen] = useState(false);
  const [quickCategoryType, setQuickCategoryType] = useState<TransactionType>('chi');
  const [quickEditingCategory, setQuickEditingCategory] = useState<CategoryItem | null>(null);

  const handleOpenAddCategoryModal = (type: TransactionType) => {
    setQuickCategoryType(type);
    setQuickEditingCategory(null);
    setIsCategoryQuickModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat: CategoryItem) => {
    setQuickEditingCategory(cat);
    setQuickCategoryType(cat.type);
    setIsCategoryQuickModalOpen(true);
  };

  const handleSaveQuickCategory = (
    catData: { name: string; type: TransactionType; group: string; monthlyBudget?: number },
    existingId?: string
  ) => {
    if (existingId) {
      handleUpdateCategory(existingId, catData);
    } else {
      handleAddCategory(catData);
    }
  };

  // Print Modal
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    type: 'transaction' | 'month_report';
    tx?: Transaction | null;
  }>({
    isOpen: false,
    type: 'month_report',
  });

  // Persistent storage auto-save
  useEffect(() => {
    saveTransactions(bizTransactions);
  }, [bizTransactions]);

  useEffect(() => {
    saveSchoolConfig(schoolConfig);
  }, [schoolConfig]);

  useEffect(() => {
    saveCategories(bizCategories);
  }, [bizCategories]);

  useEffect(() => {
    saveHomeTransactions(homeTransactions);
  }, [homeTransactions]);

  useEffect(() => {
    saveHomeCategories(homeCategories);
  }, [homeCategories]);

  useEffect(() => {
    saveHomeConfig(familyConfig);
  }, [familyConfig]);

  // Current Month Transactions
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.month === currentMonth);
  }, [transactions, currentMonth]);

  // Current Month KPIs
  const { totalRevenue, totalExpense } = useMemo(() => {
    let rev = 0;
    let exp = 0;
    currentMonthTransactions.forEach((tx) => {
      if (tx.type === 'thu') rev += tx.amount;
      else exp += tx.amount;
    });
    return { totalRevenue: rev, totalExpense: exp };
  }, [currentMonthTransactions]);

  // ================= CATEGORY CRUD HANDLERS (SEPARATED BY MODE) =================
  const handleAddCategory = (newCat: Omit<CategoryItem, 'id'>) => {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const item: CategoryItem = { ...newCat, id };
    if (isBusiness) {
      setBizCategories((prev) => [...prev, item]);
      if (user) saveUserCategoryToFirestore(user.uid, item, 'business');
    } else {
      setHomeCategories((prev) => [...prev, item]);
      if (user) saveUserCategoryToFirestore(user.uid, item, 'home');
    }
  };

  const handleUpdateCategory = (id: string, updated: Partial<CategoryItem>) => {
    if (isBusiness) {
      setBizCategories((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const merged = { ...c, ...updated };
            if (user) saveUserCategoryToFirestore(user.uid, merged, 'business');
            return merged;
          }
          return c;
        })
      );
      if (updated.name) {
        const newName = updated.name;
        setBizTransactions((prev) =>
          prev.map((t) => (t.categoryId === id ? { ...t, categoryName: newName } : t))
        );
      }
    } else {
      setHomeCategories((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const merged = { ...c, ...updated };
            if (user) saveUserCategoryToFirestore(user.uid, merged, 'home');
            return merged;
          }
          return c;
        })
      );
      if (updated.name) {
        const newName = updated.name;
        setHomeTransactions((prev) =>
          prev.map((t) => (t.categoryId === id ? { ...t, categoryName: newName } : t))
        );
      }
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (isBusiness) {
      setBizCategories((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveCategories(next);
        return next;
      });
    } else {
      setHomeCategories((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveHomeCategories(next);
        return next;
      });
    }
    if (user) {
      deleteUserCategoryFromFirestore(user.uid, id);
    }
  };

  const handleResetDefaultCategories = () => {
    if (isBusiness) {
      setBizCategories(ALL_CATEGORIES);
      saveCategories(ALL_CATEGORIES);
    } else {
      setHomeCategories(HOME_ALL_CATEGORIES);
      saveHomeCategories(HOME_ALL_CATEGORIES);
    }
  };

  // ================= TRANSACTION ACTION HANDLERS (SEPARATED BY MODE) =================
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (isBusiness) {
      if (existingId) {
        setBizTransactions((prev) => {
          const next = prev.map((t) => {
            if (t.id === existingId) {
              const updated = { ...t, ...data };
              if (user) saveUserTransactionToFirestore(user.uid, updated, 'business');
              return updated;
            }
            return t;
          });
          saveTransactions(next);
          return next;
        });
      } else {
        const newTx: Transaction = {
          ...data,
          id: `tx-biz-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          createdAt: Date.now(),
        };
        setBizTransactions((prev) => {
          const next = [newTx, ...prev];
          saveTransactions(next);
          return next;
        });
        if (user) saveUserTransactionToFirestore(user.uid, newTx, 'business');
      }
    } else {
      if (existingId) {
        setHomeTransactions((prev) => {
          const next = prev.map((t) => {
            if (t.id === existingId) {
              const updated = { ...t, ...data };
              if (user) saveUserTransactionToFirestore(user.uid, updated, 'home');
              return updated;
            }
            return t;
          });
          saveHomeTransactions(next);
          return next;
        });
      } else {
        const newTx: Transaction = {
          ...data,
          id: `tx-home-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          createdAt: Date.now(),
        };
        setHomeTransactions((prev) => {
          const next = [newTx, ...prev];
          saveHomeTransactions(next);
          return next;
        });
        if (user) saveUserTransactionToFirestore(user.uid, newTx, 'home');
      }
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (isBusiness) {
      setBizTransactions((prev) => {
        const next = prev.filter((t) => t.id !== id);
        saveTransactions(next);
        return next;
      });
    } else {
      setHomeTransactions((prev) => {
        const next = prev.filter((t) => t.id !== id);
        saveHomeTransactions(next);
        return next;
      });
    }
    if (user) {
      deleteUserTransactionFromFirestore(user.uid, id);
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setDefaultCategory(null);
    setDefaultTxType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleOpenNewTx = () => {
    setEditingTx(null);
    setDefaultCategory(null);
    setDefaultTxType('chi');
    setIsTxModalOpen(true);
  };

  const handleOpenNewTxWithType = (type: TransactionType) => {
    setEditingTx(null);
    setDefaultCategory(null);
    setDefaultTxType(type);
    setIsTxModalOpen(true);
  };

  const handleOpenNewTxWithCategory = (cat: CategoryItem) => {
    setEditingTx(null);
    setDefaultCategory(cat);
    setDefaultTxType(cat.type);
    setIsTxModalOpen(true);
  };

  const handleFilterByCategory = (categoryId: string) => {
    navigateTo('giao_dich', categoryId);
  };

  // Adapted config for Excel & print exports
  const activeExportConfig: SchoolConfig = useMemo(() => {
    if (isBusiness) return schoolConfig;
    return {
      schoolName: familyConfig.familyName || 'Tổ Ấm Gia Đình',
      branchName: familyConfig.subTitle || 'Sổ Thu Chi & Kế Hoạch Tài Chính',
      address: familyConfig.address || '',
      phone: familyConfig.phone || '',
      principalName: familyConfig.approverName || 'Chủ hộ',
      treasurerName: familyConfig.managerName || 'Người ghi sổ',
    };
  }, [isBusiness, schoolConfig, familyConfig]);

  const handleExportCSV = () => {
    exportMonthlyReportExcel(currentMonth, transactions, activeExportConfig, categories);
  };

  const handleExportTransactionsExcel = (type: 'all' | 'thu' | 'chi' = 'all') => {
    const prefix = isBusiness ? 'So_Giao_Dich_Truong' : 'So_Thu_Chi_Gia_Dinh';
    if (type === 'thu') {
      exportIncomeOnlyExcel(currentMonthTransactions, currentMonth, activeExportConfig);
    } else if (type === 'chi') {
      exportExpenseOnlyExcel(currentMonthTransactions, currentMonth, activeExportConfig);
    } else {
      exportTransactionsExcel(currentMonthTransactions, `${prefix}_${currentMonth}.xlsx`);
    }
  };

  const handleOpenImportExcel = (type: 'all' | 'thu' | 'chi' = 'all') => {
    setImportInitialType(type);
    setIsImportExcelOpen(true);
  };

  const handleImportTransactions = (
    importedTxs: Omit<Transaction, 'id' | 'createdAt'>[],
    modeImport: 'append' | 'replace',
    targetMonth: string
  ) => {
    const generated: Transaction[] = importedTxs.map((t, idx) => ({
      ...t,
      id: `tx-import-${isBusiness ? 'biz' : 'home'}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now() + idx,
    }));

    if (isBusiness) {
      if (modeImport === 'replace') {
        setBizTransactions((prev) => [
          ...generated,
          ...prev.filter((t) => t.month !== targetMonth),
        ]);
      } else {
        setBizTransactions((prev) => [...generated, ...prev]);
      }
    } else {
      if (modeImport === 'replace') {
        setHomeTransactions((prev) => [
          ...generated,
          ...prev.filter((t) => t.month !== targetMonth),
        ]);
      } else {
        setHomeTransactions((prev) => [...generated, ...prev]);
      }
    }
  };

  const handlePrintMonthReport = () => {
    setPrintModalState({
      isOpen: true,
      type: 'month_report',
    });
  };

  const handlePrintTransaction = (tx: Transaction) => {
    setPrintModalState({
      isOpen: true,
      type: 'transaction',
      tx,
    });
  };

  const handleDataReloaded = () => {
    setBizTransactions(loadTransactions());
    setSchoolConfig(loadSchoolConfig());
    setBizCategories(loadCategories());
    setHomeTransactions(loadHomeTransactions());
    setFamilyConfig(loadHomeConfig());
    setHomeCategories(loadHomeCategories());
    setModeState(loadActiveMode());
  };

  const currentYear = parseInt(currentMonth.split('-')[0], 10) || new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden flex flex-col">
      {/* Header with dual layout (Desktop top tabs + Mobile compact top bar) and Dual Mode Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={(t) => navigateTo(t, 'all')}
        mode={mode}
        onSwitchMode={handleSwitchMode}
        onOpenNewTx={handleOpenNewTx}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCSV={handleExportCSV}
        onPrintMonthReport={handlePrintMonthReport}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        schoolConfig={schoolConfig}
        familyConfig={familyConfig}
        canGoBack={navHistory.length > 0}
        onGoBack={handleGoBack}
        onChangeTheme={handleChangeTheme}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 md:pb-14 space-y-3 sm:space-y-6 flex-1">
        {/* Month Selector */}
        <MonthSelector currentMonth={currentMonth} onChangeMonth={setCurrentMonth} />

        {/* High-level KPIs (Rendered on other tabs for quick overview) */}
        {activeTab !== 'dashboard' && (
          <KPICards
            totalRevenue={totalRevenue}
            totalExpense={totalExpense}
            txCount={currentMonthTransactions.length}
            mode={mode}
            themeColor={familyConfig?.themeColor}
          />
        )}

        {/* TAB 0: TỔNG QUAN / DASHBOARD TOÀN DIỆN */}
        {activeTab === 'dashboard' && (
          <DashboardView
            currentMonth={currentMonth}
            transactions={transactions}
            currentMonthTransactions={currentMonthTransactions}
            categories={categories}
            schoolConfig={schoolConfig}
            familyConfig={familyConfig}
            mode={mode}
            onNavigateToTab={(tab, catFilter) => navigateTo(tab, catFilter || 'all')}
            onOpenNewTx={handleOpenNewTx}
            onOpenNewTxWithType={handleOpenNewTxWithType}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onExportCSV={handleExportCSV}
            onPrintMonthReport={handlePrintMonthReport}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenImportExcel={handleOpenImportExcel}
            onExportExcel={handleExportTransactionsExcel}
            onChangeTheme={handleChangeTheme}
          />
        )}

        {/* TAB 1: BẢNG THU CHI THÁNG */}
        {activeTab === 'bang_tinh' && (
          <SpreadsheetView
            transactions={currentMonthTransactions}
            categories={categories}
            onOpenNewTxWithCategory={handleOpenNewTxWithCategory}
            onFilterByCategory={handleFilterByCategory}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onOpenAddCategoryModal={handleOpenAddCategoryModal}
            onOpenEditCategoryModal={handleOpenEditCategoryModal}
            onDeleteCategory={handleDeleteCategory}
            onExportExcel={handleExportTransactionsExcel}
            onOpenImportExcel={handleOpenImportExcel}
            mode={mode}
            themeColor={familyConfig?.themeColor}
          />
        )}

        {/* TAB 2: SỔ GIAO DỊCH CHI TIẾT */}
        {activeTab === 'giao_dich' && (
          <TransactionList
            transactions={currentMonthTransactions}
            categories={categories}
            onOpenNewTx={handleOpenNewTx}
            onEditTx={handleEditTransaction}
            onDeleteTx={handleDeleteTransaction}
            onPrintTxReceipt={handlePrintTransaction}
            initialCategoryFilter={categoryFilter}
            onClearCategoryFilter={() => setCategoryFilter('all')}
            onBackToSpreadsheet={() => navigateTo('bang_tinh', 'all')}
            onExportExcel={handleExportTransactionsExcel}
            onOpenImportExcel={handleOpenImportExcel}
            mode={mode}
            themeColor={familyConfig?.themeColor}
          />
        )}

        {/* TAB 3: THỐNG KÊ 12 THÁNG & BÁO CÁO NĂM */}
        {activeTab === 'thong_ke' && (
          <StatsView
            transactions={transactions}
            currentYear={currentYear}
            categories={categories}
            mode={mode}
            themeColor={familyConfig?.themeColor}
          />
        )}
      </main>

      {/* MODAL: Thêm / Sửa Giao Dịch */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTx={editingTx}
        defaultCategory={defaultCategory}
        defaultType={defaultTxType}
        currentMonth={currentMonth}
        categories={categories}
        onOpenAddCategory={handleOpenAddCategoryModal}
      />

      {/* MODAL: Thêm / Sửa Nhanh Hạng Mục Trực Tiếp */}
      <CategoryQuickModal
        isOpen={isCategoryQuickModalOpen}
        onClose={() => setIsCategoryQuickModalOpen(false)}
        onSave={handleSaveQuickCategory}
        editingCategory={quickEditingCategory}
        defaultType={quickCategoryType}
      />

      {/* MODAL: Quản Lý Danh Mục (Thêm, Sửa, Xóa) */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        transactions={transactions}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetDefaultCategories={handleResetDefaultCategories}
      />

      {/* MODAL: In Phiếu Thu / Chi / Báo Cáo Tháng */}
      <PrintReceiptModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState((prev) => ({ ...prev, isOpen: false }))}
        type={printModalState.type}
        transaction={printModalState.tx}
        monthStr={currentMonth}
        transactions={currentMonthTransactions}
        schoolConfig={schoolConfig}
        familyConfig={familyConfig}
        mode={mode}
        categories={categories}
      />

      {/* MODAL: Cài Đặt Thông Tin Trường / Gia Đình & Sao Lưu */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mode={mode}
        schoolConfig={schoolConfig}
        familyConfig={familyConfig}
        onSaveSchoolConfig={(cfg) => {
          setSchoolConfig(cfg);
          if (user) saveUserSettingsToFirestore(user.uid, { schoolConfig: cfg });
        }}
        onSaveFamilyConfig={(cfg) => {
          setFamilyConfig(cfg);
          if (user) saveUserSettingsToFirestore(user.uid, { familyConfig: cfg });
        }}
        onDataReloaded={handleDataReloaded}
      />

      {/* MODAL: Nhập Giao Dịch Từ File Excel */}
      {isImportExcelOpen && (
        <ImportExcelModal
          isOpen={isImportExcelOpen}
          onClose={() => setIsImportExcelOpen(false)}
          onImport={handleImportTransactions}
          categories={categories}
          currentMonth={currentMonth}
          initialType={importInitialType}
        />
      )}
    </div>
  );
}
