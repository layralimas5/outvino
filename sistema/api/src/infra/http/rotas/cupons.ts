import { Router } from 'express';
import {
  atualizarCupom,
  criarCupom,
  listarCupons,
  removerCupom,
} from '../../../application/cupons/casosDeUso.js';
import { atualizarCupomSchema, criarCupomSchema } from '../../../domain/cupons/Cupom.js';
import type { Deps } from '../../container.js';
import { apresentarCupom } from '../apresentadores.js';
import { parametro } from '../contexto.js';

export function rotasDeCupons(deps: Deps): Router {
  const rotas = Router();

  rotas.get('/', async (_req, res) => {
    const cupons = await listarCupons(deps);
    res.json(cupons.map(apresentarCupom));
  });

  rotas.post('/', async (req, res) => {
    const entrada = criarCupomSchema.parse(req.body);
    const cupom = await criarCupom(deps, entrada);
    res.status(201).json(apresentarCupom(cupom));
  });

  rotas.patch('/:codigo', async (req, res) => {
    const entrada = atualizarCupomSchema.parse(req.body);
    const cupom = await atualizarCupom(deps, parametro(req, 'codigo'), entrada);
    res.json(apresentarCupom(cupom));
  });

  rotas.delete('/:codigo', async (req, res) => {
    await removerCupom(deps, parametro(req, 'codigo'));
    res.status(204).end();
  });

  return rotas;
}
