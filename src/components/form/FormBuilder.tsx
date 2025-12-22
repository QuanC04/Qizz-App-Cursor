import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Save, Link as LinkIcon, Upload, Download, FileSpreadsheet } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useAuthStore } from '../../stores/useAuthStore';
import { useFormStore } from '../../stores/useFormStore';
import type { Question, QuestionType, FormInput } from '../../types';
import { SortableQuestionCard } from './SortableQuestionCard';
import { FormSettingsDialog } from './FormSettingsDialog';
import {
  exportQuestionsToExcel,
  importQuestionsFromExcel,
  downloadExcelTemplate,
} from '../../utils/excelUtils';

interface FormBuilderProps {
  mode?: 'create' | 'edit';
  initialData?: FormInput & { id?: string };
  existingFormId?: string;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  mode = 'create',
  initialData,
  existingFormId,
}) => {
  const { user } = useAuthStore();
  const { createForm, updateForm, updateFormSilent, deleteForm } = useFormStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionTypeSelector, setShowQuestionTypeSelector] = useState(false);
  const [formId, setFormId] = useState<string>(existingFormId || '');
  const [saving, setSaving] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [formSettings, setFormSettings] = useState({
    requireLogin: false,
    oneSubmissionOnly: false,
    enableTimer: false,
    timerMinutes: 30,
  });
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('published');

  // File input ref for Excel import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering questions
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order property
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  // Handle Excel export
  const handleExportExcel = () => {
    const filename = title.trim() ? `${title.trim()}.xlsx` : 'questions.xlsx';
    exportQuestionsToExcel(questions, filename);
  };

  // Handle Excel import
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedQuestions = await importQuestionsFromExcel(file);
      // Reorder and assign new IDs to avoid conflicts
      const newQuestions = importedQuestions.map((q, index) => ({
        ...q,
        id: `q_${Date.now()}_${index}`,
        order: questions.length + index,
      }));
      setQuestions([...questions, ...newQuestions]);
      alert(`Đã import ${newQuestions.length} câu hỏi thành công!`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lỗi import file!');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load initial data when in edit mode
  const isInitialized = useRef(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setQuestions(initialData.questions || []);
      setFormId(initialData.id || existingFormId || '');
      setFormSettings({
        requireLogin: initialData.requireLogin || false,
        oneSubmissionOnly: initialData.oneSubmissionOnly || false,
        enableTimer: initialData.enableTimer || false,
        timerMinutes: initialData.timerMinutes || 30,
      });
      setFormStatus(initialData.status || 'published');
      // Mark as initialized after loading data
      setTimeout(() => {
        isInitialized.current = true;
      }, 100);
    } else if (mode === 'create') {
      // For create mode, mark as initialized immediately
      isInitialized.current = true;
    }
  }, [mode, initialData, existingFormId]);

  // Auto-save after 1 second of inactivity
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip auto-save until component is initialized
    if (!isInitialized.current) {
      return;
    }

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Only auto-save if we have the minimum required data
      if (!user || !title.trim() || questions.length === 0) {
        return;
      }

      // Validate questions silently
      const isValid = questions.every(q => {
        if (!q.content.trim()) return false;
        if (q.type !== 'text' && (!q.options || q.options.length === 0)) return false;
        return true;
      });

      if (!isValid) return;

      try {
        setSaving(true);

        // Clean questions to remove undefined values
        const cleanedQuestions = questions.map(q => {
          const cleaned: any = {
            id: q.id,
            type: q.type,
            content: q.content,
            correctAnswer: q.correctAnswer,
            points: q.points,
            order: q.order,
          };

          if (q.options !== undefined) {
            cleaned.options = q.options;
          }

          return cleaned as Question;
        });

        const formData = {
          title,
          description,
          status: 'published' as const,
          questions: cleanedQuestions,
          ...formSettings,
        };

        if (formId) {
          // Update existing form silently (no loading state change)
          await updateFormSilent(formId, formData);
        } else {
          // Create new form
          const newFormId = await createForm(user.uid, formData);
          setFormId(newFormId);
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setSaving(false);
      }
    }, 1000); // 1 second debounce

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, description, questions, formSettings, user, formId, createForm, updateForm]);

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type,
      content: '',
      ...(type !== 'text' && { options: [] }),
      correctAnswer: type === 'checkbox' ? [] : type === 'radio' ? 0 : [],
      points: 1,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
    setShowQuestionTypeSelector(false);
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }));
    setQuestions(reorderedQuestions);
  };

  const handleSave = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu form');
      return;
    }

    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề form');
      return;
    }

    if (questions.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    // Validate questions
    for (const q of questions) {
      if (!q.content.trim()) {
        alert('Tất cả câu hỏi phải có nội dung');
        return;
      }
      if (q.type !== 'text' && (!q.options || q.options.length === 0)) {
        alert('Câu hỏi trắc nghiệm phải có ít nhất một lựa chọn');
        return;
      }
    }

    try {
      setSaving(true);

      // Clean questions to remove undefined values
      const cleanedQuestions = questions.map(q => {
        const cleaned: any = {
          id: q.id,
          type: q.type,
          content: q.content,
          correctAnswer: q.correctAnswer,
          points: q.points,
          order: q.order,
        };

        // Only add options if it exists and is not undefined
        if (q.options !== undefined) {
          cleaned.options = q.options;
        }

        return cleaned as Question;
      });

      const formData = {
        title,
        description,
        status: 'published' as const,
        questions: cleanedQuestions,
        ...formSettings,
      };

      if (mode === 'edit' && formId) {
        // Update existing form
        await updateForm(formId, formData);
        alert('Cập nhật form thành công!');
      } else {
        // Create new form
        const newFormId = await createForm(user.uid, formData);
        setFormId(newFormId);
        alert('Lưu form thành công!');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Lưu form thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel - delete auto-saved form if in create mode
  const handleCancel = async () => {
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // If in create mode and form was auto-saved, delete it
    if (mode === 'create' && formId) {
      try {
        await deleteForm(formId);
      } catch (error) {
        console.error('Error deleting auto-saved form:', error);
      }
    }

    navigate({ to: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Tạo Form Mới
          </h1>
          <p className="text-gray-600">Tạo bài kiểm tra hoặc khảo sát của bạn</p>
        </div>

        {/* Saving Status */}
        <div className="text-sm text-right mb-4 h-6">
          {saving && <span className="text-yellow-600 font-semibold">⏳ Đang lưu...</span>}
        </div>

        {/* Form Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin Form</h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tiêu đề Form <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề form..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Nhập mô tả cho form..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="mb-6">
          {/* Hidden file input for Excel import */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Câu hỏi ({questions.length})</h2>

            <div className="flex gap-2">
              <button
                onClick={downloadExcelTemplate}
                className="px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all flex items-center gap-1 text-sm cursor-pointer"
                title="Tải file mẫu Excel"
              >
                <FileSpreadsheet size={16} />
                Mẫu
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-all flex items-center gap-1 text-sm cursor-pointer"
                title="Import câu hỏi từ Excel"
              >
                <Upload size={16} />
                Import
              </button>

              <button
                onClick={handleExportExcel}
                className="px-3 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-all flex items-center gap-1 text-sm cursor-pointer"
                title="Export câu hỏi ra Excel"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map(q => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {questions.map((question, index) => (
                <SortableQuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={(updatedQuestion: Question) =>
                    handleUpdateQuestion(index, updatedQuestion)
                  }
                  onDelete={() => handleDeleteQuestion(index)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {questions.length === 0 && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <p className="text-gray-500 text-lg mb-2">Chưa có câu hỏi nào</p>
              <p className="text-gray-400 text-sm">Nhấn nút bên dưới để thêm câu hỏi đầu tiên</p>
            </div>
          )}
        </div>

        {/* Add Question Section */}
        <div className="mb-6">
          {!showQuestionTypeSelector ? (
            <button
              onClick={() => setShowQuestionTypeSelector(true)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={20} />
              Thêm câu hỏi
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">Chọn loại câu hỏi:</p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleAddQuestion('radio')}
                  className="py-3 px-4 bg-white border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl transition-all font-semibold text-gray-800 cursor-pointer"
                >
                  Trắc nghiệm
                </button>

                <button
                  onClick={() => handleAddQuestion('checkbox')}
                  className="py-3 px-4 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all font-semibold text-gray-800 cursor-pointer"
                >
                  Nhiều lựa chọn
                </button>

                <button
                  onClick={() => handleAddQuestion('text')}
                  className="py-3 px-4 bg-white border-2 border-green-200 hover:border-green-400 hover:bg-green-50 rounded-xl transition-all font-semibold text-gray-800 cursor-pointer"
                >
                  Văn bản
                </button>
              </div>

              <button
                onClick={() => setShowQuestionTypeSelector(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-800 font-semibold cursor-pointer"
              >
                Hủy
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 sticky bottom-4">
          <button
            onClick={handleCancel}
            className="px-8 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all cursor-pointer"
          >
            Hủy
          </button>

          <button
            onClick={() => setShowLinkDialog(true)}
            className="flex-1 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LinkIcon size={20} />
            Tạo link làm bài
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save size={20} />
            {saving ? 'Đang lưu...' : 'Lưu Form'}
          </button>
        </div>

        {/* Settings Dialog */}
        <FormSettingsDialog
          isOpen={showLinkDialog}
          onClose={() => setShowLinkDialog(false)}
          settings={formSettings}
          onSave={setFormSettings}
          formId={formId}
          formStatus={formStatus}
          onStatusChange={async newStatus => {
            setFormStatus(newStatus);
            if (formId) {
              try {
                await updateFormSilent(formId, { status: newStatus });
              } catch (error) {
                console.error('Error updating status:', error);
              }
            }
          }}
        />
      </div>
    </div>
  );
};
