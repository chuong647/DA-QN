import * as XLSX from 'xlsx';
import { BinhBinhRecord } from '../types';

/**
 * Xuất dữ liệu danh sách trích yếu hồ sơ cấp sổ ưu đãi giáo dục, đào tạo ra tệp Excel (.xlsx)
 */
export function exportToExcel(records: BinhBinhRecord[], baseFileName = 'Trich_Yeu_Ho_So_Cap_So_Uu_Dai_GD_DT') {
  if (!records || records.length === 0) {
    throw new Error('Không có dữ liệu để xuất Excel');
  }

  // Chuẩn bị dữ liệu bảng tính
  const excelRows = records.map((record, index) => ({
    'STT': index + 1,
    'Số hồ sơ': record.recordNumber || `KT/ƯĐGD-${String(record.pageNumber).padStart(2, '0')}`,
    'Trích yếu hồ sơ (Chuẩn hóa)': record.formattedTitle,
    'Tên cá nhân': record.fullName,
    'Ngày sinh': record.birthDate,
    'Nơi thường trú': record.permanentResidence || record.residence || '',
    'Loại văn bản in': record.documentType || 'Văn bản in cấp sổ ưu đãi',
    'Nhận xét văn bản in': record.printNotes || record.handwritingNotes || 'Văn bản in rõ nét',
    'Tên tệp gốc': record.fileName,
    'Trang': record.pageNumber,
  }));

  // Tạo Worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Đặt độ rộng các cột tối ưu cho việc đọc
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Số hồ sơ (ví dụ: KT/ƯĐGD-01)
    { wch: 80 }, // Trích yếu hồ sơ (rộng rãi)
    { wch: 28 }, // Tên cá nhân
    { wch: 15 }, // Ngày sinh
    { wch: 42 }, // Nơi thường trú
    { wch: 35 }, // Loại văn bản in
    { wch: 35 }, // Nhận xét văn bản in
    { wch: 28 }, // Tên tệp
    { wch: 8 },  // Trang
  ];

  // Tạo Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trích yếu hồ sơ');

  // Đặt tên file xuất có gắn timestamp
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `${baseFileName}_${dateStr}.xlsx`;

  // Xuất file
  XLSX.writeFile(workbook, fileName);
}

/**
 * Sao chép cột Số hồ sơ và Trích yếu hồ sơ vào Clipboard
 * Định dạng phân tách bằng Tab (\t) để khi dán vào Excel sẽ tự động chia thành 2 cột:
 * Cột 1: Số hồ sơ (ví dụ KT/ƯĐGD-01)
 * Cột 2: Trích yếu hồ sơ
 */
export async function copyRecordNumberAndTitlesToClipboard(records: BinhBinhRecord[]): Promise<boolean> {
  if (!records || records.length === 0) return false;

  const content = records
    .map((r) => {
      const recNumber = (r.recordNumber || `KT/ƯĐGD-${String(r.pageNumber).padStart(2, '0')}`).trim();
      const title = (r.formattedTitle || '').trim();
      return `${recNumber}\t${title}`;
    })
    .filter(Boolean)
    .join('\n');

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      return true;
    } else {
      // Fallback cho môi trường không hỗ trợ navigator.clipboard trực tiếp
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Lỗi khi sao chép Số hồ sơ và Trích yếu hồ sơ:', err);
    return false;
  }
}

// Giữ alias tương thích
export const copyProfileTitlesToClipboard = copyRecordNumberAndTitlesToClipboard;

/**
 * Sao chép toàn bộ bảng dưới dạng TSV (Tab-Separated Values)
 * Để người dùng dán lập tức vào Excel với đầy đủ các cột
 */
export async function copyTableAsTsv(records: BinhBinhRecord[]): Promise<boolean> {
  if (!records || records.length === 0) return false;

  const headers = [
    'STT',
    'Số hồ sơ',
    'Trích yếu hồ sơ',
    'Tên cá nhân',
    'Ngày sinh',
    'Nơi thường trú',
    'Loại văn bản in',
    'Nhận xét văn bản in',
    'Tệp nguồn',
    'Trang'
  ];

  const rows = records.map((r, idx) => [
    idx + 1,
    r.recordNumber || `KT/ƯĐGD-${String(r.pageNumber).padStart(2, '0')}`,
    r.formattedTitle,
    r.fullName,
    r.birthDate,
    r.permanentResidence || r.residence || '',
    r.documentType,
    r.printNotes || r.handwritingNotes || '',
    r.fileName,
    r.pageNumber
  ]);

  const tsvContent = [
    headers.join('\t'),
    ...rows.map(row => row.map(cell => String(cell).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t'))
  ].join('\n');

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(tsvContent);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = tsvContent;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Lỗi khi sao chép bảng:', err);
    return false;
  }
}
