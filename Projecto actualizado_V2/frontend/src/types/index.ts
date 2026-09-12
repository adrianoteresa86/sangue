export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  telefone: string;
  rua?: string;
  numero?: string;
  provincia?: string;
  bairro?: string;
  perfil: 'DOADOR' | 'ADMIN' | 'RECEPTOR' | 'COORDENADOR_HEMOCENTRO' | 'TECNICO_HEMOCENTRO';
  ativo?: boolean;
  dataCriacao?: Date;
}

export interface Doador {
  id?: string;
  usuarioId: string;
  tipoSanguineo: string;
  fatorRh: string;
  peso: number;
  altura: number;
  genero: string;
  dataNascimento: string;
  cpf: string;
  endereco: string;
  cidade: string;
  estado: string;
  dataUltimaDoacaoId?: string;
  periodoMinimoDoacoes: number;
}

export interface Hemocentro {
  id?: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  horarioAbertura: string;
  horarioFechamento: string;
  cidade: string;
  estado: string;
  ativo?: boolean;
}

export interface Campanha {
  id?: string;
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  metaUnidades: number;
  hemocentroId: string;
  ativo?: boolean;
}

export interface AgendamentoDoacao {
  id?: string;
  doadorId: string;
  hemocentroId: string;
  dataAgendada: string;
  horaAgendada: string;
  status: string;
  observacoes?: string;
}

export interface RegistroDoacao {
  id?: string;
  doadorId: string;
  hemocentroId: string;
  dataDoacao: string;
  quantidadeMl: number;
  status: string;
  observacoes?: string;
}

export interface EstoqueSangue {
  id?: string;
  hemocentroId: string;
  tipoSanguineo: string;
  fatorRh: string;
  quantidadeUnidades: number;
  dataAtualizacao: string;
}

export interface Notificacao {
  id?: string;
  usuarioId: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  dataCriacao: string;
}

export interface PedidoTransfusao {
  id?: string;
  hemocentroId: string;
  tipoSanguineo: string;
  fatorRh: string;
  quantidadeUnidades: number;
  status: string;
  motivo: string;
  dataRequisicao: string;
}

export interface RegistroTransfusao {
  id?: string;
  pacienteId: string;
  hemocentroId: string;
  tipoSanguineo: string;
  quantidadeMl: number;
  dataTransfusao: string;
  status: string;
  observacoes?: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

// ── Receptor ──────────────────────────────────────────────────────────────────

export type StatusPedido =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PedidoReceptor {
  id: number;
  nomePaciente: string;
  tipoSanguinePaciente: string;
  quantidadeSolicitada: number;
  nivelUrgencia: number;
  status: StatusPedido;
  diagnostico: string;
  observacoes?: string;
  indicacaoClinica?: string;
  contatoMedico?: string;
  numeroProntuario?: string;
  dataSolicitacao: string;
  precisaAte?: string;
  criadoEm: string;
  atualizadoEm?: string;
  hemocentro?: { id: number; nome: string; cidade?: string };
}

export interface NotificacaoReceptor {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  criadoEm: string;
  lidaEm?: string;
  tipoEntidadeRelacionada?: string;
  idEntidadeRelacionada?: number;
}

export interface NotificacoesResponse {
  total: number;
  naoLidas: number;
  notificacoes: NotificacaoReceptor[];
}

export interface DashboardReceptor {
  ativos: number;
  concluidas: number;
  canceladas: number;
  tipoSanguineo: string | null;
  recentes: PedidoReceptor[];
}

export interface HistoricoReceptor {
  total: number;
  totalLitros: number;
  esteAno: number;
  transfusoes: PedidoReceptor[];
}

export interface PerfilMedico {
  id?: number;
  dataNascimento?: string;
  tipoSanguineo?: string;
  peso?: number;
  altura?: number;
  historicoMedico?: string;
  genero?: string;
}

export interface PerfilReceptorResponse {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  provincia?: string;
  perfilMedico: PerfilMedico | null;
}

export interface HemocentroSimples {
  id: number;
  nome: string;
  cidade?: string;
  telefone?: string;
}
