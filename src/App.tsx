import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadDropzone } from './components/UploadDropzone';
import { DataTable } from './components/DataTable';
import { DetailModal } from './components/DetailModal';
import { StructureGuideModal } from './components/StructureGuideModal';
import { BinhBinhRecord, ProcessingProgress, generateProfileTitle, toTitleCase } from './types';
import { extractPagesFromPdf, processImageFile } from './utils/pdfProcessor';
import { CheckCircle2, AlertTriangle, Plus, FileSpreadsheet, Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  // Danh sách hồ sơ bắt đầu rỗng theo yêu cầu xóa bảng mẫu của người dùng
  const [records, setRecords] = useState<BinhBinhRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BinhBinhRecord | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [progress, setProgress] = useState<ProcessingProgress>({
    currentPage: 0,
    totalPages: 0,
    currentFileName: '',
    isProcessing: false,
    statusText: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Xử lý tệp được người dùng chọn (PDF hoặc Ảnh)
  const handleFileSelected = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      alert('Vui lòng chọn tệp PDF hoặc ảnh scan tài liệu (JPG, PNG)');
      return;
    }

    setProgress({
      currentPage: 0,
      totalPages: 1,
      currentFileName: file.name,
      isProcessing: true,
      statusText: isPdf ? 'Đang trích xuất từng trang PDF thành hình ảnh độ nét cao...' : 'Đang xử lý ảnh tài liệu...',
    });

    try {
      let pagesToProcess: { pageNumber: number; dataUrl: string }[] = [];

      if (isPdf) {
        pagesToProcess = await extractPagesFromPdf(file, (current, total) => {
          setProgress((prev) => ({
            ...prev,
            currentPage: current,
            totalPages: total,
            statusText: `Đã trích xuất ${current}/${total} trang từ tệp ${file.name}...`,
          }));
        });
      } else {
        const singlePage = await processImageFile(file);
        pagesToProcess = [{ pageNumber: 1, dataUrl: singlePage.dataUrl }];
      }

      const totalPages = pagesToProcess.length;
      showToast(`Bắt đầu OCR bóc tách ${totalPages} trang văn bản bằng Gemini 3.6 Flash...`);

      const newExtractedRecords: BinhBinhRecord[] = [];

      // Xử lý OCR từng trang một cách tuần tự và hiển thị kết quả dần lên bảng
      for (let i = 0; i < totalPages; i++) {
        const pageItem = pagesToProcess[i];
        const pageNum = pageItem.pageNumber;

        // Giãn cách ngắn giữa các trang để tránh nghẽn tải hoặc rate limit
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        setProgress({
          currentPage: pageNum,
          totalPages,
          currentFileName: file.name,
          isProcessing: true,
          statusText: `Đang nhận diện OCR trang ${pageNum}/${totalPages} bằng Gemini 3.6 Flash...`,
        });

        try {
          // Thử gửi yêu cầu với cơ chế retry tự động
          let res: Response | null = null;
          let lastFetchError: any = null;

          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              res = await fetch('/api/ocr-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageBase64: pageItem.dataUrl,
                  mimeType: 'image/jpeg',
                  fileName: file.name,
                  pageNumber: pageNum,
                }),
              });

              if (res.ok) {
                break;
              } else {
                const errorData = await res.json().catch(() => ({}));
                const errMsg = errorData.error || `Lỗi máy chủ (${res.status})`;
                lastFetchError = new Error(errMsg);

                if (attempt < 3) {
                  setProgress((prev) => ({
                    ...prev,
                    statusText: `Máy chủ AI đang điều phối, tự động thử lại trang ${pageNum} (lần ${attempt}/3)...`,
                  }));
                  await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
                }
              }
            } catch (netErr: any) {
              lastFetchError = netErr;
              if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
              }
            }
          }

          if (!res || !res.ok) {
            throw lastFetchError || new Error('Không thể kết nối đến dịch vụ OCR');
          }

          const ocrResult = await res.json();

          // Chuẩn hóa tên viết hoa chữ cái đầu và tạo trích yếu chuẩn
          const normalizedName = toTitleCase(ocrResult.fullName || `Học Sinh Trang ${pageNum}`);
          const permResidence = ocrResult.permanentResidence || ocrResult.residence || '';
          const formattedTitle =
            ocrResult.formattedTitle ||
            generateProfileTitle({
              fullName: normalizedName,
              birthDate: ocrResult.birthDate,
              permanentResidence: permResidence,
            });

          const record: BinhBinhRecord = {
            id: `rec-${Date.now()}-${pageNum}-${Math.random().toString(36).substr(2, 5)}`,
            pageNumber: pageNum,
            fileName: file.name,
            previewUrl: pageItem.dataUrl,
            recordNumber: ocrResult.recordNumber || `KT/ƯĐGD-${String(pageNum).padStart(2, '0')}`,
            fullName: normalizedName,
            birthDate: ocrResult.birthDate || '',
            permanentResidence: permResidence,
            residence: permResidence,
            formattedTitle,
            documentType: ocrResult.documentType || 'Văn bản in cấp sổ ưu đãi GD&ĐT',
            printNotes: ocrResult.printNotes || 'Văn bản in rõ nét',
            fullExtractedText: ocrResult.fullExtractedText || '',
            confidence: ocrResult.confidence || 'high',
            aiModel: ocrResult.aiModel || 'gemini-3.6-flash',
            status: 'completed',
          };

          newExtractedRecords.push(record);
          // Cập nhật real-time vào bảng, luôn sắp xếp thứ tự từ trên xuống theo số trang (Trang 1, 2, 3...)
          setRecords((prev) => {
            const updated = [...prev, record];
            return updated.sort((a, b) => a.pageNumber - b.pageNumber);
          });
        } catch (pageError: any) {
          console.error(`Lỗi OCR trang ${pageNum}:`, pageError);
          // Vẫn tạo record với thông báo lỗi để người dùng có thể đối chiếu và nhập thủ công
          const errorRecord: BinhBinhRecord = {
            id: `rec-err-${Date.now()}-${pageNum}`,
            pageNumber: pageNum,
            fileName: file.name,
            previewUrl: pageItem.dataUrl,
            recordNumber: `KT/ƯĐGD-${String(pageNum).padStart(2, '0')}`,
            fullName: `Học Sinh Trang ${pageNum}`,
            birthDate: '',
            permanentResidence: '',
            residence: '',
            formattedTitle: `Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên Học Sinh Trang ${pageNum}, chưa rõ ngày sinh, nơi thường trú chưa rõ`,
            documentType: 'Cần kiểm tra văn bản in',
            printNotes: `Gặp lỗi OCR: ${pageError.message}`,
            fullExtractedText: '',
            confidence: 'low',
            aiModel: 'gemini-3.6-flash',
            status: 'error',
            errorMessage: pageError.message,
          };
          setRecords((prev) => {
            const updated = [...prev, errorRecord];
            return updated.sort((a, b) => a.pageNumber - b.pageNumber);
          });
        }
      }

      setProgress({
        currentPage: totalPages,
        totalPages,
        currentFileName: file.name,
        isProcessing: false,
        statusText: `Hoàn tất bóc tách ${totalPages} trang!`,
      });

      showToast(`Đã hoàn tất bóc tách thành công ${totalPages} trang hồ sơ!`);
    } catch (err: any) {
      console.error('Lỗi khi bóc tách tệp:', err);
      alert(`Có lỗi xảy ra: ${err.message || 'Không thể xử lý tệp'}`);
      setProgress((prev) => ({
        ...prev,
        isProcessing: false,
        statusText: `Lỗi: ${err.message}`,
      }));
    }
  };

  // Cập nhật record sau khi chỉnh sửa
  const handleUpdateRecord = (updated: BinhBinhRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast('Đã lưu các thay đổi của hồ sơ');
  };

  // Xóa 1 record
  const handleDeleteRecord = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa dòng hồ sơ này?')) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast('Đã xóa 1 dòng hồ sơ');
    }
  };

  // Xóa tất cả
  const handleClearAll = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách hồ sơ hiện tại?')) {
      setRecords([]);
      showToast('Đã dọn dẹp danh sách');
    }
  };

  // Thêm một dòng thủ công
  const handleAddNewRow = () => {
    const newPageNum = records.length + 1;
    const newRecord: BinhBinhRecord = {
      id: `manual-${Date.now()}`,
      pageNumber: newPageNum,
      fileName: 'Van_Ban_In.pdf',
      previewUrl: '',
      recordNumber: `KT/ƯĐGD-${String(newPageNum).padStart(2, '0')}`,
      fullName: 'Nguyễn Văn An',
      birthDate: '15/08/2002',
      permanentResidence: 'Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội',
      residence: 'Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội',
      formattedTitle: generateProfileTitle({
        fullName: 'Nguyễn Văn An',
        birthDate: '15/08/2002',
        permanentResidence: 'Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội',
      }),
      documentType: 'Quyết định cấp sổ ưu đãi giáo dục, đào tạo',
      printNotes: 'Văn bản in vi tính / Nhập thủ công',
      fullExtractedText: '',
      confidence: 'high',
      status: 'completed',
    };

    setRecords((prev) => {
      const updated = [...prev, newRecord];
      return updated.sort((a, b) => a.pageNumber - b.pageNumber);
    });
    setSelectedRecord(newRecord);
    showToast('Đã thêm 1 hồ sơ mới, vui lòng cập nhật thông tin');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased font-sans">
      {/* Header */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        recordCount={records.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner giới thiệu nhanh & tóm tắt cấu trúc trích yếu hồ sơ */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-700/80 text-[11px] font-semibold tracking-wide uppercase border border-blue-500/50">
                  Chuẩn hóa Lưu trữ Văn thư
                </span>
                <span className="text-xs text-blue-200">Đọc kỹ & chính xác văn bản in từng trang</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Cấu trúc trích yếu hồ sơ cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên
              </h2>
              <p className="text-xs text-blue-100 font-mono bg-slate-950/70 p-2.5 rounded border border-blue-700/50 leading-relaxed">
                Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên [Tên cá nhân], [ngày sinh], [Nơi thường trú]
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <button
                id="btn-quick-add"
                onClick={handleAddNewRow}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white text-blue-950 hover:bg-blue-50 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm thủ công</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upload dropzone */}
        <UploadDropzone
          onFileSelected={handleFileSelected}
          progress={progress}
          onCancel={() =>
            setProgress((prev) => ({
              ...prev,
              isProcessing: false,
              statusText: 'Đã dừng xử lý.',
            }))
          }
        />

        {/* Data Table */}
        <DataTable
          records={records}
          onSelectRecord={(rec) => setSelectedRecord(rec)}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAll}
          onAddNewRow={handleAddNewRow}
          onUpdateRecord={handleUpdateRecord}
        />
      </main>

      {/* Side-by-Side Detail & Verification Modal */}
      {selectedRecord && (
        <DetailModal
          record={selectedRecord}
          isOpen={true}
          onClose={() => setSelectedRecord(null)}
          onSave={handleUpdateRecord}
        />
      )}

      {/* Guide Modal */}
      {isGuideOpen && (
        <StructureGuideModal
          isOpen={true}
          onClose={() => setIsGuideOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-xl flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
