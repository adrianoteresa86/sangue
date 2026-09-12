import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

export const useApi = () => {
  // Auth endpoints
  const login = useMutation({
    mutationFn: (data: { email: string; senha: string }) =>
      api.post('/autenticacao/login', data),
  });

  const register = useMutation({
    mutationFn: (data: any) =>
      api.post('/autenticacao/registrar', data),
  });

  // Usuários
  const useUsuarios = () =>
    useQuery({
      queryKey: ['usuarios'],
      queryFn: () => api.get('/usuarios').then((res) => res.data),
    });

  const useUsuario = (id: string) =>
    useQuery({
      queryKey: ['usuario', id],
      queryFn: () => api.get(`/usuarios/${id}`).then((res) => res.data),
      enabled: !!id,
    });

  const createUsuario = useMutation({
    mutationFn: (data: any) => api.post('/usuarios', data),
  });

  const updateUsuario = useMutation({
    mutationFn: (data: any) => api.put(`/usuarios/${data.id}`, data),
  });

  const deleteUsuario = useMutation({
    mutationFn: (id: number) => api.delete(`/usuarios/${id}`),
  });

  const toggleUsuarioStatus = useMutation({
    mutationFn: (data: { id: number; ativo: boolean }) => 
      api.patch(`/usuarios/${data.id}/status`, { ativo: data.ativo }),
  });

  // Doadores
  const useDoadores = () =>
    useQuery({
      queryKey: ['doadores'],
      queryFn: () => api.get('/doadores').then((res) => res.data),
    });

  const useDoador = (id: string) =>
    useQuery({
      queryKey: ['doador', id],
      queryFn: () => api.get(`/doadores/${id}`).then((res) => res.data),
      enabled: !!id,
    });

  const createDoador = useMutation({
    mutationFn: (data: any) => api.post('/doadores', data),
  });

  const updateDoador = useMutation({
    mutationFn: (data: any) => api.put(`/doadores/${data.id}`, data),
  });

  const deleteDoador = useMutation({
    mutationFn: (id: number) => api.delete(`/doadores/${id}`),
  });

  const toggleDoadorStatus = useMutation({
    mutationFn: (data: { id: number; ativo: boolean }) => 
      api.patch(`/doadores/${data.id}/status`, { ativo: data.ativo }),
  });

  // Campanhas
  const useCampanhas = () =>
    useQuery({
      queryKey: ['campanhas'],
      queryFn: () => api.get('/campanhas').then((res) => res.data),
    });

  const useCampanha = (id: string) =>
    useQuery({
      queryKey: ['campanha', id],
      queryFn: () => api.get(`/campanhas/${id}`).then((res) => res.data),
      enabled: !!id,
    });

  const createCampanha = useMutation({
    mutationFn: (data: any) => api.post('/campanhas', data),
  });

  const updateCampanha = useMutation({
    mutationFn: (data: any) => api.put(`/campanhas/${data.id}`, data),
  });

  const deleteCampanha = useMutation({
    mutationFn: (id: number) => api.delete(`/campanhas/${id}`),
  });

  const toggleCampanhaStatus = useMutation({
    mutationFn: (data: { id: number; status: string }) => 
      api.patch(`/campanhas/${data.id}/status`, { status: data.status }),
  });

  // Agendamentos
  const useAgendamentos = () =>
    useQuery({
      queryKey: ['agendamentos'],
      queryFn: () => api.get('/agendamentos-doacao').then((res) => res.data),
    });

  const useAgendamento = (id: string) =>
    useQuery({
      queryKey: ['agendamento', id],
      queryFn: () => api.get(`/agendamentos-doacao/${id}`).then((res) => res.data),
      enabled: !!id,
    });

  const createAgendamento = useMutation({
    mutationFn: (data: any) => api.post('/agendamentos-doacao', data),
  });

  const updateAgendamentoStatus = useMutation({
    mutationFn: (data: { id: number; status: string }) => 
      api.patch(`/agendamentos-doacao/${data.id}/status`, { status: data.status }),
  });

  const cancelAgendamento = useMutation({
    mutationFn: (id: number) => 
      api.patch(`/agendamentos-doacao/${id}/cancelar`),
  });

  // Doações
  const useDoacoes = () =>
    useQuery({
      queryKey: ['doacoes'],
      queryFn: () => api.get('/doacoes').then((res) => res.data),
    });

  const createDoacao = useMutation({
    mutationFn: (data: any) => api.post('/doacoes', data),
  });

  // Estoque
  const useEstoque = () =>
    useQuery({
      queryKey: ['estoque'],
      queryFn: () => api.get('/estoque').then((res) => res.data),
    });

  const createEstoque = useMutation({
    mutationFn: (data: any) => api.post('/estoque', data),
  });

  const updateEstoque = useMutation({
    mutationFn: (data: any) => api.put(`/estoque/${data.id}`, data),
  });

  const deleteEstoque = useMutation({
    mutationFn: (id: number) => api.delete(`/estoque/${id}`),
  });

  // Hemocentros
  const useHemocentros = () =>
    useQuery({
      queryKey: ['hemocentros'],
      queryFn: () => api.get('/hemocentros').then((res) => res.data),
    });

  const createHemocentro = useMutation({
    mutationFn: (data: any) => api.post('/hemocentros', data),
  });

  const updateHemocentro = useMutation({
    mutationFn: (data: any) => api.put(`/hemocentros/${data.id}`, data),
  });

  const deleteHemocentro = useMutation({
    mutationFn: (id: number) => api.delete(`/hemocentros/${id}`),
  });

  const toggleHemocentroStatus = useMutation({
    mutationFn: (data: { id: number; ativo: boolean }) => 
      api.patch(`/hemocentros/${data.id}/status`, { ativo: data.ativo }),
  });

  // Notificações
  const useNotificacoes = () =>
    useQuery({
      queryKey: ['notificacoes'],
      queryFn: () => api.get('/notificacoes').then((res) => res.data),
    });

  return {
    login,
    register,
    useUsuarios,
    useUsuario,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    toggleUsuarioStatus,
    useDoadores,
    useDoador,
    createDoador,
    updateDoador,
    deleteDoador,
    toggleDoadorStatus,
    useCampanhas,
    useCampanha,
    createCampanha,
    updateCampanha,
    deleteCampanha,
    toggleCampanhaStatus,
    useAgendamentos,
    useAgendamento,
    createAgendamento,
    updateAgendamentoStatus,
    cancelAgendamento,
    useDoacoes,
    createDoacao,
    useEstoque,
    createEstoque,
    updateEstoque,
    deleteEstoque,
    useHemocentros,
    createHemocentro,
    updateHemocentro,
    deleteHemocentro,
    toggleHemocentroStatus,
    useNotificacoes,
  };
};
