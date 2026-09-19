import React, { useRef, useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { ProcessingProgress } from '../types';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  progress: ProcessingProgress;
  onCancel?: () => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelected,
  progress,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        onFileSelected(file);
      } else {
        alert('Vui lòng chọn tệp định dạng PDF hoặc ảnh tài liệu scan (JPG, PNG)');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 transition-all">
      {progress.isProcessing ? (
        <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Đang đọc kỹ văn bản in & bóc tách trang...
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-md">
            {progress.statusText || `Đang xử lý ${progress.currentFileName} (Trang ${progress.currentPage}/${progress.totalPages})`}
          </p>

          {/* Progress bar */}
          <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${progress.totalPages > 0 ? (progress.currentPage / progress.totalPages) * 100 : 15}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between w-full max-w-md text-[11px] text-slate-500">
            <span>Tiến độ: Trang {progress.currentPage} / {progress.totalPages || '...'}</span>
            <span>{progress.totalPages > 0 ? `${Math.round((progress.currentPage / progress.totalPages) * 100)}%` : 'Đang khởi tạo...'}</span>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-3 py-1 text-xs text-slate-600 hover:text-slate-800 underline cursor-pointer"
            >
              Hủy bỏ tiến trình
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vùng kéo thả */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
              Kéo & thả tệp PDF tài liệu vào đây hoặc <span className="text-blue-600 underline">chọn từ máy tính</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-3">
              Hỗ trợ tệp PDF nhiều trang, tài liệu in scan, quyết định, danh sách học sinh sinh viên. Hệ thống đọc kỹ lưỡng các văn bản in một cách chính xác nhất và tạo trích yếu hồ sơ chuẩn hóa.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200">
                <FileText className="w-3 h-3 text-blue-500" /> Tệp PDF nhiều trang
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200">
                <ImageIcon className="w-3 h-3 text-indigo-500" /> Ảnh scan văn bản in
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Đọc kỹ văn bản in chính xác
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 font-medium">
                <Sparkles className="w-3 h-3 text-violet-600" /> AI: Gemini 3.6 Flash
              </span>
            </div>
          </div>

          {/* Ghi chú hướng dẫn quy chuẩn */}
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Cấu trúc trích yếu hồ sơ phân tách dấu phẩy: Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên [Tên cá nhân], [ngày sinh], [Nơi thường trú].</span>
          </div>
        </div>
      )}
    </div>
  );
};
