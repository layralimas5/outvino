import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { slug } from '../../shared/id.js';
import type { Operador } from './contexto.js';

/**
 * Sessão do painel: um token assinado dentro de cookie `httpOnly`.
 *
 * Não é JWT nem biblioteca de auth. O sistema tem uma senha só, uma loja e um
 * punhado de operadores — um HMAC do `node:crypto` resolve, sem dependência
 * nova pra manter e sem superfície que ninguém aqui vai auditar.
 *
 * O token fica em cookie `httpOnly` e não em `localStorage` de propósito: se um
 * XSS entrar no painel, JavaScript não consegue ler o cookie e sair com a
 * sessão pra outro lugar.
 */

const COOKIE = 'outvino_sessao';

/** Separa os domínios de derivação: a mesma senha nunca gera as duas chaves. */
const SAL_DA_ASSINATURA = 'outvino:sessao:v1';
const SAL_DA_SENHA = 'outvino:senha:v1';

interface Conteudo {
  id: string;
  nome: string;
  /** Epoch em milissegundos. Expiração vive dentro da assinatura, não só no cookie. */
  exp: number;
}

/**
 * `scrypt` é caro de propósito (é o que torna força bruta inviável), então o
 * resultado é calculado uma vez por instância e reaproveitado. Em função
 * serverless isso significa uma vez por container frio.
 */
let chaveMemorizada: Buffer | null = null;
let senhaMemorizada: Buffer | null = null;

function derivar(base: string, sal: string): Buffer {
  return scryptSync(base, sal, 32);
}

function chaveDeAssinatura(): Buffer {
  chaveMemorizada ??= derivar(env.segredoDaSessao || env.senhaDoPainel, SAL_DA_ASSINATURA);
  return chaveMemorizada;
}

function assinar(dados: string): string {
  return createHmac('sha256', chaveDeAssinatura()).update(dados).digest('base64url');
}

/** Comparação em tempo constante: `===` em hash vaza quanto do prefixo bateu. */
function iguais(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function senhaConfere(informada: string): boolean {
  senhaMemorizada ??= derivar(env.senhaDoPainel, SAL_DA_SENHA);
  return iguais(senhaMemorizada, derivar(informada, SAL_DA_SENHA));
}

export function criarToken(nome: string): { token: string; operador: Operador; expiraEm: Date } {
  const expiraEm = new Date(Date.now() + env.sessaoEmHoras * 60 * 60 * 1000);
  const operador: Operador = { id: slug(nome) || 'sistema', nome };
  const conteudo: Conteudo = { id: operador.id, nome: operador.nome, exp: expiraEm.getTime() };

  const corpo = Buffer.from(JSON.stringify(conteudo), 'utf8').toString('base64url');
  return { token: `${corpo}.${assinar(corpo)}`, operador, expiraEm };
}

/** Devolve `null` pra qualquer token ausente, adulterado, corrompido ou vencido. */
export function lerToken(token: string | undefined): Operador | null {
  if (!token) return null;

  const separador = token.lastIndexOf('.');
  if (separador <= 0) return null;

  const corpo = token.slice(0, separador);
  const assinatura = token.slice(separador + 1);

  if (!iguais(Buffer.from(assinatura), Buffer.from(assinar(corpo)))) return null;

  try {
    const conteudo = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8')) as Conteudo;
    if (typeof conteudo.exp !== 'number' || conteudo.exp <= Date.now()) return null;
    if (typeof conteudo.id !== 'string' || typeof conteudo.nome !== 'string') return null;
    return { id: conteudo.id, nome: conteudo.nome };
  } catch {
    return null;
  }
}

/**
 * Lê o cookie na mão em vez de trazer `cookie-parser`: é uma linha de header e
 * uma dependência a menos no bundle da função.
 */
export function tokenDaRequisicao(req: Request): string | undefined {
  const cabecalho = req.header('cookie');
  if (!cabecalho) return undefined;

  for (const parte of cabecalho.split(';')) {
    const igual = parte.indexOf('=');
    if (igual < 0) continue;
    if (parte.slice(0, igual).trim() !== COOKIE) continue;
    return decodeURIComponent(parte.slice(igual + 1).trim());
  }
  return undefined;
}

/**
 * `sameSite: 'lax'` é o que segura CSRF: o navegador não manda esse cookie em
 * POST vindo de outro site. `secure` só em produção porque o dev roda em HTTP.
 */
const OPCOES_DO_COOKIE = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
} as const;

export function gravarCookie(res: Response, token: string, expiraEm: Date): void {
  res.cookie(COOKIE, token, { ...OPCOES_DO_COOKIE, secure: env.producao, expires: expiraEm });
}

export function limparCookie(res: Response): void {
  res.clearCookie(COOKIE, { ...OPCOES_DO_COOKIE, secure: env.producao });
}
