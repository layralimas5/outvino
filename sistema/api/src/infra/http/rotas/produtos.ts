import { Router } from 'express';
import { registrarMovimento } from '../../../application/estoque/casosDeUso.js';
import {
  atualizarProduto,
  buscarProduto,
  criarProduto,
  listarProdutos,
  removerProduto,
} from '../../../application/produtos/casosDeUso.js';
import { registrarMovimentoSchema } from '../../../domain/estoque/MovimentoEstoque.js';
import {
  atualizarProdutoSchema,
  criarProdutoSchema,
  type Tipo,
} from '../../../domain/produtos/Produto.js';
import type { Deps } from '../../container.js';
import { apresentarProduto } from '../apresentadores.js';
import { autorDaRequisicao, booleano, parametro, texto } from '../contexto.js';

export function rotasDeProdutos(deps: Deps): Router {
  const rotas = Router();

  rotas.get('/', async (req, res) => {
    const produtos = await listarProdutos(deps, {
      busca: texto(req.query.busca),
      tipo: texto(req.query.tipo) as Tipo | undefined,
      pais: texto(req.query.pais),
      publicadoNoSite: booleano(req.query.publicadoNoSite),
      destaque: booleano(req.query.destaque),
      abaixoDoMinimo: booleano(req.query.abaixoDoMinimo),
      semEstoque: booleano(req.query.semEstoque),
    });

    res.json(produtos.map(apresentarProduto));
  });

  rotas.get('/:id', async (req, res) => {
    const produto = await buscarProduto(deps, parametro(req, 'id'));
    res.json(apresentarProduto(produto));
  });

  rotas.post('/', async (req, res) => {
    const entrada = criarProdutoSchema.parse(req.body);
    const produto = await criarProduto(deps, entrada, autorDaRequisicao(req));
    res.status(201).json(apresentarProduto(produto));
  });

  rotas.patch('/:id', async (req, res) => {
    const entrada = atualizarProdutoSchema.parse(req.body);
    const produto = await atualizarProduto(deps, parametro(req, 'id'), entrada);
    res.json(apresentarProduto(produto));
  });

  rotas.delete('/:id', async (req, res) => {
    await removerProduto(deps, parametro(req, 'id'));
    res.status(204).end();
  });

  /** Entrada, saída, perda e ajuste — o único caminho pra mudar estoque. */
  rotas.post('/:id/estoque', async (req, res) => {
    const entrada = registrarMovimentoSchema.parse(req.body);
    const { movimento, produto } = await registrarMovimento(
      deps,
      parametro(req, 'id'),
      entrada,
      autorDaRequisicao(req),
    );
    res.status(201).json({ movimento, produto: apresentarProduto(produto) });
  });

  return rotas;
}
