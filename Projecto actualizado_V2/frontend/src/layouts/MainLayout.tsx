import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart2, CalendarDays, ChevronLeft, ChevronRight,
  ClipboardList, Droplets, LogOut, Megaphone, Settings, User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard',      href: '/dashboard',    icon: <BarChart2 className="w-5 h-5" /> },
    { label: 'Meu Perfil',     href: '/perfil',       icon: <User className="w-5 h-5" /> },
    { label: 'Agendar Doação', href: '/agendar-doacao', icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'Histórico',      href: '/historico',    icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Campanhas',      href: '/campanhas',    icon: <Megaphone className="w-5 h-5" /> },
    { label: 'Estoque',        href: '/estoque',      icon: <Droplets className="w-5 h-5" /> },
    ...(usuario?.perfil === 'ADMIN' ? [{ label: 'Admin Panel', href: '/admin', icon: <Settings className="w-5 h-5" /> }] : []),
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-secondary text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-700 flex items-center gap-2">
          <Droplets className="w-6 h-6 shrink-0" />
          {sidebarOpen && <h1 className="font-bold text-2xl">DoarFazBem</h1>}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mb-2"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {sidebarOpen && <span>Recolher</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-primary rounded-lg hover:bg-primary-intense transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Bem-vindo!</p>
            <p className="text-lg font-bold text-gray-900">{usuario?.nome}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Perfil: <span className="font-semibold">{usuario?.perfil}</span>
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
