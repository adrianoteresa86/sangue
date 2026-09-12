/**
 * Compatibilidade sanguínea (concentrado de glóbulos vermelhos).
 * Lógica pura, sem dependências — usada pela Sanguinha para responder
 * a perguntas do tipo "sou O-, posso doar para quem?".
 */

export const TIPOS_SANGUE = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;

export type TipoSangue = (typeof TIPOS_SANGUE)[number];

/** De que tipos é que cada tipo sanguíneo pode RECEBER. */
export const RECEBE_DE: Record<TipoSangue, TipoSangue[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': [...TIPOS_SANGUE],
};

/** Para que tipos é que um dado tipo sanguíneo pode DOAR. */
export function doaPara(tipo: TipoSangue): TipoSangue[] {
  return TIPOS_SANGUE.filter((destino) => RECEBE_DE[destino].includes(tipo));
}

/** O- é dador universal; AB+ é receptor universal. */
export const DOADOR_UNIVERSAL: TipoSangue = 'O-';
export const RECEPTOR_UNIVERSAL: TipoSangue = 'AB+';

// Aceita "O-", "o +", "o negativo", "ab pos", "tipo A positivo", ...
const PADRAO_TIPO = /(?:^|\s)(ab|a|b|o)\s*(\+|-|positivo|negativo|pos|neg)(?=\s|$)/;

/**
 * Extrai um tipo sanguíneo de texto já normalizado (minúsculas, sem acentos,
 * mantendo `+` e `-`). Devolve `null` se não encontrar nenhum.
 */
export function detectarTipoSangue(normalizado: string): TipoSangue | null {
  const encontrado = PADRAO_TIPO.exec(normalizado);
  if (!encontrado) return null;

  const grupo = encontrado[1].toUpperCase();
  const marcador = encontrado[2];
  const sinal = marcador === '+' || marcador.startsWith('p') ? '+' : '-';

  return `${grupo}${sinal}` as TipoSangue;
}
