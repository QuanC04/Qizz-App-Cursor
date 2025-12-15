import { createFileRoute, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useFormStore } from '../../../stores/useFormStore';
import { FormBuilder } from '../../../components/form/FormBuilder';
import type { FormInput } from '../../../types';

export const Route = createFileRoute('/forms/$formId/edit')({
  component: EditFormPage,
});

function EditFormPage() {
  const { formId } = useParams({ from: '/forms/$formId/edit' });
  const { fetchFormById, currentForm, loading } = useFormStore();
  const [formData, setFormData] = useState<(FormInput & { id: string }) | null>(null);

  useEffect(() => {
    fetchFormById(formId);
  }, [formId]);

  useEffect(() => {
    if (currentForm) {
      setFormData({
        id: currentForm.id,
        title: currentForm.title,
        description: currentForm.description,
        status: currentForm.status,
        questions: currentForm.questions,
      });
    }
  }, [currentForm]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Loading form...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Form not found</p>
      </div>
    );
  }

  return <FormBuilder mode="edit" initialData={formData} />;
}
