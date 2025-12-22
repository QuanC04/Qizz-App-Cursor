import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useFormStore } from '../../../stores/useFormStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { QuizViewer } from '../../../components/quiz/QuizViewer';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { LogIn, Lock } from 'lucide-react';

export const Route = createFileRoute('/forms/$formId/take')({
  component: TakeQuizPage,
});

function TakeQuizPage() {
  const { formId } = useParams({ from: '/forms/$formId/take' });
  const { fetchFormById, currentForm, loading } = useFormStore();
  const { user, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFormById(formId);
  }, [formId]);

  if (loading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Loading quiz...</p>
      </div>
    );
  }

  if (!currentForm) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Quiz not found</p>
      </div>
    );
  }

  if (currentForm.status !== 'published') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">This quiz is not available</p>
      </div>
    );
  }

  // Check login requirement BEFORE showing quiz
  if (currentForm.requireLogin && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center py-12">
        <Card className="p-12 text-center max-w-lg mx-auto bg-white shadow-xl">
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Yêu cầu đăng nhập</h2>
            <p className="text-gray-600 mb-2">
              Bài kiểm tra "{currentForm.title}" yêu cầu bạn đăng nhập trước khi làm bài.
            </p>
            <p className="text-sm text-gray-500">Đăng nhập để tiếp tục và lưu kết quả của bạn.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() =>
                navigate({ to: '/auth/login', search: { redirect: `/forms/${formId}/take` } })
              }
              size="lg"
              className="flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Đăng nhập
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate({ to: '/auth/register', search: { redirect: `/forms/${formId}/take` } })
              }
            >
              Chưa có tài khoản? Đăng ký
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: '/' })} className="text-gray-500">
              Quay lại trang chủ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <QuizViewer form={currentForm} />;
}
