import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy as firestoreOrderBy, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useFormStore } from '../../../stores/useFormStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatTime } from '../../../utils/formatTime';
import type { Response } from '../../../types';

export const Route = createFileRoute('/quiz/$formId/results')({
  component: ResultsPage,
});

function ResultsPage() {
  const { formId } = useParams({ from: '/quiz/$formId/results' });
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchFormById, currentForm } = useFormStore();
  const [submission, setSubmission] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchFormById(formId);

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const submissionsRef = collection(db, 'forms', formId, 'submissions');

        // Simplified query without orderBy to avoid index issues
        const q = query(
          submissionsRef,
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Get the most recent one manually
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Response));

          // Sort by submittedAt manually
          docs.sort((a, b) => {
            const aTime = a.submittedAt?.toMillis() || 0;
            const bTime = b.submittedAt?.toMillis() || 0;
            return bTime - aTime;
          });

          const latestSubmission = docs[0];
          setSubmission(latestSubmission);
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [formId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Đang tải kết quả...</p>
      </div>
    );
  }

  if (!currentForm || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Không tìm thấy bài làm của bạn</p>
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalPoints = currentForm.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold mb-2">{currentForm.title}</h1>
          {currentForm.description && (
            <p className="text-gray-600 mb-8">{currentForm.description}</p>
          )}

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Điểm số</p>
              <p className="text-3xl font-bold text-blue-600">
                {submission.score ||0}/{totalPoints}
              </p>
            </div>

            {submission.timeSpent && (
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-1">Thời gian làm bài</p>
                <div className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                  <Clock size={24} />
                  {formatTime(submission.timeSpent)}
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500 border-t pt-3">
            <span className="font-semibold">Nộp bài lúc:</span>{' '}
            {submission.submittedAt && new Date(submission.submittedAt.toDate()).toLocaleString('vi-VN')}
          </p>
        </div>

        {/* Questions Detail */}
        <div className="space-y-4">
          {currentForm.questions
            .sort((a, b) => a.order - b.order)
            .map((question, idx) => {
              const userAnswer = submission.answers[question.id];
              const correctAnswer = question.correctAnswer;

              let isCorrect = false;

              // Check if answer is correct
              if (question.type === 'radio') {
                isCorrect = userAnswer === correctAnswer;
              } else if (question.type === 'checkbox') {
                const userArr = Array.isArray(userAnswer) ? userAnswer : [];
                const correctArr = Array.isArray(correctAnswer) ? correctAnswer : [];
                isCorrect =
                  userArr.length === correctArr.length &&
                  userArr.every((ans) => correctArr.includes(ans));
              } else if (question.type === 'text') {
                const correctArr = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
                const userStr = String(userAnswer || '').toLowerCase().trim();
                isCorrect = correctArr.some(
                  (ans) => String(ans).toLowerCase().trim() === userStr
                );
              }

              return (
                <div key={question.id} className="bg-white rounded-xl shadow-md p-5">
                  <div
                    className={`flex items-center gap-2 mb-3 w-fit px-3 py-1 rounded-full font-semibold ${
                      isCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Đúng (+{question.points} điểm)
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Sai
                      </>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg mb-3 flex gap-x-2 items-center">
                    <span className="bg-black text-white px-4 py-1 rounded-full text-sm font-bold">
                      Câu {idx + 1}
                    </span>
                    <span>{question.content}</span>
                  </h3>

                  <div className="space-y-2 ml-2">
                    {question.type === 'text' ? (
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Câu trả lời của bạn:</p>
                          <input
                            type="text"
                            value={String(userAnswer || 'Chưa trả lời')}
                            disabled
                            className={`p-2 border rounded-lg w-full max-w-md ${
                              isCorrect
                                ? 'border-green-400 bg-green-50'
                                : 'border-red-400 bg-red-50'
                            }`}
                          />
                        </div>
                        {!isCorrect && correctAnswer && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Đáp án đúng:</p>
                            <div className="text-black p-2 border rounded-lg border-green-400 bg-green-50 w-full max-w-md">
                              {Array.isArray(correctAnswer)
                                ? correctAnswer.join(', ')
                                : correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      question.options?.map((option, optionIndex) => {
                        const userSelected = question.type === 'radio'
                          ? userAnswer === optionIndex
                          : Array.isArray(userAnswer) && userAnswer.includes(optionIndex);

                        const isCorrectOption = question.type === 'radio'
                          ? correctAnswer === optionIndex
                          : Array.isArray(correctAnswer) && correctAnswer.includes(optionIndex);

                        let borderClass = 'border-gray-300';
                        if (isCorrectOption && userSelected) {
                          borderClass = 'border-green-500 bg-green-50';
                        } else if (isCorrectOption) {
                          borderClass = 'border-green-300 bg-green-50';
                        } else if (userSelected) {
                          borderClass = 'border-red-400 bg-red-50';
                        }

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-center gap-3 p-3 border rounded-lg ${borderClass}`}
                          >
                            <input
                              type={question.type === 'radio' ? 'radio' : 'checkbox'}
                              checked={userSelected}
                              readOnly
                              className="w-5 h-5"
                            />
                            <span className="text-gray-800">{option}</span>
                            {isCorrectOption && (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 mb-6">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition cursor-pointer"
          >
            Quay lại Dashboard
          </button>
          <button
            onClick={() => navigate({ to: `/forms/${formId}/take` })}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            Làm lại
          </button>
        </div>
      </div>
    </div>
  );
}
