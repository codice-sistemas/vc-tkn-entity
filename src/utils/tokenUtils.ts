import tokenTypes from "../config/tokenTypes.json" assert { type: "json" };

/**
 * Retorna o nome do tipo de token a partir do código.
 * Se não encontrar, retorna o próprio código.
 */
export function getTokenTypeName(code: string | number): string {
  const num = Number(code);
  const found = (tokenTypes as any[]).find(t => t.code === num);
  return found ? found.name : `Tipo desconhecido (${code})`;
}

/**
 * Retorna o objeto completo do tipo (com required, extra, rules etc).
 */
export function getTokenTypeDetails(code: string | number) {
  const num = Number(code);
  return (tokenTypes as any[]).find(t => t.code === num) || null;
}
