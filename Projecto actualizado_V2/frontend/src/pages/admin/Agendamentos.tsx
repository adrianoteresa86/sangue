import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Heart, Clock, CheckCircle, XCircle, RefreshCw, Calendar, MapPin, FlaskConical, AlertTriangle, X, Ban } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { TriagemModal } from '../../components/admin/TriagemModal';
import { HistoricoModal } from '../../components/admin/HistoricoModal';
import { BotaoExportarPDF } from '../../components/admin/BotaoExportarPDF';
import { gerarRelatorioPDF, intervaloPeriodo, type Periodo } from '../../utilitarios/gerarPDF';
import { Pagination } from '../../components/common/Pagination';
import { DataTableToolbar, exportToXLS } from '../../components/common/DataTableToolbar';
import api from '../../services/api';

interface AgendamentoDoacao {
  id: number;
  usuario: { id: number; nome: string; email: string; telefone?: string };
  hemocentro: { id: number; nome: string; cidade?: string };
  dataPreferida: string;
  horaPreferida?: string;
  tipoSangue?: string;
  status: 'PENDING' | 'APPROVED' | 'IN_PROCESSING' | 'COMPLETED' | 'REFUSED' | 'CANCELLED' | 'RESCHEDULE_REQUESTED';
  observacoes?: string;
  nomeContatoEmergencia?: string;
  telefoneContatoEmergencia?: string;
  novaDataSolicitada?: string;
  novaHoraSolicitada?: string;
  criadoEm?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT');
}

export const Agendamentos = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [triagemAgendamento, setTriagemAgendamento] = useState<AgendamentoDoacao | null>(null);
  const [historicoAgendamento, setHistoricoAgendamento] = useState<AgendamentoDoacao | null>(null);
  const [confirmacao, setConfirmacao] = useState<{ agendamento: AgendamentoDoacao; status: 'APPROVED' | 'CANCELLED' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const queryClient = useQueryClient();

  const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:              { label: 'Pendente',              bg: '#fef9c3', color: '#854d0e' },
    APPROVED:             { label: 'Aprovado',              bg: '#dbeafe', color: '#1d4ed8' },
    IN_PROCESSING:        { label: 'Em Processamento',      bg: '#ede9fe', color: '#5b21b6' },
    COMPLETED:            { label: 'Concluído',             bg: '#dcfce7', color: '#166534' },
    REFUSED:              { label: 'Recusado',              bg: '#fee2e2', color: '#991b1b' },
    CANCELLED:            { label: 'Cancelado',             bg: '#f3f4f6', color: '#6b7280' },
    RESCHEDULE_REQUESTED: { label: 'Reagendamento Solicitado',   bg: '#fff7ed', color: '#c2410c' },
  };

  const { data: agendamentos = [], isLoading, isError, refetch } = useQuery<AgendamentoDoacao[]>({
    queryKey: ['agendamentos'],
    queryFn: () => api.get('/agendamentos-doacao').then((r) => r.data),
  });

  const exportarPDF = (periodo: Periodo, customInicio?: string, customFim?: string) => {
    const { inicio, fim, label } = intervaloPeriodo(periodo, customInicio, customFim);

    const concluidas = agendamentos.filter((a) => {
      if (a.status !== 'COMPLETED') return false;
      const data = new Date((a as any).criadoEm ?? a.dataPreferida);
      return data >= inicio && data <= fim;
    });

    if (concluidas.length === 0) {
      toast.warning(`Nenhuma doação concluída no período: ${label}`);
      return;
    }

    const STATUS_LABELS: Record<string, string> = {
      COMPLETED: 'Concluído', PENDING: 'Pendente', APPROVED: 'Aprovado',
      IN_PROCESSING: 'Em Processamento', REFUSED: 'Recusado', CANCELLED: 'Cancelado',
    };

    gerarRelatorioPDF({
      titulo:    'Relatório de Doações Efectuadas',
      subtitulo: 'DoarFazBem — Sistema de Gestão de Sangue de Angola',
      periodo:   label,
      cabecalhos: ['#', 'Doador', 'Tipo Sanguíneo', 'Data', 'Hora', 'Hemocentro', 'Estado'],
      linhas: concluidas.map((a, i) => [
        i + 1,
        a.usuario?.nome ?? '—',
        a.tipoSangue ?? '—',
        new Date(a.dataPreferida).toLocaleDateString('pt-PT'),
        a.horaPreferida ?? '—',
        a.hemocentro?.nome ?? '—',
        STATUS_LABELS[a.status] ?? a.status,
      ]),
      rodape: `Total de doações no período: ${concluidas.length}`,
    });

    toast.success(`PDF gerado com ${concluidas.length} doação(ões)`);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/agendamentos-doacao/${id}/status`, { status }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notificacoes-count'] });
      const labels: Record<string, string> = {
        APPROVED:  'aprovado',
        CANCELLED: 'cancelado',
      };
      toast.success(`Agendamento ${labels[vars.status] ?? vars.status.toLowerCase()}.`);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err.response?.data?.erro ?? t('common.error_load'));
    },
  });

  const aprovarReagendamentoMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/agendamentos-doacao/${id}/aprovar-reagendamento`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Reagendamento aprovado. Agendamento voltou a estado Pendente.');
    },
    onError: (err: { response?: { data?: { erro?: string } } }) =>
      toast.error(err.response?.data?.erro ?? 'Erro ao aprovar reagendamento'),
  });

  const rejeitarReagendamentoMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/agendamentos-doacao/${id}/rejeitar-reagendamento`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Reagendamento rejeitado. Data original mantida.');
    },
    onError: (err: { response?: { data?: { erro?: string } } }) =>
      toast.error(err.response?.data?.erro ?? 'Erro ao rejeitar reagendamento'),
  });

  const stats = {
    total:                agendamentos.length,
    pendentes:            agendamentos.filter((a) => a.status === 'PENDING').length,
    reagendamentos:       agendamentos.filter((a) => a.status === 'RESCHEDULE_REQUESTED').length,
    emAndamento:          agendamentos.filter((a) => a.status === 'APPROVED' || a.status === 'IN_PROCESSING').length,
    concluidos:           agendamentos.filter((a) => a.status === 'COMPLETED').length,
    naoAprovados:         agendamentos.filter((a) => a.status === 'REFUSED' || a.status === 'CANCELLED').length,
  };

  const filtered = agendamentos.filter((a) => {
    const matchSearch =
      !searchTerm ||
      a.usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.hemocentro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.tipoSangue ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.hemocentro.cidade ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterValues.status || a.status === filterValues.status;
    const matchTipo = !filterValues.tipoSangue || a.tipoSangue === filterValues.tipoSangue;
    return matchSearch && matchStatus && matchTipo;
  });

  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = filtered.map((a: any) => ({
      'Doador': a.usuario?.nome || '-',
      'Hemocentro': a.hemocentro?.nome || '-',
      'Data Preferida': a.dataPreferida ? formatDate(a.dataPreferida) : '-',
      'Hora Preferida': a.horaPreferida || '-',
      'Tipo Sanguíneo': a.tipoSangue || '-',
      'Status': STATUS_CONFIG[a.status]?.label || a.status
    }));
    exportToXLS(dataToExport, 'Agendamentos');
  };

  const handleStatus = (agendamento: AgendamentoDoacao, status: 'APPROVED' | 'CANCELLED') => {
    setConfirmacao({ agendamento, status });
  };

  const confirmarStatus = () => {
    if (!confirmacao) return;
    updateStatusMutation.mutate(
      { id: confirmacao.agendamento.id, status: confirmacao.status },
      { onSettled: () => setConfirmacao(null) },
    );
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
        {t('admin.agendamentos.error_load')}{' '}
        <button onClick={() => refetch()} className="underline font-medium">{t('admin.agendamentos.retry')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.agendamentos.title')}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">{t('admin.agendamentos.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <BotaoExportarPDF onExportar={exportarPDF} />
          <Button variant="primary" onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('admin.agendamentos.refresh')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendentes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendentes}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reagendamentos</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{stats.reagendamentos}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Em Andamento</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.emAndamento}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Concluídos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.concluidos}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recusados/Cancelados</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.naoAprovados}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      <DataTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        filters={[
          {
            key: 'status',
            label: 'Todos os Estados',
            options: [
              { value: 'PENDING',      label: 'Pendente' },
              { value: 'APPROVED',     label: 'Aprovado' },
              { value: 'IN_PROCESSING',label: 'Em Processamento' },
              { value: 'COMPLETED',    label: 'Concluído' },
              { value: 'REFUSED',      label: 'Recusado' },
              { value: 'CANCELLED',             label: 'Cancelado' },
              { value: 'RESCHEDULE_REQUESTED',  label: 'Reagendamento Solicitado' },
            ]
          },
          {
            key: 'tipoSangue',
            label: 'Todos os Tipos',
            options: [
              { value: 'A+', label: 'A+' },
              { value: 'A-', label: 'A-' },
              { value: 'B+', label: 'B+' },
              { value: 'B-', label: 'B-' },
              { value: 'AB+', label: 'AB+' },
              { value: 'AB-', label: 'AB-' },
              { value: 'O+', label: 'O+' },
              { value: 'O-', label: 'O-' },
            ]
          }
        ]}
      />

      {/* Tabela */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  t('admin.agendamentos.col_donor'),
                  t('admin.agendamentos.col_hemocentro'),
                  t('admin.agendamentos.col_datetime'),
                  t('admin.agendamentos.col_blood'),
                  t('admin.agendamentos.col_status'),
                  'Histórico',
                  t('admin.agendamentos.col_actions'),
                ].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-1">{t('admin.agendamentos.empty_title')}</p>
                    <p className="text-gray-500 text-sm">
                      {searchTerm || Object.keys(filterValues).length > 0
                        ? t('admin.agendamentos.empty_adjust')
                        : t('admin.agendamentos.empty_default')}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((a) => {
                  const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{a.usuario.nome}</p>
                        <p className="text-xs text-gray-500">{a.usuario.email}</p>
                        {a.usuario.telefone && <p className="text-xs text-gray-400">{a.usuario.telefone}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{a.hemocentro.nome}</p>
                        {a.hemocentro.cidade && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{a.hemocentro.cidade}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(a.dataPreferida)}
                        </p>
                        {a.horaPreferida && <p className="text-xs text-gray-500 mt-0.5">{a.horaPreferida}</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {a.tipoSangue ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 text-xs font-semibold rounded-full"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setHistoricoAgendamento(a)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" /> Ver
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {a.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatus(a, 'APPROVED')}
                              disabled={updateStatusMutation.isPending}
                              title="Aprovar agendamento"
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                            </button>
                            <button
                              onClick={() => handleStatus(a, 'CANCELLED')}
                              disabled={updateStatusMutation.isPending}
                              title="Cancelar agendamento"
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancelar
                            </button>
                          </div>
                        )}
                        {a.status === 'RESCHEDULE_REQUESTED' && (
                          <div className="space-y-1.5">
                            {a.novaDataSolicitada && (
                              <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Nova data: {formatDate(a.novaDataSolicitada)}
                                {a.novaHoraSolicitada && ` · ${a.novaHoraSolicitada}`}
                              </p>
                            )}
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => aprovarReagendamentoMutation.mutate(a.id)}
                                disabled={aprovarReagendamentoMutation.isPending || rejeitarReagendamentoMutation.isPending}
                                className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Aceitar
                              </button>
                              <button
                                onClick={() => rejeitarReagendamentoMutation.mutate(a.id)}
                                disabled={aprovarReagendamentoMutation.isPending || rejeitarReagendamentoMutation.isPending}
                                className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Rejeitar
                              </button>
                            </div>
                          </div>
                        )}
                        {(a.status === 'APPROVED' || a.status === 'IN_PROCESSING') && (
                          <button
                            onClick={() => setTriagemAgendamento(a)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            {a.status === 'APPROVED' ? 'Iniciar Triagem' : 'Ver Triagem'}
                          </button>
                        )}
                        {a.status === 'COMPLETED' && (
                          <button
                            onClick={() => setTriagemAgendamento(a)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            Ver Triagem
                          </button>
                        )}
                        {(a.status === 'REFUSED' || a.status === 'CANCELLED') && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500">
                            <Ban className="w-3.5 h-3.5" />
                            Sem ações
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
        
        <Pagination
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </Card>

      {triagemAgendamento && (
        <TriagemModal
          agendamento={triagemAgendamento}
          onClose={() => setTriagemAgendamento(null)}
        />
      )}

      {historicoAgendamento && (
        <HistoricoModal
          agendamento={historicoAgendamento}
          onClose={() => setHistoricoAgendamento(null)}
        />
      )}

      {confirmacao && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${confirmacao.status === 'APPROVED' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {confirmacao.status === 'APPROVED' ? (
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <h3 className={`font-bold text-base ${confirmacao.status === 'APPROVED' ? 'text-green-800' : 'text-red-800'}`}>
                  {confirmacao.status === 'APPROVED' ? 'Aprovar Agendamento' : 'Cancelar Agendamento'}
                </h3>
              </div>
              <button onClick={() => setConfirmacao(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-gray-600">
                {confirmacao.status === 'APPROVED'
                  ? 'Tem a certeza que deseja aprovar este agendamento? O doador será notificado.'
                  : 'Tem a certeza que deseja cancelar este agendamento? Esta ação não pode ser revertida.'}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                <p className="font-semibold text-gray-900">{confirmacao.agendamento.usuario.nome}</p>
                <p className="text-gray-500 text-xs">{confirmacao.agendamento.usuario.email}</p>
                <div className="flex items-center gap-1 text-gray-500 text-xs pt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {confirmacao.agendamento.hemocentro.nome}
                  {confirmacao.agendamento.hemocentro.cidade && ` · ${confirmacao.agendamento.hemocentro.cidade}`}
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {formatDate(confirmacao.agendamento.dataPreferida)}
                  {confirmacao.agendamento.horaPreferida && ` · ${confirmacao.agendamento.horaPreferida}`}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setConfirmacao(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={confirmarStatus}
                disabled={updateStatusMutation.isPending}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl text-white transition-colors disabled:opacity-60 ${
                  confirmacao.status === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {updateStatusMutation.isPending
                  ? 'A processar…'
                  : confirmacao.status === 'APPROVED' ? 'Confirmar Aprovação' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
