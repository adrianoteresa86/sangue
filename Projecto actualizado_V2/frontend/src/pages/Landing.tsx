import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, Clock, Users, Droplet, CheckCircle, ArrowRight, Phone, Mail } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';

export function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('');
  const parallaxRef = useRef<HTMLDivElement>(null);
  const parallaxCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.45}px)`;
      }
      if (parallaxCtaRef.current) {
        parallaxCtaRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const locations = [
    'Luanda - Hospital Josina Machel',
    'Luanda - Hospital Maria Pia',
    'Luanda - Hospital Prenda',
    'Benguela - Hospital Benguela',
    'Huambo - Hospital Central do Huambo',
    'Lubango - Hospital Nossa Senhora do Monte',
    'Cabinda - Hospital Municipal de Cabinda',
    'Uíge - Hospital Regional do Uíge',
    'Malanje - Hospital Provincial de Malanje',
    'Namibe - Hospital Regional do Namibe',
    'Soyo - Municipal de Soyo',
    'Kuito - Hospital do Kuito'
  ];

  const donationSteps = [
    {
      number: '01',
      title: t('landing.steps.01.title'),
      description: t('landing.steps.01.description')
    },
    {
      number: '02',
      title: t('landing.steps.02.title'),
      description: t('landing.steps.02.description')
    },
    {
      number: '03',
      title: t('landing.steps.03.title'),
      description: t('landing.steps.03.description')
    },
    {
      number: '04',
      title: t('landing.steps.04.title'),
      description: t('landing.steps.04.description')
    },
    {
      number: '05',
      title: t('landing.steps.05.title'),
      description: t('landing.steps.05.description')
    },
    {
      number: '06',
      title: t('landing.steps.06.title'),
      description: t('landing.steps.06.description')
    }
  ];

  const requirements = [
    t('landing.requirements.items.0'),
    t('landing.requirements.items.1'),
    t('landing.requirements.items.2'),
    t('landing.requirements.items.3'),
    t('landing.requirements.items.4'),
    t('landing.requirements.items.5')
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 35%, #991b1b 65%, #b91c1c 100%)' }}
      >
        {/* Parallax background layer */}
        <div ref={parallaxRef} className="absolute inset-0 pointer-events-none will-change-transform" style={{ top: '-20%', height: '140%' }}>
          <div className="absolute -top-16 -right-32 w-125 h-125 rounded-full bg-white opacity-5" />
          <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full bg-red-400 opacity-10" />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-red-300 opacity-5" style={{ transform: 'translate(-50%, -50%)' }} />
          <div className="absolute top-20 left-1/2 w-48 h-48 rounded-full bg-white opacity-5" />
        </div>

        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* ── Left: text + CTA ── */}
            <div className="text-white">
              {/* Brand badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-10">
                <Heart className="w-4 h-4 text-red-300 animate-pulse" />
                <span className="text-sm font-semibold text-red-100 tracking-wide">DoarFazBem · Angola</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                {t('landing.title')}
              </h1>
              <p className="text-xl text-red-100 font-medium mb-4">
                {t('landing.subtitle')}
              </p>
              <p className="text-red-200 mb-12 text-base leading-relaxed max-w-lg">
                {t('landing.description')}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-14">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white text-red-700 px-8 py-4 rounded-xl font-bold text-base hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-xl"
                >
                  <Droplet className="w-5 h-5" />
                  {t('landing.buttons.donate')}
                </button>
                <button
                  onClick={() => navigate('/estoque-publico')}
                  className="bg-white/10 border border-white/25 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  {t('landing.buttons.stock')}
                </button>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-3xl font-extrabold">10k+</p>
                  <p className="text-red-300 text-sm mt-0.5">Doadores</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-3xl font-extrabold">30k+</p>
                  <p className="text-red-300 text-sm mt-0.5">Vidas salvas</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-3xl font-extrabold">18</p>
                  <p className="text-red-300 text-sm mt-0.5">Províncias</p>
                </div>
              </div>
            </div>

            {/* ── Right: decorative panel ── */}
            <div className="hidden lg:flex flex-col items-center justify-center gap-6">
              {/* Central drop icon */}
              <div
                className="w-44 h-44 rounded-full flex items-center justify-center shadow-2xl"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
              >
                <Droplet className="w-20 h-20 text-white drop-shadow-lg" />
              </div>

              {/* Blood type grid */}
              <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
                {['O+', 'A+', 'B+', 'AB+', 'O−', 'A−', 'B−', 'AB−'].map((tipo) => (
                  <div
                    key={tipo}
                    className="rounded-xl py-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)' }}
                  >
                    <p className="text-base font-extrabold text-white">{tipo}</p>
                  </div>
                ))}
              </div>

              {/* Urgency card */}
              <div
                className="w-full max-w-xs rounded-2xl px-6 py-4 flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)' }}
              >
                <div className="w-10 h-10 rounded-full bg-red-400/30 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-red-200" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Doação salva até 3 vidas</p>
                  <p className="text-red-200 text-xs mt-0.5">Cada gota conta. Regista-te hoje.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" style={{ height: '60px' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* Donation Steps Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              {t('landing.steps.title')}
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {donationSteps.map((step, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                {t('landing.requirements.title')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('landing.requirements.subtitle')}
              </p>
              <div className="w-24 h-1 bg-red-600 mx-auto"></div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">{t('landing.requirements.requirements_title')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center gap-2"
                >
                  {t('landing.requirements.button')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              {t('landing.locations.title')}
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-3">{t('landing.locations.select_label')}</label>
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none"
                >
                  <option value="">{t('landing.locations.placeholder')}</option>
                  {locations.map((location, index) => (
                    <option key={index} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              
              {selectedLocation && (
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{selectedLocation}</h3>
                      <div className="space-y-2 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{t('landing.locations.schedule')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>+244 222 123 456</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>doacao@institutonacionaldesangue.ao</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/register')}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        {t('landing.locations.button')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 40%, #991b1b 70%, #b91c1c 100%)' }}
      >
        {/* Top wave */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none" style={{ height: '60px', transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#f9fafb" />
          </svg>
        </div>

        {/* Parallax background layer */}
        <div ref={parallaxCtaRef} className="absolute inset-0 pointer-events-none will-change-transform" style={{ top: '-20%', height: '140%' }}>
          <div className="absolute -top-10 -left-20 w-80 h-80 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-20 -right-10 w-96 h-96 rounded-full bg-red-400 opacity-10" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-white opacity-5" style={{ transform: 'translate(-50%, -50%)' }} />
          <div className="absolute top-10 right-1/3 w-48 h-48 rounded-full bg-red-300 opacity-5" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
            <Heart className="w-4 h-4 text-red-300 animate-pulse" />
            <span className="text-sm font-semibold text-red-100">Junte-se a nós</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl mb-10 text-red-100 max-w-2xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-red-700 px-10 py-4 rounded-xl font-bold text-base hover:bg-red-50 transition-colors shadow-xl"
          >
            {t('landing.cta.button')}
          </button>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" style={{ height: '60px' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,20 C360,60 1080,-20 1440,20 L1440,60 L0,60 Z" fill="#111827" />
          </svg>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
