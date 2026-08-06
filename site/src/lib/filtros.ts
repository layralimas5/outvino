/**
 * Regras do catálogo compartilhadas entre o build e o script do navegador.
 *
 * A página imprime as opções no HTML e o script filtra os cartões com essas
 * mesmas faixas: um lugar só pra mudar quando o preço médio da adega mudar.
 */

export interface FaixaDePreco {
  id: string;
  rotulo: string;
  /** Em reais, ambos inclusivos. Faixas vizinhas se tocam de propósito. */
  min: number;
  max: number;
}

export const FAIXAS: FaixaDePreco[] = [
  { id: 'ate-60', rotulo: 'Até R$ 60', min: 0, max: 60 },
  { id: '60-120', rotulo: 'R$ 60 a R$ 120', min: 60, max: 120 },
  { id: '120-200', rotulo: 'R$ 120 a R$ 200', min: 120, max: 200 },
  { id: 'acima-200', rotulo: 'Acima de R$ 200', min: 200, max: Infinity },
];

export function faixaPorId(id: string): FaixaDePreco | undefined {
  return FAIXAS.find((faixa) => faixa.id === id);
}

export interface Ordenacao {
  id: string;
  rotulo: string;
}

export const ORDEM_PADRAO = 'destaques';

export const ORDENS: Ordenacao[] = [
  { id: ORDEM_PADRAO, rotulo: 'Nossa ordem' },
  { id: 'menor-preco', rotulo: 'Menor preço' },
  { id: 'maior-preco', rotulo: 'Maior preço' },
  { id: 'nome', rotulo: 'Nome (A–Z)' },
];

/** O mínimo que a ordenação precisa saber: serve pro Produto e pro cartão. */
export interface Ordenavel {
  nome: string;
  preco: number;
  destaque: boolean;
  disponivel: boolean;
}

type Comparador = (a: Ordenavel, b: Ordenavel) => number;

export const COMPARADORES: Record<string, Comparador> = {
  /** O que dá pra comprar na frente, destaque depois, resto em ordem alfabética. */
  [ORDEM_PADRAO]: (a, b) =>
    Number(b.disponivel) - Number(a.disponivel) ||
    Number(b.destaque) - Number(a.destaque) ||
    a.nome.localeCompare(b.nome, 'pt-BR'),
  'menor-preco': (a, b) => a.preco - b.preco,
  'maior-preco': (a, b) => b.preco - a.preco,
  nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
};

export function comparadorDe(ordem: string): Comparador {
  return COMPARADORES[ordem] ?? COMPARADORES[ORDEM_PADRAO]!;
}
