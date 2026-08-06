import { Router } from 'express';
import {
  buscarPedido,
  criarPedido,
  listarPedidos,
  mudarStatus,
} from '../../../application/pedidos/casosDeUso.js';
import {
  criarPedidoSchema,
  mudarStatusSchema,
  type StatusDePedido,
} from '../../../domain/pedidos/Pedido.js';
import type { Deps } from '../../container.js';
import { apresentarPedido } from '../apresentadores.js';
import { autorDaRequisicao, parametro, texto } from '../contexto.js';

export function rotasDePedidos(deps: Deps): Router {
  const rotas = Router();

  rotas.get('/', async (req, res) => {
    const origem = texto(req.query.origem);

    const pedidos = await listarPedidos(deps, {
      status: texto(req.query.status) as StatusDePedido | undefined,
      origem: origem === 'site' || origem === 'manual' ? origem : undefined,
      busca: texto(req.query.busca),
      desde: texto(req.query.desde),
      ate: texto(req.query.ate),
    });

    res.json(pedidos.map(apresentarPedido));
  });

  rotas.get('/:id', async (req, res) => {
    const pedido = await buscarPedido(deps, parametro(req, 'id'));
    res.json(apresentarPedido(pedido));
  });

  /** Pedido de balcão. O do site entra por `/api/publico/pedidos`. */
  rotas.post('/', async (req, res) => {
    const entrada = criarPedidoSchema.parse(req.body);
    const pedido = await criarPedido(deps, entrada, autorDaRequisicao(req), 'manual');
    res.status(201).json(apresentarPedido(pedido));
  });

  /** Confirmar, separar, enviar, entregar, cancelar. */
  rotas.post('/:id/status', async (req, res) => {
    const entrada = mudarStatusSchema.parse(req.body);
    const pedido = await mudarStatus(deps, parametro(req, 'id'), entrada, autorDaRequisicao(req));
    res.json(apresentarPedido(pedido));
  });

  return rotas;
}
