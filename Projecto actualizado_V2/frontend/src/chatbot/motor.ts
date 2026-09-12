import { detectarTipoSangue } from './compatibilidade';
import { INTENCOES, respostaFallback, SUGESTOES_INICIAIS } from './conhecimento';
import type { ContextoConversa, Intencao, PerfilUsuario, RespostaBot } from './tipos';

/**
 * Minúsculas, sem acentos e sem pontuação — mas preservando `+` e `-`,
 * indispensáveis para reconhecer tipos sanguíneos ("O-", "AB+").
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const cacheGatilhos = new Map<string, RegExp>();

/**
 * Um gatilho só conta como encontrado se aparecer como palavra/expressão
 * completa — assim "dor" não activa em "doador". O sufixo opcional tolera
 * plurais simples ("doador" encontra "doadores").
 */
function regexGatilho(gatilho: string): RegExp {
  let padrao = cacheGatilhos.get(gatilho);
  if (!padrao) {
    const escapado = gatilho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    padrao = new RegExp(`(?:^|\\s)${escapado}(?:s|es)?(?=\\s|$)`);
    cacheGatilhos.set(gatilho, padrao);
  }
  return padrao;
}

/** Bónus dos gatilhos fortes: chega para "tatuagem" vencer "posso doar". */
const BONUS_FORTE = 2;

function pontuarLista(gatilhos: string[] | undefined, normalizado: string, bonus: number): number {
  let pontos = 0;
  for (const gatilho of gatilhos ?? []) {
    if (regexGatilho(gatilho).test(normalizado)) {
      pontos += gatilho.split(' ').length + bonus;
    }
  }
  return pontos;
}

/**
 * Pontua uma intenção: cada gatilho encontrado vale o seu número de palavras.
 * Expressões longas ("quando posso doar de novo") ganham a gatilhos curtos e
 * ambíguos ("doar") que a frase também contenha — excepto quando o gatilho
 * curto é forte, e aí o bónus desempata a favor da intenção específica.
 */
function pontuar(intencao: Intencao, normalizado: string): number {
  return (
    pontuarLista(intencao.gatilhos, normalizado, 0) +
    pontuarLista(intencao.gatilhosFortes, normalizado, BONUS_FORTE)
  );
}

/** Só para depuração e testes: devolve a intenção escolhida e a pontuação. */
export function classificar(normalizado: string): { intencao: Intencao | null; pontos: number } {
  let escolhida: Intencao | null = null;
  let melhor = 0;

  for (const intencao of INTENCOES) {
    const pontos = pontuar(intencao, normalizado);
    // `>` e não `>=`: em caso de empate mantém-se a primeira da lista.
    if (pontos > melhor) {
      melhor = pontos;
      escolhida = intencao;
    }
  }

  return { intencao: escolhida, pontos: melhor };
}

export async function responder(
  entrada: string,
  perfil: PerfilUsuario | null,
  primeiroNome: string | null
): Promise<RespostaBot> {
  const normalizado = normalizar(entrada);

  const contexto: ContextoConversa = {
    texto: entrada,
    normalizado,
    tipoSangue: detectarTipoSangue(normalizado),
    perfil,
    primeiroNome,
  };

  if (!normalizado) return respostaFallback(contexto);

  // "Sou O-" sozinho: sem gatilhos, mas o tipo sanguíneo diz-nos o que responder.
  const { intencao } = classificar(normalizado);
  if (!intencao) {
    return contexto.tipoSangue
      ? INTENCOES.find((item) => item.id === 'compatibilidade')!.responder(contexto)
      : respostaFallback(contexto);
  }

  try {
    return await intencao.responder(contexto);
  } catch {
    return {
      intencao: 'erro',
      texto: 'Ups, algo correu mal a preparar a resposta. Podes tentar de novo?',
      sugestoes: SUGESTOES_INICIAIS,
    };
  }
}
