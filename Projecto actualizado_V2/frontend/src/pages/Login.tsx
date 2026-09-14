import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Heart, Droplet, Shield, Users, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';

export const Login: React.FC = () => {
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().min(1, t('errors.email_required')),
    senha: z.string().min(1, t('errors.password_required')),
  });
  type LoginFormData = z.infer<typeof loginSchema>;

  const navigate = useNavigate();
  const { login, usuario } = useAuth();
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const onScroll = () => {
      if (parallaxRef.current)
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.45}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (usuario) {
      switch (usuario.perfil) {
        case 'ADMIN': 
        case 'COORDENADOR_HEMOCENTRO':
        case 'TECNICO_HEMOCENTRO':
          navigate('/admin'); break;
        case 'DOADOR': navigate('/doador'); break;
        case 'RECEPTOR': navigate('/receptor'); break;
        default: navigate('/doador');
      }
    }
  }, [usuario, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError('');
      await login(data.email, data.senha);
    } catch (error: any) {
      setLoginError(error.message || t('errors.invalid_credentials'));
    }
  };

  const destaques = [
    { icon: <Droplet className="w-5 h-5" />, text: t('login.hero_feature_1') },
    { icon: <Users className="w-5 h-5" />, text: t('login.hero_feature_2') },
    { icon: <Shield className="w-5 h-5" />, text: t('login.hero_feature_3') },
    { icon: <Heart className="w-5 h-5" />, text: t('login.hero_feature_4') },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNavbar />

      <div className="flex flex-1">
        {/* ── Left: parallax hero panel ── */}
        <div
          className="hidden lg:flex flex-col justify-center relative overflow-hidden w-1/2 shrink-0"
          style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 40%, #991b1b 70%, #b91c1c 100%)', minHeight: 'calc(100vh - 64px)' }}
        >
          <div ref={parallaxRef} className="absolute inset-0 pointer-events-none will-change-transform" style={{ top: '-20%', height: '140%' }}>
            <div className="absolute -top-16 -right-20 w-96 h-96 rounded-full bg-white opacity-5" />
            <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-red-400 opacity-10" />
            <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-red-300 opacity-5" style={{ transform: 'translate(-50%,-50%)' }} />
            <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-white opacity-5" />
          </div>

          <div className="relative z-10 px-12 py-16 text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
              <Heart className="w-4 h-4 text-red-300 animate-pulse" />
              <span className="text-sm font-semibold text-red-100">{t('login.hero_badge')}</span>
            </div>

            <h2 className="text-4xl font-extrabold mb-4 leading-tight">
              {t('login.hero_title_1')}<br />{t('login.hero_title_2')}
            </h2>
            <p className="text-red-100 text-lg mb-10 leading-relaxed max-w-sm">
              {t('login.hero_desc')}
            </p>

            <div className="space-y-4">
              {destaques.map((d, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <div className="text-red-300 shrink-0">{d.icon}</div>
                  <span className="text-white text-sm font-medium">{d.text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-8 mt-12 pt-8 border-t border-white/20">
              <div>
                <p className="text-2xl font-extrabold">10k+</p>
                <p className="text-red-300 text-xs mt-0.5">{t('layout.stat_donors')}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-2xl font-extrabold">30k+</p>
                <p className="text-red-300 text-xs mt-0.5">{t('layout.stat_lives')}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-2xl font-extrabold">18</p>
                <p className="text-red-300 text-xs mt-0.5">{t('layout.stat_provinces')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('login.subtitle')}</h1>
              <p className="text-gray-500 mt-1 text-sm">{t('login.description')}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {loginError && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('login.email_label')}
                  </label>

                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="text"
                      placeholder={t('login.email_placeholder')}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm transition"
                      {...register('email')}
                    />
                  </div>

                  {errors.email && (
                    <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('login.password_label')}
                  </label>

                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('login.password_placeholder')}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm transition"
                      {...register('senha')}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {errors.senha && (
                    <p className="text-red-600 text-xs mt-1">{errors.senha.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition"
                >
                  {isSubmitting ? t('login.logging_in') : t('login.login_button')}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                {t('login.no_account')}{' '}
                <Link to="/register" className="text-red-600 font-semibold hover:underline">
                  {t('login.register_now')}
                </Link>
              </div>

              <p className="text-xs text-center text-gray-400 mt-4">
                {t('login.terms')}{' '}
                <span className="text-red-600 cursor-pointer hover:underline">{t('login.terms_of_use')}</span>
                {' '}e{' '}
                <span className="text-red-600 cursor-pointer hover:underline">{t('login.privacy_policy')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
