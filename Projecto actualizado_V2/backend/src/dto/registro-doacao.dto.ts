export interface CriarRegistroDoacaoDto {
  idDoador: number;
  idHemocentro: number;
  idAgendamento?: number;
  dataDoacao?: Date;
  quantidade: number;
  tipoSangue: string;
  tipoComponente: string;
  nivelHemoglobina: number;
  pressaoSistolica: number;
  pressaoDiastolica: number;
  pulso: number;
  temperatura: number;
  peso: number;
  observacoes?: string;
  elegivel?: boolean;
  motivoInelegibilidade?: string;
  idTecnico?: number;
}

export interface ActualizarRegistroDoacaoDto {
  quantidade?: number;
  tipoSangue?: string;
  tipoComponente?: string;
  nivelHemoglobina?: number;
  pressaoSistolica?: number;
  pressaoDiastolica?: number;
  pulso?: number;
  temperatura?: number;
  peso?: number;
  observacoes?: string;
  elegivel?: boolean;
  motivoInelegibilidade?: string;
}
