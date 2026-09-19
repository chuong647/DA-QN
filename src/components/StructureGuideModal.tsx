import React from 'react';
import { X, CheckCircle2, FileSpreadsheet, Copy } from 'lucide-react';

interface StructureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StructureGuideModal: React.FC<StructureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              TC
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Quy Chuẩn Cấu Trúc Trích Yếu Hồ Sơ
              </h3>
              <p className="text-xs text-slate-500">
                Cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-700">
          {/* Cấu trúc chuẩn */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              1. Công thức cấu trúc trích yếu hồ sơ:
            </span>
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-950 font-medium font-mono text-xs leading-relaxed">
              Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên + Tên cá nhân + ngày sinh + Nơi thường trú
            </div>
          </div>

          {/* Quy tắc quan trọng */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              2. Các quy tắc bắt buộc:
            </span>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Đọc kỹ các văn bản in một cách chính xác nhất:</strong>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hệ thống tập trung đọc kỹ lưỡng các văn bản in vi tính, văn bản đánh máy, phôi quyết định in sẵn, danh sách in, bảo đảm chuẩn xác 100% từng ký tự, dấu tiếng Việt, họ tên, ngày sinh và địa chỉ nơi thường trú.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Phân tách bằng dấu phẩy (comma):</strong>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Các trường thông tin trong trích yếu hồ sơ được ngăn cách bằng dấu phẩy theo đúng quy định lưu trữ (Ví dụ: <em>... học sinh, sinh viên Nguyễn Văn An, sinh ngày 15/08/2002, nơi thường trú Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội</em>).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Quy cách viết hoa tên cá nhân:</strong>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tên cá nhân <strong>chỉ viết hoa chữ cái đầu</strong> của mỗi từ (Title Case: <em>Nguyễn Văn An</em>), tuyệt đối không viết hoa toàn bộ như <em>NGUYỄN VĂN AN</em>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Mỗi trang văn bản là 1 trích yếu hồ sơ:</strong>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mỗi trang trong tệp PDF khi bóc tách sẽ tự động sinh ra một hàng tương ứng với 1 trích yếu hồ sơ độc lập, sắp xếp thứ tự từ trên xuống theo trang.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-blue-50/60 rounded-lg border border-blue-200">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-950">Cột Số hồ sơ và Tính năng sao chép 2 cột:</strong>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Số hồ sơ được trích xuất trực tiếp từ văn bản (dạng ví dụ <code>KT/ƯĐGD-01</code>). Nút <strong>&ldquo;Sao chép cột Số hồ sơ & Trích yếu&rdquo;</strong> sẽ sao chép đồng thời cả 2 cột (phân tách bằng Tab) để khi dán vào Excel sẽ tự động nhảy đều vào 2 cột riêng biệt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ví dụ mẫu kết quả */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              3. Ví dụ trích yếu hồ sơ hoàn chỉnh:
            </span>
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-xs text-slate-800 leading-relaxed font-sans font-medium">
              &ldquo;Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên Nguyễn Văn An, sinh ngày 15/08/2002, nơi thường trú Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội&rdquo;
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
