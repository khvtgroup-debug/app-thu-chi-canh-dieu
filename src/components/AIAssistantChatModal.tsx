import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  PlusCircle,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Wallet,
  Mic,
  MicOff,
  Edit3,
} from 'lucide-react';
import { Transaction, CategoryItem, AppMode, TransactionType, PaymentMethod } from '../types/finance';
import { formatVND } from '../utils/formatters';

interface ParsedAction {
  id: string;
  type: TransactionType;
  amount: number;
  note: string;
  payerOrReceiver?: string;
  date: string;
  matchedCategoryId: string | null;
  matchedCategoryName: string | null;
  paymentMethod: PaymentMethod;
  needsNewCategory: boolean;
  suggestedCategory?: {
    name: string;
    type: TransactionType;
    group?: string;
  } | null;
  // User choices on card
  userCategoryChoice: 'matched' | 'create_new' | 'choose_existing';
  selectedExistingCategoryId?: string;
  isSaved?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  parsedAction?: ParsedAction;
}

interface AIAssistantChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  currentCategories: CategoryItem[];
  onSaveTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onAddCategory: (cat: Omit<CategoryItem, 'id'>) => CategoryItem | void;
  onOpenDetailedModal?: (prefilled: Partial<Transaction>) => void;
  currentMonthSummary?: {
    totalRevenue: number;
    totalExpense: number;
  };
}

export const AIAssistantChatModal: React.FC<AIAssistantChatModalProps> = ({
  isOpen,
  onClose,
  mode,
  currentCategories,
  onSaveTransaction,
  onAddCategory,
  onOpenDetailedModal,
  currentMonthSummary,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'ai',
      text:
        mode === 'home'
          ? 'Chào bạn! Mình là Trợ lý AI Thu Chi Gia Đình. Bạn chỉ cần nhập tự nhiên như: *"đi chợ mua thực phẩm 350k"*, *"lương tháng này 25tr"* hoặc *"tiền điện nước 850k"*, mình sẽ nhận diện và ghi chép ngay!'
          : 'Chào thầy cô! Em là Trợ lý AI Thu Chi Mầm Non. Thầy cô chỉ cần nhập nhanh như: *"thu tiền học phí 2tr"*, *"thu tiền ăn bán trú 1.5tr bé Nam"*, hoặc *"chi mua giáo cụ đồ chơi 600k"*, em sẽ tự động phân loại danh mục và chuẩn bị phiếu thu chi ngay!',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickPrompts =
    mode === 'home'
      ? [
          'Lương tháng này 20tr',
          'Đi siêu thị mua thức ăn 450k',
          'Đóng tiền điện nước 750k',
          'Mua sữa cho bé 600k',
        ]
      : [
          'Thu tiền học phí 2tr',
          'Thu tiền ăn bán trú bé Mai 1.5tr',
          'Chi mua văn phòng phẩm giáo cụ 350k',
          'Chi tiền điện nước trường 1.2tr',
          'Thu tiền dã ngoại trải nghiệm 500k',
        ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Speech Recognition (if available in browser)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói. Vui lòng nhập văn bản.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: query,
          mode,
          currentCategories: currentCategories.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
          })),
          contextSummary: currentMonthSummary,
        }),
      });

      const data = await response.json();

      let parsedAction: ParsedAction | undefined;

      if (data.isFinancialAction && data.parsedTransaction) {
        const pt = data.parsedTransaction;
        
        // Find existing match
        let matchedCat = currentCategories.find(
          (c) => c.id === pt.matchedCategoryId || c.name.toLowerCase() === (pt.matchedCategoryName || '').toLowerCase()
        );

        // Fallback matching if not returned explicitly
        if (!matchedCat && pt.matchedCategoryName) {
          matchedCat = currentCategories.find(
            (c) => c.type === pt.type && c.name.toLowerCase().includes(pt.matchedCategoryName.toLowerCase())
          );
        }

        const needsNewCategory = pt.needsNewCategory || (!matchedCat && !!pt.suggestedCategory);

        parsedAction = {
          id: `act-${Date.now()}`,
          type: pt.type || 'chi',
          amount: Number(pt.amount) || 0,
          note: pt.note || query,
          payerOrReceiver: pt.payerOrReceiver || '',
          date: pt.date || new Date().toISOString().split('T')[0],
          matchedCategoryId: matchedCat ? matchedCat.id : null,
          matchedCategoryName: matchedCat ? matchedCat.name : null,
          paymentMethod: (pt.paymentMethod as PaymentMethod) || 'tien_mat',
          needsNewCategory,
          suggestedCategory: pt.suggestedCategory || (needsNewCategory ? {
            name: pt.matchedCategoryName || (pt.type === 'thu' ? 'Thu khác' : 'Chi khác'),
            type: pt.type || 'chi',
            group: 'Khác',
          } : null),
          userCategoryChoice: matchedCat ? 'matched' : (needsNewCategory ? 'create_new' : 'choose_existing'),
          selectedExistingCategoryId: currentCategories.find((c) => c.type === (pt.type || 'chi'))?.id,
          isSaved: false,
        };
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.aiReply || 'Em đã tiếp nhận yêu cầu.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        parsedAction,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error('Error contacting AI service:', err);
      // Client-side fallback so it never fails
      const fallbackAiMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Xin lỗi anh/chị, em đang kết nối lại. Anh/chị có thể nhập lại hoặc mở form nhập thủ công nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateActionChoice = (messageId: string, updates: Partial<ParsedAction>) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.parsedAction) {
          return {
            ...msg,
            parsedAction: {
              ...msg.parsedAction,
              ...updates,
            },
          };
        }
        return msg;
      })
    );
  };

  const handleConfirmSave = (msgId: string, action: ParsedAction) => {
    if (action.isSaved) return;

    let finalCategoryId = action.matchedCategoryId;
    let finalCategoryName = action.matchedCategoryName;

    // Check choice:
    if (action.userCategoryChoice === 'create_new' && action.suggestedCategory) {
      // Create new category
      const newCatData: Omit<CategoryItem, 'id'> = {
        name: action.suggestedCategory.name,
        type: action.type,
        group: action.suggestedCategory.group || (action.type === 'thu' ? 'Khoản thu mới' : 'Khoản chi mới'),
        monthlyBudget: action.type === 'chi' ? 0 : undefined,
      };
      const created = onAddCategory(newCatData);
      if (created) {
        finalCategoryId = created.id;
        finalCategoryName = created.name;
      } else {
        // Fallback id
        finalCategoryId = `cat_${Date.now()}`;
        finalCategoryName = action.suggestedCategory.name;
      }
    } else if (action.userCategoryChoice === 'choose_existing' && action.selectedExistingCategoryId) {
      const found = currentCategories.find((c) => c.id === action.selectedExistingCategoryId);
      if (found) {
        finalCategoryId = found.id;
        finalCategoryName = found.name;
      }
    } else if (!finalCategoryId) {
      // Default to first matching type or fallback
      const defaultCat = currentCategories.find((c) => c.type === action.type);
      if (defaultCat) {
        finalCategoryId = defaultCat.id;
        finalCategoryName = defaultCat.name;
      } else {
        finalCategoryId = action.type === 'thu' ? 'thu_khac' : 'chi_khac';
        finalCategoryName = action.type === 'thu' ? 'Thu khác' : 'Chi khác';
      }
    }

    // Save transaction
    const dateStr = action.date || new Date().toISOString().split('T')[0];
    const monthStr = dateStr.slice(0, 7);

    onSaveTransaction({
      date: dateStr,
      month: monthStr,
      type: action.type,
      categoryId: finalCategoryId || 'other',
      categoryName: finalCategoryName || 'Khác',
      amount: action.amount,
      note: action.note,
      payerOrReceiver: action.payerOrReceiver || '',
      paymentMethod: action.paymentMethod,
    });

    // Mark action as saved
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.parsedAction) {
          return {
            ...msg,
            parsedAction: {
              ...msg.parsedAction,
              isSaved: true,
              matchedCategoryId: finalCategoryId,
              matchedCategoryName: finalCategoryName,
            },
          };
        }
        return msg;
      })
    );

    // Follow-up AI message
    const confirmFollowup: ChatMessage = {
      id: `ai-saved-${Date.now()}`,
      sender: 'ai',
      text: `Đã ghi nhận thành công: ${action.type === 'thu' ? 'Thu' : 'Chi'} ${formatVND(
        action.amount
      )} vào danh mục "${finalCategoryName}" rồi ạ! 🎉`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, confirmFollowup]);
  };

  const handleOpenEditDetail = (action: ParsedAction) => {
    if (onOpenDetailedModal) {
      onOpenDetailedModal({
        type: action.type,
        amount: action.amount,
        note: action.note,
        payerOrReceiver: action.payerOrReceiver,
        date: action.date,
        categoryId: action.matchedCategoryId || '',
        paymentMethod: action.paymentMethod,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] max-h-[720px] flex flex-col border border-emerald-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner text-amber-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">Trợ Lý AI Thu Chi</h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/40 text-emerald-100 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  Sẵn sàng
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                {mode === 'home'
                  ? 'Ghi chép thu chi gia đình bằng ngôn ngữ tự nhiên'
                  : 'Tự động bóc tách số tiền, danh mục học phí & thu chi trường học'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome-reset',
                    sender: 'ai',
                    text: 'Lịch sử chat đã được làm mới. Em sẵn sàng nhận lệnh thu chi tiếp theo!',
                    timestamp: new Date().toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ])
              }
              title="Làm mới đoạn hội thoại"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Đóng chatbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick prompt suggestions bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Gợi ý:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1 text-xs font-medium bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-full shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat message stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.sender === 'ai'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm'
                    : 'bg-slate-700 text-white shadow-sm'
                }`}
              >
                {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble & Cards */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Bubble text */}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1 font-mono ${
                      msg.sender === 'user' ? 'text-emerald-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* Interactive Transaction Card if parsed */}
                {msg.parsedAction && (
                  <div className="mt-2.5 w-full bg-white rounded-xl border border-emerald-200 shadow-md p-4 transition-all">
                    {/* Card Header Status */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            msg.parsedAction.type === 'thu'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {msg.parsedAction.type === 'thu' ? 'Khoản Thu (+)' : 'Khoản Chi (-)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {msg.parsedAction.date}
                        </span>
                      </div>
                      <span
                        className={`text-base sm:text-lg font-black font-mono ${
                          msg.parsedAction.type === 'thu' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {msg.parsedAction.type === 'thu' ? '+' : '-'}
                        {formatVND(msg.parsedAction.amount)}
                      </span>
                    </div>

                    {/* Transaction Details */}
                    <div className="py-3 space-y-2 text-xs sm:text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 font-medium shrink-0">Nội dung:</span>
                        <span className="text-slate-800 font-semibold text-right">
                          {msg.parsedAction.note}
                        </span>
                      </div>

                      {msg.parsedAction.payerOrReceiver && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 font-medium">Người nộp/nhận:</span>
                          <span className="text-slate-700 font-medium">
                            {msg.parsedAction.payerOrReceiver}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 font-medium">Hình thức:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateActionChoice(msg.id, {
                                paymentMethod:
                                  msg.parsedAction?.paymentMethod === 'tien_mat'
                                    ? 'chuyen_khoan'
                                    : 'tien_mat',
                              })
                            }
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer border border-slate-200"
                          >
                            {msg.parsedAction.paymentMethod === 'tien_mat'
                              ? '💵 Tiền mặt'
                              : '💳 Chuyển khoản'}
                          </button>
                        </div>
                      </div>

                      {/* Category Selection / Creation section */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>Phân loại danh mục:</span>
                          {msg.parsedAction.matchedCategoryName && !msg.parsedAction.needsNewCategory && (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs font-medium">
                              Khớp danh mục: <strong>{msg.parsedAction.matchedCategoryName}</strong>
                            </span>
                          )}
                        </div>

                        {/* CASE 1: Has matched category */}
                        {msg.parsedAction.matchedCategoryId && !msg.parsedAction.needsNewCategory ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                              <span className="text-emerald-900 font-medium flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                Ghi vào tab: <strong>{msg.parsedAction.matchedCategoryName}</strong>
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateActionChoice(msg.id, {
                                    userCategoryChoice: 'choose_existing',
                                  })
                                }
                                className="text-emerald-700 hover:text-emerald-900 underline font-medium"
                              >
                                Đổi mục khác
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* CASE 2: No matched category yet or user needs options */
                          <div className="space-y-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
                            <div className="flex items-center gap-1.5 text-xs text-amber-900 font-medium">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              Chưa có tab danh mục phù hợp trong hệ thống:
                            </div>

                            {/* Option A: Create new category */}
                            {msg.parsedAction.suggestedCategory && (
                              <label className="flex items-start gap-2 p-2 bg-white rounded-lg border border-amber-300/80 hover:border-emerald-400 cursor-pointer text-xs">
                                <input
                                  type="radio"
                                  name={`cat-choice-${msg.id}`}
                                  checked={msg.parsedAction.userCategoryChoice === 'create_new'}
                                  onChange={() =>
                                    handleUpdateActionChoice(msg.id, {
                                      userCategoryChoice: 'create_new',
                                    })
                                  }
                                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="flex-1">
                                  <div className="font-bold text-slate-800 flex items-center gap-1">
                                    <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                                    Tạo mới tab: &quot;{msg.parsedAction.suggestedCategory.name}&quot;
                                  </div>
                                  <span className="text-[11px] text-slate-500">
                                    Tự động tạo danh mục {msg.parsedAction.type === 'thu' ? 'thu' : 'chi'} mới này và thêm vào hệ thống
                                  </span>
                                </div>
                              </label>
                            )}

                            {/* Option B: Put into another existing category */}
                            <label className="flex items-start gap-2 p-2 bg-white rounded-lg border border-amber-300/80 hover:border-emerald-400 cursor-pointer text-xs">
                              <input
                                type="radio"
                                name={`cat-choice-${msg.id}`}
                                checked={msg.parsedAction.userCategoryChoice === 'choose_existing'}
                                onChange={() =>
                                  handleUpdateActionChoice(msg.id, {
                                    userCategoryChoice: 'choose_existing',
                                  })
                                }
                                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="flex-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1">
                                  <Wallet className="w-3.5 h-3.5 text-slate-600" />
                                  Đưa vào mục tùy chọn khác:
                                </div>
                                <select
                                  value={
                                    msg.parsedAction.selectedExistingCategoryId ||
                                    currentCategories.find((c) => c.type === msg.parsedAction?.type)?.id ||
                                    ''
                                  }
                                  onChange={(e) =>
                                    handleUpdateActionChoice(msg.id, {
                                      userCategoryChoice: 'choose_existing',
                                      selectedExistingCategoryId: e.target.value,
                                    })
                                  }
                                  className="mt-1 w-full text-xs py-1 px-2 border border-slate-300 rounded bg-white text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
                                >
                                  {currentCategories
                                    .filter((c) => c.type === msg.parsedAction?.type)
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name} {c.group ? `(${c.group})` : ''}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      {msg.parsedAction.isSaved ? (
                        <div className="w-full flex items-center justify-between py-1 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Đã lưu vào sổ thu chi thành công!
                          </span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDetail(msg.parsedAction!)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Sửa chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmSave(msg.id, msg.parsedAction!)}
                            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Xác nhận lưu ngay
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing/Thinking loader */}
          {isLoading && (
            <div className="flex items-start gap-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-sm">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-2xs text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                Trợ lý AI đang phân tích nội dung...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? 'Đang lắng nghe giọng nói...' : 'Nói để nhập'}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Nhập nội dung, ví dụ: "thu tiền học phí 2tr", "chi mua đồ chơi 400k"...'
              disabled={isLoading}
              className="flex-1 text-sm py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-md hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>💡 Thử gõ: &quot;thu tiền học phí 2tr&quot; hoặc &quot;chi 350k mua giáo cụ&quot;</span>
            <span className="hidden sm:inline">Phím Enter để gửi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
