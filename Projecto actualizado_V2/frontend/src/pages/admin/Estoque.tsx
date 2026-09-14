import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EstoqueSangueForm } from '../../components/admin/forms';
import { Plus, AlertTriangle, CheckCircle, TrendingUp, Search, Edit, Trash2 } from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
import { DataTableToolbar, exportToXLS } from '../../components/common/DataTableToolbar';
import api from '../../services/api';

export const AdminEstoque: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingEstoque, setEditingEstoque] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: estoqueData, isLoading: loadingEstoque, refetch } = useQuery({
    queryKey: ['estoque'],
    queryFn: () => api.get('/estoque-sangue/formatados').then((res) => res.data),
  });

  const { data: hemocentrosData } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
  });

  const estoque = Array.isArray(estoqueData) ? estoqueData : [];
  const hemocentros = Array.isArray(hemocentrosData) ? hemocentrosData : [];

  const createEstoqueMutation = useMutation({
    mutationFn: (data: any) => api.post('/estoque-sangue', data),
  });

  const updateEstoqueMutation = useMutation({
    mutationFn: (data: any) => api.put(`/estoque-sangue/${data.id}`, data),
  });

  const deleteEstoqueMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/estoque-sangue/${id}`),
  });

  const { mutateAsync: createEstoque, isPending: creating } = createEstoqueMutation;
  const { mutateAsync: updateEstoque, isPending: updating } = updateEstoqueMutation;
  const { mutateAsync: deleteEstoque, isPending: deleting } = deleteEstoqueMutation;

  const loading = creating || updating || deleting;

  const handleSubmit = async (data: any) => {
    try {
      if (editingEstoque) {
        await updateEstoque({ ...data, id: editingEstoque.id });
      } else {
        await createEstoque(data);
      }
      setShowForm(false);
      setEditingEstoque(null);
      refetch();
    } catch (error) {
      console.error('Erro ao salvar estoque:', error);
      toast.error(t('admin.estoque.error_save'));
    }
  };

  const handleNew = () => {
    setEditingEstoque(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEstoque(null);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            {t('admin.estoque.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingEstoque ? t('admin.estoque.edit_title') : t('admin.estoque.add_title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {editingEstoque ? t('admin.estoque.edit_subtitle') : t('admin.estoque.add_subtitle')}
            </p>
          </div>
        </div>

        <EstoqueSangueForm
          title={editingEstoque ? t('admin.estoque.edit_title') : t('admin.estoque.new_title')}
          onSubmit={handleSubmit}
          initialData={editingEstoque}
          loading={loading}
          hemocentros={hemocentrosData?.hemocentros || hemocentros}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  const filtered = estoque.filter(item => {
    const matchesSearch = item.tipoSangue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tipoComponente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.hemocentro?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !filterValues.tipo || item.tipoSangue === filterValues.tipo;
    const matchesComponente = !filterValues.componente || item.tipoComponente === filterValues.componente;
    const matchesHemocentro = !filterValues.hemocentro || item.hemocentro?.nome === filterValues.hemocentro;
    return matchesSearch && matchesTipo && matchesComponente && matchesHemocentro;
  });

  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = filtered.map((item: any) => ({
      'Tipo Sanguíneo': item.tipoSangue || '-',
      'Componente': item.tipoComponente || '-',
      'Quantidade (mL)': item.quantidade || '-',
      'Hemocentro': item.hemocentro?.nome || '-',
      'Validade': item.dataValidade || '-',
      'Status': item.status || '-'
    }));
    exportToXLS(dataToExport, 'Estoque_Sangue');
  };

  const estoqueAdequado = paginatedData.filter(item => item.status === 'Adequado');
  const estoqueBaixo = paginatedData.filter(item => item.status === 'Baixo');
  const estoqueCritico = paginatedData.filter(item => item.status === 'Crítico');

  const summary = {
    total: estoque.length,
    adequados: estoqueAdequado.length,
    baixos: estoqueBaixo.length,
    criticos: estoqueCritico.length,
    totalDoacoes: estoque.reduce((total, item) => total + (item.quantidade || 0), 0),
    totalDoado: Math.round(estoque.reduce((total, item) => total + (item.quantidade || 0), 0) * 1.5),
    doacoes30dias: estoque.filter(item => {
      if (!item.dataRecebimentoOriginal) return false;
      const recebimentoDate = new Date(item.dataRecebimentoOriginal);
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return recebimentoDate >= primeiroDiaMes && recebimentoDate <= ultimoDiaMes;
    }).length,
  };

  const tiposSanguineos = [...new Set(estoque.map(item => item.tipoSangue).filter(Boolean))] as string[];
  const componentes = [...new Set(estoque.map(item => item.tipoComponente).filter(Boolean))] as string[];
  const hemocentroNomes = [...new Set(hemocentros.map(hemo => hemo.nome).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('admin.estoque.title')}</h1>
        <p className="text-gray-600">{t('admin.estoque.subtitle')}</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.estoque.stat_total')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.estoque.stat_volume')}</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{summary.totalDoacoes.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.estoque.stat_critical')}</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{summary.criticos}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('admin.estoque.stat_receipts')}</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{summary.doacoes30dias}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
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
            key: 'tipo',
            label: 'Todos os Tipos Sanguíneos',
            options: tiposSanguineos.map(t => ({ value: t, label: t }))
          },
          {
            key: 'componente',
            label: 'Todos os Componentes',
            options: componentes.map(c => ({ value: c, label: c }))
          },
          {
            key: 'hemocentro',
            label: 'Todos os Hemocentros',
            options: hemocentroNomes.map(h => ({ value: h, label: h }))
          }
        ]}
      />

      {/* Botão Adicionar */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('admin.estoque.add_button')}
        </Button>
      </div>

      {loadingEstoque ? (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <div className="w-16 h-16 mx-auto border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.estoque.loading')}</h3>
            <p className="text-gray-600">{t('admin.estoque.loading_wait')}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Estoque Crítico */}
          {estoqueCritico.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-primary-intense" />
                  <h3 className="text-lg font-semibold text-primary-intense">
                    {t('admin.estoque.critical_title')} ({estoqueCritico.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-red-50 border-b border-red-200">
                        {[t('admin.estoque.col_blood'), t('admin.estoque.col_component'), t('admin.estoque.col_quantity'), t('admin.estoque.col_hemocentro'), t('admin.estoque.col_expiry'), t('admin.estoque.col_status'), t('admin.estoque.col_actions')].map(h => (
                          <th key={h} className="text-left py-3 px-4 font-semibold text-primary-dark">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {estoqueCritico.map((item) => (
                        <tr key={item.id} className="border-b border-red-100 hover:bg-red-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{item.tipoSangue}</td>
                          <td className="py-3 px-4 text-gray-600">{item.tipoComponente}</td>
                          <td className="py-3 px-4 font-semibold text-primary-intense">{item.quantidade} mL</td>
                          <td className="py-3 px-4 text-gray-600">{item.hemocentro?.nome || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-600">
                            <div>
                              <div>{item.dataValidade}</div>
                              <div className="text-xs text-primary-intense mt-1">{item.statusValidade}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-red-100 text-primary-dark px-3 py-1 rounded-full text-xs font-semibold">
                              {t('admin.estoque.status_critical')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <button
                                title={t('common.edit')}
                                onClick={() => { setEditingEstoque(item); setShowForm(true); }}
                                className="p-1.5 rounded-lg text-primary hover:bg-red-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                title={t('common.delete')}
                                onClick={() => {
                                  if (confirm(t('admin.estoque.confirm_delete'))) {
                                    deleteEstoque(item.id);
                                    refetch();
                                  }
                                }}
                                className="p-1.5 rounded-lg text-primary-intense hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Estoque Baixo */}
          {estoqueBaixo.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-yellow-600">
                    {t('admin.estoque.low_title')} ({estoqueBaixo.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-yellow-50 border-b border-yellow-200">
                        {[t('admin.estoque.col_blood'), t('admin.estoque.col_component'), t('admin.estoque.col_quantity'), t('admin.estoque.col_hemocentro'), t('admin.estoque.col_expiry'), t('admin.estoque.col_status'), t('admin.estoque.col_actions')].map(h => (
                          <th key={h} className="text-left py-3 px-4 font-semibold text-yellow-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {estoqueBaixo.map((item) => (
                        <tr key={item.id} className="border-b border-yellow-100 hover:bg-yellow-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{item.tipoSangue}</td>
                          <td className="py-3 px-4 text-gray-600">{item.tipoComponente}</td>
                          <td className="py-3 px-4 font-semibold text-yellow-600">{item.quantidade} mL</td>
                          <td className="py-3 px-4 text-gray-600">{item.hemocentro?.nome || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-600">
                            <div>
                              <div>{item.dataValidade}</div>
                              <div className="text-xs text-yellow-600 mt-1">{item.statusValidade}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                              {t('admin.estoque.status_low')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <button
                                title={t('common.edit')}
                                onClick={() => { setEditingEstoque(item); setShowForm(true); }}
                                className="p-1.5 rounded-lg text-primary hover:bg-red-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                title={t('common.delete')}
                                onClick={() => {
                                  if (confirm(t('admin.estoque.confirm_delete'))) {
                                    deleteEstoque(item.id);
                                    refetch();
                                  }
                                }}
                                className="p-1.5 rounded-lg text-primary-intense hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* Estoque Adequado */}
          {estoqueAdequado.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-600">
                    {t('admin.estoque.adequate_title')} ({estoqueAdequado.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-50 border-b border-green-200">
                        {[t('admin.estoque.col_blood'), t('admin.estoque.col_component'), t('admin.estoque.col_quantity'), t('admin.estoque.col_hemocentro'), t('admin.estoque.col_expiry'), t('admin.estoque.col_status'), t('admin.estoque.col_actions')].map(h => (
                          <th key={h} className="text-left py-3 px-4 font-semibold text-green-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {estoqueAdequado.map((item) => (
                        <tr key={item.id} className="border-b border-green-100 hover:bg-green-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{item.tipoSangue}</td>
                          <td className="py-3 px-4 text-gray-600">{item.tipoComponente}</td>
                          <td className="py-3 px-4 font-semibold text-green-600">{item.quantidade} mL</td>
                          <td className="py-3 px-4 text-gray-600">{item.hemocentro?.nome || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-600">
                            <div>
                              <div>{item.dataValidade}</div>
                              <div className="text-xs text-green-600 mt-1">{item.statusValidade}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                              {t('admin.estoque.status_adequate')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <button
                                title={t('common.edit')}
                                onClick={() => { setEditingEstoque(item); setShowForm(true); }}
                                className="p-1.5 rounded-lg text-primary hover:bg-red-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                title={t('common.delete')}
                                onClick={() => {
                                  if (confirm(t('admin.estoque.confirm_delete'))) {
                                    deleteEstoque(item.id);
                                    refetch();
                                  }
                                }}
                                className="p-1.5 rounded-lg text-primary-intense hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {filtered.length === 0 && (
            <Card>
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.estoque.empty_title')}</h3>
                <p className="text-gray-600">{t('admin.estoque.empty_subtitle')}</p>
              </div>
            </Card>
          )}
          
          {!loadingEstoque && filtered.length > 0 && (
            <div className="bg-white rounded-lg shadow mt-6">
              <Pagination
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
