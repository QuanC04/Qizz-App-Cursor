import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';
import { Navbar } from '../components/common/Navbar';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();

  // Hide navbar when taking quiz
  const isQuizRoute = location.pathname.includes('/forms/') && location.pathname.includes('/take');

  return (
    <>
      {!isQuizRoute && <Navbar />}
      <Outlet />
    </>
  );
}
