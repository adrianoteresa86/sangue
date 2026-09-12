import { useState, useRef, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell, Building2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  ClipboardList, Droplets, Home, LogOut, Megaphone, User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_GRADIENT = 'linear-gradient(180deg, #450a0a 0%, #7f1d1d 55%, #991b1b 100%)';
const HEADER_GRADIENT  = 'linear-gradient(90deg, #450a0a 0%, #7f1d1d 45%, #991b1b 75%, #b91c1c 100%)';

function useClickFora(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

function iniciais(nome?: string) {
  if (!nome) return '?';
  return nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function useRelogio() {
  const [agora, setAgora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return agora;
}

interface DoadorLayoutProps {
  children: ReactNode;
}

export const DoadorLayout = ({ children }: DoadorLayoutProps) => {
  const { t } = useTranslation();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const agora = useRelogio();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickFora(menuRef, () => setMenuAberto(false));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const doadorMenuItems = [
    { label: t('layout_doador.menu_dashboard'),   href: '/doador',              icon: <Home className="w-5 h-5 shrink-0" />,         end: true },
    { label: t('layout_doador.menu_donate'),       href: '/doador/agendar',      icon: <Droplets className="w-5 h-5 shrink-0" /> },
    { label: t('layout_doador.menu_hemocentros'),  href: '/doador/hemocentros',  icon: <Building2 className="w-5 h-5 shrink-0" /> },
    { label: t('layout_doador.menu_campaigns'),    href: '/doador/campanhas',    icon: <Megaphone className="w-5 h-5 shrink-0" /> },
    { label: t('layout_doador.menu_history'),      href: '/doador/historico',    icon: <ClipboardList className="w-5 h-5 shrink-0" /> },
    { label: 'Notificações',                       href: '/doador/notificacoes', icon: <Bell className="w-5 h-5 shrink-0" /> },
    { label: t('layout_doador.menu_profile'),      href: '/doador/perfil',       icon: <User className="w-5 h-5 shrink-0" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} text-white transition-all duration-300 flex flex-col shadow-xl shrink-0`}
        style={{ background: SIDEBAR_GRADIENT }}
      >
        <div className="p-6 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <Droplets className="w-7 h-7 shrink-0" />
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-xl leading-tight">DoarFazBem</h1>
              <p className="text-xs text-red-300 mt-0.5">{t('layout_doador.sidebar_subtitle')}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {doadorMenuItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold border-l-4 border-white/80 pl-3'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm text-white/75 hover:text-white"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {sidebarOpen && <span>{t('layout.collapse')}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>{t('layout.logout')}</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="px-8 py-4 flex items-center justify-between shadow-md shrink-0"
          style={{ background: HEADER_GRADIENT, borderBottom: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div>
            <p className="text-xs text-red-300 uppercase tracking-wide font-medium">{t('layout_doador.panel_label')}</p>
            <h2 className="text-lg font-bold text-white leading-tight">{usuario?.nome}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-sm font-bold text-white tabular-nums">
                {agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-xs text-white/60">
                {agora.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuAberto((v) => !v)}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-3 py-1.5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold">
                  {iniciais(usuario?.nome)}
                </div>
                <span className="hidden md:block text-sm text-white font-medium max-w-28 truncate">{usuario?.nome}</span>
                {menuAberto
                  ? <ChevronUp className="w-3.5 h-3.5 text-white/60" />
                  : <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                }
              </button>

              {menuAberto && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #450a0a, #991b1b)' }}>
                    <p className="text-sm font-semibold text-white truncate">{usuario?.nome}</p>
                    <p className="text-xs text-red-300 font-medium">{t('layout_doador.role')}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { navigate('/doador'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" /> {t('layout.dashboard')}
                    </button>
                    <button onClick={() => { navigate('/doador/perfil'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> {t('layout_doador.menu_profile')}
                    </button>
                    <button onClick={() => { navigate('/doador/historico'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-gray-400" /> {t('layout_doador.menu_history')}
                    </button>
                    <button onClick={() => { navigate('/doador/campanhas'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-gray-400" /> {t('layout_doador.menu_campaigns')}
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                      <LogOut className="w-4 h-4" /> {t('layout.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
