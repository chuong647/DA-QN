import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  Eye,
  Trash2,
  Search,
  Plus,
  ArrowUpDown,
  FileText,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { BinhBinhRecord, toTitleCase } from '../types';
import { exportToExcel, copyRecordNumberAndTitlesToClipboard, copyTableAsTsv } from '../utils/excelExport';

interface DataTableProps {
  records: BinhBinhRecord[];
  onSelectRecord: (record: BinhBinhRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onAddNewRow: () => void;
  onUpdateRecord: (updated: BinhBinhRecord) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
  onAddNewRow,
  onUpdateRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedColumn, setCopiedColumn] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  // Sắp xếp thứ tự kết quả từ trên xuống theo số trang (Trang 1, Trang 2, Trang 3...)
  const sortedRecords = [...records].sort((a, b) => a.pageNumber - b.pageNumber);

  // Lọc theo từ khóa tìm kiếm
  const filteredRecords = sortedRecords.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (r.recordNumber || '').toLowerCase().includes(term) ||
      r.fullName.toLowerCase().includes(term) ||
      (r.permanentResidence || '').toLowerCase().includes(term) ||
      (r.residence || '').toLowerCase().includes(term) ||
      r.formattedTitle.toLowerCase().includes(term) ||
      r.documentType.toLowerCase().includes(term) ||
      r.fileName.toLowerCase().includes(term)
    );
  });

  // Sao chép cột Số hồ sơ & Trích yếu hồ sơ (Để dán trực tiếp vào 2 cột trong Excel)
  const handleCopyColumnTitles = async () => {
    const success = await copyRecordNumberAndTitlesToClipboard(filteredRecords);
    if (success) {
      setCopiedColumn(true);
      setTimeout(() => setCopiedColumn(false), 2500);
    }
  };

  // Sao chép toàn bộ bảng dưới dạng TSV để dán trực tiếp vào Excel
  const handleCopyTableTsv = async () => {
    const success = await copyTableAsTsv(filteredRecords);
    if (success) {
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2500);
    }
  };

  // Sao chép Số hồ sơ & Trích yếu của 1 dòng đơn lẻ
  const handleCopySingleRowData = async (record: BinhBinhRecord) => {
    try {
      const recNum = record.recordNumber || `KT/ƯĐGD-${String(record.pageNumber).padStart(2, '0')}`;
      const textToCopy = `${recNum}\t${record.formattedTitle}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedRowId(record.id);
      setTimeout(() => setCopiedRowId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Xuất file Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      exportToExcel(filteredRecords);
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi xuất tệp Excel');
    }
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          Chưa có hồ sơ nào trong bảng kết quả
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          Hãy tải lên tệp PDF tài liệu cấp sổ ưu đãi giáo dục, đào tạo ở phía trên để hệ thống tự động đọc kỹ các văn bản in và bóc tách từng trang thành trích yếu hồ sơ chuẩn hóa.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Action Toolbar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Nhóm tìm kiếm & thống kê */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh, nơi thường trú, loại văn bản..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <span className="text-xs text-slate-600 font-medium px-2 py-1 bg-white rounded border border-slate-200">
            Hiển thị <strong>{filteredRecords.length}</strong> / {records.length} hồ sơ
          </span>
        </div>

        {/* Nhóm Nút Hành Động Trọng Tâm */}
        <div className="flex flex-wrap items-center gap-2">
          {/* NÚT SAO CHÉP CỘT SỐ HỒ SƠ & TRÍCH YẾU HỒ SƠ */}
          <button
            id="btn-copy-title-column"
            onClick={handleCopyColumnTitles}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Sao chép 2 cột: Số hồ sơ & Trích yếu hồ sơ vào clipboard để dán trực tiếp vào Excel"
          >
            {copiedColumn ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã sao chép {filteredRecords.length} dòng (Số HS & Trích yếu)!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-700" />
                <span>Sao chép cột Số hồ sơ & Trích yếu</span>
              </>
            )}
          </button>

          {/* Nút Sao chép toàn bộ bảng TSV */}
          <button
            onClick={handleCopyTableTsv}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs"
            title="Sao chép toàn bộ dữ liệu bảng để dán vào Excel với đầy đủ các cột"
          >
            {copiedTsv ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Đã chép bảng!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Chép bảng Excel</span>
              </>
            )}
          </button>

          {/* Nút Xuất tệp Excel (.xlsx) */}
          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-2xs"
            title="Tải tệp bảng tính Microsoft Excel (.xlsx) về máy tính"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất tệp Excel (.xlsx)</span>
          </button>

          {/* Nút Xóa tất cả */}
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
            title="Xóa toàn bộ kết quả đang hiển thị"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa hết</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet / Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100/90 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">STT</th>
              <th className="py-2.5 px-3 w-16 text-center">Trang</th>
              <th className="py-2.5 px-3 min-w-[130px] text-blue-950 bg-blue-50/70 font-mono">Số hồ sơ</th>
              <th className="py-2.5 px-3 min-w-[360px] text-slate-900 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <span>Trích Yếu Hồ Sơ (Chuẩn Hóa Phân Tách Dấu Phẩy)</span>
                  <span className="text-[10px] text-amber-700 font-normal lowercase">(Cột chính)</span>
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[160px]">Tên cá nhân (Title Case)</th>
              <th className="py-2.5 px-3 min-w-[110px]">Ngày sinh</th>
              <th className="py-2.5 px-3 min-w-[220px]">Nơi thường trú</th>
              <th className="py-2.5 px-3 min-w-[180px]">Loại văn bản in</th>
              <th className="py-2.5 px-3 w-28 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRecords.map((record, index) => {
              const isCopied = copiedRowId === record.id;
              const residenceDisplay = record.permanentResidence || record.residence || 'Chưa rõ';
              const notesDisplay = record.printNotes || record.handwritingNotes;
              const recordNumberDisplay = record.recordNumber || `KT/ƯĐGD-${String(record.pageNumber).padStart(2, '0')}`;
              return (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                    {index + 1}
                  </td>

                  {/* Trang & Preview Thumbnail */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectRecord(record)}
                      className="group/thumb relative inline-block rounded overflow-hidden border border-slate-300 hover:border-blue-500 transition-all cursor-pointer"
                      title="Bấm để xem ảnh văn bản in đối chiếu"
                    >
                      {record.previewUrl ? (
                        <img
                          src={record.previewUrl}
                          alt={`Trang ${record.pageNumber}`}
                          referrerPolicy="no-referrer"
                          className="w-9 h-11 object-cover"
                        />
                      ) : (
                        <div className="w-9 h-11 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                          P.{record.pageNumber}
                        </div>
                      )}
                      <span className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </button>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Tr.{record.pageNumber}
                    </div>
                  </td>

                  {/* Số hồ sơ */}
                  <td className="py-2.5 px-3 bg-blue-50/25">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-100/80 text-blue-900 border border-blue-200">
                      {recordNumberDisplay}
                    </span>
                  </td>

                  {/* Trích yếu hồ sơ hoàn chỉnh */}
                  <td className="py-2.5 px-3 bg-amber-50/30">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-xs text-slate-900 font-medium leading-relaxed select-all">
                        {record.formattedTitle}
                      </p>
                      <button
                        onClick={() => handleCopySingleRowData(record)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors shrink-0"
                        title="Sao chép Số hồ sơ & Trích yếu dòng này để dán vào Excel"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="truncate max-w-[220px]" title={record.documentType}>
                        {record.documentType}
                      </span>
                      {notesDisplay && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[240px] text-blue-800 italic" title={notesDisplay}>
                            {notesDisplay}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Tên cá nhân (Title Case) */}
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {record.fullName}
                  </td>

                  {/* Ngày sinh */}
                  <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">
                    {record.birthDate || 'Chưa rõ'}
                  </td>

                  {/* Nơi thường trú */}
                  <td className="py-2.5 px-3 text-slate-700 leading-snug">
                    {residenceDisplay}
                  </td>

                  {/* Loại văn bản in */}
                  <td className="py-2.5 px-3 text-slate-700 font-medium">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                      {record.documentType || 'Văn bản in'}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectRecord(record)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors"
                        title="Xem đối chiếu văn bản in gốc & chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa dòng hồ sơ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer bảng dữ liệu */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>Tổng cộng: <strong>{filteredRecords.length}</strong> trang văn bản tương ứng <strong>{filteredRecords.length}</strong> tiêu đề hồ sơ</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Định dạng chuẩn Excel
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Ngăn cách bằng dấu phẩy
          </span>
        </div>
      </div>
    </div>
  );
};
