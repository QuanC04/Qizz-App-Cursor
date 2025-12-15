import React, { useState } from 'react';
import type { Question, QuestionType } from '../../types';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Trash2, Plus, X } from 'lucide-react';

interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onUpdate,
  onDelete,
}) => {
  const handleContentChange = (content: string) => {
    onUpdate({ ...question, content });
  };

  const handlePointsChange = (points: number) => {
    onUpdate({ ...question, points });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    onUpdate({ ...question, options: newOptions });
  };

  const handleAddOption = () => {
    const newOptions = [...(question.options || []), ''];
    onUpdate({ ...question, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== index);
    onUpdate({ ...question, options: newOptions });
  };

  const handleCorrectAnswerChange = (value: number | number[] | string[]) => {
    onUpdate({ ...question, correctAnswer: value });
  };

  return (
    <Card className="p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Question {question.order + 1}
        </h3>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          className="flex items-center space-x-1"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </Button>
      </div>

      <div className="space-y-4">
        {/* Question Content */}
        <Input
          label="Question"
          placeholder="Enter your question"
          value={question.content}
          onChange={(e) => handleContentChange(e.target.value)}
        />

        {/* Question Type Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Type:</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
            {question.type === 'radio' && 'Multiple Choice'}
            {question.type === 'checkbox' && 'Checkbox'}
            {question.type === 'text' && 'Short Answer'}
          </span>
        </div>

        {/* Options for Multiple Choice and Checkbox */}
        {(question.type === 'radio' || question.type === 'checkbox') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            {(question.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddOption}
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option</span>
            </Button>
          </div>
        )}

        {/* Correct Answer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correct Answer
          </label>
          {question.type === 'radio' && (
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={question.correctAnswer as number ?? ''}
              onChange={(e) => handleCorrectAnswerChange(Number(e.target.value))}
            >
              <option value="">Select correct answer</option>
              {(question.options || []).map((option, index) => (
                <option key={index} value={index}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {question.type === 'checkbox' && (
            <div className="space-y-2">
              {(question.options || []).map((option, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={(question.correctAnswer as number[] || []).includes(index)}
                    onChange={(e) => {
                      const currentAnswers = (question.correctAnswer as number[]) || [];
                      if (e.target.checked) {
                        handleCorrectAnswerChange([...currentAnswers, index]);
                      } else {
                        handleCorrectAnswerChange(
                          currentAnswers.filter((a) => a !== index)
                        );
                      }
                    }}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
          {question.type === 'text' && (
            <Input
              placeholder="Enter correct answers separated by commas"
              value={(question.correctAnswer as string[] || []).join(', ')}
              onChange={(e) => handleCorrectAnswerChange(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            />
          )}
        </div>

        {/* Points */}
        <Input
          type="number"
          label="Points"
          placeholder="Enter points for this question"
          value={question.points}
          onChange={(e) => handlePointsChange(Number(e.target.value))}
          min="0"
        />
      </div>
    </Card>
  );
};
