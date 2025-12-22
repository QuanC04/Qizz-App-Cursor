import { createFileRoute } from '@tanstack/react-router';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { z } from 'zod';

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/auth/register')({
  validateSearch: searchSchema,
  component: RegisterPage,
});

function RegisterPage() {
  const { redirect } = Route.useSearch();
  return <RegisterForm redirectTo={redirect} />;
}
