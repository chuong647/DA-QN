import React from 'react';
import { FileText, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  recordCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide, recordCount }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Bóc Tách Trích Yếu Hồ Sơ Cấp Sổ Ưu Đãi GD&ĐT
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Đọc Kỹ Văn Bản In Chính Xác
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                <Sparkles className="w-3 h-3 text-violet-600" />
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Đọc chuẩn xác văn bản in từng trang PDF, tự động tạo trích yếu hồ sơ phân tách dấu phẩy & xuất Excel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã xử lý: <strong>{recordCount}</strong> hồ sơ</span>
          </div>

          <button
            id="btn-open-guide"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Quy chuẩn trích yếu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
