import { createFileRoute } from '@tanstack/react-router';
import { FormBuilder } from '../../components/form/FormBuilder';

export const Route = createFileRoute('/forms/new')({
  component: NewFormPage,
});

function NewFormPage() {
  return <FormBuilder mode="create" />;
}
