import { useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { useTranslation } from 'react-i18next';
import { Heart, CheckCircle, Droplet, Users, Shield } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (parallaxRef.current)
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.45}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const registerSchema = z.object({
    nome: z.string().min(3, t('errors.name_required')),
    email: z.string().email(t('errors.email_invalid')),
    senha: z.string().min(6, t('errors.password_required')),
    telefone: z.string().min(10, t('errors.phone_invalid')),
    rua: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    provincia: z.string().optional(),
    perfil: z.enum(['DOADOR', 'RECEPTOR', 'ADMIN']),
  });

  type RegisterFormData = z.infer<typeof registerSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      perfil: 'DOADOR',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
    }
  };

  const beneficios = [
    { icon: <Droplet className="w-5 h-5" />, text: t('register.hero_benefit_1') },
    { icon: <Users className="w-5 h-5" />, text: t('register.hero_benefit_2') },
    { icon: <Shield className="w-5 h-5" />, text: t('register.hero_benefit_3') },
    { icon: <CheckCircle className="w-5 h-5" />, text: t('register.hero_benefit_4') },
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
          {/* Parallax circles */}
          <div ref={parallaxRef} className="absolute inset-0 pointer-events-none will-change-transform" style={{ top: '-20%', height: '140%' }}>
            <div className="absolute -top-16 -right-20 w-96 h-96 rounded-full bg-white opacity-5" />
            <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-red-400 opacity-10" />
            <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-red-300 opacity-5" style={{ transform: 'translate(-50%,-50%)' }} />
            <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-white opacity-5" />
          </div>

          <div className="relative z-10 px-12 py-16 text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
              <Heart className="w-4 h-4 text-red-300 animate-pulse" />
              <span className="text-sm font-semibold text-red-100">{t('register.hero_badge')}</span>
            </div>

            <h2 className="text-4xl font-extrabold mb-4 leading-tight">
              {t('register.hero_title_1')}<br />{t('register.hero_title_2')}
            </h2>
            <p className="text-red-100 text-lg mb-10 leading-relaxed max-w-sm">
              {t('register.hero_desc')}
            </p>

            <div className="space-y-4">
              {beneficios.map((b, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <div className="text-red-300 shrink-0">{b.icon}</div>
                  <span className="text-white text-sm font-medium">{b.text}</span>
                </div>
              ))}
            </div>

            {/* Stats row */}
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
        <div className="flex-1 flex items-start justify-center bg-gray-50 px-6 py-12 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Droplet className="w-7 h-7 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('register.title')}</h1>
              <p className="text-gray-500 mt-1">{t('register.subtitle')}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('register.name_label')}
                  placeholder={t('register.name_placeholder')}
                  {...register('nome')}
                  error={errors.nome?.message}
                />

                <Input
                  label={t('register.email_label')}
                  type="email"
                  placeholder={t('register.email_placeholder')}
                  {...register('email')}
                  error={errors.email?.message}
                />

                <Input
                  label={t('register.phone_label')}
                  placeholder={t('register.phone_placeholder')}
                  {...register('telefone')}
                  error={errors.telefone?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('register.street_label')}
                    placeholder={t('register.street_placeholder')}
                    {...register('rua')}
                    error={errors.rua?.message}
                  />
                  <Input
                    label={t('register.number_label')}
                    placeholder={t('register.number_placeholder')}
                    {...register('numero')}
                    error={errors.numero?.message}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('register.neighborhood_label')}
                    placeholder={t('register.neighborhood_placeholder')}
                    {...register('bairro')}
                    error={errors.bairro?.message}
                  />
                  <Input
                    label={t('register.province_label')}
                    placeholder={t('register.province_placeholder')}
                    {...register('provincia')}
                    error={errors.provincia?.message}
                  />
                </div>

                <Input
                  label={t('register.password_label')}
                  type="password"
                  placeholder={t('register.password_placeholder')}
                  {...register('senha')}
                  error={errors.senha?.message}
                />

                <Select
                  label={t('register.user_type_label')}
                  {...register('perfil')}
                  options={[
                    { value: 'DOADOR', label: t('user_types.donor') },
                    { value: 'RECEPTOR', label: t('user_types.receptor') },
                  ]}
                  error={errors.perfil?.message}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  className="w-full"
                >
                  {t('register.register_button')}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  {t('register.has_account')}{' '}
                  <Link to="/login" className="text-red-600 font-semibold hover:underline">
                    {t('register.login_link')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
