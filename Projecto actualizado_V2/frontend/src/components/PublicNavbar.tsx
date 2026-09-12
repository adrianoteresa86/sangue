import { useState, useRef, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Globe, ChevronUp, ChevronDown, LogIn, UserPlus } from 'lucide-react';

export function PublicNavbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(e.target as Node)) {
        setLoginMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.about'), to: '/sobre' },
    { label: t('nav.stock'), to: '/estoque-publico' },
    { label: t('nav.contact'), to: '/contacto' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Heart className="w-6 h-6 text-red-600" />
          <span className="text-xl font-bold text-gray-900">DoarFazBem</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative" ref={loginMenuRef}>
            <button
              onClick={() => setLoginMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <span>{t("nav.enter")}</span>

              {loginMenuOpen ? (
                <ChevronUp size={16} className="opacity-80" />
              ) : (
                <ChevronDown size={16} className="opacity-80" />
              )}
            </button>

            {loginMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <button
                  onClick={() => {
                    navigate("/login");
                    setLoginMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 font-medium transition-colors"
                >
                  <LogIn size={18} />
                  <span>{t("nav.sign_in")}</span>
                </button>

                <div className="border-t border-gray-100" />

                <button
                  onClick={() => {
                    navigate("/register");
                    setLoginMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 font-medium transition-colors"
                >
                  <UserPlus size={18} />
                  <span>{t("nav.create_account")}</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const l = i18n.language === 'pt' ? 'en' : 'pt';
              i18n.changeLanguage(l);
              localStorage.setItem('language', l);
            }}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            title={i18n.language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
          >
            <Globe className="w-4 h-4" />
            <span>{i18n.language === 'pt' ? 'EN' : 'PT'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
