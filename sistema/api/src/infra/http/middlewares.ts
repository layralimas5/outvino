import type { ErrorRequestHandler, Request, RequestHandler } from 'express';
import { ZodError, z } from 'zod';
import { env } from '../../config/env.js';
import {
  ConfiguracaoPendente,
  DadoInvalido,
  ErroDeAplicacao,
  NaoAutenticado,
  SemPermissao,
} from '../../shared/erros.js';
import { slug } from '../../shared/id.js';
import { lerToken, tokenDaRequisicao } from './sessao.js';

/**
 * Anota quem está operando, pro histórico de estoque e pedido ter autor.
 *
 * Com autenticação ligada, o autor é a sessão assinada — o cabeçalho
 * `x-operador` é ignorado, senão qualquer um assinaria como qualquer um. Sem
 * autenticação (só desenvolvimento), o nome vem do front mesmo.
 */
export const identificarOperador: RequestHandler = (req, _res, next) => {
  if (env.autenticacaoLigada) {
    const operador = lerToken(tokenDaRequisicao(req));
    if (operador) req.operador = operador;
    next();
    return;
  }

  const nome = req.header('x-operador')?.trim();
  if (nome) req.operador = { id: slug(nome) || 'sistema', nome };
  next();
};

/**
 * Reforço anti-CSRF atrás do `sameSite: 'lax'` do cookie.
 *
 * Só POST importa: formulário de outro site consegue disparar POST, mas não
 * consegue mandar `application/json` sem preflight — e preflight o CORS barra.
 * PATCH e DELETE já são impossíveis a partir de um `<form>`.
 */
export function exigirJson(req: Request): void {
  if (req.method === 'POST' && !req.is('application/json')) {
    throw new DadoInvalido('Requisição precisa ser application/json.');
  }
}

/**
 * Fecha as rotas de gestão do painel.
 *
 * Sem `SENHA_PAINEL` em produção, nada passa: um back-office aberto na internet
 * entrega pedido, dado de cliente e faturamento pra quem descobrir a URL.
 */
export const exigirSessao: RequestHandler = (req, _res, next) => {
  if (!env.autenticacaoLigada) {
    // `PAINEL_ABERTO=true` é a decisão consciente de abrir: passa direto.
    if (env.producao && !env.painelAberto) {
      throw new ConfiguracaoPendente(
        'Painel sem senha configurada. Defina SENHA_PAINEL nas variáveis de ambiente pra liberar o acesso.',
      );
    }
    next();
    return;
  }

  if (!req.operador) throw new NaoAutenticado('Faça login pra continuar.');

  exigirJson(req);
  next();
};

/**
 * O site usa uma chave fixa porque quem chama é o carrinho, de fora da rede da
 * loja. Sem `CHAVE_SITE` configurada o endpoint fica fechado — melhor
 * indisponível que aberto pra qualquer um criar pedido.
 */
export const autenticarSite: RequestHandler = (req, _res, next) => {
  if (!env.chaveSite) {
    throw new SemPermissao('Integração com o site desligada: falta configurar CHAVE_SITE.');
  }
  if (req.header('x-chave-site') !== env.chaveSite) {
    throw new NaoAutenticado('Chave do site inválida.');
  }
  next();
};

export const naoEncontrado: RequestHandler = (req, res) => {
  res.status(404).json({
    erro: { codigo: 'rota_nao_encontrada', mensagem: `${req.method} ${req.path} não existe.` },
  });
};

export const tratarErros: ErrorRequestHandler = (erro, _req, res, _next) => {
  if (erro instanceof ZodError) {
    res.status(422).json({
      erro: {
        codigo: 'dado_invalido',
        mensagem: 'Confira os campos enviados.',
        detalhes: z.treeifyError(erro),
      },
    });
    return;
  }

  if (erro instanceof ErroDeAplicacao) {
    res.status(erro.status).json({
      erro: { codigo: erro.codigo, mensagem: erro.message, detalhes: erro.detalhes },
    });
    return;
  }

  // Aqui só cai bug. Log completo no servidor, mensagem genérica pro cliente:
  // stack trace em resposta HTTP é entregar o mapa da casa.
  console.error('Erro não tratado:', erro);
  res.status(500).json({
    erro: { codigo: 'erro_interno', mensagem: 'Algo quebrou aqui dentro. Tente de novo.' },
  });
};
