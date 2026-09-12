import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ClipboardList } from 'lucide-react';
import api from '../../services/api';
import type { PedidoReceptor } from '../../types';

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const URGENCIA_CLASS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-orange-100 text-orange-700',
  4: 'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT');
}

export const ReceptorRequisicoes: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [erroCancel, setErroCancel] = useState('');

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

  const { data: pedidos = [], isLoading, isError } = useQuery<PedidoReceptor[]>({
    queryKey: ['receptor-pedidos'],
    queryFn: () => api.get('/receptor/meus-pedidos').then((r) => r.data),
  });

  const cancelarMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/receptor/pedidos/${id}/cancelar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptor-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['receptor-dashboard'] });
      setCancelandoId(null);
    },
    onError: (error: any) => {
      setErroCancel(error.response?.data?.erro ?? t('common.error_load'));
      setCancelandoId(null);
    },
  });

  const confirmarCancelar = (id: number) => {
    setErroCancel('');
    if (window.confirm(t('receptor.requisicoes.confirm_cancel'))) {
      setCancelandoId(id);
      cancelarMutation.mutate(id);
    }
  };

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
        {t('receptor.requisicoes.error_load')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('receptor.requisicoes.title')}</h1>
          <p className="text-gray-600 mt-1">{t('receptor.requisicoes.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/receptor/transfusao')}>
          {t('receptor.requisicoes.new_button')}
        </Button>
      </div>

      {erroCancel && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {erroCancel}
        </div>
      )}

      <Card>
        {pedidos.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">{t('receptor.requisicoes.empty_msg')}</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/receptor/transfusao')}
            >
              {t('receptor.requisicoes.empty_first')}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.requisicoes.col_date')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.requisicoes.col_blood')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.requisicoes.col_volume')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.requisicoes.col_urgency')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.requisicoes.col_motive')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.requisicoes.col_status')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('receptor.requisicoes.col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(p.criadoEm)}</td>
                    <td className="py-3 px-4">
                      <span className="bg-red-100 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        {p.tipoSanguinePaciente}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{p.quantidadeSolicitada} mL</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${URGENCIA_CLASS[p.nivelUrgencia] ?? 'bg-gray-100 text-gray-600'}`}>
                        {URGENCIA_LABEL[p.nivelUrgencia] ?? `Nível ${p.nivelUrgencia}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-gray-600" title={p.diagnostico}>
                      {p.diagnostico}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/receptor/pedidos/${p.id}`)}
                          className="text-primary hover:underline text-xs font-medium"
                        >
                          {t('receptor.requisicoes.action_view')}
                        </button>
                        {p.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => navigate(`/receptor/pedidos/${p.id}`)}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              {t('receptor.requisicoes.action_edit')}
                            </button>
                            <button
                              onClick={() => confirmarCancelar(p.id)}
                              disabled={cancelandoId === p.id}
                              className="text-red-600 hover:underline text-xs disabled:opacity-50"
                            >
                              {cancelandoId === p.id ? t('receptor.requisicoes.cancelling') : t('receptor.requisicoes.action_cancel')}
                            </button>
                          </>
                        )}
                      </div>
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
