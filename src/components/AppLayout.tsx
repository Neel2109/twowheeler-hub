import { Link, useLocation } from 'react-router-dom';
import { Wrench, LayoutDashboard, Plus, List, Search, FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/create', label: 'New RO', icon: Plus },
  { to: '/orders', label: 'All Orders', icon: List },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="garage-gradient text-garage-dark-foreground border-b border-sidebar-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-primary leading-none">Patidar Auto Care</h1>
              <p className="text-[10px] text-garage-dark-foreground/60 leading-none mt-0.5">Two-Wheeler Service Center</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <Button variant="ghost" size="icon" onClick={signOut} className="ml-2 text-sidebar-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
