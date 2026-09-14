import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CampanhaForm } from '../../components/admin/forms';
import { Target, Edit, Trash2, Play, Pause } from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
import { DataTableToolbar, exportToXLS } from '../../components/common/DataTableToolbar';
import api from '../../services/api';

export const AdminCampanhas: React.FC = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingCampanha, setEditingCampanha] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatarDataParaInput = (data: string | Date) => {
    if (!data) return '';
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    return dataObj.toISOString().split('T')[0];
  };

  const formatarData = (data: string | Date) => {
    if (!data) return 'N/A';
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    return dataObj.toLocaleDateString('pt-PT');
  };

  const { data: campanhasData, isLoading, refetch } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => api.get('/campanhas').then((res) => res.data),
  });

  const { data: hemocentrosData } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
  });

  const createCampanhaMutation = useMutation({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: any) => api.post('/campanhas', data),
  });

  const updateCampanhaMutation = useMutation({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: any) => api.put(`/campanhas/${data.id}`, data),
  });

  const deleteCampanhaMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/campanhas/${id}`),
  });

  const campanhas = Array.isArray(campanhasData) ? campanhasData.map(campanha => ({
    id: campanha.id,
    name: campanha.titulo,
    goal: campanha.metaDoacoes,
    current: campanha.doacoesAtuais,
    status: campanha.ativo
      ? t('admin.campanhas.status_active')
      : campanha.doacoesAtuais >= campanha.metaDoacoes
        ? t('admin.campanhas.status_completed')
        : t('admin.campanhas.status_inactive'),
    statusRaw: campanha.ativo ? 'Ativa' : 'Inativa',
    startDate: formatarData(campanha.dataInicio),
    endDate: formatarData(campanha.dataFim),
    dataOriginalInicio: campanha.dataInicio,
    dataOriginalFim: campanha.dataFim,
    description: campanha.descricao || t('admin.campanhas.no_description'),
    tipoSanguineo: campanha.tipoSanguineo,
    hemocentro: campanha.hemocentro,
    criadoEm: formatarData(campanha.criadoEm),
    atualizadoEm: campanha.atualizadoEm ? formatarData(campanha.atualizadoEm) : null,
    ativo: campanha.ativo,
  })) : [];

  const filtered = campanhas.filter((c: any) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterValues.status || (filterValues.status === 'ativo' ? c.ativo : !c.ativo);
    const matchesTipo = !filterValues.tipoSangue || c.tipoSanguineo === filterValues.tipoSangue;

    return matchesSearch && matchesStatus && matchesTipo;
  });

  const paginatedCampanhas = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = filtered.map((c: any) => ({
      'Título': c.name || '-',
      'Descrição': c.description || '-',
      'Data Início': c.startDate || '-',
      'Data Fim': c.endDate || '-',
      'Tipo Sanguíneo': c.tipoSanguineo || '-',
      'Meta de Doações': c.goal || 0,
      'Doações Atuais': c.current || 0,
      'Status': c.statusRaw || '-'
    }));
    exportToXLS(dataToExport, 'Campanhas');
  };

  const hemocentros = Array.isArray(hemocentrosData) ? hemocentrosData : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    try {
      const backendData = {
        titulo: data.titulo,
        descricao: data.descricao,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        tipoSanguineo: data.tipoSanguineo,
        metaDoacoes: data.metaDoacoes,
        doacoesAtuais: data.doacoesAtuais,
        idHemocentro: data.hemocentroId,
        ativo: data.ativo,
      };

      if (editingCampanha) {
        await updateCampanhaMutation.mutateAsync({ ...backendData, id: editingCampanha.id });
      } else {
        await createCampanhaMutation.mutateAsync(backendData);
      }

      setShowForm(false);
      setEditingCampanha(null);
      refetch();
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      toast.error(t('admin.campanhas.error_save'));
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (campanha: any) => {
    setEditingCampanha(campanha);
    setShowForm(true);
  };

  const handleDelete = async (campanhaId: number) => {
    if (!confirm(t('admin.campanhas.confirm_delete'))) return;
    try {
      await deleteCampanhaMutation.mutateAsync(campanhaId);
      refetch();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error(t('admin.campanhas.error_delete'));
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToggleStatus = async (campanha: any) => {
    try {
      const backendData = { ativo: !campanha.ativo };
      await updateCampanhaMutation.mutateAsync({
        ...backendData,
        id: campanha.id,
        titulo: campanha.name,
        descricao: campanha.description,
        dataInicio: campanha.dataOriginalInicio,
        dataFim: campanha.dataOriginalFim,
        tipoSanguineo: campanha.tipoSanguineo,
        metaDoacoes: campanha.goal,
        doacoesAtuais: campanha.current,
        idHemocentro: campanha.hemocentro?.id,
      });
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status da campanha:', error);
      toast.error(t('admin.campanhas.error_status'));
    }
  };

  const handleNew = () => {
    setEditingCampanha(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCampanha(null);
  };

  if (showForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <CampanhaForm
            onSubmit={handleSubmit}
            initialData={editingCampanha ? {
              titulo: editingCampanha.name,
              descricao: editingCampanha.description,
              dataInicio: formatarDataParaInput(editingCampanha.dataOriginalInicio),
              dataFim: formatarDataParaInput(editingCampanha.dataOriginalFim),
              tipoSanguineo: editingCampanha.tipoSanguineo || '',
              metaDoacoes: editingCampanha.goal,
              doacoesAtuais: editingCampanha.current,
              hemocentroId: editingCampanha.hemocentro?.id || 0,
              ativo: editingCampanha.ativo,
            } : undefined}
            loading={createCampanhaMutation.isPending || updateCampanhaMutation.isPending}
            title={editingCampanha ? t('admin.campanhas.title') : t('admin.campanhas.title')}
            hemocentros={hemocentros}
            onCancel={handleCancel}
          />
          <div className="p-4 border-t">
            <Button variant="secondary" onClick={handleCancel} className="w-full">
              {t('admin.campanhas.cancel_button')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.campanhas.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('admin.campanhas.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={handleNew}>{t('admin.campanhas.new_button')}</Button>
      </div>

      <DataTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        filters={[
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
          },
          {
            key: 'status',
            label: 'Todos os Estados',
            options: [
              { value: 'ativo', label: 'Ativa' },
              { value: 'inativo', label: 'Inativa' }
            ]
          }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="text-gray-500 text-center">
              <div className="w-16 h-16 mx-auto border-4 border-gray-300 border-t-primary rounded-full animate-spin mb-4"></div>
              <p>{t('admin.campanhas.loading')}</p>
            </div>
          </div>
        ) : campanhas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.campanhas.empty_title')}</h3>
            <p className="text-gray-600">{t('admin.campanhas.empty_subtitle')}</p>
          </div>
        ) : (
          paginatedCampanhas.map((camp) => (
            <Card key={camp.id} className="relative">
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  camp.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    camp.ativo ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  {camp.status}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      camp.ativo ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Target className={`w-6 h-6 ${
                        camp.ativo ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{camp.name}</h3>
                    </div>
                  </div>
                </div>

                {/* Progresso */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{t('admin.campanhas.progress_label')}</span>
                    <span className="font-semibold">{Math.round((camp.current / camp.goal) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        camp.ativo ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${(camp.current / camp.goal) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>
                      {t('admin.campanhas.donations_of', { current: camp.current, goal: camp.goal })}
                    </p>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-400 mt-0.5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('admin.campanhas.period_label')}</p>
                      <p className="text-sm text-gray-600">{camp.startDate} - {camp.endDate}</p>
                    </div>
                  </div>

                  {camp.tipoSanguineo && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 text-gray-400 mt-0.5">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('admin.campanhas.blood_type_label')}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            {camp.tipoSanguineo}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-400 mt-0.5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('admin.campanhas.description_label')}</p>
                      <p className="text-sm text-gray-600">{camp.description}</p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    title={t('common.edit')}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                    onClick={() => handleEdit(camp)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    title={t('common.delete')}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-intense border border-primary-intense rounded-lg hover:bg-primary-intense hover:text-white transition-colors"
                    onClick={() => handleDelete(camp.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    title={camp.ativo ? t('admin.campanhas.pause_button') : t('admin.campanhas.activate_button')}
                    className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      camp.ativo
                        ? 'text-orange-600 border border-orange-600 hover:bg-orange-600 hover:text-white'
                        : 'text-green-600 border border-green-600 hover:bg-green-600 hover:text-white'
                    }`}
                    onClick={() => handleToggleStatus(camp)}
                  >
                    {camp.ativo ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-6">
          <Pagination
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}
    </div>
  );
};
