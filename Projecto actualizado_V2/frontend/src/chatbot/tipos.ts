import type { Usuario } from '../types';
import type { TipoSangue } from './compatibilidade';

export type PerfilUsuario = Usuario['perfil'];

/** Botão de navegação sugerido pela Sanguinha (ex.: "Agendar doação" → /doador/agendar). */
export interface AccaoBot {
  rotulo: string;
  rota: string;
}

export interface RespostaBot {
  /** Identificador da intenção que produziu a resposta (útil para depuração/métricas). */
  intencao: string;
  /** Texto da resposta. Suporta `**negrito**` e quebras de linha. */
  texto: string;
  /** Respostas rápidas que o utilizador pode tocar. */
  sugestoes?: string[];
  accoes?: AccaoBot[];
}

/** Tudo o que uma intenção precisa de saber para formular a resposta. */
export interface ContextoConversa {
  texto: string;
  normalizado: string;
  tipoSangue: TipoSangue | null;
  perfil: PerfilUsuario | null;
  primeiroNome: string | null;
}

export interface Intencao {
  id: string;
  /** Palavras ou expressões que activam a intenção. Expressões longas pesam mais. */
  gatilhos: string[];
  /**
   * Termos que, sozinhos, identificam a intenção com pouca margem para dúvida
   * ("tatuagem", "agulha"). Recebem um bónus para não perderem contra
   * expressões mais longas mas vagas, como "posso doar".
   */
  gatilhosFortes?: string[];
  responder: (contexto: ContextoConversa) => RespostaBot | Promise<RespostaBot>;
}

export interface Mensagem {
  id: string;
  autor: 'bot' | 'utilizador';
  texto: string;
  /** ISO 8601. */
  hora: string;
  sugestoes?: string[];
  accoes?: AccaoBot[];
}
