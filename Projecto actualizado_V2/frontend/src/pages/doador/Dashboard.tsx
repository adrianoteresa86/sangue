import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Heart, Target, Clock, MapPin, Droplets } from 'lucide-react';
import api from '../../services/api';

interface Agendamento {
  id: number;
  dataPreferida: string;
  horaPreferida?: string;
  tipoSangue?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  hemocentro?: { nome: string; cidade?: string };
}

interface PodeDoarResponse {
  podeDoar: boolean;
  proximaDataDisponivel: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: '#fef9c3', color: '#854d0e' },
  COMPLETED: { bg: '#dcfce7', color: '#166534' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
}

export const DoadorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { usuario } = useAuth();

  const { data: agendamentos = [] } = useQuery<Agendamento[]>({
    queryKey: ['doador-historico'],
    queryFn: () => api.get('/agendamentos-doacao/meus').then((r) => r.data),
    enabled: !!usuario?.id,
  });

  const { data: podeDoarData } = useQuery<PodeDoarResponse>({
    queryKey: ['pode-doar', usuario?.id],
    queryFn: () => api.get('/agendamentos-doacao/pode-doar').then((r) => r.data),
    enabled: !!usuario?.id,
  });

  const { data: campanhasData = [] } = useQuery<{ ativo: boolean }[]>({
    queryKey: ['campanhas'],
    queryFn: () => api.get('/campanhas').then((r) => r.data),
  });

  const { data: proximosAgendamentos = [] } = useQuery<Agendamento[]>({
    queryKey: ['agendamentos-futuros', usuario?.id],
    queryFn: () => api.get('/agendamentos-doacao/meus/futuros').then((r) => r.data),
    enabled: !!usuario?.id,
  });

  const totalConcluidos = agendamentos.filter((a) => a.status === 'COMPLETED').length;
  const totalPendentes  = agendamentos.filter((a) => a.status === 'PENDING').length;
  const campanhasAtivas = campanhasData.filter((c) => c.ativo).length;
  const proximoAgendamento = proximosAgendamentos[0];

  const STATUS_LABEL: Record<string, string> = {
    PENDING: t('common.filter_pending') || 'Pendente',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {t('doador.dashboard.welcome', { name: usuario?.nome?.split(' ')[0] || 'Doador' })}
        </h1>
        <p className="text-gray-600">{t('doador.dashboard.subtitle')}</p>
      </div>

      {/* Acções rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center space-y-4 p-2">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{t('doador.dashboard.donate_title')}</h3>
            <p className="text-sm text-gray-600">{t('doador.dashboard.donate_subtitle')}</p>
            <Button variant="primary" size="sm" className="w-full" onClick={() => navigate('/doador/agendar')}>
              {t('doador.dashboard.donate_button')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-center space-y-4 p-2">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{t('doador.dashboard.history_title')}</h3>
            <p className="text-sm text-gray-600">{t('doador.dashboard.history_subtitle')}</p>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/doador/historico')}>
              {t('doador.dashboard.history_button')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-center space-y-4 p-2">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{t('doador.dashboard.campaigns_title')}</h3>
            <p className="text-sm text-gray-600">{t('doador.dashboard.campaigns_subtitle')}</p>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate('/doador/campanhas')}>
              {t('doador.dashboard.campaigns_button')}
            </Button>
          </div>
        </Card>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">{t('doador.dashboard.stat_completed')}</p>
          <p className="text-4xl font-bold text-primary">{totalConcluidos}</p>
          <p className="text-xs text-gray-500 mt-1">{t('doador.dashboard.stat_completed_sub')}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">{t('doador.dashboard.stat_lives')}</p>
          <p className="text-4xl font-bold text-green-600">{totalConcluidos * 3}</p>
          <p className="text-xs text-gray-500 mt-1">{t('doador.dashboard.stat_lives_sub')}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">{t('doador.dashboard.stat_next')}</p>
          {podeDoarData === undefined ? (
            <p className="text-sm text-gray-400">{t('doador.dashboard.stat_checking')}</p>
          ) : podeDoarData.podeDoar ? (
            <>
              <p className="text-lg font-bold text-green-600">{t('doador.dashboard.stat_eligible')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('doador.dashboard.stat_eligible_sub')}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-900">
                {podeDoarData.proximaDataDisponivel === 'hoje'
                  ? 'Hoje'
                  : formatDate(podeDoarData.proximaDataDisponivel)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t('doador.dashboard.stat_wait_sub')}</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">{t('doador.dashboard.stat_campaigns')}</p>
          <p className="text-4xl font-bold text-blue-600">{campanhasAtivas}</p>
          <p className="text-xs text-gray-500 mt-1">{t('doador.dashboard.stat_campaigns_sub')}</p>
        </div>
      </div>

      {/* Agendamentos pendentes */}
      {totalPendentes > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">
              {t('doador.dashboard.pending_alert', {
                count: totalPendentes,
                plural: totalPendentes !== 1 ? 's' : '',
              })}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/doador/historico')}>
            {t('doador.dashboard.view_button')}
          </Button>
        </div>
      )}

      {/* Próximo agendamento */}
      {proximoAgendamento && (
        <Card>
          <div className="p-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900">{t('doador.dashboard.next_appointment')}</h3>
                <p className="text-sm text-gray-500">
                  {formatDate(proximoAgendamento.dataPreferida)}
                  {proximoAgendamento.horaPreferida ? ` às ${proximoAgendamento.horaPreferida}` : ''}
                </p>
                {proximoAgendamento.hemocentro?.nome && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {proximoAgendamento.hemocentro.nome}
                      {proximoAgendamento.hemocentro.cidade ? ` — ${proximoAgendamento.hemocentro.cidade}` : ''}
                    </span>
                  </p>
                )}
              </div>
              <span
                className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full"
                style={STATUS_STYLE[proximoAgendamento.status] ?? { bg: '#f3f4f6', color: '#374151' }}
              >
                {STATUS_LABEL[proximoAgendamento.status] ?? proximoAgendamento.status}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Estado vazio — sem histórico */}
      {agendamentos.length === 0 && (
        <Card>
          <div className="py-10 text-center space-y-3">
            <Droplets className="w-10 h-10 mx-auto text-red-500" />
            <p className="font-semibold text-gray-700">{t('doador.dashboard.empty_title')}</p>
            <p className="text-sm text-gray-500">{t('doador.dashboard.empty_subtitle')}</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/doador/agendar')}>
              {t('doador.dashboard.schedule_now')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
