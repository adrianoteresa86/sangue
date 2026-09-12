import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Syringe, Droplets, BarChart2 } from 'lucide-react';
import api from '../../services/api';
import type { HistoricoReceptor, PedidoReceptor } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT');
}

export const ReceptorHistorico: React.FC = () => {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery<HistoricoReceptor>({
    queryKey: ['receptor-historico'],
    queryFn: () => api.get('/receptor/historico').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        {t('receptor.historico.error_load')}
      </div>
    );
  }

  const stats = [
    { label: t('receptor.historico.stat_total'), value: String(data?.total ?? 0), icon: <Syringe className="w-8 h-8 text-red-500" /> },
    { label: t('receptor.historico.stat_liters'), value: `${data?.totalLitros ?? 0}L`, icon: <Droplets className="w-8 h-8 text-red-500" /> },
    { label: t('receptor.historico.stat_year'), value: String(data?.esteAno ?? 0), icon: <BarChart2 className="w-8 h-8 text-blue-500" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('receptor.historico.title')}</h1>
        <p className="text-gray-600 mt-1">{t('receptor.historico.subtitle')}</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className="text-4xl">{stat.icon}</div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabela */}
      <Card>
        {!data?.transfusoes?.length ? (
          <div className="py-12 text-center text-gray-500">
            <Droplets className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <p className="font-medium">{t('receptor.historico.empty_msg')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.historico.col_date')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.historico.col_blood')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.historico.col_volume')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.historico.col_motive')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.historico.col_hemocentro')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.historico.col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.transfusoes.map((item: PedidoReceptor) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(item.criadoEm)}</td>
                    <td className="py-3 px-4">
                      <span className="bg-red-100 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        {item.tipoSanguinePaciente}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.quantidadeSolicitada} mL</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={item.diagnostico}>
                      {item.diagnostico}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.hemocentro?.nome ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {t('receptor.historico.status_completed')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
