import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { toast } from 'sonner';
import { Hourglass, CheckCircle, Microscope, CheckCircle2, Ban, XCircle, CalendarClock, Droplets, CalendarDays, ArrowRight } from 'lucide-react';
import api from '../../services/api';

interface Agendamento {
  id: number;
  dataPreferida: string;
  horaPreferida?: string;
  tipoSangue?: string;
  status: 'PENDING' | 'APPROVED' | 'IN_PROCESSING' | 'COMPLETED' | 'REFUSED' | 'CANCELLED' | 'RESCHEDULE_REQUESTED';
  observacoes?: string;
  hemocentro?: { id: number; nome: string; cidade?: string };
  novaDataSolicitada?: string;
  novaHoraSolicitada?: string;
  criadoEm?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ReagendarDados {
  agendamento: Agendamento;
  dataPreferida: string;
  horaPreferida: string;
}

export const DoadorHistorico: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reagendar, setReagendar] = useState<ReagendarDados | null>(null);

  const reagendarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { dataPreferida: string; horaPreferida?: string } }) =>
      api.patch(`/agendamentos-doacao/${id}/reagendar`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doador-historico'] });
      toast.success('Agendamento reagendado com sucesso!');
      setReagendar(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.erro || err?.message || 'Erro ao reagendar');
    },
  });

  const STATUS_ICON_CLASS = 'w-3.5 h-3.5';
  const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    PENDING:       { label: t('doador.historico.filter_pending'),   bg: '#fef9c3', color: '#854d0e', icon: <Hourglass className={STATUS_ICON_CLASS} /> },
    APPROVED:      { label: 'Aprovado',                             bg: '#dbeafe', color: '#1d4ed8', icon: <CheckCircle className={STATUS_ICON_CLASS} /> },
    IN_PROCESSING: { label: 'Em Processamento',                     bg: '#ede9fe', color: '#5b21b6', icon: <Microscope className={STATUS_ICON_CLASS} /> },
    COMPLETED:     { label: t('doador.historico.filter_completed'), bg: '#dcfce7', color: '#166534', icon: <CheckCircle2 className={STATUS_ICON_CLASS} /> },
    REFUSED:       { label: 'Recusado',                             bg: '#fee2e2', color: '#991b1b', icon: <Ban className={STATUS_ICON_CLASS} /> },
    CANCELLED:            { label: t('doador.historico.filter_cancelled'), bg: '#f3f4f6', color: '#6b7280', icon: <XCircle className={STATUS_ICON_CLASS} /> },
    RESCHEDULE_REQUESTED: { label: 'Reagendamento em análise',              bg: '#fff7ed', color: '#c2410c', icon: <CalendarClock className={STATUS_ICON_CLASS} /> },
  };

  const { data: agendamentos = [], isLoading, isError } = useQuery<Agendamento[]>({
    queryKey: ['doador-historico'],
    queryFn: () => api.get('/agendamentos-doacao/meus').then((r) => r.data),
  });

  const stats = {
    total:     agendamentos.length,
    concluidos: agendamentos.filter((a) => a.status === 'COMPLETED').length,
    pendentes:  agendamentos.filter((a) => a.status === 'PENDING').length,
    cancelados: agendamentos.filter((a) => a.status === 'CANCELLED').length,
  };

  const vidasAjudadas = stats.concluidos * 3;

  const filtered = agendamentos.filter((a) => {
    const termo = searchTerm.toLowerCase();
    const matchSearch =
      !termo ||
      (a.hemocentro?.nome ?? '').toLowerCase().includes(termo) ||
      (a.tipoSangue ?? '').toLowerCase().includes(termo) ||
      formatDate(a.dataPreferida).toLowerCase().includes(termo);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('doador.historico.title')}</h1>
        <p className="text-gray-600 mt-1">{t('doador.historico.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('doador.historico.stat_total'),     value: stats.total,      color: '#dc2626', bg: '#fff1f2' },
          { label: t('doador.historico.stat_completed'), value: stats.concluidos, color: '#16a34a', bg: '#f0fdf4' },
          { label: t('doador.historico.stat_pending'),   value: stats.pendentes,  color: '#ca8a04', bg: '#fefce8' },
          { label: t('doador.historico.stat_lives'),     value: vidasAjudadas,    color: '#2563eb', bg: '#eff6ff' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder={t('doador.historico.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
        >
          <option value="all">{t('doador.historico.filter_all')}</option>
          <option value="PENDING">{t('doador.historico.filter_pending')}</option>
          <option value="COMPLETED">{t('doador.historico.filter_completed')}</option>
          <option value="CANCELLED">{t('doador.historico.filter_cancelled')}</option>
        </select>
      </div>

      {/* Conteúdo */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {t('doador.historico.error_load')}
        </div>
      )}

      {!isLoading && !isError && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    t('doador.historico.col_date'),
                    t('doador.historico.col_time'),
                    t('doador.historico.col_blood'),
                    t('doador.historico.col_hemocentro'),
                    t('doador.historico.col_status'),
                    t('doador.historico.col_notes'),
                    'Acções',
                  ].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <Droplets className="w-10 h-10 mx-auto mb-3 text-red-500" />
                      <p className="font-medium text-gray-700">
                        {searchTerm || statusFilter !== 'all'
                          ? t('doador.historico.empty_filtered')
                          : t('doador.historico.empty_all')}
                      </p>
                      {!searchTerm && statusFilter === 'all' && (
                        <p className="text-gray-400 text-sm mt-1">{t('doador.historico.empty_hint')}</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const cfg = STATUS_CONFIG[a.status] ?? { label: a.status, bg: '#f3f4f6', color: '#6b7280', icon: '•' };
                    return (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                          {formatDate(a.dataPreferida)}
                        </td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {a.horaPreferida ?? '—'}
                        </td>
                        <td className="py-3 px-4">
                          {a.tipoSangue ? (
                            <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                              {a.tipoSangue}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{a.hemocentro?.nome ?? '—'}</p>
                          {a.hemocentro?.cidade && (
                            <p className="text-xs text-gray-400">{a.hemocentro.cidade}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}
                          >
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 max-w-48 truncate">
                          {a.observacoes || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {a.status === 'PENDING' && (
                            <button
                              onClick={() => setReagendar({
                                agendamento: a,
                                dataPreferida: a.dataPreferida.split('T')[0],
                                horaPreferida: a.horaPreferida ?? '',
                              })}
                              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
                            >
                              <CalendarDays className="w-3.5 h-3.5" /> Reagendar
                            </button>
                          )}
                          {a.status === 'RESCHEDULE_REQUESTED' && a.novaDataSolicitada && (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                              <ArrowRight className="w-3.5 h-3.5" /> {formatDate(a.novaDataSolicitada)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 px-4 py-3 border-t border-gray-100">
              {filtered.length !== 1
                ? t('doador.historico.records_found_plural', { count: filtered.length })
                : t('doador.historico.records_found', { count: filtered.length })}
            </p>
          )}
        </Card>
      )}

      {/* Modal de reagendamento */}
      {reagendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Reagendar Doação</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {reagendar.agendamento.hemocentro?.nome ?? 'Hemocentro'}
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova data</label>
                <input
                  type="date"
                  value={reagendar.dataPreferida}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setReagendar((prev) => prev ? { ...prev, dataPreferida: e.target.value } : prev)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora preferida (opcional)</label>
                <input
                  type="time"
                  value={reagendar.horaPreferida}
                  onChange={(e) => setReagendar((prev) => prev ? { ...prev, horaPreferida: e.target.value } : prev)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setReagendar(null)}
                disabled={reagendarMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => reagendarMutation.mutate({
                  id: reagendar.agendamento.id,
                  data: {
                    dataPreferida: reagendar.dataPreferida,
                    horaPreferida: reagendar.horaPreferida || undefined,
                  },
                })}
                disabled={reagendarMutation.isPending || !reagendar.dataPreferida}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {reagendarMutation.isPending ? 'A guardar…' : 'Confirmar Reagendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
