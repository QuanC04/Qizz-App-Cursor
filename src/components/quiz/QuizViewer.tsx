import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Form } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';
import { useResponseStore } from '../../stores/useResponseStore';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Send, Clock } from 'lucide-react';
import TimerProgress from './TimerProgress';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface QuizViewerProps {
  form: Form;
}

export const QuizViewer: React.FC<QuizViewerProps> = ({ form }) => {
  const { user } = useAuthStore();
  const { submitResponse, loading } = useResponseStore();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number | number[] | string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [started, setStarted] = useState(!form.enableTimer); // Start immediately if no timer
  const [submissionDone, setSubmissionDone] = useState(false);

  // Check if user already submitted (if oneSubmissionOnly is enabled)
  useEffect(() => {
    const checkSubmission = async () => {
      if (form.oneSubmissionOnly && user) {
        const submissionsRef = collection(db, 'forms', form.id, 'submissions');
        const q = query(submissionsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setAlreadySubmitted(true);
        }
      }
    };

    checkSubmission();
  }, [form.id, form.oneSubmissionOnly, user]);

  const handleAnswerChange = (questionId: string, answer: number | number[] | string) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (!user && form.requireLogin) {
      alert('Vui lòng đăng nhập để nộp bài');
      navigate({ to: '/auth/login' });
      return;
    }

    const timeSpent = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;

    try {
      await submitResponse(
        form.id,
        user?.uid || 'anonymous',
        user?.email || 'Anonymous',
        answers,
        timeSpent
      );

      // Clear timer from localStorage BEFORE navigation
      localStorage.removeItem(`exam-start-${form.id}`);

      // Navigate to results page
      navigate({ to: `/quiz/${form.id}/results` });

      // Set submission states
      setSubmissionDone(true);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Nộp bài thất bại. Vui lòng thử lại.');
    }
  };

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, []);

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center py-12">
        <Card className="p-16 text-center max-w-2xl mx-auto bg-white shadow-xl">
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Bạn đã nộp bài rồi
            </h2>
            <p className="text-lg text-gray-600">
              Form này chỉ cho phép nộp một lần. Bạn đã hoàn thành bài kiểm tra này.
            </p>
          </div>
          <Button onClick={() => navigate({ to: '/dashboard' })} size="lg">
            Quay lại Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center py-12">
        <Card className="p-16 text-center max-w-2xl mx-auto bg-white shadow-xl">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Nộp bài thành công!
            </h2>
            <p className="text-lg text-gray-600">
              Cảm ơn bạn đã hoàn thành bài kiểm tra. Đang chuyển đến trang xem đáp án...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Start screen - show before quiz begins (when timer is enabled)
  if (!started && form.enableTimer) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-12 flex flex-col items-center ">
        <div className="max-w-2xl ">
          {/* Timer */}
          <div className="flex items-center gap-2 text-gray-800 mb-8 justify-self-center">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-medium">{form.timerMinutes} phút</span>
          </div>

          {/* Main content */}
          <div className='flex flex-col items-center'>
            <p className="text-gray-800 font-medium mb-6 text-base ">
              Đây là biểu mẫu đã hẹn giờ.
            </p>

            <p className="text-gray-700 leading-relaxed mb-8 text-base">
              Sau khi bắt đầu, bạn không thể tạm dừng bộ hẹn giờ. Đừng lo, Forms
              cung cấp cho bạn lời nhắc phút cuối trước khi gửi. Câu trả lời của
              bạn sẽ được gửi tự động khi hết thời gian. Vui lòng chuẩn bị trước
              khi bạn bắt đầu giúp quản lý thời gian gửi của bạn.
            </p>

            {/* Button */}
            <button
              onClick={() => {
                setStarted(true);
                setStartTime(Date.now());
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors border-2 border-blue-600 cursor-pointer flex justify-center"
            >
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
      <div className="w-2/3">
        <Card className="bg-white shadow-xl border-0 rounded-none min-h-screen">
          {/* Timer - sticky at top */}
          {form.enableTimer && form.timerMinutes && (
            <div className="w-full bg-white p-6 shadow-lg z-50 sticky top-0 mb-6">
              <TimerProgress
                timerMinutes={form.timerMinutes}
                formId={form.id}
                onTimeUp={handleTimeUp}
                submissionDone={submissionDone}
                onStartTimer={() => {
                  if (!startTime) setStartTime(Date.now());
                }}
              />
            </div>
          )}

          <div className="text-center mb-8 px-4 md:px-10 pt-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{form.title}</h1>
            {form.description && (
              <p className="text-lg text-gray-600">{form.description}</p>
            )}
          </div>

          <div className="space-y-6 px-4 md:px-10">
            {form.questions
              .sort((a, b) => a.order - b.order)
              .map((question) => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  answer={
                    answers[question.id] !== undefined
                      ? answers[question.id]
                      : question.type === 'checkbox'
                        ? []
                        : question.type === 'radio'
                          ? -1  // -1 means no selection
                          : ''
                  }
                  onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
                />
              ))}
          </div>

          {/* Submit button */}
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => handleSubmit()}
              disabled={loading}
              className="flex items-center gap-2"
              size="lg"
            >
              <Send className="w-5 h-5" />
              <span>{loading ? 'Đang nộp bài...' : 'Nộp bài'}</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
