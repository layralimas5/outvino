import { Router } from 'express';
import {
  atualizarCliente,
  criarCliente,
  definirEtapaDeCliente,
  limparEtapaDeCliente,
  listarClientes,
  removerCliente,
  resumirClientes,
} from '../../../application/clientes/casosDeUso.js';
import {
  atualizarClienteSchema,
  criarClienteSchema,
} from '../../../domain/clientes/Cliente.js';
import { definirEtapaSchema } from '../../../domain/clientes/EtapaDeCliente.js';
import type { Deps } from '../../container.js';
import { autorDaRequisicao, booleano, parametro, texto } from '../contexto.js';

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

  /** Cadastro manual da ficha completa. O histórico continua vindo dos pedidos. */
  rotas.post('/', async (req, res) => {
    const entrada = criarClienteSchema.parse(req.body);
    const cliente = await criarCliente(deps, entrada, autorDaRequisicao(req));
    res.status(201).json(cliente);
  });

  rotas.patch('/:telefone', async (req, res) => {
    const entrada = atualizarClienteSchema.parse(req.body);
    const cliente = await atualizarCliente(deps, parametro(req, 'telefone'), entrada);
    res.json(cliente);
  });

  /** Apaga o cadastro, não a pessoa: a ficha dos pedidos continua de pé. */
  rotas.delete('/:telefone', async (req, res) => {
    await removerCliente(deps, parametro(req, 'telefone'));
    res.status(204).end();
  });

  /** O card mudou de coluna no quadro. Responde a ficha já com a etapa nova. */
  rotas.patch('/:telefone/etapa', async (req, res) => {
    const { etapa } = definirEtapaSchema.parse(req.body);
    const cliente = await definirEtapaDeCliente(
      deps,
      parametro(req, 'telefone'),
      etapa,
      autorDaRequisicao(req),
    );
    res.json(cliente);
  });

  /** Desfaz o movimento manual: a coluna volta a sair do histórico de pedidos. */
  rotas.delete('/:telefone/etapa', async (req, res) => {
    const cliente = await limparEtapaDeCliente(deps, parametro(req, 'telefone'));
    res.json(cliente);
  });

  return rotas;
}
