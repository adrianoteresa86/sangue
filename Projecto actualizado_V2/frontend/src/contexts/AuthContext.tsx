import { createContext, useContext, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { Usuario } from '../types';
import api from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  register: (usuario: Omit<Usuario, 'id'>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {

  const getStoredUser = () => {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    return stored && token ? JSON.parse(stored) : null;
  };

  const [usuario, setUsuario] = useState(getStoredUser);
  const isLoading = false;

  const login = async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, usuario: usuarioData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
      setUsuario(usuarioData);
      toast.success(`Bem-vindo, ${usuarioData.nome?.split(' ')[0] ?? ''}!`);
    } catch (error: any) {
      const msg = error.response?.data?.erro ?? error.response?.data?.message ?? 'Credenciais inválidas.';
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    toast.info('Sessão terminada.');
  };

  const register = async (usuarioData: Omit<Usuario, 'id'>) => {
    try {
      await api.post('/auth/registrar', usuarioData);
      toast.success('Conta criada com sucesso! Faça login para continuar.');
    } catch (error: any) {
      const msg = error.response?.data?.erro ?? error.response?.data?.message ?? 'Erro ao criar conta.';
      toast.error(msg);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
