import React from 'react';
import type { Question } from '../../types';

interface QuestionRendererProps {
  question: Question;
  answer: number | number[] | string;
  onAnswerChange: (answer: number | number[] | string) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  onAnswerChange,
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {question.order + 1}. {question.content}
        <span className="text-sm text-gray-500 ml-2">({question.points} points)</span>
      </h3>

      {question.type === 'radio' && (
        <div className="space-y-2">
          {(question.options || []).map((option, index) => (
            <label
              key={index}
              className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name={question.id}
                value={index}
                checked={typeof answer === 'number' && answer === index}
                onChange={() => onAnswerChange(index)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'checkbox' && (
        <div className="space-y-2">
          {(question.options || []).map((option, index) => (
            <label
              key={index}
              className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                value={index}
                checked={Array.isArray(answer) && answer.includes(index)}
                onChange={(e) => {
                  const currentAnswers = Array.isArray(answer) ? answer : [];
                  if (e.target.checked) {
                    onAnswerChange([...currentAnswers, index]);
                  } else {
                    onAnswerChange(currentAnswers.filter((a) => a !== index));
                  }
                }}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'text' && (
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter your answer"
          value={answer as string || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
        />
      )}
    </div>
  );
};
