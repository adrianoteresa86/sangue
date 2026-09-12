import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';

export interface CriarNotificacaoDto {
  idDestinatario: number;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  expiraEm?: Date;
  tipoEntidadeRelacionada?: string;
  idEntidadeRelacionada?: number;
}

export interface CriarNotificacaoEmMassaDto {
  idsDestinatarios: number[];
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
}
