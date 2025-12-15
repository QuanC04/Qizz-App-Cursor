import { createFileRoute, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useFormStore } from '../../../stores/useFormStore';
import { QuizViewer } from '../../../components/quiz/QuizViewer';

export const Route = createFileRoute('/forms/$formId/take')({
  component: TakeQuizPage,
});

function TakeQuizPage() {
  const { formId } = useParams({ from: '/forms/$formId/take' });
  const { fetchFormById, currentForm, loading } = useFormStore();

  useEffect(() => {
    fetchFormById(formId);
  }, [formId]);

  if (loading) {
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

  return <QuizViewer form={currentForm} />;
}
