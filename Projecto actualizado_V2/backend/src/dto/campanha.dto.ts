export interface CriarCampanhaDto {
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  tipoSanguineo?: string;
  metaDoacoes: number;
  idHemocentro: number;
}

export interface ActualizarCampanhaDto {
  titulo?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  tipoSanguineo?: string;
  metaDoacoes?: number;
  ativo?: boolean;
}
