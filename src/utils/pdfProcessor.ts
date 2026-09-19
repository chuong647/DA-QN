import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình Worker cho PDF.js để tránh lỗi trong trình duyệt
try {
  if (typeof window !== 'undefined') {
    // Sử dụng CDN chính thức của pdfjs-dist tương ứng hoặc fallback
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker initialization notice:', e);
}

export interface ExtractedPage {
  pageNumber: number;
  dataUrl: string; // JPEG Data URL
  width: number;
  height: number;
}

/**
 * Trích xuất toàn bộ các trang trong tệp PDF thành danh sách ảnh chất lượng cao
 * Đảm bảo độ phân giải sắc nét (scale 2.0) để nhận diện chính xác chữ viết tay bút mực, bút bi
 */
export async function extractPagesFromPdf(
  file: File,
  onPageProgress?: (current: number, total: number) => void
): Promise<ExtractedPage[]> {
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: ExtractedPage[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onPageProgress) {
      onPageProgress(pageNum, totalPages);
    }

    const page = await pdf.getPage(pageNum);
    // Scale 2.0 để chữ viết tay rõ ràng, không bị vỡ hạt
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) {
      throw new Error('Không thể khởi tạo Canvas 2D');
    }

    // Vẽ trang PDF lên canvas
    await page.render({
      canvasContext,
      viewport,
      canvas,
    } as any).promise;

    // Chuyển sang dạng JPEG chất lượng 92%
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    pages.push({
      pageNumber: pageNum,
      dataUrl,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}

/**
 * Chuyển tệp ảnh đơn lẻ (JPG, PNG) thành trang chuẩn để đưa vào bộ OCR
 */
export async function processImageFile(file: File): Promise<ExtractedPage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        resolve({
          pageNumber: 1,
          dataUrl,
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Lỗi khi tải tệp ảnh'));
    reader.readAsDataURL(file);
  });
}
