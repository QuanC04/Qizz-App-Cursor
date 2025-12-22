import { createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '../../components/auth/LoginForm';
import { z } from 'zod';

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/auth/login')({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <LoginForm redirectTo={redirect} />;
}
