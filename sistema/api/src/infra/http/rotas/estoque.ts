import { Router } from 'express';
import { alertasDeEstoque, listarMovimentos } from '../../../application/estoque/casosDeUso.js';
import type { TipoDeMovimento } from '../../../domain/estoque/MovimentoEstoque.js';
import type { Deps } from '../../container.js';
import { apresentarProduto } from '../apresentadores.js';
import { texto } from '../contexto.js';

export function rotasDeEstoque(deps: Deps): Router {
  const rotas = Router();

  rotas.get('/movimentos', async (req, res) => {
    const movimentos = await listarMovimentos(deps, {
      produtoId: texto(req.query.produtoId),
      tipo: texto(req.query.tipo) as TipoDeMovimento | undefined,
      desde: texto(req.query.desde),
    });

    res.json(movimentos);
  });

  /** O que está no mínimo ou abaixo. É a lista de compras da loja. */
  rotas.get('/alertas', async (_req, res) => {
    const produtos = await alertasDeEstoque(deps);
    res.json(produtos.map(apresentarProduto));
  });

  return rotas;
}
