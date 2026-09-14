import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '../../components/common/Button';
import { PerfilDoadorForm } from '../../components/admin/forms';
import { UserPlus, Edit, Trash2, UserX, UserCheck, User } from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
import { DataTableToolbar, exportToXLS } from '../../components/common/DataTableToolbar';
import api from '../../services/api';

export const AdminDoadores: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingDoador, setEditingDoador] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: doadoresData, isLoading: loadingDoadores, refetch } = useQuery({
    queryKey: ['doadores'],
    queryFn: () => api.get('/doadores').then((res) => res.data),
  });

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then((res) => res.data),
  });

  const doadores = Array.isArray(doadoresData) ? doadoresData : [];
  const usuarios = Array.isArray(usuariosData?.usuarios) ? usuariosData.usuarios : [];

  const createDoadorMutation = useMutation({
    mutationFn: (data: any) => api.post('/doadores', data),
  });

  const updateDoadorMutation = useMutation({
    mutationFn: (data: any) => api.put(`/doadores/${data.id}`, data),
  });

  const deleteDoadorMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/doadores/${id}`),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data: { id: number; ativo: boolean }) =>
      api.patch(`/doadores/${data.id}/status`, { ativo: data.ativo }),
  });

  const { mutateAsync: createDoador, isPending: creating } = createDoadorMutation;
  const { mutateAsync: updateDoador, isPending: updating } = updateDoadorMutation;
  const { mutateAsync: deleteDoador, isPending: deleting } = deleteDoadorMutation;
  const { mutateAsync: toggleStatus, isPending: toggling } = toggleStatusMutation;

  const loading = creating || updating || deleting || toggling;

  const filtered = doadores.filter((d: any) => {
    const matchesSearch = d.usuario?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.usuario?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.tipoSangue?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipoSangue = !filterValues.tipoSangue || d.tipoSangue === filterValues.tipoSangue;
    const matchesStatus = !filterValues.status || (filterValues.status === 'ativo' ? d.usuario?.ativo : !d.usuario?.ativo);

    return matchesSearch && matchesTipoSangue && matchesStatus;
  });

  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = filtered.map((d: any) => ({
      'Doador': d.usuario?.nome || '-',
      'Email': d.usuario?.email || '-',
      'Telefone': d.usuario?.telefone || '-',
      'Tipo Sanguíneo': d.tipoSangue || '-',
      'Idade': d.idade || '-',
      'Peso': d.peso || '-',
      'Status': d.usuario?.ativo ? 'Ativo' : 'Inativo'
    }));
    exportToXLS(dataToExport, 'Doadores');
  };

  const handleEdit = (doador: any) => {
    setEditingDoador(doador);
    setShowForm(true);
  };

  const handleDelete = async (doadorId: number) => {
    if (!confirm(t('admin.doadores.confirm_delete'))) return;
    try {
      await deleteDoador(doadorId);
      refetch();
    } catch (error) {
      console.error('Erro ao excluir doador:', error);
      toast.error(t('admin.doadores.error_delete'));
    }
  };

  const handleToggleStatus = async (doador: any) => {
    try {
      const newStatus = !(doador.usuario?.ativo);
      await toggleStatus({ id: doador.id, ativo: newStatus });
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status do doador:', error);
      toast.error(t('admin.doadores.error_status'));
    }
  };

  const handleNew = () => {
    setEditingDoador(null);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      const backendData = {
        idUsuario: data.usuarioId,
        idade: data.idade,
        peso: data.peso,
        tipoSangue: data.tipoSangue,
      };

      if (editingDoador) {
        await updateDoador({ ...backendData, id: editingDoador.id });
      } else {
        await createDoador(backendData);
      }

      setShowForm(false);
      setEditingDoador(null);
      refetch();
    } catch (error) {
      console.error('Erro ao salvar doador:', error);
      toast.error(t('admin.doadores.error_save'));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDoador(null);
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
            {t('admin.doadores.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingDoador ? t('admin.doadores.edit_title') : t('admin.doadores.new_title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {editingDoador ? t('admin.doadores.edit_subtitle') : t('admin.doadores.new_subtitle')}
            </p>
          </div>
        </div>

        <PerfilDoadorForm
          title={editingDoador ? t('admin.doadores.edit_title') : t('admin.doadores.new_title')}
          onSubmit={handleSubmit}
          initialData={editingDoador ? {
            usuarioId: editingDoador.usuario?.id,
            idade: editingDoador.idade,
            peso: editingDoador.peso,
            tipoSangue: editingDoador.tipoSangue,
          } : undefined}
          loading={loading}
          usuarios={editingDoador && editingDoador.usuario ? [editingDoador.usuario] : usuarios}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.doadores.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('admin.doadores.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={handleNew} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          {t('admin.doadores.new_button')}
        </Button>
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
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' }
            ]
          }
        ]}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loadingDoadores ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500 text-center">
              <div className="w-16 h-16 mx-auto border-4 border-gray-300 border-t-primary rounded-full animate-spin mb-4"></div>
              <p>{t('admin.doadores.loading')}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.doadores.empty_title')}</h3>
            <p className="text-gray-600">
              {searchTerm ? t('admin.doadores.empty_search') : t('admin.doadores.empty_default')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.doadores.col_donor')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.doadores.col_contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.doadores.col_info')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.doadores.col_status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.doadores.col_actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((doador) => (
                  <tr key={doador.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          doador.usuario?.ativo ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <User className={`w-5 h-5 ${
                            doador.usuario?.ativo ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {doador.usuario?.nome || t('common.not_informed')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doador.usuario?.email || t('common.not_informed')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doador.usuario?.telefone || t('common.not_informed')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doador.tipoSangue || t('common.not_informed')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doador.idade ? `${doador.idade} anos` : ''}
                        {doador.idade && doador.peso ? ` • ${doador.peso}kg` : ''}
                        {doador.peso && !doador.idade ? `${doador.peso}kg` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doador.usuario?.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {doador.usuario?.ativo ? t('admin.doadores.status_active') : t('admin.doadores.status_inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          className="text-primary hover:text-primary-dark"
                          onClick={() => handleEdit(doador)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="text-primary-intense hover:text-primary-dark"
                          onClick={() => handleDelete(doador.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          className={`${doador.usuario?.ativo ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                          onClick={() => handleToggleStatus(doador)}
                        >
                          {doador.usuario?.ativo ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loadingDoadores && filtered.length > 0 && (
          <Pagination
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
    </div>
  );
};
