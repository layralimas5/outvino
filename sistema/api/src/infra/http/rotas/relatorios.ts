import { Router } from 'express';
import { resumoDoPainel } from '../../../application/relatorios/casosDeUso.js';
import { financeiro } from '../../../application/relatorios/financeiro.js';
import type { Deps } from '../../container.js';
import { texto } from '../contexto.js';

/** AAAA-MM-DD ou nada. Data torta na query vira "sem filtro", não erro 500. */
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function data(valor: unknown): string | undefined {
  const bruto = texto(valor);
  return bruto && DATA.test(bruto) ? bruto : undefined;
}

export function rotasDeRelatorios(deps: Deps): Router {
  const rotas = Router();

  /** Tudo que a home do painel mostra, numa chamada só. */
  rotas.get('/resumo', async (_req, res) => {
    res.json(await resumoDoPainel(deps));
  });

  /** Fechamento do período: faturamento, custo, margem e ranking de produto. */
  rotas.get('/financeiro', async (req, res) => {
    res.json(
      await financeiro(deps, { desde: data(req.query.desde), ate: data(req.query.ate) }),
    );
  });

  return rotas;
}
