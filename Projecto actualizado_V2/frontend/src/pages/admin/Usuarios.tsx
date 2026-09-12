import React, { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { UsuarioForm } from '../../components/admin/forms';
import { Edit, Trash2, Power, PowerOff } from 'lucide-react';

export const AdminUsuarios: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: usuariosData = { usuarios: [], paginacao: { total: 0, page: 1, limit: 10, totalPages: 1 } }, isLoading: loadingUsuarios, refetch } = useQuery({
    queryKey: ['usuarios', page, limit],
    queryFn: () => api.get(`/usuarios?page=${page}&limit=${limit}`).then((res) => res.data),
  });

  const { data: hemocentrosData = { hemocentros: [] } } = useQuery({
    queryKey: ['hemocentros'],
    queryFn: () => api.get('/hemocentros').then((res) => res.data),
  });

  const usuarios = Array.isArray(usuariosData.usuarios) ? usuariosData.usuarios : [];
  const paginacao = usuariosData.paginacao;
  const hemocentros = Array.isArray(hemocentrosData.hemocentros) ? hemocentrosData.hemocentros : [];

  const filtered = usuarios.filter((u: any) =>
    u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setEditingUser(user);
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
            <p className="text-gray-600 mt-1">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.usuarios.title')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.usuarios.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={handleNew}>{t('admin.usuarios.new_button')}</Button>
      </div>

      <Input
        label={t('admin.usuarios.search_label')}
        placeholder={t('admin.usuarios.search_placeholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
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
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_profile')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_status')}</th>
                  <th className="text-left py-3 px-4 font-semibold">{t('admin.usuarios.col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user: any) => (
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
            
            {paginacao && paginacao.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((paginacao.page - 1) * paginacao.limit) + 1}</span> até <span className="font-medium">{Math.min(paginacao.page * paginacao.limit, paginacao.total)}</span> de <span className="font-medium">{paginacao.total}</span> resultados
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={paginacao.page === 1}
                    >
                      Anterior
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setPage(p => Math.min(paginacao.totalPages, p + 1))}
                      disabled={paginacao.page === paginacao.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
