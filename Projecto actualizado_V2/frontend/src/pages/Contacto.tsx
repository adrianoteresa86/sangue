import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Phone, Mail, MapPin, Clock, Send, CheckCircle, ArrowRight } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';

interface FormState {
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
}

export function Contacto() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState<FormState>({
    nome: '',
    email: '',
    telefone: '',
    assunto: 'geral',
    mensagem: '',
  });

  useEffect(() => {
    const onScroll = () => {
      if (parallaxRef.current)
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.45}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviado(true);
  };

  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6 text-red-600" />,
      title: t('contacto.contact_phone'),
      lines: ['+244 923 456 789 (Linha Verde)', '+244 222 123 456'],
    },
    {
      icon: <Mail className="w-6 h-6 text-red-600" />,
      title: t('contacto.contact_email'),
      lines: ['contacto@institutonacionaldesangue.ao', 'doacoes@doardoar.ao'],
    },
    {
      icon: <MapPin className="w-6 h-6 text-red-600" />,
      title: t('contacto.contact_address'),
      lines: ['Rua Amílcar Cabral, 35', 'Luanda, Angola'],
    },
    {
      icon: <Clock className="w-6 h-6 text-red-600" />,
      title: t('contacto.contact_hours'),
      lines: ['Segunda a Sexta: 8h – 17h', 'Sábado: 8h – 13h'],
    },
  ];

  const provincias = [
    { nome: 'Luanda', hemocentros: 3 },
    { nome: 'Benguela', hemocentros: 2 },
    { nome: 'Huambo', hemocentros: 1 },
    { nome: 'Lubango', hemocentros: 1 },
    { nome: 'Cabinda', hemocentros: 1 },
    { nome: 'Malanje', hemocentros: 1 },
    { nome: 'Uíge', hemocentros: 1 },
    { nome: 'Soyo', hemocentros: 1 },
    { nome: 'Namibe', hemocentros: 1 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 35%, #991b1b 65%, #b91c1c 100%)', minHeight: '380px' }}
      >
        <div ref={parallaxRef} className="absolute inset-0 pointer-events-none will-change-transform" style={{ top: '-20%', height: '140%' }}>
          <div className="absolute -top-16 -right-32 w-96 h-96 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-red-400 opacity-10" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-red-300 opacity-5" style={{ transform: 'translate(-50%,-50%)' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-24 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
            <Heart className="w-4 h-4 text-red-300 animate-pulse" />
            <span className="text-sm font-semibold text-red-100">{t('contacto.badge')}</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-6 leading-tight">{t('contacto.title')}</h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto leading-relaxed">
            {t('contacto.subtitle')}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" style={{ height: '60px' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* Contact cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {contactInfo.map((c) => (
              <div key={c.title} className="bg-red-50 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  {c.icon}
                </div>
                <h4 className="font-bold text-gray-900 mb-3">{c.title}</h4>
                {c.lines.map((line, i) => (
                  <p key={i} className="text-gray-600 text-sm">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12">

            {/* Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('contacto.form_title')}</h2>
              <p className="text-gray-500 mb-8">{t('contacto.form_subtitle')}</p>

              {enviado ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-700">{t('contacto.success_title')}</h3>
                  <p className="text-green-600">{t('contacto.success_msg')}</p>
                  <button
                    onClick={() => { setEnviado(false); setForm({ nome: '', email: '', telefone: '', assunto: 'geral', mensagem: '' }); }}
                    className="text-sm text-green-700 underline hover:no-underline"
                  >
                    {t('contacto.send_another')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('contacto.full_name')}</label>
                      <input
                        type="text"
                        name="nome"
                        value={form.nome}
                        onChange={handleChange}
                        required
                        placeholder={t('contacto.full_name_placeholder')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('contacto.phone_label')}</label>
                      <input
                        type="tel"
                        name="telefone"
                        value={form.telefone}
                        onChange={handleChange}
                        placeholder="+244 9XX XXX XXX"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('contacto.email_label')}</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="seu@email.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('contacto.subject_label')}</label>
                    <select
                      name="assunto"
                      value={form.assunto}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      <option value="geral">{t('contacto.subject_general')}</option>
                      <option value="doacao">{t('contacto.subject_donation')}</option>
                      <option value="agendamento">{t('contacto.subject_scheduling')}</option>
                      <option value="parceria">{t('contacto.subject_partnership')}</option>
                      <option value="tecnico">{t('contacto.subject_technical')}</option>
                      <option value="outro">{t('contacto.subject_other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('contacto.message_label')}</label>
                    <textarea
                      name="mensagem"
                      value={form.mensagem}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder={t('contacto.message_placeholder')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> {t('contacto.send_button')}
                  </button>
                </form>
              )}
            </div>

            {/* Locations */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('contacto.units_title')}</h2>
              <p className="text-gray-500 mb-8">{t('contacto.units_subtitle')}</p>

              <div className="space-y-3">
                {provincias.map((p) => (
                  <div key={p.nome} className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:border-red-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.nome}</p>
                        <p className="text-gray-400 text-xs">
                          {p.hemocentros} {p.hemocentros > 1 ? t('contacto.hemocentros_label_plural') : t('contacto.hemocentros_label')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {t('contacto.unit_active')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-red-50 rounded-2xl p-5 flex items-start gap-4">
                <Clock className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{t('contacto.donation_hours_title')}</p>
                  <p className="text-gray-600 text-sm">{t('contacto.donation_hours_weekdays')}</p>
                  <p className="text-gray-600 text-sm">{t('contacto.donation_hours_saturday')}</p>
                  <p className="text-gray-400 text-xs mt-1">{t('contacto.donation_hours_note')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto bg-red-600 rounded-3xl p-12 text-white shadow-2xl">
            <Heart className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-extrabold mb-4">{t('contacto.cta_title')}</h2>
            <p className="text-red-100 mb-8">
              {t('contacto.cta_subtitle')}
            </p>
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-red-700 px-8 py-3.5 rounded-xl font-bold hover:bg-red-50 transition-colors shadow-lg inline-flex items-center gap-2"
            >
              {t('contacto.cta_button')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
