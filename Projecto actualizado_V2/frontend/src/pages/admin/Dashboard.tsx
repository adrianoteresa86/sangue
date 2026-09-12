import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Users, Megaphone, Droplets, Building2 } from 'lucide-react';
import api from '../../services/api';

interface RegistroDoacao {
  id: number;
  dataDoacao: string;
  tipoSangue: string;
  quantidade: number;
  elegivel: boolean;
  doador?: { nome?: string };
  hemocentro?: { nome?: string };
}

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const { data: doadoresData, isLoading: loadingDoadores } = useQuery({
    queryKey: ['doadores'],
    queryFn: () => api.get('/doadores').then((res) => res.data),
  });

  const { data: campanhasData, isLoading: loadingCampanhas } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => api.get('/campanhas').then((res) => res.data),
  });

  const { data: estoqueData, isLoading: loadingEstoque } = useQuery({
    queryKey: ['estoque-sangue'],
    queryFn: () => api.get('/estoque-sangue/formatados').then((res) => res.data),
  });

  const { data: hemocentrosData, isLoading: loadingHemocentros } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
  });

  const { data: registrosData = [] } = useQuery<RegistroDoacao[]>({
    queryKey: ['registros-doacao-admin'],
    queryFn: () => api.get('/registros-doacao').then((res) => res.data),
  });

  const isLoading = loadingDoadores || loadingCampanhas || loadingEstoque || loadingHemocentros;

  const stats = [
    {
      label: t('admin.dashboard.stat_donors'),
      value: Array.isArray(doadoresData) ? doadoresData.length.toLocaleString() : '0',
      icon: <Users className="w-9 h-9 text-blue-500" />,
      color: 'bg-blue-50',
    },
    {
      label: t('admin.dashboard.stat_campaigns'),
      value: Array.isArray(campanhasData)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? campanhasData.filter((c: any) => c.ativo).length.toString()
        : '0',
      icon: <Megaphone className="w-9 h-9 text-green-500" />,
      color: 'bg-green-50',
    },
    {
      label: t('admin.dashboard.stat_stock'),
      value: Array.isArray(estoqueData)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? `${Math.round(estoqueData.reduce((total: number, item: any) => total + (item.quantidade || 0), 0) / 1000)}L`
        : '0L',
      icon: <Droplets className="w-9 h-9 text-red-500" />,
      color: 'bg-red-50',
    },
    {
      label: t('admin.dashboard.stat_hemocentros'),
      value: Array.isArray(hemocentrosData) ? hemocentrosData.length.toString() : '0',
      icon: <Building2 className="w-9 h-9 text-purple-500" />,
      color: 'bg-purple-50',
    },
  ];

  const recentDonations = [...registrosData]
    .sort((a, b) => new Date(b.dataDoacao).getTime() - new Date(a.dataDoacao).getTime())
    .slice(0, 5);

  const estoquePorTipo = Array.isArray(estoqueData)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? estoqueData.reduce((acc: any, item: any) => {
        const tipo = item.tipoSangue || 'Desconhecido';
        if (!acc[tipo]) {
          acc[tipo] = { quantidade: 0, itens: [] };
        }
        acc[tipo].quantidade += item.quantidade || 0;
        acc[tipo].itens.push(item);
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500 text-center">
            <div className="w-16 h-16 mx-auto border-4 border-gray-300 border-t-primary rounded-full animate-spin mb-4"></div>
            <p>{t('admin.dashboard.loading')}</p>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.dashboard.title')}</h1>
            <p className="text-gray-600">{t('admin.dashboard.subtitle')}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className={`${stat.color} rounded-lg p-6 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <span className="text-4xl">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={t('admin.dashboard.recent_donations_title')}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4">{t('admin.dashboard.col_donor')}</th>
                      <th className="text-left py-2 px-4">{t('admin.dashboard.col_type')}</th>
                      <th className="text-left py-2 px-4">{t('admin.dashboard.col_date')}</th>
                      <th className="text-left py-2 px-4">{t('admin.dashboard.col_status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDonations.length > 0 ? (
                      recentDonations.map((d) => (
                        <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{d.doador?.nome || `Doador #${d.id}`}</td>
                          <td className="py-3 px-4">
                            <span className="bg-red-100 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                              {d.tipoSangue || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(d.dataDoacao).toLocaleDateString('pt-PT')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              d.elegivel ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {d.elegivel ? t('admin.dashboard.status_completed') : t('admin.dashboard.status_ineligible')}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          {t('admin.dashboard.no_recent')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title={t('admin.dashboard.stock_title')}>
              <div className="space-y-4">
                {Object.keys(estoquePorTipo).length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  Object.entries(estoquePorTipo).map(([tipo, dados]: [string, any]) => {
                    const quantidade = dados.quantidade || 0;
                    const maxQuantidade = 1000;
                    const percentage = Math.min((quantidade / maxQuantidade) * 100, 100);

                    return (
                      <div key={tipo}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-700">{tipo}</span>
                          <span className="text-sm text-gray-600">{quantidade} mL</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              quantidade > 500 ? 'bg-green-500' : quantidade > 200 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t('admin.dashboard.no_stock')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
