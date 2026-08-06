import type { Request } from 'express';
import { DadoInvalido } from '../../shared/erros.js';

/**
 * O sistema roda sem login. Mesmo assim toda ação grava **quem fez**, porque
 * movimento de estoque e histórico de pedido sem autor não servem pra auditar
 * nada — é o que responde "quem deu essa baixa?" quando o estoque não bate.
 *
 * Quem faz a ação vem do cabeçalho `x-operador` (o front manda o nome de quem
 * está no balcão). Sem o cabeçalho, fica `sistema`.
 */
export interface Operador {
  id: string;
  nome: string;
}

const PADRAO: Operador = { id: 'sistema', nome: 'Sistema' };

declare module 'express-serve-static-core' {
  interface Request {
    operador?: Operador;
  }
}

export function operadorDaRequisicao(req: Request): Operador {
  return req.operador ?? PADRAO;
}

/** Identificador curto pra gravar em movimento, pedido e lançamento. */
export function autorDaRequisicao(req: Request): string {
  return operadorDaRequisicao(req).id;
}

/**
 * Parâmetro de rota. O Express tipa `req.params` como possivelmente ausente em
 * alguns verbos, então centralizar aqui evita `!` e `as string` em cada rota.
 */
export function parametro(req: Request, nome: string): string {
  const valores = req.params as Record<string, string | string[] | undefined>;
  const valor = valores[nome];
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  if (!bruto) throw new DadoInvalido(`Faltou o parâmetro "${nome}" na URL.`);
  return bruto;
}

/** Query string sempre chega como string; isso evita `as string` espalhado. */
export function texto(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpo = valor.trim();
  return limpo.length > 0 ? limpo : undefined;
}

export function numero(valor: unknown): number | undefined {
  const bruto = texto(valor);
  if (bruto === undefined) return undefined;
  const convertido = Number(bruto);
  return Number.isFinite(convertido) ? convertido : undefined;
}

export function booleano(valor: unknown): boolean | undefined {
  const bruto = texto(valor);
  if (bruto === undefined) return undefined;
  if (bruto === 'true' || bruto === '1') return true;
  if (bruto === 'false' || bruto === '0') return false;
  return undefined;
}
