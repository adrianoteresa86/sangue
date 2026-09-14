import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { UsuarioForm } from '../../components/admin/forms';
import { Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
import { DataTableToolbar, exportToXLS } from '../../components/common/DataTableToolbar';

export const AdminUsuarios: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: usuariosData = { usuarios: [] }, isLoading: loadingUsuarios, refetch } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get(`/usuarios?limit=10000`).then((res) => res.data),
  });

  const { data: hemocentrosData = { hemocentros: [] } } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
  });

  const usuarios = Array.isArray(usuariosData.usuarios) ? usuariosData.usuarios : [];
  const hemocentros = Array.isArray(hemocentrosData) ? hemocentrosData : (Array.isArray(hemocentrosData.hemocentros) ? hemocentrosData.hemocentros : []);

  const filtered = usuarios.filter((u: any) => {
    const matchesSearch = u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerfil = !filterValues.perfil || u.perfil === filterValues.perfil;
    const matchesStatus = !filterValues.status || (filterValues.status === 'ativo' ? u.ativo : !u.ativo);
    return matchesSearch && matchesPerfil && matchesStatus;
  });
  
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExport = () => {
    const dataToExport = filtered.map((u: any) => ({
      Nome: u.nome,
      Email: u.email,
      Telefone: u.telefone || '-',
      'Tipo Sanguíneo': u.tipoSangue || '-',
      Província: u.provincia || '-',
      Hemocentro: u.perfilHemocentro?.hemocentroNome || '-',
      Perfil: u.perfil,
      Status: u.ativo ? 'Ativo' : 'Inativo'
    }));
    exportToXLS(dataToExport, 'Utilizadores');
  };

  const createUsuarioMutation = useMutation({
    mutationFn: (data: any) => api.post('/usuarios/adicionar', data),
  });

  const updateUsuarioMutation = useMutation({
    mutationFn: (data: any) => api.put(`/usuarios/${data.id}`, data),
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/usuarios/${id}`),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (data: { id: number; ativo: boolean }) =>
      api.patch(`/usuarios/${data.id}/status`, { ativo: data.ativo }),
  });

  const { mutateAsync: createUsuario, isPending: creating } = createUsuarioMutation;
  const { mutateAsync: updateUsuario, isPending: updating } = updateUsuarioMutation;
  const { mutateAsync: deleteUsuario, isPending: deleting } = deleteUsuarioMutation;
  const { mutateAsync: toggleStatus, isPending: toggling } = toggleStatusMutation;

  const loading = creating || updating || deleting || toggling;

  const handleSubmit = async (data: any) => {
    try {
      if (editingUser) {
        await updateUsuario({ ...data, id: editingUser.id });
      } else {
        await createUsuario(data);
      }
      setShowForm(false);
      setEditingUser(null);
      refetch();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(t('admin.usuarios.error_save'));
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser({
      ...user,
      hemocentroId: user.perfilHemocentro?.hemocentroId
    });
    setShowForm(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm(t('admin.usuarios.confirm_delete'))) return;
    try {
      await deleteUsuario(userId);
      refetch();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(t('admin.usuarios.error_delete'));
    }
  };

  const handleNew = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await toggleStatus({ id: user.id, ativo: !user.ativo });
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error(t('admin.usuarios.error_status'));
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={handleCancel} className="flex items-center gap-2">
            {t('admin.usuarios.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingUser ? t('admin.usuarios.edit_title') : t('admin.usuarios.new_title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {editingUser ? t('admin.usuarios.edit_subtitle') : t('admin.usuarios.new_subtitle')}
            </p>
          </div>
        </div>

        <UsuarioForm
          title={editingUser ? t('admin.usuarios.edit_title') : t('admin.usuarios.new_title')}
          onSubmit={handleSubmit}
          initialData={editingUser}
          loading={loading}
          onCancel={handleCancel}
          hemocentros={hemocentros}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.usuarios.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('admin.usuarios.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={handleNew} className="w-full sm:w-auto">{t('admin.usuarios.new_button')}</Button>
      </div>

      <DataTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        filters={[
          {
            key: 'perfil',
            label: 'Todos os Perfis',
            options: [
              { value: 'ADMIN', label: 'Admin' },
              { value: 'DOADOR', label: 'Doador' },
              { value: 'RECEPTOR', label: 'Receptor' },
              { value: 'COORDENADOR', label: 'Coordenador' }
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

      <Card>
        {loadingUsuarios ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">{t('admin.usuarios.loading')}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_name')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_email')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_phone')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_blood_type')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_province')}</th>
                  <th className="text-left py-3 px-4 font-semibold">Hemocentro</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_profile')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_status')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((user: any) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{user.nome}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600">{user.telefone || '-'}</td>
                    <td className="py-3 px-4">
                      {user.tipoSangue ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          {user.tipoSangue}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.provincia || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.perfilHemocentro?.hemocentroNome ? (
                        <span className="text-sm">{user.perfilHemocentro.hemocentroNome}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.perfil === 'ADMIN' ? 'bg-red-100 text-primary' :
                        user.perfil === 'DOADOR' ? 'bg-blue-100 text-blue-700' :
                        user.perfil === 'RECEPTOR' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {user.perfil}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.ativo ? t('admin.usuarios.status_active') : t('admin.usuarios.status_inactive')}
                        </span>
                        {user.ativo ? (
                          <PowerOff className="w-4 h-4 text-green-600" />
                        ) : (
                          <Power className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button
                          title={t('common.edit')}
                          className="p-1.5 rounded-lg text-primary hover:bg-red-50 transition-colors"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          title={t('common.delete')}
                          className="p-1.5 rounded-lg text-primary-intense hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          title={user.ativo ? t('admin.hemocentros.status_inactive') : t('admin.hemocentros.status_active')}
                          className={`p-1.5 rounded-lg transition-colors ${user.ativo ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                          onClick={() => handleToggleStatus(user)}
                          disabled={toggling}
                        >
                          {user.ativo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!loadingUsuarios && filtered.length > 0 && (
              <Pagination
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
