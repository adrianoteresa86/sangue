import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Users, Droplet, Award, Target, Eye, CheckCircle, Shield, Zap, ArrowRight, Microscope, Hospital, Megaphone, Smartphone, GraduationCap } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';

export function Sobre() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const parallaxRef = useRef<HTMLDivElement>(null);
  const parallaxCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (parallaxRef.current)
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.45}px)`;
      if (parallaxCtaRef.current)
        parallaxCtaRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const valores = [
    { icon: <Users className="w-5 h-5" />, label: t('sobre.values.solidarity_label'), desc: t('sobre.values.solidarity_desc') },
    { icon: <Shield className="w-5 h-5" />, label: t('sobre.values.quality_label'), desc: t('sobre.values.quality_desc') },
    { icon: <CheckCircle className="w-5 h-5" />, label: t('sobre.values.integrity_label'), desc: t('sobre.values.integrity_desc') },
    { icon: <Zap className="w-5 h-5" />, label: t('sobre.values.innovation_label'), desc: t('sobre.values.innovation_desc') },
  ];

  const servicos = [
    { icon: <Droplet className="w-8 h-8 text-red-600" />, title: t('sobre.services.collection_title'), desc: t('sobre.services.collection_desc') },
    { icon: <Microscope className="w-8 h-8 text-red-600" />, title: t('sobre.services.screening_title'), desc: t('sobre.services.screening_desc') },
    { icon: <Hospital className="w-8 h-8 text-red-600" />, title: t('sobre.services.distribution_title'), desc: t('sobre.services.distribution_desc') },
    { icon: <Megaphone className="w-8 h-8 text-red-600" />, title: t('sobre.services.campaigns_title'), desc: t('sobre.services.campaigns_desc') },
    { icon: <Smartphone className="w-8 h-8 text-red-600" />, title: t('sobre.services.platform_title'), desc: t('sobre.services.platform_desc') },
    { icon: <GraduationCap className="w-8 h-8 text-red-600" />, title: t('sobre.services.training_title'), desc: t('sobre.services.training_desc') },
  ];

  const highlights = t('sobre.highlights', { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 35%, #991b1b 65%, #b91c1c 100%)', minHeight: '420px' }}
      >
        <div ref={parallaxRef} className="absolute inset-0 pointer-events-none will-change-transform" style={{ top: '-20%', height: '140%' }}>
          <div className="absolute -top-16 -right-32 w-96 h-96 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-red-400 opacity-10" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-red-300 opacity-5" style={{ transform: 'translate(-50%,-50%)' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-28 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
            <Heart className="w-4 h-4 text-red-300 animate-pulse" />
            <span className="text-sm font-semibold text-red-100">{t('sobre.badge')}</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight">
            {t('sobre.title')}
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto leading-relaxed">
            {t('sobre.subtitle')}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" style={{ height: '60px' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* Missão / Visão / Valores */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('sobre.what_moves_us')}</h2>
            <div className="w-24 h-1 bg-red-600 mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <Target className="w-8 h-8 text-red-600" />,
                title: t('sobre.mission_title'),
                text: t('sobre.mission_text'),
              },
              {
                icon: <Eye className="w-8 h-8 text-red-600" />,
                title: t('sobre.vision_title'),
                text: t('sobre.vision_text'),
              },
              {
                icon: <Award className="w-8 h-8 text-red-600" />,
                title: t('sobre.values_title'),
                text: t('sobre.values_text'),
              },
            ].map((item) => (
              <div key={item.title} className="bg-red-50 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: '10k+', label: t('sobre.stats.active_donors'), icon: <Users className="w-6 h-6" /> },
              { value: '30k+', label: t('sobre.stats.lives_saved'), icon: <Heart className="w-6 h-6" /> },
              { value: '18', label: t('sobre.stats.provinces'), icon: <Shield className="w-6 h-6" /> },
              { value: '+20', label: t('sobre.stats.years_service'), icon: <Award className="w-6 h-6" /> },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
                  {stat.icon}
                </div>
                <p className="text-4xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('sobre.history_title')}</h2>
              <div className="w-24 h-1 bg-red-600 mx-auto" />
            </div>
            <div className="grid md:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-gray-600 leading-relaxed mb-5">
                  {t('sobre.history_p1')}
                </p>
                <p className="text-gray-600 leading-relaxed mb-5">
                  {t('sobre.history_p2')}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {t('sobre.history_p3')}
                </p>
              </div>
              <div className="space-y-3">
                {highlights.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-red-50 rounded-lg px-4 py-3">
                    <CheckCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span className="text-gray-700 text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Os Nossos Valores */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('sobre.our_values_title')}</h2>
            <div className="w-24 h-1 bg-red-600 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {valores.map((v) => (
              <div key={v.label} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                  {v.icon}
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{v.label}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O Que Fazemos */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('sobre.what_we_do_title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('sobre.what_we_do_subtitle')}
            </p>
            <div className="w-24 h-1 bg-red-600 mx-auto mt-4" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {servicos.map((s) => (
              <div key={s.title} className="flex items-start gap-4 p-6 rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all">
                <div className="shrink-0 bg-red-50 p-3 rounded-full">
                  {s.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{s.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative py-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 40%, #991b1b 70%, #b91c1c 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 overflow-hidden leading-none" style={{ height: '60px', transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#ffffff" />
          </svg>
        </div>

        <div ref={parallaxCtaRef} className="absolute inset-0 pointer-events-none will-change-transform" style={{ top: '-20%', height: '140%' }}>
          <div className="absolute -top-10 -left-20 w-80 h-80 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-20 -right-10 w-96 h-96 rounded-full bg-red-400 opacity-10" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-white opacity-5" style={{ transform: 'translate(-50%,-50%)' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
            <Droplet className="w-4 h-4 text-red-300 animate-pulse" />
            <span className="text-sm font-semibold text-red-100">{t('sobre.cta_badge')}</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            {t('sobre.cta_title')}
          </h2>
          <p className="text-xl mb-10 text-red-100 max-w-2xl mx-auto">
            {t('sobre.cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-red-700 px-10 py-4 rounded-xl font-bold hover:bg-red-50 transition-colors shadow-xl inline-flex items-center gap-2"
            >
              {t('sobre.cta_donate')} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/contacto')}
              className="bg-white/10 border border-white/25 text-white px-10 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              {t('sobre.cta_contact')}
            </button>
          </div>
        </div>

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
