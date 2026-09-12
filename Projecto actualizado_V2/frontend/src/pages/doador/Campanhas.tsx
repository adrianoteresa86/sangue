/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DateInput } from '../../components/common/DateInput';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../services/api';

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-PT');
};

const calcProgress = (confirmed: number | null | undefined, goal: number | null | undefined) => {
  if (!goal || goal === 0) return 0;
  return Math.min(Math.round(((confirmed ?? 0) / goal) * 100), 100);
};

const HORARIOS = [
  { value: '08:00', label: '08:00 - 09:00' },
  { value: '09:00', label: '09:00 - 10:00' },
  { value: '10:00', label: '10:00 - 11:00' },
  { value: '14:00', label: '14:00 - 15:00' },
  { value: '15:00', label: '15:00 - 16:00' },
];

interface ModalState {
  camp: any;
  data: string;
  hora: string;
  observacoes: string;
}

export const DoadorCampanhas: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<ModalState | null>(null);
  const { data: campanhasData, isLoading, error } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => api.get('/campanhas').then((res) => res.data),
  });

  const { data: meusAgendamentos = [] } = useQuery<any[]>({
    queryKey: ['meus-agendamentos'],
    queryFn: () => api.get('/agendamentos-doacao/meus').then((res) => res.data),
  });

  const temPedidoPendente = meusAgendamentos.some(
    (a) => a.status === 'PENDING' || a.status === 'APPROVED' || a.status === 'IN_PROCESSING',
  );

  const participarMutation = useMutation({
    mutationFn: (payload: any) => api.post('/agendamentos-doacao', payload),
    onSuccess: () => {
      setModal(null);
      toast.success(t('doador.campanhas.success_participation'));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.erro ||
        err?.response?.data?.message ||
        'Não foi possível criar o agendamento. Verifique os dados e tente novamente.';
      toast.error(msg, { duration: 6000 });
    },
  });

  const filteredCampanhas = campanhasData?.filter((camp: any) =>
    camp.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    camp.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    camp.hemocentro?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const openModal = (camp: any) => {
    if (temPedidoPendente) {
      toast.warning('Já tem um agendamento em curso. Aguarde a aceitação antes de fazer um novo pedido.');
      return;
    }
    setModal({ camp, data: '', hora: '', observacoes: '' });
  };

  const handleParticipar = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modal) return;
    const dataISO = modal.hora
      ? new Date(`${modal.data}T${modal.hora}:00`).toISOString()
      : new Date(modal.data).toISOString();

    participarMutation.mutate({
      idHemocentro: Number(modal.camp.hemocentro?.id),
      dataPreferida: dataISO,
      horaPreferida: modal.hora || undefined,
      observacoes: modal.observacoes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('doador.campanhas.title')}</h1>
        <p className="text-gray-600 mt-1">{t('doador.campanhas.subtitle')}</p>
      </div>

      {/* Campo de Busca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('doador.campanhas.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">{t('doador.campanhas.loading')}</p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-primary-intense">{t('doador.campanhas.error_load')}</p>
        </div>
      )}

      {/* Estado vazio */}
      {!isLoading && !error && filteredCampanhas.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t('doador.campanhas.empty')}
        </div>
      )}

      {/* Lista de Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampanhas.map((camp: any) => {
          const progress = calcProgress(camp.doacoesAtuais, camp.metaDoacoes);
          const description = camp.hemocentro?.nome
            ? `${camp.hemocentro.nome} - ${camp.descricao}`
            : camp.descricao;
          return (
            <Card key={camp.id} title={camp.titulo} description={description}>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{t('doador.campanhas.progress')}</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {t('doador.campanhas.donations_of', { current: camp.doacoesAtuais ?? 0, goal: camp.metaDoacoes ?? 0 })}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(camp.dataInicio)} - {formatDate(camp.dataFim)}
                </p>
                <Button variant="primary" size="sm" className="w-full" onClick={() => openModal(camp)}>
                  {t('doador.campanhas.participate')}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de Agendamento */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-primary/10 px-6 py-5 border-b border-primary/20">
              <h2 className="text-2xl font-semibold text-gray-900">{t('doador.campanhas.modal_title')}</h2>
              <p className="text-sm text-gray-600 mt-1">{modal.camp.titulo}</p>
              {modal.camp.hemocentro?.nome && (
                <p className="text-sm text-gray-500">{modal.camp.hemocentro.nome}</p>
              )}
            </div>

            <form onSubmit={handleParticipar} className="p-6 space-y-6">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                  <p className="text-sm text-gray-500">{t('doador.campanhas.campaign_period')}</p>
                  <p className="text-base font-medium text-gray-800">{formatDate(modal.camp.dataInicio)} – {formatDate(modal.camp.dataFim)}</p>
                </div>

                <DateInput
                  label={<>{t('doador.campanhas.preferred_date')} <span className="text-red-500">*</span></>}
                  required
                  min={modal.camp.dataInicio?.split('T')[0]}
                  max={modal.camp.dataFim?.split('T')[0]}
                  value={modal.data}
                  onChange={(e) => setModal({ ...modal, data: e.target.value })}
                  className="px-4 py-3 rounded-2xl"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('doador.campanhas.preferred_time')}</label>
                  <select
                    required
                    value={modal.hora}
                    onChange={(e) => setModal({ ...modal, hora: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('doador.campanhas.select_time')}</option>
                    {HORARIOS.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('doador.campanhas.notes_optional')}</label>
                  <textarea
                    rows={4}
                    value={modal.observacoes}
                    onChange={(e) => setModal({ ...modal, observacoes: e.target.value })}
                    placeholder={t('doador.campanhas.notes_placeholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={participarMutation.isPending}
                >
                  {t('doador.campanhas.confirm_participation')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setModal(null)}
                  disabled={participarMutation.isPending}
                >
                  {t('doador.campanhas.close')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
