import React from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Droplets, CheckCircle, AlertOctagon, Info, Megaphone, Bell } from 'lucide-react';
import api from '../../services/api';
import type { NotificacoesResponse, NotificacaoReceptor } from '../../types';

interface TipoConfig {
  icon: React.ReactNode;
  accent: string;
  bgNaoLida: string;
  iconBg: string;
}

const ICON_CLASS = 'w-5 h-5';

const TIPO_CONFIG: Record<string, TipoConfig> = {
  TRANSFUSION_REQUEST:   { icon: <Droplets className={ICON_CLASS} />, accent: '#f87171', bgNaoLida: '#fff1f2', iconBg: '#fee2e2' },
  TRANSFUSION_COMPLETED: { icon: <CheckCircle className={ICON_CLASS} />, accent: '#4ade80', bgNaoLida: '#f0fdf4', iconBg: '#dcfce7' },
  BLOOD_URGENCY:         { icon: <AlertOctagon className={ICON_CLASS} />, accent: '#fb923c', bgNaoLida: '#fff7ed', iconBg: '#ffedd5' },
  SYSTEM_ALERT:          { icon: <Info className={ICON_CLASS} />, accent: '#60a5fa', bgNaoLida: '#eff6ff', iconBg: '#dbeafe' },
  ADMIN_NOTIFICATION:    { icon: <Megaphone className={ICON_CLASS} />, accent: '#c084fc', bgNaoLida: '#faf5ff', iconBg: '#f3e8ff' },
  CAMPAIGN_ANNOUNCEMENT: { icon: <Megaphone className={ICON_CLASS} />, accent: '#facc15', bgNaoLida: '#fefce8', iconBg: '#fef9c3' },
};

const DEFAULT_CONFIG: TipoConfig = {
  icon: <Bell className={ICON_CLASS} />, accent: '#9ca3af', bgNaoLida: '#f9fafb', iconBg: '#f3f4f6',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export const ReceptorNotificacoes: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<NotificacoesResponse>({
    queryKey: ['receptor-notificacoes'],
    queryFn: () => api.get('/receptor/notificacoes').then((r) => r.data),
  });

  const lerUmaMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/receptor/notificacoes/${id}/ler`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptor-notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['receptor-notificacoes-count'] });
      toast.success(t('receptor.notificacoes.toast_marked'));
    },
    onError: () => toast.error(t('receptor.notificacoes.toast_error')),
  });

  const lerTodasMutation = useMutation({
    mutationFn: () => api.patch('/receptor/notificacoes/ler-todas'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptor-notificacoes'] });
      queryClient.invalidateQueries({ queryKey: ['receptor-notificacoes-count'] });
      toast.success(t('receptor.notificacoes.toast_all_marked'));
    },
    onError: () => toast.error(t('receptor.notificacoes.toast_error_all')),
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
        {t('receptor.notificacoes.error_load')}
      </div>
    );
  }

  const notificacoes = data?.notificacoes ?? [];
  const naoLidas = data?.naoLidas ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('receptor.notificacoes.title')}</h1>
          <p className="text-gray-600 mt-1">
            {naoLidas > 0 ? (
              <span className="text-primary font-semibold">
                {naoLidas !== 1
                  ? t('receptor.notificacoes.unread_plural', { count: naoLidas })
                  : t('receptor.notificacoes.unread_single', { count: naoLidas })}
              </span>
            ) : (
              t('receptor.notificacoes.all_read')
            )}
            {' '}{t('receptor.notificacoes.total', { count: notificacoes.length })}
          </p>
        </div>
        {naoLidas > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => lerTodasMutation.mutate()}
            loading={lerTodasMutation.isPending}
          >
            {t('receptor.notificacoes.mark_all_read')}
          </Button>
        )}
      </div>

      <Card>
        {notificacoes.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">{t('receptor.notificacoes.empty_msg')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notificacoes.map((n: NotificacaoReceptor) => {
              const cfg = TIPO_CONFIG[n.tipo] ?? DEFAULT_CONFIG;
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-4 p-4 transition-colors"
                  style={{
                    backgroundColor: n.lida ? '#ffffff' : cfg.bgNaoLida,
                    borderLeft: `4px solid ${n.lida ? 'transparent' : cfg.accent}`,
                  }}
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: cfg.iconBg, color: cfg.accent }}
                  >
                    {cfg.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${n.lida ? 'text-gray-500' : 'text-gray-900'}`}>
                        {n.titulo}
                        {!n.lida && (
                          <span
                            className="ml-2 inline-block w-2 h-2 rounded-full align-middle"
                            style={{ backgroundColor: cfg.accent }}
                          />
                        )}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                        {formatDate(n.criadoEm)}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${n.lida ? 'text-gray-400' : 'text-gray-600'}`}>{n.mensagem}</p>
                  </div>

                  {!n.lida && (
                    <button
                      onClick={() => lerUmaMutation.mutate(n.id)}
                      disabled={lerUmaMutation.isPending}
                      className="text-xs text-primary hover:underline shrink-0 mt-0.5 disabled:opacity-50"
                    >
                      {t('receptor.notificacoes.mark_read')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
