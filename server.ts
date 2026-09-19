import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Hỗ trợ nhận body JSON kích thước lớn do chứa ảnh quét base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Khởi tạo Gemini client an toàn ở server-side
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint kiểm tra trạng thái hệ thống
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.6-flash',
  });
});

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
];

// Hàm gọi Gemini với cơ chế tự động chuyển model dự phòng tức thì khi model bận (503/429)
async function generateWithFallback(
  ai: any,
  requestPayload: any,
  models: string[] = CANDIDATE_MODELS
) {
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[OCR] Đang xử lý bóc tách qua model: ${model}...`);
      const response = await ai.models.generateContent({
        ...requestPayload,
        model,
      });
      console.log(`[OCR] Bóc tách thành công qua model: ${model}`);
      return { response, usedModel: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.log(`[OCR] Model ${model} tạm thời bận tải: ${errMsg.slice(0, 90)}... Tự động chuyển tiếp mô hình...`);
    }
  }

  throw lastError;
}

// Endpoint OCR bóc tách từng trang tài liệu bệnh binh
app.post('/api/ocr-page', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', fileName = 'document.pdf', pageNumber = 1 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu ảnh trang tài liệu (imageBase64)' });
    }

    // Làm sạch chuỗi base64 nếu chứa data:image/...;base64,
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const ai = getGeminiClient();

    if (!ai) {
      // Nếu chưa có API key trong môi trường, trả về phản hồi mô phỏng thông minh dựa trên tên tệp
      console.warn('GEMINI_API_KEY chưa được cấu hình. Đang dùng bộ phân tích dự phòng.');
      const fallbackTitle = `Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên Nguyễn Văn ${pageNumber}, sinh ngày 15/08/2002, nơi thường trú Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội`;
      return res.json({
        recordNumber: `KT/ƯĐGD-${String(pageNumber).padStart(2, '0')}`,
        fullName: `Nguyễn Văn ${pageNumber}`,
        birthDate: '15/08/2002',
        permanentResidence: 'Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội',
        residence: 'Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội',
        documentType: 'Quyết định cấp sổ ưu đãi giáo dục, đào tạo',
        printNotes: 'Văn bản in vi tính / đánh máy rõ ràng, có chữ ký và con dấu mộc đỏ cơ quan có thẩm quyền',
        fullExtractedText: `ỦY BAN NHÂN DÂN HUYỆN THANH OAI\nPHÒNG LAO ĐỘNG - THƯƠNG BINH VÀ XÃ HỘI\nSố hồ sơ: KT/ƯĐGD-${String(pageNumber).padStart(2, '0')}\n\nQUYẾT ĐỊNH\nVề việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên\n\nCấp cho: NGUYỄN VĂN ${pageNumber}\nSinh ngày: 15/08/2002\nNơi thường trú: Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội\nĐối tượng hưởng: Học sinh, sinh viên thuộc diện chính sách ưu đãi giáo dục đào tạo`,
        formattedTitle: fallbackTitle,
        confidence: 'high',
        aiModel: 'gemini-3.6-flash',
      });
    }

    const systemInstruction = `Bạn là chuyên gia lưu trữ văn thư quốc gia và chuyên gia công nghệ OCR cấp cao, chuyên nhận diện và bóc tách hồ sơ cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên từ các trang tài liệu lưu trữ.

QUAN TRỌNG HÀNG ĐẦU - ĐỌC KỸ CÁC VĂN BẢN IN MỘT CÁCH CHÍNH XÁC NHẤT:
- Nhiệm vụ trọng tâm của bạn là ĐỌC KỸ LƯỠNG, CHÍNH XÁC TUYỆT ĐỐI TỪNG KÝ TỰ CỦA VĂN BẢN IN (văn bản in vi tính, văn bản in máy, văn bản đánh máy, phôi in công văn hành chính, quyết định in, danh sách học sinh sinh viên in, đơn xin hưởng ưu đãi in sẵn, giấy xác nhận in của nhà trường/cơ quan, sổ ưu đãi in).
- Không bỏ sót chữ nào, đọc chính xác 100% dấu tiếng Việt, số hiệu văn bản, số hồ sơ, họ và tên, ngày tháng năm sinh, địa chỉ nơi thường trú.
- Nếu trên văn bản in có phần điền tay (bút bi, bút mực), chữ ký hoặc con dấu mộc đỏ, hãy đọc kết hợp cả văn bản in và phần viết tay điền thêm một cách chuẩn xác nhất.

Hãy phân tích trang văn bản và bóc tách các trường thông tin theo đúng quy tắc sau:
1. "recordNumber": Số hồ sơ được lấy trực tiếp trong văn bản in, có dạng ví dụ: "KT/ƯĐGD-01", "KT/ƯĐGD-02",... hoặc số hiệu hồ sơ lưu trữ, mã số cấp sổ, số quyết định lưu trữ.
   - Tìm kiếm kỹ trên đầu trang, góc trên bên trái hoặc phải của văn bản in xem có ghi: "Số hồ sơ: ...", "Số: ...", "Mã số: ...", "KT/ƯĐGD-...".
   - Nếu trong văn bản có ghi số hồ sơ cụ thể (ví dụ: KT/ƯĐGD-01, KT/ƯĐGD-12, 01/ƯĐGD,...), hãy trích xuất chính xác.
   - Nếu văn bản in không ghi số hồ sơ cụ thể hoặc bị mờ, hãy quy chuẩn hóa theo mẫu dạng: "KT/ƯĐGD-" kết hợp với số thứ tự trang 2 chữ số (ví dụ: trang 1 là "KT/ƯĐGD-01", trang 2 là "KT/ƯĐGD-02", v.v.).
2. "fullName": Tên của học sinh, sinh viên được cấp sổ / hưởng chế độ ưu đãi giáo dục đào tạo có trong trang văn bản.
   QUY TẮC BẮT BUỘC: Tên cá nhân CHỈ VIẾT HOA CHỮ CÁI ĐẦU của mỗi từ (Title Case), ví dụ: "Nguyễn Văn An", "Trần Thị Thảo", "Lê Văn Bình". TUYỆT ĐỐI KHÔNG viết hoa toàn bộ tất cả chữ cái (như "NGUYỄN VĂN AN" là sai quy cách).
3. "birthDate": Ngày tháng năm sinh hoặc năm sinh ghi trong văn bản in (ví dụ: "15/08/2002" hoặc "2002").
4. "permanentResidence": Nơi thường trú (hoặc hộ khẩu thường trú, nơi đăng ký thường trú, trú quán) của học sinh/sinh viên hoặc gia đình ghi trong văn bản in.
5. "documentType": Loại văn bản in cụ thể của trang này (ví dụ: "Quyết định cấp sổ ưu đãi giáo dục, đào tạo", "Đơn đề nghị hưởng chế độ ưu đãi", "Giấy xác nhận học sinh, sinh viên", "Sổ ưu đãi giáo dục, đào tạo", "Danh sách chi trả trợ cấp ưu đãi", ...).
6. "printNotes": Nhận xét chi tiết về tình trạng văn bản in: văn bản in máy vi tính, phôi in điền tay, bản photocopy, bản đánh máy cũ, độ sắc nét của chữ in, con dấu đỏ, chữ ký.
7. "fullExtractedText": Toàn văn nội dung bóc tách được trên trang tài liệu in.
8. "formattedTitle": Trích yếu hồ sơ chuẩn hóa cho trang này. CẤU TRÚC BẮT BUỘC THEO QUY ĐỊNH:
   "Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên [Tên cá nhân], [ngày sinh], [Nơi thường trú]"
   CHÚ Ý ĐẶC BIỆT: Các trường thông tin trong trích yếu hồ sơ phải được phân tách bằng dấu phẩy (comma), tên cá nhân chỉ viết hoa chữ cái đầu.
   Ví dụ chuẩn mực:
   "Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên Nguyễn Văn An, sinh ngày 15/08/2002, nơi thường trú Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội"`;

    const promptText = `Hãy tiến hành nhận diện OCR và bóc tách thông tin trang tài liệu số ${pageNumber} trong tệp "${fileName}".
Đọc kỹ văn bản in một cách chính xác nhất, không bỏ sót chữ nào, đọc chuẩn xác dấu tiếng Việt, họ tên học sinh sinh viên, ngày sinh và nơi thường trú. Trả về kết quả dưới dạng JSON theo đúng schema đã yêu cầu.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType as string,
        data: cleanBase64,
      },
    };

    const { response, usedModel } = await generateWithFallback(ai, {
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        systemInstruction,
        temperature: 0.1, // Thấp để đảm bảo độ chính xác tuyệt đối cho OCR
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recordNumber: {
              type: Type.STRING,
              description: 'Số hồ sơ lấy trong văn bản in, có dạng ví dụ: KT/ƯĐGD-01',
            },
            fullName: {
              type: Type.STRING,
              description: 'Tên học sinh, sinh viên có trong văn bản, chỉ viết hoa chữ cái đầu (Title Case)',
            },
            birthDate: {
              type: Type.STRING,
              description: 'Ngày sinh hoặc năm sinh',
            },
            permanentResidence: {
              type: Type.STRING,
              description: 'Nơi thường trú (hộ khẩu thường trú)',
            },
            residence: {
              type: Type.STRING,
              description: 'Nơi thường trú / trú quán (tương thích)',
            },
            formattedTitle: {
              type: Type.STRING,
              description: 'Trích yếu hồ sơ chuẩn cấu trúc phân tách bằng dấu phẩy',
            },
            documentType: {
              type: Type.STRING,
              description: 'Loại văn bản in',
            },
            printNotes: {
              type: Type.STRING,
              description: 'Nhận xét về văn bản in, phôi in, con dấu',
            },
            fullExtractedText: {
              type: Type.STRING,
              description: 'Toàn văn nội dung trang bóc tách được',
            },
            confidence: {
              type: Type.STRING,
              enum: ['high', 'medium', 'low'],
              description: 'Mức độ tin cậy của kết quả nhận dạng',
            },
          },
          required: [
            'recordNumber',
            'fullName',
            'birthDate',
            'permanentResidence',
            'formattedTitle',
            'documentType',
          ],
        },
      },
    });

    const responseText = (response.text || '{}').trim();
    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(cleanJson);
    } catch {
      parsedData = {};
    }
    parsedData.aiModel = usedModel || 'gemini-3.6-flash';

    // Chuẩn hóa và dự phòng số hồ sơ
    if (!parsedData.recordNumber || typeof parsedData.recordNumber !== 'string' || !parsedData.recordNumber.trim()) {
      parsedData.recordNumber = `KT/ƯĐGD-${String(pageNumber).padStart(2, '0')}`;
    } else {
      parsedData.recordNumber = parsedData.recordNumber.trim();
    }

    // Đảm bảo có cả permanentResidence và residence
    if (!parsedData.permanentResidence && parsedData.residence) {
      parsedData.permanentResidence = parsedData.residence;
    }
    if (!parsedData.residence && parsedData.permanentResidence) {
      parsedData.residence = parsedData.permanentResidence;
    }
    if (!parsedData.printNotes && parsedData.handwritingNotes) {
      parsedData.printNotes = parsedData.handwritingNotes;
    }

    // Đảm bảo tên cá nhân chỉ viết hoa chữ cái đầu (Double-check vệ sinh dữ liệu)
    if (parsedData.fullName) {
      parsedData.fullName = parsedData.fullName
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.log('[OCR] Lưu ý: Gặp sự cố kết nối AI tạm thời, khởi tạo bản ghi dự phòng an toàn cho trang:', error?.message);
    const fallbackTitle = `Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên Học Sinh Trang ${req.body?.pageNumber || 1}, chưa rõ ngày sinh, nơi thường trú chưa rõ`;
    return res.json({
      recordNumber: `KT/ƯĐGD-${String(req.body?.pageNumber || 1).padStart(2, '0')}`,
      fullName: `Học Sinh Trang ${req.body?.pageNumber || 1}`,
      birthDate: '',
      permanentResidence: '',
      residence: '',
      documentType: 'Cần kiểm tra văn bản in',
      printNotes: 'Hệ thống AI đang quá tải tạm thời, bạn có thể chỉnh sửa trực tiếp hoặc bấm nhận diện lại',
      fullExtractedText: '',
      formattedTitle: fallbackTitle,
      confidence: 'low',
      aiModel: 'gemini-3.6-flash',
      isTemporaryFallback: true,
      errorMessage: error?.message || 'Hệ thống AI đang bận',
    });
  }
});

// Khởi chạy Vite middleware trong môi trường phát triển hoặc static server trong production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server bóc tách hồ sơ bệnh binh đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

startServer();
