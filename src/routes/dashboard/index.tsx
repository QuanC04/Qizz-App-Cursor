import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useFormStore } from '../../stores/useFormStore';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PlusCircle, FileText, Edit, Trash2, Eye, Clock } from 'lucide-react';
import type { Form } from '../../types';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading: authLoading } = useAuthStore();
  const { forms, fetchUserForms, deleteForm, updateFormSilent, loading } = useFormStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    if (!user) {
      navigate({ to: '/auth/login' });
      return;
    }
    fetchUserForms(user.uid);
  }, [user, authLoading, navigate]);

  const handleDelete = async (formId: string) => {
    if (confirm('Are you sure you want to delete this form?')) {
      try {
        await deleteForm(formId);
      } catch (error) {
        console.error('Error deleting form:', error);
      }
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
            My Forms
          </h1>
          <p className="text-lg text-gray-600 mb-8">Create and manage your quizzes and forms</p>
          <Button
            onClick={() => navigate({ to: '/forms/new' })}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl mx-auto"
            size="lg"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create New Form</span>
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 mt-4">Loading your forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <Card className="p-16 text-center bg-white/80 backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-6">
              <FileText className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No forms yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by creating your first form. It only takes a few minutes!
            </p>
            <Button onClick={() => navigate({ to: '/forms/new' })} size="lg" className="shadow-lg">
              <div className="flex items-center ">
                <PlusCircle className="w-5 h-5 mr-2" />
                Create Your First Form
              </div>
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form: Form) => (
              <Card
                key={form.id}
                className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                hover
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {form.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{form.description}</p>
                  </div>
                  <button
                    onClick={async e => {
                      e.stopPropagation();
                      const newStatus = form.status === 'published' ? 'draft' : 'published';
                      try {
                        await updateFormSilent(form.id, { status: newStatus });
                        fetchUserForms(user.uid); // Refresh list
                      } catch (error) {
                        console.error('Error updating status:', error);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full cursor-pointer transition-all hover:scale-105 ${
                      form.status === 'published'
                        ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                    title={
                      form.status === 'published' ? 'Click để chuyển về nháp' : 'Click để xuất bản'
                    }
                  >
                    {form.status === 'published' ? '● Published' : '○ Draft'}
                  </button>
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>
                      {form.questions.length} question{form.questions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{form.updatedAt?.toDate().toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      navigate({ to: `/forms/$formId/edit`, params: { formId: form.id } })
                    }
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      navigate({ to: `/responses/$formId`, params: { formId: form.id } })
                    }
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Results</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(form.id)}
                    className="flex items-center justify-center px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
