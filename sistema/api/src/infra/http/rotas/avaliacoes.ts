import { Router } from 'express';
import {
  listarAvaliacoes,
  moderarAvaliacao,
  removerAvaliacao,
} from '../../../application/avaliacoes/casosDeUso.js';
import {
  moderarAvaliacaoSchema,
  statusDeAvaliacao,
  type StatusDeAvaliacao,
} from '../../../domain/avaliacoes/Avaliacao.js';
import type { Deps } from '../../container.js';
import { autorDaRequisicao, parametro, texto } from '../contexto.js';

function statusDaQuery(valor: unknown): StatusDeAvaliacao | undefined {
  const bruto = texto(valor);
  return statusDeAvaliacao.find((status) => status === bruto);
}

export function rotasDeAvaliacoes(deps: Deps): Router {
  const rotas = Router();

  rotas.get('/', async (req, res) => {
    const avaliacoes = await listarAvaliacoes(deps, {
      produtoId: texto(req.query.produtoId),
      status: statusDaQuery(req.query.status),
    });
    res.json(avaliacoes);
  });

  /** Publicar, recusar e responder — tudo é a mesma edição. */
  rotas.patch('/:id', async (req, res) => {
    const entrada = moderarAvaliacaoSchema.parse(req.body);
    const avaliacao = await moderarAvaliacao(
      deps,
      parametro(req, 'id'),
      entrada,
      autorDaRequisicao(req),
    );
    res.json(avaliacao);
  });

  rotas.delete('/:id', async (req, res) => {
    await removerAvaliacao(deps, parametro(req, 'id'));
    res.status(204).end();
  });

  return rotas;
}
