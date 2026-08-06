import type { Cupom } from '../../domain/cupons/Cupom.js';
import type { Pedido } from '../../domain/pedidos/Pedido.js';
import { precisaRepor, type Produto } from '../../domain/produtos/Produto.js';
import { centavosParaReais, margemPercentual } from '../../shared/dinheiro.js';

/**
 * A borda HTTP fala em reais; o miolo fala em centavos. A conversão mora aqui,
 * num lugar só, pra nenhuma tela precisar dividir por 100 na mão.
 */
export function apresentarProduto(produto: Produto) {
  const { precoCentavos, precoDeCentavos, custoCentavos, ...resto } = produto;

  return {
    ...resto,
    preco: centavosParaReais(precoCentavos),
    precoDe: precoDeCentavos === undefined ? undefined : centavosParaReais(precoDeCentavos),
    custo: custoCentavos === undefined ? undefined : centavosParaReais(custoCentavos),
    margem: custoCentavos === undefined ? undefined : margemPercentual(precoCentavos, custoCentavos),
    aRepor: precisaRepor(produto),
  };
}

export function apresentarPedido(pedido: Pedido) {
  const { subtotalCentavos, descontoCentavos, freteCentavos, totalCentavos, itens, ...resto } =
    pedido;

  return {
    ...resto,
    subtotal: centavosParaReais(subtotalCentavos),
    desconto: centavosParaReais(descontoCentavos),
    frete: centavosParaReais(freteCentavos),
    total: centavosParaReais(totalCentavos),
    itens: itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: centavosParaReais(item.precoUnitarioCentavos),
      subtotal: centavosParaReais(item.subtotalCentavos),
    })),
  };
}

export function apresentarCupom(cupom: Cupom) {
  const { minimoCentavos, valor, ...resto } = cupom;

  return {
    ...resto,
    /** Percentual continua percentual; valor fixo volta pra reais. */
    valor: cupom.tipo === 'percentual' ? valor : centavosParaReais(valor),
    minimo: centavosParaReais(minimoCentavos),
  };
}
