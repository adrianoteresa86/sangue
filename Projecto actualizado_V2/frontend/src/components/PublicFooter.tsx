import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Phone, Mail } from 'lucide-react';

export function PublicFooter() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold">{t('landing.footer.title')}</h3>
            </div>
            <p className="text-gray-400">{t('landing.footer.description')}</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('landing.footer.links.title')}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button onClick={() => navigate('/sobre')} className="hover:text-white transition-colors">
                  {t('landing.footer.links.about')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                  {t('landing.footer.links.how')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/estoque-publico')} className="hover:text-white transition-colors">
                  {t('landing.footer.links.units')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contacto')} className="hover:text-white transition-colors">
                  {t('landing.footer.links.contact')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('landing.footer.contact.title')}</h4>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{t('landing.footer.contact.phone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{t('landing.footer.contact.email')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>{t('landing.footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
