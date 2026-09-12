export interface CriarAgendamentoDoacaoDto {
  idHemocentro: number;
  dataPreferida: Date;
  horaPreferida?: string;
  tipoSangue?: string;
  observacoes?: string;
  nomeContatoEmergencia?: string;
  telefoneContatoEmergencia?: string;
  cidade?: string;
}

export interface ActualizarStatusAgendamentoDto {
  status: string;
}
