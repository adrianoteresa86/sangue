import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/common/Button';
import { PedidoTransfusaoFormSimple } from '../../components/admin/forms/PedidoTransfusaoFormSimple';
import { TriagemTransfusaoModal } from '../../components/admin/TriagemTransfusaoModal';
import { BotaoExportarPDF } from '../../components/admin/BotaoExportarPDF';
import { gerarRelatorioPDF, intervaloPeriodo, type Periodo } from '../../utilitarios/gerarPDF';
import {
  Plus,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  PlayCircle,
  Flag,
  X,
  FileText,
  ClipboardList,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
import { DataTableToolbar, exportToXLS } from '../../components/common/DataTableToolbar';
import api from '../../services/api';

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const URGENCIA_CLASS = (n: number) => {
  if (n >= 4) return 'text-red-700 bg-red-50';
  if (n === 3) return 'text-orange-600 bg-orange-50';
  if (n === 2) return 'text-yellow-600 bg-yellow-50';
  return 'text-blue-600 bg-blue-50';
};

const URGENCY_KEYS: Record<number, string> = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };

function fmt(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT');
}

const DetalhesPedido: React.FC<{ pedido: any; onClose: () => void }> = ({ pedido, onClose }) => {
  const { t } = useTranslation();
  const statusKey = pedido.status?.toLowerCase();
  const statusLabel = t(`admin.pedidos_transfusao.status_${statusKey}`, { defaultValue: pedido.status });
  const urgencyLabel = t(`admin.pedidos_transfusao.urgency_${URGENCY_KEYS[pedido.nivelUrgencia] ?? 'low'}`, { defaultValue: String(pedido.nivelUrgencia) });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t('admin.pedidos_transfusao.modal_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_CLASS[pedido.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {statusLabel}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${URGENCIA_CLASS(pedido.nivelUrgencia)}`}>
              {t('admin.pedidos_transfusao.urgency_label', { level: urgencyLabel })}
            </span>
            <span className="bg-red-100 text-primary px-3 py-1 rounded-full text-sm font-semibold">
              {pedido.tipoSanguinePaciente ?? pedido.tipoSanguineoPaciente}
            </span>
          </div>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              {t('admin.pedidos_transfusao.modal_section_patient')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label={t('admin.pedidos_transfusao.field_name')} value={pedido.nomePaciente} />
              <Field label={t('admin.pedidos_transfusao.field_prontuario')} value={pedido.numeroProntuario} />
              <Field
                label={t('admin.pedidos_transfusao.field_age')}
                value={pedido.idadePaciente ? t('admin.pedidos_transfusao.field_age_years', { age: pedido.idadePaciente }) : undefined}
              />
              <Field label={t('admin.pedidos_transfusao.field_gender')} value={pedido.generoPaciente} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              {t('admin.pedidos_transfusao.modal_section_transfusion')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label={t('admin.pedidos_transfusao.field_diagnosis')} value={pedido.diagnostico} full />
              <Field label={t('admin.pedidos_transfusao.field_component')} value={pedido.tipoComponente} />
              <Field
                label={t('admin.pedidos_transfusao.field_quantity')}
                value={pedido.quantidadeSolicitada ? t('admin.pedidos_transfusao.field_quantity_ml', { qty: pedido.quantidadeSolicitada }) : undefined}
              />
              <Field label={t('admin.pedidos_transfusao.field_clinical')} value={pedido.indicacaoClinica} full />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              {t('admin.pedidos_transfusao.modal_section_dates')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label={t('admin.pedidos_transfusao.field_request_date')} value={fmt(pedido.dataSolicitacao ?? pedido.criadoEm)} />
              <Field label={t('admin.pedidos_transfusao.field_needed_until')} value={fmt(pedido.precisaAte)} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              {t('admin.pedidos_transfusao.modal_section_logistics')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label={t('admin.pedidos_transfusao.field_hemocentro')} value={pedido.hemocentro?.nome} />
              <Field label={t('admin.pedidos_transfusao.field_medical_contact')} value={pedido.contatoMedico} />
            </div>
          </section>

          {pedido.observacoes && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                {t('admin.pedidos_transfusao.modal_section_notes')}
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{pedido.observacoes}</p>
            </section>
          )}

          {pedido.urlDocumentoAutorizacao && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Documento de Autorização Médica
              </h3>
              <a
                href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}${pedido.urlDocumentoAutorizacao}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Ver documento assinado
              </a>
            </section>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button variant="secondary" onClick={onClose}>{t('admin.pedidos_transfusao.modal_close')}</Button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value?: string | number; full?: boolean }> = ({ label, value, full }) => (
  <div className={full ? 'col-span-2' : ''}>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="font-medium text-gray-900">{value ?? '—'}</p>
  </div>
);

export const AdminPedidosTransfusao: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'pendentes' | 'aprovados' | 'em-andamento' | 'concluidos'>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingPedido, setEditingPedido] = useState<any>(null);
  const [detalhesPedido, setDetalhesPedido] = useState<any>(null);
  const [confirmacao, setConfirmacao] = useState<{ pedido: any; tipo: 'status' | 'delete'; novoStatus?: string } | null>(null);
  const [triagemPedido, setTriagemPedido] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const { data: pedidosData, isLoading: loadingPedidos, refetch } = useQuery({
    queryKey: ['pedidos-transfusao'],
    queryFn: () => api.get('/pedidos-transfusao').then((res) => res.data),
    retry: false,
  });

  const { data: hemocentrosData } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/pedidos-transfusao', data),
    onSuccess: () => { refetch(); setShowForm(false); setEditingPedido(null); },
    onError: () => toast.error(t('admin.pedidos_transfusao.error_save')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/pedidos-transfusao/${data.id}`, data),
    onSuccess: () => { refetch(); setShowForm(false); setEditingPedido(null); },
    onError: () => toast.error(t('admin.pedidos_transfusao.error_update')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/pedidos-transfusao/${id}`),
    onSuccess: () => refetch(),
    onError: () => toast.error(t('admin.pedidos_transfusao.error_delete')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/pedidos-transfusao/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-transfusao'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.erro ?? t('admin.pedidos_transfusao.error_status')),
  });

  const loading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const getStatusLabel = (status: string) =>
    t(`admin.pedidos_transfusao.status_${status.toLowerCase()}`, { defaultValue: status });

  const getUrgencyLabel = (n: number) =>
    t(`admin.pedidos_transfusao.urgency_${URGENCY_KEYS[n] ?? 'low'}`, { defaultValue: String(n) });

  const handleSubmit = (data: any) => {
    if (editingPedido) {
      updateMutation.mutate({ ...data, id: editingPedido.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (pedido: any) => {
    setConfirmacao({ pedido, tipo: 'delete' });
  };

  const handleStatus = (pedido: any, status: string) => {
    setConfirmacao({ pedido, tipo: 'status', novoStatus: status });
  };

  const confirmar = () => {
    if (!confirmacao) return;
    if (confirmacao.tipo === 'delete') {
      deleteMutation.mutate(confirmacao.pedido.id, { onSettled: () => setConfirmacao(null) });
    } else if (confirmacao.tipo === 'status' && confirmacao.novoStatus) {
      statusMutation.mutate(
        { id: confirmacao.pedido.id, status: confirmacao.novoStatus },
        { onSettled: () => setConfirmacao(null) },
      );
    }
  };

  const pedidos = Array.isArray(pedidosData) ? pedidosData : [];
  const hemocentros = Array.isArray(hemocentrosData) ? hemocentrosData : (hemocentrosData?.hemocentros ?? []);

  const exportarPDF = (periodo: Periodo, customInicio?: string, customFim?: string) => {
    const { inicio, fim, label } = intervaloPeriodo(periodo, customInicio, customFim);

    const concluidas = pedidos.filter((p) => {
      if (p.status !== 'COMPLETED') return false;
      const data = new Date(p.criadoEm ?? p.dataTransfusao ?? p.updatedAt);
      return data >= inicio && data <= fim;
    });

    if (concluidas.length === 0) {
      toast.warning(`Nenhuma transfusão concluída no período: ${label}`);
      return;
    }

    const URGENCIA_LABELS: Record<number, string> = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Crítica' };

    gerarRelatorioPDF({
      titulo:    'Relatório de Transfusões Efectuadas',
      subtitulo: 'DoarFazBem — Sistema de Gestão de Sangue de Angola',
      periodo:   label,
      cabecalhos: ['#', 'Paciente', 'Prontuário', 'Tipo Sanguíneo', 'Volume (mL)', 'Urgência', 'Diagnóstico', 'Estado'],
      linhas: concluidas.map((p, i) => [
        i + 1,
        p.nomePaciente ?? '—',
        p.numeroProntuario ?? '—',
        p.tipoSanguinePaciente ?? '—',
        p.volumeSolicitado ?? '—',
        URGENCIA_LABELS[p.nivelUrgencia] ?? String(p.nivelUrgencia ?? '—'),
        p.diagnostico ?? '—',
        'Concluído',
      ]),
      rodape: `Total de transfusões no período: ${concluidas.length}`,
    });

    toast.success(`PDF gerado com ${concluidas.length} transfusão(ões)`);
  };

  const filtered = pedidos.filter((p) => {
    const matchSearch =
      p.nomePaciente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.numeroProntuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tipoSanguinePaciente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.diagnostico?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTab =
      activeTab === 'todos' ? true :
      activeTab === 'pendentes' ? p.status === 'PENDING' :
      activeTab === 'aprovados' ? p.status === 'APPROVED' :
      activeTab === 'em-andamento' ? p.status === 'IN_PROGRESS' :
      activeTab === 'concluidos' ? p.status === 'COMPLETED' : true;

    const matchUrgencia = !filterValues.urgencia || String(p.nivelUrgencia) === filterValues.urgencia;
    const matchHemocentro = !filterValues.hemocentro || String(p.hemocentroId) === filterValues.hemocentro;

    return matchSearch && matchTab && matchUrgencia && matchHemocentro;
  });

  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = filtered.map((p: any) => ({
      'Paciente': p.nomePaciente || '-',
      'Prontuário': p.numeroProntuario || '-',
      'Tipo Sanguíneo': p.tipoSanguinePaciente ?? p.tipoSanguineoPaciente ?? '-',
      'Componente': p.tipoComponente || '-',
      'Quantidade (mL)': p.quantidadeSolicitada || '-',
      'Urgência': getUrgencyLabel(p.nivelUrgencia) || '-',
      'Hemocentro': p.hemocentro?.nome || '-',
      'Status': getStatusLabel(p.status) || '-'
    }));
    exportToXLS(dataToExport, 'Pedidos_Transfusao');
  };

  const stats = [
    { label: t('admin.pedidos_transfusao.stat_total'), value: pedidos.length, icon: <ClipboardList className="w-9 h-9 text-blue-500" />, color: 'bg-blue-50' },
    { label: t('admin.pedidos_transfusao.stat_pending'), value: pedidos.filter(p => p.status === 'PENDING').length, icon: <Clock className="w-9 h-9 text-yellow-500" />, color: 'bg-yellow-50' },
    { label: t('admin.pedidos_transfusao.stat_in_progress'), value: pedidos.filter(p => p.status === 'IN_PROGRESS').length, icon: <RefreshCw className="w-9 h-9 text-purple-500" />, color: 'bg-purple-50' },
    { label: t('admin.pedidos_transfusao.stat_completed'), value: pedidos.filter(p => p.status === 'COMPLETED').length, icon: <CheckCircle className="w-9 h-9 text-green-500" />, color: 'bg-green-50' },
  ];

  const tabs = [
    { key: 'todos', label: t('admin.pedidos_transfusao.tab_all') },
    { key: 'pendentes', label: t('admin.pedidos_transfusao.tab_pending') },
    { key: 'aprovados', label: t('admin.pedidos_transfusao.tab_approved') },
    { key: 'em-andamento', label: t('admin.pedidos_transfusao.tab_in_progress') },
    { key: 'concluidos', label: t('admin.pedidos_transfusao.tab_completed') },
  ];

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {editingPedido ? t('admin.pedidos_transfusao.edit_title') : t('admin.pedidos_transfusao.new_title')}
            </h1>
            <p className="text-gray-600">
              {editingPedido ? t('admin.pedidos_transfusao.edit_subtitle') : t('admin.pedidos_transfusao.new_subtitle')}
            </p>
          </div>
          <Button variant="secondary" onClick={() => { setShowForm(false); setEditingPedido(null); }}>
            {t('admin.pedidos_transfusao.back')}
          </Button>
        </div>
        <PedidoTransfusaoFormSimple
          title={editingPedido ? t('admin.pedidos_transfusao.edit_title') : t('admin.pedidos_transfusao.new_title')}
          onSubmit={handleSubmit}
          initialData={editingPedido}
          loading={loading}
          hemocentros={hemocentros}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {detalhesPedido && (
        <DetalhesPedido pedido={detalhesPedido} onClose={() => setDetalhesPedido(null)} />
      )}

      {triagemPedido && (
        <TriagemTransfusaoModal
          pedido={triagemPedido}
          onClose={() => setTriagemPedido(null)}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.pedidos_transfusao.title')}</h1>
        <p className="text-gray-600">{t('admin.pedidos_transfusao.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`${s.color} rounded-lg p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
              </div>
              <span className="text-4xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="primary" onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('admin.pedidos_transfusao.new_button')}
        </Button>
        <BotaoExportarPDF onExportar={exportarPDF} />
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <DataTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        filters={[
          {
            key: 'urgencia',
            label: 'Todas as Urgências',
            options: [
              { value: '1', label: 'Baixa' },
              { value: '2', label: 'Média' },
              { value: '3', label: 'Alta' },
              { value: '4', label: 'Crítica' }
            ]
          },
          {
            key: 'hemocentro',
            label: 'Todos os Hemocentros',
            options: hemocentros.map((h: any) => ({ value: String(h.id), label: h.nome }))
          }
        ]}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loadingPedidos ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-16 h-16 mx-auto border-4 border-gray-300 border-t-primary rounded-full animate-spin mb-4" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.pedidos_transfusao.empty_title')}</h3>
            <p className="text-gray-600">
              {searchTerm ? t('admin.pedidos_transfusao.empty_search') : t('admin.pedidos_transfusao.empty_default')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    t('admin.pedidos_transfusao.col_patient'),
                    t('admin.pedidos_transfusao.col_blood_type'),
                    t('admin.pedidos_transfusao.col_component'),
                    t('admin.pedidos_transfusao.col_quantity'),
                    t('admin.pedidos_transfusao.col_urgency'),
                    t('admin.pedidos_transfusao.col_hemocentro'),
                    t('admin.pedidos_transfusao.col_status'),
                    t('admin.pedidos_transfusao.col_actions'),
                  ].map((h, idx) => (
                    <th
                      key={idx}
                      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${idx === 7 ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pedido.nomePaciente}</div>
                      <div className="text-xs text-gray-500">{pedido.numeroProntuario}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="bg-red-100 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                        {pedido.tipoSanguinePaciente ?? pedido.tipoSanguineoPaciente}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{pedido.tipoComponente}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{pedido.quantidadeSolicitada} mL</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${URGENCIA_CLASS(pedido.nivelUrgencia)}`}>
                        {getUrgencyLabel(pedido.nivelUrgencia)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pedido.hemocentro?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CLASS[pedido.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {getStatusLabel(pedido.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-1">
                        <ActionBtn
                          title={t('admin.pedidos_transfusao.action_view')}
                          color="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => setDetalhesPedido(pedido)}
                          icon={<Eye className="w-4 h-4" />}
                        />
                        {pedido.status === 'PENDING' && (
                          <ActionBtn
                            title={t('admin.pedidos_transfusao.action_approve')}
                            color="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => handleStatus(pedido, 'APPROVED')}
                            icon={<CheckCircle className="w-4 h-4" />}
                          />
                        )}
                        {pedido.status === 'PENDING' && (
                          <ActionBtn
                            title={t('admin.pedidos_transfusao.action_reject')}
                            color="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleStatus(pedido, 'REJECTED')}
                            icon={<XCircle className="w-4 h-4" />}
                          />
                        )}
                        {pedido.status === 'APPROVED' && (
                          <ActionBtn
                            title={t('admin.pedidos_transfusao.action_start')}
                            color="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                            onClick={() => setTriagemPedido(pedido)}
                            icon={<PlayCircle className="w-4 h-4" />}
                          />
                        )}
                        {pedido.status === 'IN_PROGRESS' && (
                          <ActionBtn
                            title="Ver Triagem"
                            color="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => setTriagemPedido(pedido)}
                            icon={<Eye className="w-4 h-4" />}
                          />
                        )}
                        {pedido.status === 'IN_PROGRESS' && (
                          <ActionBtn
                            title={t('admin.pedidos_transfusao.action_complete')}
                            color="text-green-600 hover:text-green-800 hover:bg-green-50"
                            onClick={() => handleStatus(pedido, 'COMPLETED')}
                            icon={<Flag className="w-4 h-4" />}
                          />
                        )}
                        {(pedido.status === 'APPROVED' || pedido.status === 'IN_PROGRESS') && (
                          <ActionBtn
                            title={t('admin.pedidos_transfusao.action_cancel')}
                            color="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleStatus(pedido, 'CANCELLED')}
                            icon={<XCircle className="w-4 h-4" />}
                          />
                        )}
                        <ActionBtn
                          title={t('admin.pedidos_transfusao.action_edit')}
                          color="text-primary hover:text-primary-dark hover:bg-red-50"
                          onClick={() => { setEditingPedido(pedido); setShowForm(true); }}
                          icon={<Edit className="w-4 h-4" />}
                        />
                        {(pedido.status === 'COMPLETED' || pedido.status === 'CANCELLED' || pedido.status === 'REJECTED') && (
                          <ActionBtn
                            title={t('admin.pedidos_transfusao.action_delete')}
                            color="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(pedido)}
                            icon={<Trash2 className="w-4 h-4" />}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loadingPedidos && filtered.length > 0 && (
          <Pagination
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
      {confirmacao && (() => {
        const isDelete = confirmacao.tipo === 'delete';
        const status = confirmacao.novoStatus ?? '';

        const CFG: Record<string, { titulo: string; texto: string; btnLabel: string; iconEl: React.ReactNode; headerBg: string; headerText: string; iconBg: string; btnCls: string }> = {
          APPROVED:    { titulo: 'Aprovar Pedido',       texto: 'O pedido será aprovado. O receptor será notificado.',                  btnLabel: 'Confirmar Aprovação',    iconEl: <CheckCircle className="w-5 h-5 text-blue-600" />,   headerBg: 'bg-blue-50',   headerText: 'text-blue-800',   iconBg: 'bg-blue-100',   btnCls: 'bg-blue-600 hover:bg-blue-700'   },
          REJECTED:    { titulo: 'Rejeitar Pedido',      texto: 'O pedido será rejeitado. Esta acção não pode ser revertida.',          btnLabel: 'Confirmar Rejeição',     iconEl: <XCircle className="w-5 h-5 text-red-600" />,        headerBg: 'bg-red-50',    headerText: 'text-red-800',    iconBg: 'bg-red-100',    btnCls: 'bg-red-600 hover:bg-red-700'     },
          IN_PROGRESS: { titulo: 'Iniciar Transfusão',   texto: 'A transfusão será marcada como em andamento.',                        btnLabel: 'Confirmar Início',       iconEl: <PlayCircle className="w-5 h-5 text-purple-600" />,   headerBg: 'bg-purple-50', headerText: 'text-purple-800', iconBg: 'bg-purple-100', btnCls: 'bg-purple-600 hover:bg-purple-700'},
          COMPLETED:   { titulo: 'Concluir Transfusão',  texto: 'A transfusão será marcada como concluída com sucesso.',               btnLabel: 'Confirmar Conclusão',    iconEl: <Flag className="w-5 h-5 text-green-600" />,         headerBg: 'bg-green-50',  headerText: 'text-green-800',  iconBg: 'bg-green-100',  btnCls: 'bg-green-600 hover:bg-green-700'  },
          CANCELLED:   { titulo: 'Cancelar Pedido',      texto: 'O pedido será cancelado. Esta acção não pode ser revertida.',         btnLabel: 'Confirmar Cancelamento', iconEl: <XCircle className="w-5 h-5 text-red-600" />,        headerBg: 'bg-red-50',    headerText: 'text-red-800',    iconBg: 'bg-red-100',    btnCls: 'bg-red-600 hover:bg-red-700'     },
          DELETE:      { titulo: 'Eliminar Pedido',      texto: 'O pedido será permanentemente eliminado. Esta acção não pode ser revertida.', btnLabel: 'Confirmar Eliminação', iconEl: <Trash2 className="w-5 h-5 text-red-600" />,   headerBg: 'bg-red-50',    headerText: 'text-red-800',    iconBg: 'bg-red-100',    btnCls: 'bg-red-600 hover:bg-red-700'     },
        };

        const key = isDelete ? 'DELETE' : status;
        const cfg = CFG[key];
        if (!cfg) return null;

        const isPending = deleteMutation.isPending || statusMutation.isPending;

        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className={`px-6 py-4 flex items-center justify-between ${cfg.headerBg}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${cfg.iconBg}`}>
                    {cfg.iconEl}
                  </div>
                  <h3 className={`font-bold text-base ${cfg.headerText}`}>{cfg.titulo}</h3>
                </div>
                <button onClick={() => setConfirmacao(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-gray-600">{cfg.texto}</p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                  <p className="font-semibold text-gray-900">{confirmacao.pedido.nomePaciente}</p>
                  <p className="text-gray-500 text-xs">{confirmacao.pedido.numeroProntuario}</p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {confirmacao.pedido.tipoSanguinePaciente ?? confirmacao.pedido.tipoSanguineoPaciente}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${URGENCIA_CLASS(confirmacao.pedido.nivelUrgencia)}`}>
                      {getUrgencyLabel(confirmacao.pedido.nivelUrgencia)}
                    </span>
                  </div>
                  {confirmacao.pedido.hemocentro?.nome && (
                    <p className="text-xs text-gray-500">{confirmacao.pedido.hemocentro.nome}</p>
                  )}
                </div>
              </div>

              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => setConfirmacao(null)}
                  disabled={isPending}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  onClick={confirmar}
                  disabled={isPending}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl text-white transition-colors disabled:opacity-60 ${cfg.btnCls}`}
                >
                  {isPending ? 'A processar…' : cfg.btnLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const ActionBtn: React.FC<{
  title: string;
  color: string;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ title, color, onClick, icon }) => (
  <button
    title={title}
    onClick={onClick}
    className={`p-1.5 rounded-lg transition-colors ${color}`}
  >
    {icon}
  </button>
);
