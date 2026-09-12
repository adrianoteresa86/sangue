import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { toast } from 'sonner';

// Em desenvolvimento, VITE_API_URL fica vazia: os pedidos saem como caminhos
// relativos (/api/v1/...) e o proxy do Vite encaminha-os para o backend. Como
// nunca mudam de origem, o browser não aplica CORS — e o porto do Vite deixa
// de importar. Em produção define-se a origem da API (ex.: https://api.exemplo.ao).
const ORIGEM_API = import.meta.env.VITE_API_URL ?? '';
const API_URL = `${ORIGEM_API}/api/v1`;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Erros de servidor (5xx) e sem resposta (rede)
    if (!error.response) {
      toast.error('Sem ligação ao servidor. Verifique a sua conexão.');
    } else if (status >= 500) {
      toast.error('Erro interno do servidor. Tente novamente.');
    }

    return Promise.reject(error);
  }
);

export default api;
