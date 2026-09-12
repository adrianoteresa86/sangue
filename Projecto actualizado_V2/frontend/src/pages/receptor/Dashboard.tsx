import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Syringe, ClipboardList, History } from 'lucide-react';
import api from '../../services/api';
import type { DashboardReceptor, PedidoReceptor } from '../../types';

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT');
}

export const ReceptorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovada',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada',
  };

  const URGENCIA_LABEL: Record<number, string> = {
    1: 'Baixa',
    2: 'Média',
    3: 'Alta',
    4: 'Crítica',
  };

  const { data, isLoading, isError } = useQuery<DashboardReceptor>({
    queryKey: ['receptor-dashboard'],
    queryFn: () => api.get('/receptor/dashboard').then((r) => r.data),
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
        {t('receptor.dashboard.error_load')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('receptor.dashboard.title')}</h1>
        <p className="text-gray-600">{t('receptor.dashboard.subtitle')}</p>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center space-y-4">
            <Syringe className="w-12 h-12 mx-auto text-red-500" />
            <h3 className="text-xl font-bold text-gray-900">{t('receptor.dashboard.transfusion_title')}</h3>
            <p className="text-sm text-gray-600">{t('receptor.dashboard.transfusion_subtitle')}</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/receptor/transfusao')}>
              {t('receptor.dashboard.transfusion_button')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-center space-y-4">
            <ClipboardList className="w-12 h-12 mx-auto text-blue-500" />
            <h3 className="text-xl font-bold text-gray-900">{t('receptor.dashboard.requests_title')}</h3>
            <p className="text-sm text-gray-600">{t('receptor.dashboard.requests_subtitle')}</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/receptor/requisicoes')}>
              {t('receptor.dashboard.requests_button')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-center space-y-4">
            <History className="w-12 h-12 mx-auto text-amber-500" />
            <h3 className="text-xl font-bold text-gray-900">{t('receptor.dashboard.history_title')}</h3>
            <p className="text-sm text-gray-600">{t('receptor.dashboard.history_subtitle')}</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/receptor/historico')}>
              {t('receptor.dashboard.history_button')}
            </Button>
          </div>
        </Card>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title={t('receptor.dashboard.stat_active')}>
          <p className="text-4xl font-bold text-primary">{data?.ativos ?? 0}</p>
          <p className="text-sm text-gray-600 mt-2">{t('receptor.dashboard.stat_active_sub')}</p>
        </Card>

        <Card title={t('receptor.dashboard.stat_completed')}>
          <p className="text-4xl font-bold text-green-600">{data?.concluidas ?? 0}</p>
          <p className="text-sm text-gray-600 mt-2">{t('receptor.dashboard.stat_completed_sub')}</p>
        </Card>

        <Card title={t('receptor.dashboard.stat_cancelled')}>
          <p className="text-4xl font-bold text-primary-intense">{data?.canceladas ?? 0}</p>
          <p className="text-sm text-gray-600 mt-2">{t('receptor.dashboard.stat_cancelled_sub')}</p>
        </Card>

        <Card title={t('receptor.dashboard.stat_blood_type')}>
          <p className="text-4xl font-bold text-primary">{data?.tipoSanguineo ?? '—'}</p>
          <p className="text-sm text-gray-600 mt-2">
            {data?.tipoSanguineo
              ? t('receptor.dashboard.stat_blood_defined')
              : t('receptor.dashboard.stat_blood_undefined')}
          </p>
        </Card>
      </div>

      {/* Requisições recentes */}
      <Card title={t('receptor.dashboard.recent_title')}>
        {!data?.recentes?.length ? (
          <div className="py-8 text-center text-gray-500">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p>{t('receptor.dashboard.empty_msg')}</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/receptor/transfusao')}
            >
              {t('receptor.dashboard.empty_first')}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.dashboard.col_date')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.dashboard.col_blood')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.dashboard.col_quantity')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.dashboard.col_urgency')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.dashboard.col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentes.map((p: PedidoReceptor) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(p.criadoEm)}</td>
                    <td className="py-3 px-4">
                      <span className="bg-red-100 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        {p.tipoSanguinePaciente}
                      </span>
                    </td>
                    <td className="py-3 px-4">{p.quantidadeSolicitada} mL</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        p.nivelUrgencia >= 4 ? 'bg-red-100 text-red-700' :
                        p.nivelUrgencia === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {URGENCIA_LABEL[p.nivelUrgencia] ?? p.nivelUrgencia}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
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
