import { reservaEstoque, type Pedido, type StatusDePedido } from '../../domain/pedidos/Pedido.js';
import type { Produto } from '../../domain/produtos/Produto.js';
import type { Deps } from '../../infra/container.js';
import { somar, type Centavos } from '../../shared/dinheiro.js';
import { hoje } from '../../shared/id.js';

/**
 * Fechamento financeiro do período.
 *
 * Duas honestidades que valem mais que o número bonito:
 *
 * 1. **Custo é estimado.** O pedido guarda o preço de venda praticado na hora
 *    (snapshot), mas não o custo — esse vive no produto e muda quando a loja
 *    recompra. Então a margem aqui é calculada com o custo **de hoje**, e a
 *    resposta diz quantos itens entraram sem custo cadastrado para a tela poder
 *    avisar em vez de fingir precisão.
 * 2. **Só conta o que virou venda.** Rascunho é pedido que ninguém confirmou e
 *    cancelado não é receita. Os dois ficam de fora do faturamento; o rascunho
 *    aparece à parte, como pipeline.
 */
export interface Financeiro {
  periodo: { desde: string; ate: string; dias: number };
  pedidos: number;
  faturamentoCentavos: Centavos;
  ticketMedioCentavos: Centavos;
  subtotalCentavos: Centavos;
  descontosCentavos: Centavos;
  freteCentavos: Centavos;
  /** Custo das mercadorias vendidas, ao custo cadastrado hoje. */
  custoCentavos: Centavos;
  margemCentavos: Centavos;
  /** Margem sobre o faturamento, em pontos percentuais. */
  margemPercentual: number;
  /** Unidades vendidas cujo produto não tem custo cadastrado. Distorce a margem. */
  unidadesSemCusto: number;
  porStatus: Record<StatusDePedido, number>;
  porDia: Array<{ dia: string; centavos: Centavos; pedidos: number }>;
  porProduto: Array<{
    produtoId: string;
    nome: string;
    unidades: number;
    receitaCentavos: Centavos;
    custoCentavos: Centavos;
    margemCentavos: Centavos;
    /** Falso quando algum item entrou sem custo: a margem da linha é otimista. */
    custoCompleto: boolean;
  }>;
  /** Rascunhos do período: dinheiro que só entra se a loja confirmar. */
  pipeline: { pedidos: number; centavos: Centavos };
}

export interface FiltroFinanceiro {
  /** AAAA-MM-DD, inclusivo. Sem ele, os últimos 30 dias. */
  desde?: string;
  /** AAAA-MM-DD, inclusivo. Sem ele, hoje. */
  ate?: string;
}

const DIAS_PADRAO = 30;
const TOP_PRODUTOS = 12;

function dia(iso: string): string {
  return iso.slice(0, 10);
}

function somarDias(data: string, dias: number): string {
  const referencia = new Date(`${data}T00:00:00Z`);
  referencia.setUTCDate(referencia.getUTCDate() + dias);
  return referencia.toISOString().slice(0, 10);
}

function diferencaEmDias(desde: string, ate: string): number {
  const inicio = Date.parse(`${desde}T00:00:00Z`);
  const fim = Date.parse(`${ate}T00:00:00Z`);
  return Math.max(1, Math.round((fim - inicio) / 86_400_000) + 1);
}

export async function financeiro(deps: Deps, filtro: FiltroFinanceiro = {}): Promise<Financeiro> {
  const [pedidos, produtos] = await Promise.all([deps.pedidos.listar(), deps.produtos.listar()]);

  const ate = filtro.ate ?? hoje();
  const desde = filtro.desde ?? somarDias(ate, -(DIAS_PADRAO - 1));

  const noPeriodo = pedidos.filter((pedido) => {
    const quando = dia(pedido.criadoEm);
    return quando >= desde && quando <= ate;
  });

  const vendas = noPeriodo.filter((pedido) => reservaEstoque(pedido.status));
  const rascunhos = noPeriodo.filter((pedido) => pedido.status === 'rascunho');

  const faturamento = somar(vendas.map((pedido) => pedido.totalCentavos));
  const custos = custoDasVendas(vendas, produtos);

  return {
    periodo: { desde, ate, dias: diferencaEmDias(desde, ate) },
    pedidos: vendas.length,
    faturamentoCentavos: faturamento,
    ticketMedioCentavos: vendas.length ? Math.round(faturamento / vendas.length) : 0,
    subtotalCentavos: somar(vendas.map((pedido) => pedido.subtotalCentavos)),
    descontosCentavos: somar(vendas.map((pedido) => pedido.descontoCentavos)),
    freteCentavos: somar(vendas.map((pedido) => pedido.freteCentavos)),
    custoCentavos: custos.total,
    margemCentavos: faturamento - custos.total,
    margemPercentual: faturamento
      ? Math.round(((faturamento - custos.total) / faturamento) * 1000) / 10
      : 0,
    unidadesSemCusto: custos.unidadesSemCusto,
    porStatus: contarStatus(noPeriodo),
    porDia: serieDiaria(vendas, desde, ate),
    porProduto: custos.porProduto,
    pipeline: {
      pedidos: rascunhos.length,
      centavos: somar(rascunhos.map((pedido) => pedido.totalCentavos)),
    },
  };
}

interface CustoApurado {
  total: Centavos;
  unidadesSemCusto: number;
  porProduto: Financeiro['porProduto'];
}

function custoDasVendas(vendas: Pedido[], produtos: Produto[]): CustoApurado {
  const custoPorProduto = new Map(produtos.map((produto) => [produto.id, produto.custoCentavos]));

  const acumulado = new Map<
    string,
    { nome: string; unidades: number; receita: Centavos; custo: Centavos; custoCompleto: boolean }
  >();

  let unidadesSemCusto = 0;

  for (const pedido of vendas) {
    for (const item of pedido.itens) {
      const custoUnitario = custoPorProduto.get(item.produtoId);
      const temCusto = custoUnitario !== undefined;
      if (!temCusto) unidadesSemCusto += item.quantidade;

      const linha = acumulado.get(item.produtoId) ?? {
        nome: item.nome,
        unidades: 0,
        receita: 0,
        custo: 0,
        custoCompleto: true,
      };

      linha.unidades += item.quantidade;
      linha.receita += item.subtotalCentavos;
      linha.custo += (custoUnitario ?? 0) * item.quantidade;
      linha.custoCompleto = linha.custoCompleto && temCusto;

      acumulado.set(item.produtoId, linha);
    }
  }

  const porProduto = [...acumulado.entries()]
    .map(([produtoId, linha]) => ({
      produtoId,
      nome: linha.nome,
      unidades: linha.unidades,
      receitaCentavos: linha.receita,
      custoCentavos: linha.custo,
      margemCentavos: linha.receita - linha.custo,
      custoCompleto: linha.custoCompleto,
    }))
    .sort((a, b) => b.receitaCentavos - a.receitaCentavos)
    .slice(0, TOP_PRODUTOS);

  return {
    total: [...acumulado.values()].reduce((total, linha) => total + linha.custo, 0),
    unidadesSemCusto,
    porProduto,
  };
}

function contarStatus(pedidos: Pedido[]): Record<StatusDePedido, number> {
  return Object.fromEntries(
    (['rascunho', 'confirmado', 'separando', 'enviado', 'entregue', 'cancelado'] as const).map(
      (status) => [status, pedidos.filter((pedido) => pedido.status === status).length],
    ),
  ) as Record<StatusDePedido, number>;
}

/** Série contínua: dia sem venda entra como zero, senão o gráfico mente. */
function serieDiaria(vendas: Pedido[], desde: string, ate: string): Financeiro['porDia'] {
  const porDia = new Map<string, { centavos: Centavos; pedidos: number }>();

  for (const pedido of vendas) {
    const chave = dia(pedido.criadoEm);
    const atual = porDia.get(chave) ?? { centavos: 0, pedidos: 0 };
    atual.centavos += pedido.totalCentavos;
    atual.pedidos += 1;
    porDia.set(chave, atual);
  }

  const dias = diferencaEmDias(desde, ate);

  return Array.from({ length: dias }, (_, indice) => {
    const chave = somarDias(desde, indice);
    const registro = porDia.get(chave) ?? { centavos: 0, pedidos: 0 };
    return { dia: chave, ...registro };
  });
}
