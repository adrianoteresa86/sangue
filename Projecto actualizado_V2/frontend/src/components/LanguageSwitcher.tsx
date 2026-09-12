import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-shadow flex items-center gap-2 text-gray-700 hover:text-red-600"
      title={i18n.language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
    >
      <Globe className="w-5 h-5" />
      <span className="font-medium text-sm">
        {i18n.language === 'pt' ? 'EN' : 'PT'}
      </span>
    </button>
  );
}
