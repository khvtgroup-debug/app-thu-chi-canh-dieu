import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Gemini SDK with User-Agent as required by Gemini API skill
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Vietnamese fallback rule parser in case API key is not present or offline
function fallbackVietnameseParser(text: string, categories: Array<{ id: string; name: string; type: 'thu' | 'chi' }>) {
  const lower = text.toLowerCase();
  
  // Detect transaction type
  let type: 'thu' | 'chi' = 'chi';
  if (
    lower.includes('thu') ||
    lower.includes('nạp') ||
    lower.includes('nhận') ||
    lower.includes('học phí') ||
    lower.includes('đóng tiền') ||
    lower.includes('bán') ||
    lower.includes('lương về')
  ) {
    type = 'thu';
  } else if (
    lower.includes('chi') ||
    lower.includes('mua') ||
    lower.includes('trả') ||
    lower.includes('thanh toán') ||
    lower.includes('tiêu')
  ) {
    type = 'chi';
  }

  // Detect amount
  let amount = 0;
  // Match patterns like 2tr, 2 triệu, 2.5tr, 350k, 500.000, 500000
  const trMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:tr|triệu|m|củ)/i);
  const kMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|ngàn)/i);
  const rawNumMatch = lower.match(/(\d{1,3}(?:[.,]\d{3})+|\d{4,12})/);

  if (trMatch) {
    const val = parseFloat(trMatch[1].replace(',', '.'));
    amount = Math.round(val * 1000000);
  } else if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    amount = Math.round(val * 1000);
  } else if (rawNumMatch) {
    const cleanNum = rawNumMatch[1].replace(/[.,]/g, '');
    amount = parseInt(cleanNum, 10);
  }

  // Detect payment method
  let paymentMethod: 'tien_mat' | 'chuyen_khoan' | 'khac' = 'tien_mat';
  if (lower.includes('chuyển khoản') || lower.includes('ck') || lower.includes('banc') || lower.includes('quẹt thẻ')) {
    paymentMethod = 'chuyen_khoan';
  }

  // Category matching
  const matchingTypeCats = categories.filter((c) => c.type === type);
  let matchedCat = matchingTypeCats.find((c) => lower.includes(c.name.toLowerCase()));

  // Heuristics for common keywords
  if (!matchedCat) {
    if (lower.includes('học phí') || lower.includes('tiền học')) {
      matchedCat = categories.find((c) => c.id === 'hoc_phi' || c.name.toLowerCase().includes('học phí'));
    } else if (lower.includes('ăn') || lower.includes('bán trú') || lower.includes('thực phẩm')) {
      matchedCat = categories.find((c) => c.id.includes('an') || c.name.toLowerCase().includes('ăn'));
    } else if (lower.includes('lương') || lower.includes('phụ cấp')) {
      matchedCat = categories.find((c) => c.id.includes('luong') || c.name.toLowerCase().includes('lương'));
    } else if (lower.includes('điện') || lower.includes('nước') || lower.includes('internet')) {
      matchedCat = categories.find((c) => c.name.toLowerCase().includes('điện') || c.name.toLowerCase().includes('sinh hoạt'));
    } else if (lower.includes('đồ chơi') || lower.includes('giáo cụ')) {
      matchedCat = categories.find((c) => c.name.toLowerCase().includes('giáo cụ') || c.name.toLowerCase().includes('đồ chơi'));
    }
  }

  let note = text;
  // Clean up note if starts with thu/chi
  if (lower.startsWith('thu ') || lower.startsWith('chi ')) {
    note = text.charAt(0).toUpperCase() + text.slice(1);
  }

  let needsNewCategory = false;
  let suggestedCategory = null;

  if (!matchedCat) {
    needsNewCategory = true;
    // Suggest a category name
    let cleanName = text.replace(/(thu|chi|tiền|\d+(?:[.,]\d+)?\s*(?:tr|triệu|k|nghìn|củ)?)/gi, '').trim();
    if (!cleanName || cleanName.length < 2) cleanName = type === 'thu' ? 'Thu khác' : 'Chi khác';
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    suggestedCategory = {
      name: cleanName,
      type: type,
      group: type === 'thu' ? 'Khoản thu khác' : 'Khoản chi khác',
    };
  }

  return {
    isFinancialAction: amount > 0 || !!matchedCat,
    aiReply: `Dạ, em nhận diện được khoản ${type === 'thu' ? 'thu' : 'chi'} ${amount.toLocaleString('vi-VN')} đ ${
      matchedCat ? `thuộc danh mục "${matchedCat.name}"` : 'cần chọn hoặc tạo danh mục mới'
    }. Mời anh/chị xem chi tiết và xác nhận lưu bên dưới nhé!`,
    parsedTransaction: {
      type,
      amount,
      note: note.slice(0, 100),
      payerOrReceiver: '',
      date: new Date().toISOString().split('T')[0],
      matchedCategoryId: matchedCat ? matchedCat.id : null,
      matchedCategoryName: matchedCat ? matchedCat.name : null,
      paymentMethod,
      needsNewCategory,
      suggestedCategory,
    },
  };
}

// AI Endpoint to parse natural language financial instructions
app.post('/api/ai/parse-transaction', async (req, res) => {
  try {
    const { text, mode, currentCategories = [], contextSummary = {} } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ' });
    }

    const categoriesList = Array.isArray(currentCategories) ? currentCategories : [];

    // If Gemini client is not initialized, run fallback parser
    if (!ai) {
      const fallbackResult = fallbackVietnameseParser(text, categoriesList);
      return res.json({ success: true, ...fallbackResult });
    }

    // Call Gemini 3.8 Flash model
    const categoriesContext = categoriesList
      .map((c: any) => `- [${c.type.toUpperCase()}] ID: "${c.id}", Tên: "${c.name}"`)
      .join('\n');

    const prompt = `Bạn là Trợ lý AI Tài chính Thông minh của ứng dụng Quản lý Thu Chi (${mode === 'home' ? 'Sổ Thu Chi Gia Đình' : 'Trường Mầm Non'}).
Nhiệm vụ của bạn là đọc tin nhắn của người dùng bằng tiếng Việt, phân tích xem đây có phải là lệnh ghi nhận thu/chi hay câu hỏi về tài chính, rồi trích xuất các thông tin kế toán chuẩn xác.

Danh sách các danh mục hiện có trong hệ thống:
${categoriesContext}

Thông tin ngữ cảnh hiện tại:
- Tháng hiện tại: ${new Date().toISOString().slice(0, 7)}
- Tổng thu tháng này: ${contextSummary.totalRevenue || 0} đ
- Tổng chi tháng này: ${contextSummary.totalExpense || 0} đ

Tin nhắn của người dùng: "${text}"

Quy tắc phân tích:
1. Xác định "isFinancialAction": true nếu người dùng muốn ghi nhận một khoản thu hoặc chi (ví dụ: "thu tiền học phí 2tr", "chi mua đồ chơi 300k", "vừa mua sữa cho bé 450k", "thu tiền bán trú 1.5 triệu", "trả tiền điện 800k"). Nếu người dùng chỉ chào hỏi hoặc hỏi câu hỏi tổng quát, đặt isFinancialAction = false.
2. "type": 'thu' (nếu là tiền vào, thu, nạp, đóng, học phí...) hoặc 'chi' (nếu là tiền ra, mua sắm, trả lương, chi phí...).
3. "amount": Số tiền nguyên dạng số (VND). Ví dụ: "2tr" -> 2000000, "2.5tr" -> 2500000, "350k" -> 350000, "1 triệu rưỡi" -> 1500000, "500 ngàn" -> 500000.
4. "matchedCategoryId": So sánh với danh sách danh mục hiện có xem có mục nào khớp nhất không (khớp ID). Nếu có, điền ID của danh mục đó và matchedCategoryName là tên danh mục.
5. "needsNewCategory": Nếu không có danh mục nào trong hệ thống thực sự phù hợp với yêu cầu (ví dụ người dùng bảo "thu tiền học phí 2tr" nhưng trong danh mục THU chưa có "Học phí", hoặc người dùng bảo "chi tiền dã ngoại" mà chưa có mục dã ngoại), đặt needsNewCategory = true.
6. "suggestedCategory": Nếu needsNewCategory = true, hãy gợi ý một danh mục mới ngắn gọn, ý nghĩa, có 'name', 'type' (thu/chi), và 'group' (nhóm danh mục).
7. "paymentMethod": 'tien_mat' (mặc định) hoặc 'chuyen_khoan' nếu người dùng nhắc đến chuyển khoản, quét mã, ngân hàng.
8. "payerOrReceiver": Tên người nộp hoặc người nhận nếu có đề cập (ví dụ "phụ huynh bé An", "cô Lan", "chú thợ điện").
9. "date": Ngày thực hiện định dạng YYYY-MM-DD. Mặc định là ngày hôm nay (${new Date().toISOString().split('T')[0]}), trừ khi người dùng nói "hôm qua", "hôm kia", hoặc ngày cụ thể.
10. "aiReply": Câu trả lời phản hồi thân thiện, nhiệt tình bằng tiếng Việt (xưng hô Em - Anh/Chị), tóm tắt rõ số tiền và danh mục đã nhận diện hoặc gợi ý.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFinancialAction: {
              type: Type.BOOLEAN,
              description: 'Whether this message is an instruction to add an income or expense transaction',
            },
            aiReply: {
              type: Type.STRING,
              description: 'Friendly Vietnamese assistant response message to the user',
            },
            parsedTransaction: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  enum: ['thu', 'chi'],
                  description: 'Income (thu) or Expense (chi)',
                },
                amount: {
                  type: Type.NUMBER,
                  description: 'The transaction amount in VND',
                },
                note: {
                  type: Type.STRING,
                  description: 'Short descriptive title/note for the transaction',
                },
                payerOrReceiver: {
                  type: Type.STRING,
                  description: 'Name of the payer, receiver, student, or vendor if mentioned',
                },
                date: {
                  type: Type.STRING,
                  description: 'Date in YYYY-MM-DD format',
                },
                matchedCategoryId: {
                  type: Type.STRING,
                  description: 'ID of matched existing category, or empty string if not matched',
                },
                matchedCategoryName: {
                  type: Type.STRING,
                  description: 'Name of matched existing category',
                },
                paymentMethod: {
                  type: Type.STRING,
                  enum: ['tien_mat', 'chuyen_khoan', 'khac'],
                  description: 'Payment method: tien_mat, chuyen_khoan, or khac',
                },
                needsNewCategory: {
                  type: Type.BOOLEAN,
                  description: 'True if no suitable category exists in current system and user should create new one',
                },
                suggestedCategory: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['thu', 'chi'] },
                    group: { type: Type.STRING },
                  },
                },
              },
            },
          },
          required: ['isFinancialAction', 'aiReply'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('Gemini API Error, falling back to rule parser:', err);
    // Graceful fallback to regex parser
    const fallback = fallbackVietnameseParser(req.body?.text || '', req.body?.currentCategories || []);
    return res.json({
      success: true,
      ...fallback,
      note: 'Processed via local smart parser',
    });
  }
});

// AI Endpoint to scan and OCR invoice / bank transfer slip / receipt image
app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const { image, mode = 'business', currentCategories = [] } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Hình ảnh hóa đơn không hợp lệ' });
    }

    // Extract mimeType and base64Data
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const categoriesList = Array.isArray(currentCategories) ? currentCategories : [];
    const categoriesContext = categoriesList
      .map((c: any) => `- [${(c.type || 'chi').toUpperCase()}] ID: "${c.id}", Tên: "${c.name}"`)
      .join('\n');

    if (!ai) {
      return res.json({
        success: true,
        extracted: {
          type: 'chi',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          payerOrReceiver: '',
          note: 'Hóa đơn / chứng từ tải lên',
          paymentMethod: 'chuyen_khoan',
          referenceCode: '',
          matchedCategoryId: '',
          matchedCategoryName: '',
          aiSummary: 'Đã nhận hình ảnh hóa đơn. Vui lòng kiểm tra và điền số tiền trước khi lưu.',
        },
      });
    }

    const prompt = `Bạn là Trợ lý Kế toán & OCR Hóa đơn / Biên nhận chuyển khoản của phần mềm Quản lý Thu Chi (${mode === 'home' ? 'Sổ Thu Chi Gia Đình' : 'Trường Mầm Non'}).
Nhiệm vụ của bạn là đọc kỹ bức ảnh được gửi kèm (hóa đơn bán lẻ, biên lai chuyển khoản ngân hàng, thông báo biến động số dư, bill thanh toán, phiếu thu, phiếu chi, hoặc biên lai học phí).
Hãy phân tích cẩn thận các thông tin trên ảnh và trích xuất dữ liệu kế toán chuẩn xác.

Danh sách danh mục có sẵn trong hệ thống:
${categoriesContext}

Quy tắc trích xuất:
1. "amount": Số tiền thanh toán / số tiền chuyển khoản (VND) dạng số nguyên. Hãy tìm dòng ghi số tiền lớn nhất hoặc số tiền thực trả/giao dịch thành công (ví dụ: "Số tiền: 1,500,000 VND" -> 1500000).
2. "type":
   - 'thu': nếu là tiền nhận vào, học phí nộp vào, phụ huynh đóng tiền, hoặc biên lai ghi 'Chuyển tiền đến / Nhận tiền'.
   - 'chi': nếu là tiền chuyển đi, mua hàng siêu thị, nhà hàng, thanh toán tiền điện, hóa đơn mua đồ, phiếu chi.
3. "date": Ngày giao dịch dạng YYYY-MM-DD. Nếu trên biên nhận có ngày giờ (VD: 11/10/2026), hãy chuyển thành YYYY-MM-DD. Nếu không thấy rõ, lấy ngày hôm nay: ${new Date().toISOString().split('T')[0]}.
4. "payerOrReceiver":
   - Nếu là 'thu': Tên người chuyển / phụ huynh / học sinh / người nộp.
   - Nếu là 'chi': Tên người thụ hưởng, tên cửa hàng, siêu thị, nhà cung cấp, hoặc người nhận.
5. "note": Nội dung chuyển khoản hoặc tóm tắt các món hàng mua / lý do thanh toán (VD: "Đóng học phí tháng 10 bé Mai", "Mua sữa và thực phẩm tươi sống", "Tiền điện tháng 10").
6. "paymentMethod": 'chuyen_khoan' nếu là màn hình ngân hàng / VietQR / Napas / Internet Banking; 'tien_mat' nếu là phiếu thu tiền mặt đóng dấu; 'khac' nếu khác.
7. "referenceCode": Mã giao dịch, mã tham chiếu, mã FT, hoặc số hóa đơn (nếu có trên ảnh).
8. "matchedCategoryId": So khớp với danh sách danh mục hiện có để chọn ID danh mục phù hợp nhất.
9. "matchedCategoryName": Tên danh mục tương ứng.
10. "aiSummary": Một câu mô tả tóm tắt ngắn gọn bằng tiếng Việt về chứng từ này (VD: "Biên nhận chuyển khoản 1.200.000đ cho Tiền điện tháng 10 qua MB Bank").`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: {
              type: Type.NUMBER,
              description: 'Transaction amount in VND (integer)',
            },
            type: {
              type: Type.STRING,
              enum: ['thu', 'chi'],
              description: 'Income (thu) or expense (chi)',
            },
            date: {
              type: Type.STRING,
              description: 'Date in YYYY-MM-DD format',
            },
            payerOrReceiver: {
              type: Type.STRING,
              description: 'Payer, receiver, student, or vendor name',
            },
            note: {
              type: Type.STRING,
              description: 'Transaction content or note',
            },
            referenceCode: {
              type: Type.STRING,
              description: 'Bank reference code or invoice number',
            },
            paymentMethod: {
              type: Type.STRING,
              enum: ['chuyen_khoan', 'tien_mat', 'khac'],
              description: 'Payment method',
            },
            matchedCategoryId: {
              type: Type.STRING,
              description: 'ID of matched category from existing list',
            },
            matchedCategoryName: {
              type: Type.STRING,
              description: 'Name of matched category',
            },
            aiSummary: {
              type: Type.STRING,
              description: 'Short Vietnamese summary of detected bill/receipt',
            },
          },
          required: ['amount', 'type', 'date'],
        },
      },
    });

    const extracted = JSON.parse(response.text || '{}');
    return res.json({ success: true, extracted });
  } catch (err: any) {
    console.error('Error scanning receipt with Gemini:', err);
    return res.json({
      success: true,
      extracted: {
        type: 'chi',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        payerOrReceiver: '',
        note: 'Hóa đơn / chứng từ tải lên',
        paymentMethod: 'chuyen_khoan',
        referenceCode: '',
        matchedCategoryId: '',
        matchedCategoryName: '',
        aiSummary: 'Đã nhận hình ảnh hóa đơn. Vui lòng kiểm tra và điền số tiền trước khi lưu.',
      },
      warning: 'Không thể nhận diện tự động, vui lòng kiểm tra lại thông tin.',
    });
  }
});

// Serve frontend in dev or prod
async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start' ||
    __dirname.endsWith('dist');

  // Locate the built frontend directory
  const distPath = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'))
    ? path.resolve(__dirname, 'dist')
    : fs.existsSync(path.resolve(__dirname, 'index.html'))
    ? __dirname
    : path.resolve(process.cwd(), 'dist');

  const indexHtmlPath = path.resolve(distPath, 'index.html');

  if (isProduction && fs.existsSync(indexHtmlPath)) {
    console.log(`Serving static production build from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.log('Starting Vite development middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finance AI Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
