import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Droplet, AlertCircle, TrendingUp, TrendingDown, Minus, Heart, Loader2, RefreshCw } from 'lucide-react';
import { PublicNavbar } from '../components/PublicNavbar';
import { PublicFooter } from '../components/PublicFooter';
import api from '../services/api';

interface ItemInventario {
  tipoSangue: string;
  totalMl: number;
  bolsas: number;
  numLotes: number;
  status: 'critical' | 'low' | 'normal' | 'high';
  minRecomendado: number;
  maxRecomendado: number;
}

interface ResumoEstoque {
  resumo: {
    totalMl: number;
    totalBolsas: number;
    criticos: number;
    baixos: number;
    atualizadoEm: string;
  };
  inventario: ItemInventario[];
}

export function EstoquePublico() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const parallaxHeaderRef = useRef<HTMLDivElement>(null);
  const parallaxCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (parallaxHeaderRef.current) {
        parallaxHeaderRef.current.style.transform = `translateY(${window.scrollY * 0.45}px)`;
      }
      if (parallaxCtaRef.current) {
        parallaxCtaRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery<ResumoEstoque>({
    queryKey: ['estoque-publico'],
    queryFn: () => api.get('/publico/estoque-resumo').then((r) => r.data),
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: 10 * 60 * 1000, // refresca automaticamente a cada 10 min
  });

  const inventario = data?.inventario ?? [];
  const resumo = data?.resumo;

  const getStatusColor = (status: ItemInventario['status']) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'low':      return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':   return 'text-green-600 bg-green-50 border-green-200';
      case 'high':     return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: ItemInventario['status']) => {
    switch (status) {
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      case 'low':      return <TrendingDown className="w-4 h-4" />;
      case 'normal':   return <Minus className="w-4 h-4" />;
      case 'high':     return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: ItemInventario['status']) => {
    switch (status) {
      case 'critical': return t('stock.table.status.critical');
      case 'low':      return t('stock.table.status.low');
      case 'normal':   return t('stock.table.status.normal');
      case 'high':     return t('stock.table.status.high');
    }
  };

  const formatHora = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />

      {/* Header Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 35%, #991b1b 65%, #b91c1c 100%)', minHeight: '320px' }}
      >
        <div ref={parallaxHeaderRef} className="absolute inset-0 pointer-events-none will-change-transform" style={{ top: '-20%', height: '140%' }}>
          <div className="absolute -top-16 -right-32 w-96 h-96 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-red-400 opacity-10" />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-red-300 opacity-5" style={{ transform: 'translate(-50%,-50%)' }} />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-20 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
            <Droplet className="w-4 h-4 text-red-300" />
            <span className="text-sm font-semibold text-red-100">Consulta pública</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4">{t('stock.title')}</h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">{t('stock.subtitle')}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" style={{ height: '60px' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-28">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : isError ? (
            <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
              <p className="font-semibold mb-3">Não foi possível carregar os dados do estoque.</p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline"
              >
                <RefreshCw className="w-4 h-4" /> Tentar novamente
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">{resumo?.totalBolsas ?? 0}</div>
                  <div className="text-gray-600 text-sm">{t('stock.stats.total')}</div>
                  <div className="text-xs text-gray-400 mt-1">{resumo?.totalMl?.toLocaleString('pt-PT') ?? 0} mL</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{resumo?.baixos ?? 0}</div>
                  <div className="text-gray-600 text-sm">{t('stock.stats.low')}</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">{resumo?.criticos ?? 0}</div>
                  <div className="text-gray-600 text-sm">{t('stock.stats.critical')}</div>
                </div>
              </div>
              {resumo?.atualizadoEm && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  Actualizado hoje às {formatHora(resumo.atualizadoEm)}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Alert Section */}
      {!isLoading && !isError && ((resumo?.criticos ?? 0) > 0 || (resumo?.baixos ?? 0) > 0) && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {(resumo?.criticos ?? 0) > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                    <h3 className="text-lg font-semibold text-red-800">{t('stock.alerts.urgent.title')}</h3>
                  </div>
                  <p className="text-red-700">
                    {t('stock.alerts.urgent.message', { count: resumo?.criticos })}
                  </p>
                </div>
              )}
              {(resumo?.baixos ?? 0) > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-6 h-6 text-orange-600 shrink-0" />
                    <h3 className="text-lg font-semibold text-orange-800">{t('stock.alerts.low.title')}</h3>
                  </div>
                  <p className="text-orange-700">
                    {t('stock.alerts.low.message', { count: resumo?.baixos })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Blood Inventory Table */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{t('stock.table.title')}</h2>
                  <p className="text-gray-600 mt-1 text-sm">{t('stock.table.subtitle')}</p>
                </div>
                {!isLoading && (
                  <button
                    onClick={() => refetch()}
                    title="Actualizar"
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('stock.table.headers.type')}</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Bolsas disponíveis</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Volume total (mL)</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{t('stock.table.headers.status')}</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Mín. recomendado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inventario.map((item) => (
                        <tr key={item.tipoSangue} className={`hover:bg-gray-50 ${item.status === 'critical' ? 'bg-red-50/40' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                item.status === 'critical' ? 'bg-red-100 text-red-700' :
                                item.status === 'low'      ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {item.tipoSangue}
                              </div>
                              <span className="font-medium text-gray-900">Tipo {item.tipoSangue}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xl font-bold ${item.bolsas === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                              {item.bolsas}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">bolsas</span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {item.totalMl.toLocaleString('pt-PT')} mL
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                                {getStatusIcon(item.status)}
                                {getStatusText(item.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-500">
                            {item.minRecomendado} bolsas
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        className="relative py-28 overflow-hidden"
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
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
            <Heart className="w-4 h-4 text-red-300 animate-pulse" />
            <span className="text-sm font-semibold text-red-100">Cada gota conta</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">{t('stock.cta.title')}</h2>
          <p className="text-xl mb-10 text-red-100 max-w-2xl mx-auto">{t('stock.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-red-700 px-10 py-4 rounded-xl font-bold hover:bg-red-50 transition-colors shadow-xl"
            >
              {t('stock.cta.buttons.donate')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-white/10 border border-white/25 text-white px-10 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              {t('stock.cta.buttons.home')}
            </button>
          </div>
        </div>
      </section>

      {/* Information */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('stock.info.title')}</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('stock.info.how_updated.title')}</h4>
                <p className="text-gray-600 leading-relaxed">{t('stock.info.how_updated.description')}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('stock.info.critical_meaning.title')}</h4>
                <p className="text-gray-600 leading-relaxed">{t('stock.info.critical_meaning.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
