import { useState, useRef, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  AlertOctagon, BarChart2, Bell, Building2, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, ClipboardList, Droplets, Home, LogOut, User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

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

interface ReceptorLayoutProps {
  children: ReactNode;
}

export const ReceptorLayout = ({ children }: ReceptorLayoutProps) => {
  const { t } = useTranslation();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const agora = useRelogio();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickFora(menuRef, () => setMenuAberto(false));

  const { data: notifData } = useQuery<{ naoLidas: number }>({
    queryKey: ['receptor-notificacoes-count'],
    queryFn: () => api.get('/receptor/notificacoes').then((r) => ({ naoLidas: r.data.naoLidas ?? 0 })),
    refetchInterval: 60000,
  });
  const naoLidas = notifData?.naoLidas ?? 0;

  const prevNaoLidas = useRef<number | null>(null);
  useEffect(() => {
    if (notifData === undefined) return;
    if (prevNaoLidas.current !== null && (notifData.naoLidas ?? 0) > prevNaoLidas.current) {
      const novas = (notifData.naoLidas ?? 0) - prevNaoLidas.current;
      const msg = novas === 1
        ? t('layout.notifications_new_single', { count: novas })
        : t('layout.notifications_new_plural', { count: novas });
      toast(msg, {
        icon: <Bell className="w-4 h-4" />,
        action: { label: t('layout.view'), onClick: () => navigate('/receptor/notificacoes') },
      });
    }
    prevNaoLidas.current = notifData.naoLidas ?? 0;
  }, [notifData, navigate, t]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const receptorMenuItems = [
    {
      section: t('layout_receptor.section_transfusion'),
      items: [
        { label: t('layout_receptor.menu_request'),      href: '/receptor/transfusao',  icon: <Droplets className="w-5 h-5 shrink-0" />,     badge: 0 },
        { label: t('layout_receptor.menu_requisitions'), href: '/receptor/requisicoes', icon: <ClipboardList className="w-5 h-5 shrink-0" />, badge: 0 },
        { label: t('layout_receptor.menu_history'),      href: '/receptor/historico',   icon: <BarChart2 className="w-5 h-5 shrink-0" />,     badge: 0 },
        { label: t('layout_receptor.menu_hemocentros'),  href: '/receptor/hemocentros', icon: <Building2 className="w-5 h-5 shrink-0" />,     badge: 0 },
      ],
    },
    {
      section: t('layout_receptor.section_account'),
      items: [
        { label: t('layout_receptor.menu_notifications'), href: '/receptor/notificacoes', icon: <Bell className="w-5 h-5 shrink-0" />, badge: naoLidas },
        { label: t('layout_receptor.menu_profile'),       href: '/receptor/perfil',        icon: <User className="w-5 h-5 shrink-0" />, badge: 0 },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} text-white transition-all duration-300 flex flex-col shadow-xl shrink-0`}
        style={{ background: SIDEBAR_GRADIENT }}
      >
        <div className="p-6 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <Building2 className="w-7 h-7 shrink-0" />
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-xl leading-tight">DoarFazBem</h1>
              <p className="text-xs text-red-300 mt-0.5">{t('layout_receptor.sidebar_subtitle')}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {receptorMenuItems.map((section) => (
            <div key={section.section}>
              {sidebarOpen && (
                <p className="text-xs font-semibold text-red-300 uppercase tracking-widest px-4 mb-2">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm ${
                        isActive
                          ? 'bg-white/20 text-white font-semibold border-l-4 border-white/80 pl-3'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    {item.icon}
                    {sidebarOpen && (
                      <span className="flex-1 flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.badge > 0 && (
                          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </span>
                    )}
                    {!sidebarOpen && item.badge > 0 && (
                      <span className="absolute top-1 right-1 bg-yellow-400 text-gray-900 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button
            onClick={() => setEmergencyActive(!emergencyActive)}
            className={`w-full flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm font-medium ${
              emergencyActive
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <AlertOctagon className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span>{emergencyActive ? t('layout_receptor.emergency_active') : t('layout_receptor.emergency_activate')}</span>}
          </button>
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
            <p className="text-xs text-red-300 uppercase tracking-wide font-medium">{t('layout_receptor.panel_label')}</p>
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

            {naoLidas > 0 && (
              <button
                onClick={() => navigate('/receptor/notificacoes')}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center" style={{ fontSize: '10px', minWidth: '18px', minHeight: '18px' }}>
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              </button>
            )}

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
                    <p className="text-xs text-red-300">{usuario?.email}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { navigate('/receptor'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" /> {t('layout.dashboard')}
                    </button>
                    <button onClick={() => { navigate('/receptor/perfil'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" /> {t('layout_receptor.menu_profile')}
                    </button>
                    <button onClick={() => { navigate('/receptor/requisicoes'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-gray-400" /> {t('layout_receptor.menu_requisitions_short')}
                    </button>
                    <button onClick={() => { navigate('/receptor/historico'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-gray-400" /> {t('layout_receptor.menu_history')}
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

      {emergencyActive && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-red-200">
            <div className="px-5 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(90deg, #450a0a, #991b1b)' }}>
              <AlertOctagon className="w-5 h-5 text-white shrink-0" />
              <p className="font-bold text-white text-sm">{t('layout_receptor.emergency_title')}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600 mb-4">{t('layout_receptor.emergency_desc')}</p>
              <button
                onClick={() => setEmergencyActive(false)}
                className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: 'linear-gradient(90deg, #7f1d1d, #b91c1c)' }}
              >
                {t('layout_receptor.emergency_deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
