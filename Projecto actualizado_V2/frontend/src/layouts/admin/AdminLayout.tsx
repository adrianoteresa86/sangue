import { useState, useRef, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Bell, Building2, CalendarDays, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, Droplets, Home, LogOut,
  Megaphone, RefreshCw, User, Users, Menu, X
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

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { t } = useTranslation();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const agora = useRelogio();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickFora(menuRef, () => setMenuAberto(false));

  const { data: notifData } = useQuery<{ contagem: number }>({
    queryKey: ['admin-notificacoes-count'],
    queryFn: () => api.get('/notificacoes/minhas/contagem-nao-lidas').then((r) => r.data),
    refetchInterval: 60000,
  });
  const naoLidas = notifData?.contagem ?? 0;

  const prevNaoLidas = useRef<number | null>(null);
  useEffect(() => {
    if (notifData === undefined) return;
    if (prevNaoLidas.current !== null && notifData.contagem > prevNaoLidas.current) {
      const novas = notifData.contagem - prevNaoLidas.current;
      const msg = novas === 1
        ? t('layout.notifications_new_single', { count: novas })
        : t('layout.notifications_new_plural', { count: novas });
      toast(msg, {
        icon: <Bell className="w-4 h-4" />,
        action: { label: t('layout.view'), onClick: () => navigate('/admin/notificacoes') },
      });
    }
    prevNaoLidas.current = notifData.contagem;
  }, [notifData, navigate, t]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenuItems = [
    {
      section: t('layout_admin.section_blood'),
      items: [
        { label: t('layout_admin.menu_stock'),      href: '/admin/estoque',     icon: <Droplets className="w-5 h-5 shrink-0" /> },
        ...(usuario?.perfil === 'ADMIN' ? [{ label: t('layout_admin.menu_hemocentros'), href: '/admin/hemocentros', icon: <Building2 className="w-5 h-5 shrink-0" /> }] : []),
      ],
    },
    {
      section: t('layout_admin.section_management'),
      items: [
        { label: t('layout_admin.menu_appointments'),  href: '/admin/agendamentos',      icon: <CalendarDays className="w-5 h-5 shrink-0" /> },
        { label: t('layout_admin.menu_donors'),        href: '/admin/doadores',          icon: <Users className="w-5 h-5 shrink-0" /> },
        { label: t('layout_admin.menu_campaigns'),     href: '/admin/campanhas',         icon: <Megaphone className="w-5 h-5 shrink-0" /> },
        { label: t('layout_admin.menu_requests'),      href: '/admin/pedidos-transfusao', icon: <RefreshCw className="w-5 h-5 shrink-0" /> },
        ...(usuario?.perfil === 'ADMIN' || usuario?.perfil === 'COORDENADOR_HEMOCENTRO' ? [{ label: t('layout_admin.menu_users'),         href: '/admin/usuarios',          icon: <User className="w-5 h-5 shrink-0" /> }] : []),
        { label: t('layout_admin.menu_notifications'), href: '/admin/notificacoes',      icon: <Bell className="w-5 h-5 shrink-0" /> },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col text-white transition-all duration-300 shadow-xl
          md:relative md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
          ${sidebarOpen ? 'md:w-64' : 'md:w-20'}
        `}
        style={{ background: SIDEBAR_GRADIENT }}
      >
        <div className="p-6 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-2">
            <Droplets className="w-7 h-7 shrink-0" />
            {(sidebarOpen || mobileMenuOpen) && (
              <div>
                <h1 className="font-bold text-xl leading-tight">DoarFazBem</h1>
                <p className="text-xs text-red-300 mt-0.5">{t('layout_admin.panel_label')}</p>
              </div>
            )}
          </div>
          <button 
            className="md:hidden text-white/75 hover:text-white" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {adminMenuItems.map((section) => (
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
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm ${
                        isActive
                          ? 'bg-white/20 text-white font-semibold border-l-4 border-white/80 pl-3'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    {item.icon}
                    {(sidebarOpen || mobileMenuOpen) && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 space-y-2 hidden md:block" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
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
        <div className="p-4 space-y-2 md:hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
           <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('layout.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="px-4 md:px-8 py-4 flex items-center justify-between shadow-md shrink-0"
          style={{ background: HEADER_GRADIENT, borderBottom: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-white bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs text-red-300 uppercase tracking-wide font-medium hidden sm:block">{t('layout_admin.panel_label')}</p>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate max-w-37.5 sm:max-w-xs">{usuario?.nome}</h2>
            </div>
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

            <button
              onClick={() => navigate('/admin/notificacoes')}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {naoLidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center" style={{ fontSize: '10px', minWidth: '18px', minHeight: '18px' }}>
                  {naoLidas > 9 ? '9+' : naoLidas}
                </span>
              )}
            </button>

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
                    <p className="text-xs text-red-300 font-medium">{t('layout_admin.role')}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { navigate('/admin'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" /> {t('layout.dashboard')}
                    </button>
                    <button onClick={() => { navigate('/admin/doadores'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" /> {t('layout_admin.menu_donors')}
                    </button>
                    {usuario?.perfil === 'ADMIN' && (
                      <button onClick={() => { navigate('/admin/hemocentros'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" /> {t('layout_admin.menu_hemocentros')}
                      </button>
                    )}
                    <button onClick={() => { navigate('/admin/campanhas'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-gray-400" /> {t('layout_admin.menu_campaigns')}
                    </button>
                    <button onClick={() => { navigate('/admin/agendamentos'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" /> {t('layout_admin.menu_appointments')}
                    </button>
                    <button onClick={() => { navigate('/admin/notificacoes'); setMenuAberto(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 flex items-center gap-2">
                      <span className="relative inline-flex">
                        <Bell className="w-4 h-4 text-gray-400" />
                        {naoLidas > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none" style={{ fontSize: '9px' }}>
                            {naoLidas > 9 ? '9+' : naoLidas}
                          </span>
                        )}
                      </span>
                      {t('layout_admin.menu_notifications')}
                      {naoLidas > 0 && (
                        <span className="ml-auto text-xs font-bold text-red-600">{naoLidas}</span>
                      )}
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
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
