import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { DateInput } from '../../components/common/DateInput';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import type { PedidoReceptor, HemocentroSimples } from '../../types';

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
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

const URGENCIA_VALOR: Record<string, number> = { normal: 1, media: 2, urgente: 3, critica: 4 };
const URGENCIA_CHAVE: Record<number, string> = { 1: 'normal', 2: 'media', 3: 'urgente', 4: 'critica' };

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT');
}

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

interface EditForm {
  tipoSangue: string;
  volume: string;
  urgencia: string;
  motivo: string;
  observacoes: string;
  idHemocentro: string;
  precisaAte: string;
}

export const ReceptorPedidoDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [erroEditar, setErroEditar] = useState('');
  const [sucessoEditar, setSucessoEditar] = useState(false);

  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
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

  const [form, setForm] = useState<EditForm>({
    tipoSangue: '',
    volume: '',
    urgencia: 'normal',
    motivo: '',
    observacoes: '',
    idHemocentro: '',
    precisaAte: '',
  });

  const { data: pedido, isLoading, isError } = useQuery<PedidoReceptor>({
    queryKey: ['receptor-pedido', id],
    queryFn: () => api.get(`/receptor/pedidos/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: hemocentros = [] } = useQuery<HemocentroSimples[]>({
    queryKey: ['receptor-hemocentros'],
    queryFn: () => api.get('/receptor/hemocentros').then((r) => r.data),
    enabled: editando,
  });

  useEffect(() => {
    if (pedido) {
      setForm({
        tipoSangue: pedido.tipoSanguinePaciente ?? '',
        volume: String(pedido.quantidadeSolicitada ?? ''),
        urgencia: URGENCIA_CHAVE[pedido.nivelUrgencia] ?? 'normal',
        motivo: pedido.diagnostico ?? '',
        observacoes: pedido.observacoes ?? '',
        idHemocentro: pedido.hemocentro ? String(pedido.hemocentro.id) : '',
        precisaAte: pedido.precisaAte ? pedido.precisaAte.slice(0, 10) : '',
      });
    }
  }, [pedido]);

  const editarMutation = useMutation({
    mutationFn: (dados: object) => api.put(`/receptor/pedidos/${id}`, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptor-pedido', id] });
      queryClient.invalidateQueries({ queryKey: ['receptor-pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['receptor-dashboard'] });
      setEditando(false);
      setSucessoEditar(true);
      setErroEditar('');
      setTimeout(() => setSucessoEditar(false), 3000);
    },
    onError: (error: any) => {
      setErroEditar(error.response?.data?.erro ?? t('common.error_load'));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroEditar('');
    if (!form.volume || Number(form.volume) <= 0) { setErroEditar(t('receptor.pedido_detalhe.error_volume')); return; }
    if (!form.motivo.trim()) { setErroEditar(t('receptor.pedido_detalhe.error_motive')); return; }
    editarMutation.mutate({
      tipoSangue: form.tipoSangue || undefined,
      volume: Number(form.volume),
      urgencia: form.urgencia,
      motivo: form.motivo,
      observacoes: form.observacoes || undefined,
      idHemocentro: form.idHemocentro ? Number(form.idHemocentro) : undefined,
      precisaAte: form.precisaAte ? new Date(form.precisaAte).toISOString() : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || !pedido) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        {t('receptor.pedido_detalhe.not_found')}
      </div>
    );
  }

  const podeEditar = pedido.status === 'PENDING';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/receptor/requisicoes')}
            className="text-sm text-primary hover:underline mb-2 flex items-center gap-1"
          >
            {t('receptor.pedido_detalhe.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('receptor.pedido_detalhe.title')}</h1>
          {pedido.numeroProntuario && (
            <p className="text-gray-500 text-sm mt-1">
              {t('receptor.pedido_detalhe.prontuario')}<span className="font-mono font-semibold">{pedido.numeroProntuario}</span>
            </p>
          )}
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${STATUS_CLASS[pedido.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABEL[pedido.status] ?? pedido.status}
        </span>
      </div>

      {sucessoEditar && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm font-medium">
          {t('receptor.pedido_detalhe.success')}
        </div>
      )}

      {/* Modo leitura */}
      {!editando && (
        <>
          <Card title={t('receptor.pedido_detalhe.info_title')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="text-gray-500">{t('receptor.pedido_detalhe.blood_type')}</p>
                <span className="mt-1 inline-block bg-red-100 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                  {pedido.tipoSanguinePaciente}
                </span>
              </div>
              <div>
                <p className="text-gray-500">{t('receptor.pedido_detalhe.volume')}</p>
                <p className="font-semibold text-gray-900">{pedido.quantidadeSolicitada} mL</p>
              </div>
              <div>
                <p className="text-gray-500">{t('receptor.pedido_detalhe.urgency')}</p>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-semibold ${URGENCIA_CLASS[pedido.nivelUrgencia] ?? 'bg-gray-100 text-gray-600'}`}>
                  {URGENCIA_LABEL[pedido.nivelUrgencia] ?? `Nível ${pedido.nivelUrgencia}`}
                </span>
              </div>
              <div>
                <p className="text-gray-500">{t('receptor.pedido_detalhe.hemocentro')}</p>
                <p className="font-semibold text-gray-900">{pedido.hemocentro?.nome ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('receptor.pedido_detalhe.motive')}</p>
                <p className="font-semibold text-gray-900">{pedido.diagnostico}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('receptor.pedido_detalhe.needed_until')}</p>
                <p className="font-semibold text-gray-900">{formatDate(pedido.precisaAte)}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('receptor.pedido_detalhe.request_date')}</p>
                <p className="font-semibold text-gray-900">{formatDateTime(pedido.criadoEm)}</p>
              </div>
              {pedido.atualizadoEm && (
                <div>
                  <p className="text-gray-500">{t('receptor.pedido_detalhe.last_update')}</p>
                  <p className="font-semibold text-gray-900">{formatDateTime(pedido.atualizadoEm)}</p>
                </div>
              )}
            </div>

            {pedido.observacoes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-500 text-sm">{t('receptor.pedido_detalhe.notes')}</p>
                <p className="text-gray-700 text-sm mt-1">{pedido.observacoes}</p>
              </div>
            )}
          </Card>

          {podeEditar && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => { setEditando(true); setErroEditar(''); }}>
                {t('receptor.pedido_detalhe.edit_button')}
              </Button>
            </div>
          )}

          {!podeEditar && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 text-sm text-center">
              {t('receptor.pedido_detalhe.cannot_edit')}
            </div>
          )}
        </>
      )}

      {/* Modo edição */}
      {editando && (
        <Card title={t('receptor.pedido_detalhe.edit_title')}>
          {erroEditar && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm mb-4">
              {erroEditar}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.pedido_detalhe.blood_type_edit')}</label>
                <select
                  name="tipoSangue"
                  value={form.tipoSangue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((tp) => (
                    <option key={tp}>{tp}</option>
                  ))}
                </select>
              </div>

              <Input
                label={t('receptor.pedido_detalhe.volume_edit')}
                name="volume"
                type="number"
                value={form.volume}
                onChange={handleChange}
                placeholder={t('receptor.pedido_detalhe.volume_placeholder')}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.pedido_detalhe.urgency_edit')}</label>
                <select
                  name="urgencia"
                  value={form.urgencia}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="normal">{t('receptor.pedido_detalhe.urgency_normal')}</option>
                  <option value="media">{t('receptor.pedido_detalhe.urgency_media')}</option>
                  <option value="urgente">{t('receptor.pedido_detalhe.urgency_urgent')}</option>
                  <option value="critica">{t('receptor.pedido_detalhe.urgency_critical')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.pedido_detalhe.motive_edit')}</label>
                <select
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('receptor.pedido_detalhe.motive_select')}</option>
                  <option value="Cirurgia programada">Cirurgia programada</option>
                  <option value="Cirurgia de emergência">Cirurgia de emergência</option>
                  <option value="Anemia severa">Anemia severa</option>
                  <option value="Anemia crónica">Anemia crónica</option>
                  <option value="Acidente / Trauma">Acidente / Trauma</option>
                  <option value="Hemorragia">Hemorragia</option>
                  <option value="Doença oncológica">Doença oncológica</option>
                  <option value="Quimioterapia">Quimioterapia</option>
                  <option value="Transplante">Transplante</option>
                  <option value="Doença hemolítica">Doença hemolítica</option>
                  <option value="Talassemia">Talassemia</option>
                  <option value="Drepanocitose">Drepanocitose</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.pedido_detalhe.hemocentro_edit')}</label>
                <select
                  name="idHemocentro"
                  value={form.idHemocentro}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('receptor.pedido_detalhe.hemocentro_no_preference')}</option>
                  {hemocentros.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nome}{h.cidade ? ` — ${h.cidade}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <DateInput
                label={t('receptor.pedido_detalhe.needed_until_edit')}
                name="precisaAte"
                value={form.precisaAte}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('receptor.pedido_detalhe.notes_edit')}</label>
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={handleChange}
                rows={3}
                placeholder={t('receptor.pedido_detalhe.notes_placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                type="button"
                onClick={() => { setEditando(false); setErroEditar(''); }}
              >
                {t('receptor.pedido_detalhe.cancel_button')}
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={editarMutation.isPending}
              >
                {editarMutation.isPending ? t('receptor.pedido_detalhe.saving') : t('receptor.pedido_detalhe.save_button')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

// Re-export URGENCIA_VALOR para uso noutros componentes se necessário
export { URGENCIA_VALOR };
