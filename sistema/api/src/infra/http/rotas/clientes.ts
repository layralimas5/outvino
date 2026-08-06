import { Router } from 'express';
import { listarClientes, resumirClientes } from '../../../application/clientes/casosDeUso.js';
import type { Deps } from '../../container.js';
import { booleano, texto } from '../contexto.js';

export function rotasDeClientes(deps: Deps): Router {
  const rotas = Router();

  /**
   * A ficha de cada pessoa que já comprou, com o resumo da carteira junto.
   *
   * O resumo vem sempre da lista **inteira**, não da filtrada: "37 clientes,
   * 9 recorrentes" é o retrato da carteira, e mudaria de significado se
   * encolhesse a cada busca digitada.
   */
  rotas.get('/', async (req, res) => {
    const todos = await listarClientes(deps);

    const filtrados = await listarClientes(deps, {
      busca: texto(req.query.busca),
      somenteRecorrentes: booleano(req.query.recorrentes),
    });

    res.json({ resumo: resumirClientes(todos), clientes: filtrados });
  });

  return rotas;
}
