import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, X, GripVertical } from 'lucide-react';
import type { Question } from '../../types';

interface SortableQuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

export const SortableQuestionCard: React.FC<SortableQuestionCardProps> = ({
  question,
  index,
  onUpdate,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const [showOptions, setShowOptions] = useState(question.options && question.options.length > 0);

  const handleAddOption = () => {
    const newOptions = [...(question.options || []), ''];
    onUpdate({ ...question, options: newOptions });
  };

  const handleRemoveOption = (optionIndex: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
    onUpdate({ ...question, options: newOptions });
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    onUpdate({ ...question, options: newOptions });
  };

  const handleCorrectAnswerToggle = (optionIndex: number) => {
    if (question.type === 'radio') {
      onUpdate({ ...question, correctAnswer: optionIndex });
    } else if (question.type === 'checkbox') {
      const currentAnswers = (question.correctAnswer as number[]) || [];
      const newAnswers = currentAnswers.includes(optionIndex)
        ? currentAnswers.filter(i => i !== optionIndex)
        : [...currentAnswers, optionIndex];
      onUpdate({ ...question, correctAnswer: newAnswers });
    }
  };

  const handleAddTextAnswer = () => {
    const currentAnswers = (question.correctAnswer as string[]) || [];
    onUpdate({ ...question, correctAnswer: [...currentAnswers, ''] });
  };

  const handleRemoveTextAnswer = (answerIndex: number) => {
    const currentAnswers = (question.correctAnswer as string[]) || [];
    onUpdate({ ...question, correctAnswer: currentAnswers.filter((_, i) => i !== answerIndex) });
  };

  const handleTextAnswerChange = (answerIndex: number, value: string) => {
    const currentAnswers = (question.correctAnswer as string[]) || [];
    const newAnswers = [...currentAnswers];
    newAnswers[answerIndex] = value;
    onUpdate({ ...question, correctAnswer: newAnswers });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl shadow-lg p-6 mb-4 border-2 border-gray-100 hover:border-purple-200 transition-all"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-grab active:cursor-grabbing touch-none"
            title="Kéo để sắp xếp lại"
          >
            <GripVertical size={20} />
          </button>
          <h3 className="text-lg font-bold text-gray-800">Câu hỏi {index + 1}</h3>
        </div>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Question Content */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nội dung câu hỏi <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={question.content}
          onChange={e => onUpdate({ ...question, content: e.target.value })}
          placeholder="Nhập câu hỏi..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Question Type Badge */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
          {question.type === 'radio' && '📻 Trắc nghiệm (1 đáp án)'}
          {question.type === 'checkbox' && '☑️ Nhiều lựa chọn'}
          {question.type === 'text' && '✍️ Văn bản'}
        </span>
      </div>

      {/* Options for Radio/Checkbox */}
      {(question.type === 'radio' || question.type === 'checkbox') && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-semibold text-gray-700">Các lựa chọn</label>
            {!showOptions && (
              <button
                onClick={() => {
                  setShowOptions(true);
                  if (!question.options || question.options.length === 0) {
                    onUpdate({ ...question, options: [''] });
                  }
                }}
                className="text-purple-600 hover:text-purple-700 text-sm font-semibold cursor-pointer"
              >
                + Thêm lựa chọn
              </button>
            )}
          </div>

          {showOptions && (
            <div className="space-y-3">
              {(question.options || []).map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-3">
                  {/* Checkbox/Radio for correct answer */}
                  <input
                    type={question.type === 'radio' ? 'radio' : 'checkbox'}
                    name={`correct-${question.id}`}
                    checked={
                      question.type === 'radio'
                        ? question.correctAnswer === optionIndex
                        : ((question.correctAnswer as number[]) || []).includes(optionIndex)
                    }
                    onChange={() => handleCorrectAnswerToggle(optionIndex)}
                    className="w-5 h-5 text-purple-600 cursor-pointer"
                    title="Đánh dấu là đáp án đúng"
                  />

                  {/* Option input */}
                  <input
                    type="text"
                    value={option}
                    onChange={e => handleOptionChange(optionIndex, e.target.value)}
                    placeholder={`Lựa chọn ${optionIndex + 1}`}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />

                  {/* Remove option button */}
                  <button
                    onClick={() => handleRemoveOption(optionIndex)}
                    className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddOption}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors font-semibold cursor-pointer"
              >
                + Thêm lựa chọn
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text Answers */}
      {question.type === 'text' && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Đáp án đúng (có thể có nhiều đáp án)
          </label>
          <div className="space-y-3">
            {((question.correctAnswer as string[]) || []).map((answer, answerIndex) => (
              <div key={answerIndex} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600 min-w-[80px]">
                  Đáp án {answerIndex + 1}:
                </span>
                <input
                  type="text"
                  value={answer}
                  onChange={e => handleTextAnswerChange(answerIndex, e.target.value)}
                  placeholder="Nhập đáp án đúng..."
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={() => handleRemoveTextAnswer(answerIndex)}
                  className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            ))}

            <button
              onClick={handleAddTextAnswer}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors font-semibold cursor-pointer"
            >
              + Thêm đáp án
            </button>
          </div>
        </div>
      )}

      {/* Points */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Điểm</label>
        <input
          type="number"
          value={question.points}
          onChange={e => onUpdate({ ...question, points: Number(e.target.value) })}
          min="0"
          className="w-32 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
        />
      </div>
    </div>
  );
};
