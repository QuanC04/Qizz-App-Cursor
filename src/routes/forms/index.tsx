import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useFormStore } from '../../stores/useFormStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { FileText } from 'lucide-react';
import type { Form } from '../../types';

export const Route = createFileRoute('/forms/')({
  component: FormsListPage,
});

function FormsListPage() {
  const { forms, fetchAllPublishedForms, loading } = useFormStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllPublishedForms();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Browse Forms
          </h1>
          <p className="text-lg text-gray-600">Discover and take available quizzes and forms</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 mt-4">Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <Card className="p-16 text-center bg-white/80 backdrop-blur-sm max-w-2xl mx-auto">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              No published forms yet
            </h3>
            <p className="text-gray-600">
              Check back later for new forms to complete
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form: Form) => (
              <Card key={form.id} className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all" hover>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {form.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {form.description}
                  </p>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <FileText className="w-4 h-4 mr-1" />
                  <span>{form.questions.length} question{form.questions.length !== 1 ? 's' : ''}</span>
                </div>

                <Button
                  onClick={() => navigate({ to: `/forms/$formId/take`, params: { formId: form.id } })}
                  className="w-full"
                  size="lg"
                >
                  Take Quiz
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
