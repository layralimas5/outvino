import { reservaEstoque, type Pedido, type StatusDePedido } from '../../domain/pedidos/Pedido.js';
import { precisaRepor } from '../../domain/produtos/Produto.js';
import type { Deps } from '../../infra/container.js';
import { somar } from '../../shared/dinheiro.js';
import { hoje } from '../../shared/id.js';

export interface ResumoDoPainel {
  hoje: { pedidos: number; faturamentoCentavos: number };
  mes: { pedidos: number; faturamentoCentavos: number; ticketMedioCentavos: number };
  aguardando: { rascunhos: number; separando: number; enviados: number };
  /** Fila de moderação. Alimenta o sino do painel junto com o resto. */
  avaliacoes: { pendentes: number };
  porStatus: Record<StatusDePedido, number>;
  /** Últimos 14 dias, do mais antigo pro mais novo — pronto pro gráfico. */
  faturamentoDiario: Array<{ dia: string; centavos: number }>;
  maisVendidos: Array<{ produtoId: string; nome: string; unidades: number; centavos: number }>;
  estoque: {
    produtos: number;
    unidades: number;
    /** Valor do estoque a preço de custo. Produto sem custo entra como zero. */
    valorEmCustoCentavos: number;
    aRepor: Array<{ id: string; nome: string; estoque: number; estoqueMinimo: number }>;
  };
}

const DIAS_NO_GRAFICO = 14;
const TOP_PRODUTOS = 5;

/** Pedido cancelado nunca conta como venda; rascunho ainda não é venda. */
function ehVenda(pedido: Pedido): boolean {
  return reservaEstoque(pedido.status);
}

function dia(iso: string): string {
  return iso.slice(0, 10);
}

export async function resumoDoPainel(deps: Deps): Promise<ResumoDoPainel> {
  const [pedidos, produtos, avaliacoes] = await Promise.all([
    deps.pedidos.listar(),
    deps.produtos.listar(),
    deps.avaliacoes.listar(),
  ]);

  const dataDeHoje = hoje();
  const mesAtual = dataDeHoje.slice(0, 7);
  const vendas = pedidos.filter(ehVenda);

  const doDia = vendas.filter((pedido) => dia(pedido.criadoEm) === dataDeHoje);
  const doMes = vendas.filter((pedido) => pedido.criadoEm.slice(0, 7) === mesAtual);
  const faturamentoDoMes = somar(doMes.map((pedido) => pedido.totalCentavos));

  const porStatus = Object.fromEntries(
    (
      ['rascunho', 'confirmado', 'separando', 'enviado', 'entregue', 'cancelado'] as const
    ).map((status) => [status, pedidos.filter((pedido) => pedido.status === status).length]),
  ) as Record<StatusDePedido, number>;

  return {
    hoje: {
      pedidos: doDia.length,
      faturamentoCentavos: somar(doDia.map((pedido) => pedido.totalCentavos)),
    },
    mes: {
      pedidos: doMes.length,
      faturamentoCentavos: faturamentoDoMes,
      ticketMedioCentavos: doMes.length ? Math.round(faturamentoDoMes / doMes.length) : 0,
    },
    aguardando: {
      rascunhos: porStatus.rascunho,
      separando: porStatus.separando,
      enviados: porStatus.enviado,
    },
    avaliacoes: {
      pendentes: avaliacoes.filter((avaliacao) => avaliacao.status === 'pendente').length,
    },
    porStatus,
    faturamentoDiario: serieDiaria(vendas, dataDeHoje),
    maisVendidos: maisVendidos(vendas),
    estoque: {
      produtos: produtos.length,
      unidades: produtos.reduce((total, produto) => total + produto.estoque, 0),
      valorEmCustoCentavos: produtos.reduce(
        (total, produto) => total + (produto.custoCentavos ?? 0) * produto.estoque,
        0,
      ),
      aRepor: produtos
        .filter(precisaRepor)
        .sort((a, b) => a.estoque - b.estoque)
        .map(({ id, nome, estoque, estoqueMinimo }) => ({ id, nome, estoque, estoqueMinimo })),
    },
  };
}

/** Série contínua: dia sem venda entra como zero, senão o gráfico mente. */
function serieDiaria(vendas: Pedido[], ate: string): Array<{ dia: string; centavos: number }> {
  const porDia = new Map<string, number>();
  for (const pedido of vendas) {
    const chave = dia(pedido.criadoEm);
    porDia.set(chave, (porDia.get(chave) ?? 0) + pedido.totalCentavos);
  }

  const fim = new Date(`${ate}T00:00:00Z`);

  return Array.from({ length: DIAS_NO_GRAFICO }, (_, indice) => {
    const data = new Date(fim);
    data.setUTCDate(fim.getUTCDate() - (DIAS_NO_GRAFICO - 1 - indice));
    const chave = data.toISOString().slice(0, 10);
    return { dia: chave, centavos: porDia.get(chave) ?? 0 };
  });
}

function maisVendidos(vendas: Pedido[]): ResumoDoPainel['maisVendidos'] {
  const acumulado = new Map<string, { nome: string; unidades: number; centavos: number }>();

  for (const pedido of vendas) {
    for (const item of pedido.itens) {
      const atual = acumulado.get(item.produtoId) ?? { nome: item.nome, unidades: 0, centavos: 0 };
      atual.unidades += item.quantidade;
      atual.centavos += item.subtotalCentavos;
      acumulado.set(item.produtoId, atual);
    }
  }

  return [...acumulado.entries()]
    .map(([produtoId, dados]) => ({ produtoId, ...dados }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, TOP_PRODUTOS);
}
