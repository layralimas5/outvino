import { Router } from 'express';
import { semearExemplos } from '../../../application/exemplos/casosDeUso.js';
import type { Deps } from '../../container.js';
import { autorDaRequisicao, booleano } from '../contexto.js';

/**
 * Popular o sistema com dados de exemplo, pelo painel.
 *
 * Em desenvolvimento isso é `npm run seed`. Em produção não existe disco pra
 * rodar script contra: os dados vivem no Netlify Blobs, e um projeto novo sobe
 * vazio — sem catálogo, o painel abre com todas as telas zeradas. Daí a rota.
 *
 * Não sobrescreve nada por acidente: havendo produto cadastrado, responde 409
 * e só insiste com `?forcar=true`.
 */
export function rotasDeExemplos(deps: Deps): Router {
  const rotas = Router();

  rotas.post('/', async (req, res) => {
    const resumo = await semearExemplos(
      deps,
      { forcar: booleano(req.query.forcar) ?? false },
      autorDaRequisicao(req),
    );
    res.status(201).json(resumo);
  });

  return rotas;
}
