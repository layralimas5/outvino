import { Router } from 'express';
import {
  atualizarBanner,
  atualizarSecao,
  criarBanner,
  criarSecao,
  listarBanners,
  listarSecoes,
  removerBanner,
  removerSecao,
} from '../../../application/vitrine/casosDeUso.js';
import {
  atualizarBannerSchema,
  atualizarSecaoSchema,
  criarBannerSchema,
  criarSecaoSchema,
} from '../../../domain/vitrine/Vitrine.js';
import type { Deps } from '../../container.js';
import { parametro } from '../contexto.js';

/** O que a loja edita na home sem encostar em código. */
export function rotasDeVitrine(deps: Deps): Router {
  const rotas = Router();

  rotas.get('/banners', async (_req, res) => {
    res.json(await listarBanners(deps));
  });

  rotas.post('/banners', async (req, res) => {
    const entrada = criarBannerSchema.parse(req.body);
    res.status(201).json(await criarBanner(deps, entrada));
  });

  rotas.patch('/banners/:id', async (req, res) => {
    const entrada = atualizarBannerSchema.parse(req.body);
    res.json(await atualizarBanner(deps, parametro(req, 'id'), entrada));
  });

  rotas.delete('/banners/:id', async (req, res) => {
    await removerBanner(deps, parametro(req, 'id'));
    res.status(204).end();
  });

  rotas.get('/secoes', async (_req, res) => {
    res.json(await listarSecoes(deps));
  });

  rotas.post('/secoes', async (req, res) => {
    const entrada = criarSecaoSchema.parse(req.body);
    res.status(201).json(await criarSecao(deps, entrada));
  });

  rotas.patch('/secoes/:id', async (req, res) => {
    const entrada = atualizarSecaoSchema.parse(req.body);
    res.json(await atualizarSecao(deps, parametro(req, 'id'), entrada));
  });

  rotas.delete('/secoes/:id', async (req, res) => {
    await removerSecao(deps, parametro(req, 'id'));
    res.status(204).end();
  });

  return rotas;
}
