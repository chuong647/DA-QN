export interface BinhBinhRecord {
  id: string;
  pageNumber: number;
  fileName: string;
  previewUrl: string; // Data URL or object URL of page thumbnail
  recordNumber?: string; // Số hồ sơ lấy trong văn bản, có dạng ví dụ: KT/ƯĐGD-01
  honorific?: 'Ông' | 'Bà' | 'Anh' | 'Chị' | 'Em' | string;
  fullName: string;
  birthDate: string;
  permanentResidence: string; // Nơi thường trú
  residence?: string; // Tương thích ngược
  nativePlace?: string; // Nguyên quán (nếu có)
  bodilyInjuryRate?: string; // Tương thích ngược
  formattedTitle: string; // Trích yếu hồ sơ chuẩn phân tách bằng dấu phẩy
  documentType: string;
  printNotes?: string; // Nhận xét về chất lượng văn bản in / phôi in
  handwritingNotes?: string; // Ghi chú chữ viết / con dấu
  fullExtractedText: string;
  confidence: 'high' | 'medium' | 'low';
  aiModel?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  isEditing?: boolean;
}

export interface ProcessingProgress {
  currentPage: number;
  totalPages: number;
  currentFileName: string;
  isProcessing: boolean;
  statusText: string;
}

/**
 * Chuẩn hóa tên cá nhân: Viết hoa chữ cái đầu mỗi từ (Title Case)
 * Ví dụ: "NGUYỄN VĂN AN" -> "Nguyễn Văn An"
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Tạo Trích yếu hồ sơ chuẩn cấu trúc phân tách bằng dấu phẩy theo quy định:
 * "Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên + Tên cá nhân + ngày sinh + Nơi thường trú"
 * Ví dụ chuẩn:
 * "Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên Nguyễn Văn An, sinh ngày 15/08/2002, nơi thường trú Xã Tam Hưng, Huyện Thanh Oai, TP Hà Nội"
 */
export function generateProfileTitle(data: {
  fullName?: string;
  birthDate?: string;
  permanentResidence?: string;
  residence?: string;
  honorific?: string;
  nativePlace?: string;
  bodilyInjuryRate?: string;
  economicBasisRate?: string;
}): string {
  const name = toTitleCase(data.fullName || 'Chưa rõ họ tên');
  
  // Xử lý ngày sinh
  let birth = (data.birthDate || '').trim();
  if (birth && !birth.toLowerCase().startsWith('sinh') && !birth.toLowerCase().startsWith('ngày sinh')) {
    birth = `sinh ngày ${birth}`;
  } else if (!birth) {
    birth = 'chưa rõ ngày sinh';
  }

  // Xử lý nơi thường trú
  let res = (data.permanentResidence || data.residence || '').trim();
  if (res) {
    if (res.toLowerCase().startsWith('căn quán')) {
      res = `nơi thường trú ${res.slice('căn quán'.length).trim()}`;
    } else if (res.toLowerCase().startsWith('trú quán')) {
      res = `nơi thường trú ${res.slice('trú quán'.length).trim()}`;
    } else if (res.toLowerCase().startsWith('thường trú tại')) {
      res = `nơi thường trú ${res.slice('thường trú tại'.length).trim()}`;
    } else if (!res.toLowerCase().startsWith('nơi thường trú') && !res.toLowerCase().startsWith('thường trú')) {
      res = `nơi thường trú ${res}`;
    }
  } else {
    res = 'nơi thường trú chưa rõ';
  }

  // Cấu trúc trích yếu hồ sơ phân tách bằng dấu phẩy
  return `Hồ sơ về việc cấp sổ ưu đãi giáo dục, đào tạo cho học sinh, sinh viên ${name}, ${birth}, ${res}`;
}
