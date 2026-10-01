import { Outlet } from 'react-router';
import { Navbar } from './Navbar.jsx';

export function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col bg-navy-900">
      <Navbar />
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
