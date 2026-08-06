import {
  podeIrPara,
  reservaEstoque,
  type CriarPedidoInput,
  type FiltroPedidos,
  type ItemDePedido,
  type MudarStatusInput,
  type Pedido,
  type StatusDePedido,
} from '../../domain/pedidos/Pedido.js';
import type { Deps } from '../../infra/container.js';
import { reaisParaCentavos, somar } from '../../shared/dinheiro.js';
import { DadoInvalido, RegraDeNegocio } from '../../shared/erros.js';
import { agora, novoId } from '../../shared/id.js';
import { normalizarTelefone } from '../../shared/texto.js';
import { aplicarCupom, consumirCupom, devolverUsoDoCupom } from '../cupons/casosDeUso.js';
import { aplicarMovimento } from '../estoque/casosDeUso.js';

export function listarPedidos(deps: Deps, filtro: FiltroPedidos): Promise<Pedido[]> {
  return deps.pedidos.listar(filtro);
}

export function buscarPedido(deps: Deps, id: string): Promise<Pedido> {
  return deps.pedidos.exigirPorId(id);
}

export async function criarPedido(
  deps: Deps,
  entrada: CriarPedidoInput,
  autor: string,
  origem: Pedido['origem'] = 'manual',
): Promise<Pedido> {
  const itens = await montarItens(deps, entrada.itens);
  const subtotalCentavos = somar(itens.map((item) => item.subtotalCentavos));

  const aplicado = entrada.cupomCodigo
    ? await aplicarCupom(deps, entrada.cupomCodigo, subtotalCentavos)
    : null;

  const freteCentavos = reaisParaCentavos(entrada.frete);
  const descontoCentavos = aplicado?.descontoCentavos ?? 0;
  const momento = agora();
  const status: StatusDePedido = entrada.confirmar ? 'confirmado' : 'rascunho';

  const pedido: Pedido = {
    id: novoId(),
    numero: await deps.contadores.proximo('pedidos'),
    cliente: {
      nome: entrada.cliente.nome.trim(),
      telefone: normalizarTelefone(entrada.cliente.telefone),
      email: entrada.cliente.email,
    },
    itens,
    subtotalCentavos,
    cupomCodigo: aplicado?.cupom.id,
    descontoCentavos,
    freteCentavos,
    totalCentavos: subtotalCentavos - descontoCentavos + freteCentavos,
    tipoEntrega: entrada.tipoEntrega,
    endereco: entrada.endereco,
    observacao: entrada.observacao,
    status,
    origem,
    historico: [{ em: momento, status, por: autor }],
    criadoEm: momento,
    atualizadoEm: momento,
  };

  /**
   * Estoque sai antes de gravar: se faltar garrafa, o pedido não chega a
   * existir, em vez de existir confirmado sem lastro.
   */
  if (reservaEstoque(status)) {
    await baixarEstoque(deps, pedido, autor);
    if (pedido.cupomCodigo) await consumirCupom(deps, pedido.cupomCodigo);
  }

  return deps.pedidos.salvar(pedido);
}

export async function mudarStatus(
  deps: Deps,
  id: string,
  entrada: MudarStatusInput,
  autor: string,
): Promise<Pedido> {
  const pedido = await deps.pedidos.exigirPorId(id);
  const destino = entrada.status;

  if (pedido.status === destino) return pedido;

  if (!podeIrPara(pedido.status, destino)) {
    throw new RegraDeNegocio(`Um pedido ${pedido.status} não pode virar ${destino}.`);
  }

  const reservavaAntes = reservaEstoque(pedido.status);
  const reservaDepois = reservaEstoque(destino);

  // Confirmação de rascunho: as unidades saem agora.
  if (!reservavaAntes && reservaDepois) {
    await baixarEstoque(deps, pedido, autor);
    if (pedido.cupomCodigo) await consumirCupom(deps, pedido.cupomCodigo);
  }

  // Cancelamento do que já tinha baixado: devolve tudo.
  if (reservavaAntes && !reservaDepois) {
    await devolverEstoque(deps, pedido, autor);
    if (pedido.cupomCodigo) await devolverUsoDoCupom(deps, pedido.cupomCodigo);
  }

  return deps.pedidos.alterar(id, (atual) => {
    atual.status = destino;
    atual.atualizadoEm = agora();
    atual.historico.push({
      em: agora(),
      status: destino,
      por: autor,
      observacao: entrada.observacao,
    });
  });
}

/** Snapshot de nome e preço no momento da venda. */
async function montarItens(
  deps: Deps,
  pedidos: readonly { produtoId: string; quantidade: number }[],
): Promise<ItemDePedido[]> {
  const agrupados = new Map<string, number>();
  for (const item of pedidos) {
    agrupados.set(item.produtoId, (agrupados.get(item.produtoId) ?? 0) + item.quantidade);
  }

  const itens: ItemDePedido[] = [];

  for (const [produtoId, quantidade] of agrupados) {
    const produto = await deps.produtos.exigirPorId(produtoId);

    if (produto.estoque < quantidade) {
      throw new RegraDeNegocio(
        `Só temos ${produto.estoque} de "${produto.nome}" e o pedido tem ${quantidade}.`,
      );
    }

    itens.push({
      produtoId: produto.id,
      nome: produto.nome,
      precoUnitarioCentavos: produto.precoCentavos,
      quantidade,
      subtotalCentavos: produto.precoCentavos * quantidade,
    });
  }

  if (itens.length === 0) throw new DadoInvalido('O pedido precisa de pelo menos um item.');

  return itens;
}

async function baixarEstoque(deps: Deps, pedido: Pedido, autor: string): Promise<void> {
  for (const item of pedido.itens) {
    await aplicarMovimento(deps, {
      produtoId: item.produtoId,
      tipo: 'saida',
      quantidade: item.quantidade,
      motivo: `Pedido #${pedido.numero}`,
      pedidoId: pedido.id,
      usuarioId: autor,
    });
  }
}

async function devolverEstoque(deps: Deps, pedido: Pedido, autor: string): Promise<void> {
  for (const item of pedido.itens) {
    await aplicarMovimento(deps, {
      produtoId: item.produtoId,
      tipo: 'entrada',
      quantidade: item.quantidade,
      motivo: `Cancelamento do pedido #${pedido.numero}`,
      pedidoId: pedido.id,
      usuarioId: autor,
    });
  }
}
