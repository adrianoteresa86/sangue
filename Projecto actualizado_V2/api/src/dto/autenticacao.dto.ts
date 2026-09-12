import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';

export interface PedidoRegistroDto {
  nome?: string;
  email?: string;
  telefone?: string;
  senha: string;
  perfil?: PerfilUsuario;
}

export interface PedidoLoginDto {
  identificador: string;
  senha: string;
}

export interface PedidoLoginOAuthDto {
  email: string;
  nome?: string;
  provedor?: string;
}

export interface RespostaAutenticacaoDto {
  token: string;
  idUsuario: number;
  email: string;
  perfil: PerfilUsuario;
}
