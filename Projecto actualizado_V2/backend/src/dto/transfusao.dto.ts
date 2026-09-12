export interface CriarPedidoTransfusaoDto {
  idHemocentro: number;
  nomePaciente: string;
  tipoSanguinePaciente: string;
  idadePaciente: number;
  generoPaciente: string;
  numeroProntuario: string;
  diagnostico: string;
  tipoComponente: string;
  quantidadeSolicitada: number;
  nivelUrgencia: number;
  dataSolicitacao?: Date;
  precisaAte: Date;
  indicacaoClinica?: string;
  idReceptor?: number;
  contatoMedico?: string;
  observacoes?: string;
}

export interface ActualizarPedidoTransfusaoDto {
  nomePaciente?: string;
  tipoSanguinePaciente?: string;
  idadePaciente?: number;
  generoPaciente?: string;
  numeroProntuario?: string;
  diagnostico?: string;
  tipoComponente?: string;
  quantidadeSolicitada?: number;
  nivelUrgencia?: number;
  precisaAte?: Date;
  indicacaoClinica?: string;
  contatoMedico?: string;
  observacoes?: string;
}

export interface ActualizarStatusTransfusaoDto {
  status: string;
}

export interface CriarRegistroTransfusaoDto {
  idPedido: number;
  idHemocentro: number;
  idEstoqueSangue: number;
  dataTransfusao?: Date;
  horaInicio?: Date;
  horaFim?: Date;
  quantidadeAdministrada: number;
  tipoSangue: string;
  tipoComponente: string;
  prePressaoSistolica: number;
  prePressaoDiastolica: number;
  prePulso: number;
  preTemperatura: number;
  preFrequenciaRespiratoria: number;
  durantePressaoSistolica?: number;
  durantePressaoDiastolica?: number;
  durantePulso?: number;
  duranteTemperatura?: number;
  posPressaoSistolica?: number;
  posPressaoDiastolica?: number;
  posPulso?: number;
  posTemperatura?: number;
  posFrequenciaRespiratoria?: number;
  reacaoAdversa?: boolean;
  descricaoReacaoAdversa?: string;
  concluida?: boolean;
  complicacoes?: string;
  observacoes?: string;
  idEnfermeiro?: number;
  idMedico?: number;
  idReceptor?: number;
}
