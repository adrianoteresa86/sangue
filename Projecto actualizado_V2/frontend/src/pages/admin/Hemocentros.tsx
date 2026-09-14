import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { HemocentroForm } from '../../components/admin/forms';
import { Edit, Trash2, Power, PowerOff, Building, Clock, Users, X } from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
import { DataTableToolbar, exportToXLS } from '../../components/common/DataTableToolbar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const AdminHemocentros: React.FC = () => {
  const { t } = useTranslation();
  const { usuario } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingHemocentro, setEditingHemocentro] = useState<any>(null);
  const [showUsersModal, setShowUsersModal] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: hemocentrosData, isLoading: loadingHemocentros, refetch } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
  });

  const { data: hemocentroUsersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['hemocentroUsers', showUsersModal],
    queryFn: () => showUsersModal ? api.get(`/usuarios?hemocentroId=${showUsersModal}&limit=100`).then((res) => res.data.usuarios) : [],
    enabled: !!showUsersModal,
  });

  const hemocentros = Array.isArray(hemocentrosData) ? hemocentrosData : [];
  const hemocentroUsers = Array.isArray(hemocentroUsersData) ? hemocentroUsersData : [];

  const filtered = hemocentros.filter((hc: any) => {
    const matchesSearch = (hc.nome || hc.name)?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterValues.status || (filterValues.status === 'ativo' ? hc.ativo : !hc.ativo);
    return matchesSearch && matchesStatus;
  });

  const paginatedHemocentros = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = filtered.map((hc: any) => ({
      Nome: hc.nome || hc.name || '-',
      Endereço: hc.endereco || hc.address || '-',
      Telefone: hc.telefone || hc.phone || '-',
      Email: hc.email || '-',
      Horário: hc.horarioFuncionamento || '-',
      Status: hc.ativo ? 'Ativo' : 'Inativo'
    }));
    exportToXLS(dataToExport, 'Hemocentros');
  };

  const createHemocentroMutation = useMutation({
    mutationFn: (data: any) => api.post('/hemocentros', data),
  });

  const updateHemocentroMutation = useMutation({
    mutationFn: (data: any) => api.put(`/hemocentros/${data.id}`, data),
  });

  const deleteHemocentroMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/hemocentros/${id}`),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data: { id: number; ativo: boolean }) =>
      api.patch(`/hemocentros/${data.id}/status`, { ativo: data.ativo }),
  });

  const { mutateAsync: createHemocentro, isPending: creating } = createHemocentroMutation;
  const { mutateAsync: updateHemocentro, isPending: updating } = updateHemocentroMutation;
  const { mutateAsync: deleteHemocentro, isPending: deleting } = deleteHemocentroMutation;
  const { mutateAsync: toggleStatus, isPending: toggling } = toggleStatusMutation;

  const loading = creating || updating || deleting || toggling;

  const handleSubmit = async (data: any) => {
    try {
      if (editingHemocentro) {
        await updateHemocentro({ ...data, id: editingHemocentro.id });
      } else {
        await createHemocentro(data);
      }
      setShowForm(false);
      setEditingHemocentro(null);
      refetch();
    } catch (error) {
      console.error('Erro ao salvar hemocentro:', error);
      toast.error(t('admin.hemocentros.error_save'));
    }
  };

  const handleEdit = (hemocentro: any) => {
    setEditingHemocentro(hemocentro);
    setShowForm(true);
  };

  const handleDelete = async (hemocentroId: number) => {
    if (!confirm(t('admin.hemocentros.confirm_delete'))) return;
    try {
      await deleteHemocentro(hemocentroId);
      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir hemocentro:', error);
      toast.error(error.response?.data?.erro || t('admin.hemocentros.error_delete'));
    }
  };

  const handleToggleStatus = async (hemocentro: any) => {
    try {
      const newStatus = !hemocentro.ativo;
      await toggleStatus({ id: hemocentro.id, ativo: newStatus });
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status do hemocentro:', error);
      toast.error(t('admin.hemocentros.error_status'));
    }
  };

  const handleNew = () => {
    setEditingHemocentro(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHemocentro(null);
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
            {t('admin.hemocentros.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingHemocentro ? t('admin.hemocentros.edit_title') : t('admin.hemocentros.new_title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {editingHemocentro ? t('admin.hemocentros.edit_subtitle') : t('admin.hemocentros.new_subtitle')}
            </p>
          </div>
        </div>

        <HemocentroForm
          title={editingHemocentro ? t('admin.hemocentros.edit_title') : t('admin.hemocentros.new_title')}
          onSubmit={handleSubmit}
          initialData={editingHemocentro}
          loading={loading}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.hemocentros.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('admin.hemocentros.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={handleNew} className="flex items-center gap-2">
          <Building className="w-4 h-4" />
          {t('admin.hemocentros.new_button')}
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
            key: 'status',
            label: 'Todos os Estados',
            options: [
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' }
            ]
          }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingHemocentros ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <div className="text-gray-500 text-center">
              <div className="w-16 h-16 mx-auto border-4 border-gray-300 border-t-primary rounded-full animate-spin mb-4"></div>
              <p>{t('admin.hemocentros.loading')}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.hemocentros.empty_title')}</h3>
            <p className="text-gray-600">{t('admin.hemocentros.empty_subtitle')}</p>
          </div>
        ) : (
          paginatedHemocentros.map((hc) => (
            <Card key={hc.id} className="relative">
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  hc.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    hc.ativo ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  {hc.ativo ? t('admin.hemocentros.status_active') : t('admin.hemocentros.status_inactive')}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      hc.ativo ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Building className={`w-6 h-6 ${
                        hc.ativo ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{hc.nome || hc.name}</h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-400 mt-0.5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('admin.hemocentros.address_label')}</p>
                      <p className="text-sm text-gray-600">{hc.endereco || hc.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-gray-400 mt-0.5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('admin.hemocentros.phone_label')}</p>
                      <p className="text-sm text-gray-600">{hc.telefone || hc.phone}</p>
                    </div>
                  </div>

                  {hc.email && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 text-gray-400 mt-0.5">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('admin.hemocentros.email_label')}</p>
                        <p className="text-sm text-gray-600">{hc.email}</p>
                      </div>
                    </div>
                  )}

                  {hc.horarioFuncionamento && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Horário de Funcionamento</p>
                        <p className="text-sm text-gray-600">{hc.horarioFuncionamento}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    title={t('common.edit')}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                    onClick={() => handleEdit(hc)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    title={hc.ativo ? 'Desativar' : 'Ativar'}
                    className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      hc.ativo
                        ? 'text-orange-600 border border-orange-600 hover:bg-orange-600 hover:text-white'
                        : 'text-green-600 border border-green-600 hover:bg-green-600 hover:text-white'
                    }`}
                    onClick={() => handleToggleStatus(hc)}
                    disabled={toggling}
                  >
                    {hc.ativo ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    title={t('common.delete')}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-intense border border-primary-intense rounded-lg hover:bg-primary-intense hover:text-white transition-colors"
                    onClick={() => handleDelete(hc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {(usuario?.perfil === 'ADMIN' || usuario?.perfil === 'COORDENADOR_HEMOCENTRO') && (
                    <button
                      title="Ver Usuários"
                      className="flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors ml-auto"
                      onClick={() => setShowUsersModal(hc.id)}
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {!loadingHemocentros && filtered.length > 0 && (
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

      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Usuários do Hemocentro
              </h2>
              <button 
                onClick={() => setShowUsersModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loadingUsers ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : hemocentroUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Nenhum usuário associado a este hemocentro.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hemocentroUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{u.nome}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.perfil === 'COORDENADOR_HEMOCENTRO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.perfil === 'COORDENADOR_HEMOCENTRO' ? 'Coordenador' : 'Técnico'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.ativo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
