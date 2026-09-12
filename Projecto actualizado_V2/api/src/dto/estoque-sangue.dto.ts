export interface CriarEstoqueSangueDto {
  idHemocentro: number;
  tipoSangue: string;
  quantidade: number;
  tipoComponente: string;
  dataValidade: Date;
  dataRecebimento?: Date;
}

export interface ActualizarEstoqueSangueDto {
  idHemocentro?: number;
  tipoSangue?: string;
  quantidade?: number;
  tipoComponente?: string;
  dataValidade?: Date;
}

export interface DiminuirQuantidadeDto {
  quantidade: number;
}
