import * as XLSX from 'xlsx';
import type { Question, QuestionType } from '../types';

interface ExcelQuestionRow {
  STT: number;
  'Nội dung câu hỏi': string;
  'Loại': string;
  'Lựa chọn A': string;
  'Lựa chọn B': string;
  'Lựa chọn C': string;
  'Lựa chọn D': string;
  'Đáp án đúng': string;
  'Điểm': number;
}

/**
 * Convert question type to Vietnamese label
 */
const typeToLabel = (type: QuestionType): string => {
  switch (type) {
    case 'radio': return 'Trắc nghiệm';
    case 'checkbox': return 'Nhiều lựa chọn';
    case 'text': return 'Văn bản';
    default: return 'Trắc nghiệm';
  }
};

/**
 * Convert Vietnamese label to question type
 */
const labelToType = (label: string): QuestionType => {
  const normalized = label.toLowerCase().trim();
  if (normalized.includes('nhiều') || normalized.includes('checkbox')) return 'checkbox';
  if (normalized.includes('văn bản') || normalized.includes('text')) return 'text';
  return 'radio';
};

/**
 * Format correct answer for Excel display
 */
const formatCorrectAnswer = (question: Question): string => {
  if (question.type === 'text') {
    return Array.isArray(question.correctAnswer)
      ? (question.correctAnswer as string[]).join(', ')
      : '';
  }

  if (question.type === 'radio') {
    const index = question.correctAnswer as number;
    return String.fromCharCode(65 + index); // 0 -> A, 1 -> B, etc.
  }

  if (question.type === 'checkbox') {
    const indices = question.correctAnswer as number[];
    return indices.map(i => String.fromCharCode(65 + i)).join(', ');
  }

  return '';
};

/**
 * Parse correct answer from Excel
 */
const parseCorrectAnswer = (value: string, type: QuestionType): number | number[] | string[] => {
  if (type === 'text') {
    return value.split(',').map(s => s.trim()).filter(s => s);
  }

  if (type === 'radio') {
    const letter = value.trim().toUpperCase();
    return letter.charCodeAt(0) - 65; // A -> 0, B -> 1, etc.
  }

  if (type === 'checkbox') {
    return value.split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s)
      .map(letter => letter.charCodeAt(0) - 65);
  }

  return 0;
};

/**
 * Export questions to Excel file
 */
export const exportQuestionsToExcel = (questions: Question[], filename: string = 'questions.xlsx'): void => {
  if (questions.length === 0) {
    alert('Không có câu hỏi nào để xuất!');
    return;
  }

  const data: ExcelQuestionRow[] = questions.map((q, index) => {
    const options = q.options || [];
    return {
      'STT': index + 1,
      'Nội dung câu hỏi': q.content,
      'Loại': typeToLabel(q.type),
      'Lựa chọn A': options[0] || '',
      'Lựa chọn B': options[1] || '',
      'Lựa chọn C': options[2] || '',
      'Lựa chọn D': options[3] || '',
      'Đáp án đúng': formatCorrectAnswer(q),
      'Điểm': q.points,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // STT
    { wch: 50 },  // Nội dung câu hỏi
    { wch: 15 },  // Loại
    { wch: 25 },  // Lựa chọn A
    { wch: 25 },  // Lựa chọn B
    { wch: 25 },  // Lựa chọn C
    { wch: 25 },  // Lựa chọn D
    { wch: 15 },  // Đáp án đúng
    { wch: 8 },   // Điểm
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Câu hỏi');

  XLSX.writeFile(workbook, filename);
};

/**
 * Import questions from Excel file
 */
export const importQuestionsFromExcel = (file: File): Promise<Question[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length === 0) {
          reject(new Error('File Excel không có dữ liệu!'));
          return;
        }

        const questions: Question[] = jsonData.map((row, index) => {
          const type = labelToType(row['Loại'] || 'Trắc nghiệm');

          // Get options from columns
          const options: string[] = [];
          if (type !== 'text') {
            ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'].forEach(col => {
              const value = row[col];
              if (value && String(value).trim()) {
                options.push(String(value).trim());
              }
            });
          }

          const question: Question = {
            id: `q_${Date.now()}_${index}`,
            type,
            content: row['Nội dung câu hỏi'] || '',
            correctAnswer: parseCorrectAnswer(String(row['Đáp án đúng'] || ''), type),
            points: Number(row['Điểm']) || 1,
            order: index,
          };

          if (type !== 'text') {
            question.options = options;
          }

          return question;
        });

        // Validate questions
        const validQuestions = questions.filter(q => q.content.trim() !== '');

        if (validQuestions.length === 0) {
          reject(new Error('Không tìm thấy câu hỏi hợp lệ trong file!'));
          return;
        }

        resolve(validQuestions);
      } catch (error) {
        reject(new Error('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file!'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi đọc file!'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Download template Excel file
 */
export const downloadExcelTemplate = (): void => {
  const templateData: ExcelQuestionRow[] = [
    {
      'STT': 1,
      'Nội dung câu hỏi': 'Thủ đô của Việt Nam là gì?',
      'Loại': 'Trắc nghiệm',
      'Lựa chọn A': 'Hà Nội',
      'Lựa chọn B': 'Hồ Chí Minh',
      'Lựa chọn C': 'Đà Nẵng',
      'Lựa chọn D': 'Huế',
      'Đáp án đúng': 'A',
      'Điểm': 1,
    },
    {
      'STT': 2,
      'Nội dung câu hỏi': 'Chọn các số chẵn:',
      'Loại': 'Nhiều lựa chọn',
      'Lựa chọn A': '2',
      'Lựa chọn B': '3',
      'Lựa chọn C': '4',
      'Lựa chọn D': '5',
      'Đáp án đúng': 'A, C',
      'Điểm': 2,
    },
    {
      'STT': 3,
      'Nội dung câu hỏi': 'Việt Nam có bao nhiêu tỉnh thành?',
      'Loại': 'Văn bản',
      'Lựa chọn A': '',
      'Lựa chọn B': '',
      'Lựa chọn C': '',
      'Lựa chọn D': '',
      'Đáp án đúng': '63',
      'Điểm': 1,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 50 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
    { wch: 8 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Câu hỏi');

  XLSX.writeFile(workbook, 'template_cau_hoi.xlsx');
};
