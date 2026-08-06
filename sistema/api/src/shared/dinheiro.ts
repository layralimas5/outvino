/**
 * Dinheiro é sempre inteiro em centavos aqui dentro. Nada de float somando
 * 189.90 + 149.90 e dando 339.79999999999995 no fechamento de caixa.
 * A conversão pra reais acontece só na borda (resposta HTTP e catálogo do site).
 */
export type Centavos = number;

export function reaisParaCentavos(reais: number): Centavos {
  return Math.round(reais * 100);
}

export function centavosParaReais(centavos: Centavos): number {
  return Math.round(centavos) / 100;
}

export function formatarBRL(centavos: Centavos): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    centavosParaReais(centavos),
  );
}

export function somar(valores: readonly Centavos[]): Centavos {
  return valores.reduce((total, valor) => total + valor, 0);
}

/** Margem sobre o preço de venda, em pontos percentuais (0 a 100). */
export function margemPercentual(precoCentavos: Centavos, custoCentavos: Centavos): number {
  if (precoCentavos <= 0) return 0;
  return Math.round(((precoCentavos - custoCentavos) / precoCentavos) * 1000) / 10;
}
