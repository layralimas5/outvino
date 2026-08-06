import {
  efeitoNoSaldo,
  type FiltroMovimentos,
  type MovimentoEstoque,
  type RegistrarMovimentoInput,
  type TipoDeMovimento,
} from '../../domain/estoque/MovimentoEstoque.js';
import { precisaRepor, type Produto } from '../../domain/produtos/Produto.js';
import type { Deps } from '../../infra/container.js';
import { reaisParaCentavos } from '../../shared/dinheiro.js';
import { RegraDeNegocio } from '../../shared/erros.js';
import { agora, novoId } from '../../shared/id.js';

export interface MovimentoInterno {
  produtoId: string;
  tipo: TipoDeMovimento;
  quantidade: number;
  motivo?: string;
  pedidoId?: string;
  custoUnitarioCentavos?: number;
  usuarioId: string;
}

/**
 * Único caminho pelo qual o estoque muda.
 *
 * A checagem de saldo acontece **dentro** da transação do produto: duas vendas
 * simultâneas da última garrafa não passam as duas, porque a segunda relê o
 * saldo já baixado e falha aqui.
 */
export async function aplicarMovimento(
  deps: Deps,
  entrada: MovimentoInterno,
): Promise<{ movimento: MovimentoEstoque; produto: Produto }> {
  const delta = efeitoNoSaldo(entrada.tipo, entrada.quantidade);

  const produto = await deps.produtos.alterar(entrada.produtoId, (atual) => {
    const novoSaldo = atual.estoque + delta;
    if (novoSaldo < 0) {
      throw new RegraDeNegocio(
        `Estoque insuficiente de "${atual.nome}": tem ${atual.estoque}, precisaria de ${Math.abs(delta)}.`,
      );
    }
    atual.estoque = novoSaldo;
    atual.atualizadoEm = agora();
  });

  const movimento: MovimentoEstoque = {
    id: novoId(),
    produtoId: produto.id,
    produtoNome: produto.nome,
    tipo: entrada.tipo,
    quantidade: entrada.quantidade,
    saldoDepois: produto.estoque,
    motivo: entrada.motivo,
    pedidoId: entrada.pedidoId,
    custoUnitarioCentavos: entrada.custoUnitarioCentavos,
    usuarioId: entrada.usuarioId,
    criadoEm: agora(),
  };

  await deps.movimentos.salvar(movimento);

  return { movimento, produto };
}

/** Movimento disparado à mão no painel (recebimento, perda, contagem). */
export async function registrarMovimento(
  deps: Deps,
  produtoId: string,
  entrada: RegistrarMovimentoInput,
  usuarioId: string,
): Promise<{ movimento: MovimentoEstoque; produto: Produto }> {
  return aplicarMovimento(deps, {
    produtoId,
    tipo: entrada.tipo,
    quantidade: entrada.quantidade,
    motivo: entrada.motivo,
    custoUnitarioCentavos:
      entrada.custoUnitario === undefined ? undefined : reaisParaCentavos(entrada.custoUnitario),
    usuarioId,
  });
}

export function listarMovimentos(
  deps: Deps,
  filtro: FiltroMovimentos,
): Promise<MovimentoEstoque[]> {
  return deps.movimentos.listar(filtro);
}

/** O que precisa ser reposto, do mais crítico (sem estoque) pro menos. */
export async function alertasDeEstoque(deps: Deps): Promise<Produto[]> {
  const produtos = await deps.produtos.listar();
  return produtos
    .filter(precisaRepor)
    .sort((a, b) => a.estoque - b.estoque || a.nome.localeCompare(b.nome, 'pt-BR'));
}
