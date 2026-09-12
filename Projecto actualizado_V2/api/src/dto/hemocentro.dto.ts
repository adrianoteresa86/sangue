export interface CriarHemocentroDto {
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  horarioFuncionamento?: string;
  descricao?: string;
  latitude?: number;
  longitude?: number;
  ativo?: boolean;
}

export interface ActualizarHemocentroDto {
  nome?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
  horarioFuncionamento?: string;
  descricao?: string;
  latitude?: number;
  longitude?: number;
  ativo?: boolean;
}
