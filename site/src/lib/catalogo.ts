import dados from '../data/catalogo.json';
import { normalizar } from './texto';

/**
 * O catálogo é um JSON gerado pela API (`npm run sync`) e commitado. O site é
 * estático de propósito: a loja carrega de CDN, não depende da API estar no ar
 * e o Google indexa cada rótulo.
 */
/** Uma avaliação já aprovada pela loja. Sem e-mail: esse arquivo é público. */
export interface Avaliacao {
  id: string;
  autor: string;
  nota: number;
  titulo?: string;
  comentario: string;
  compraVerificada: boolean;
  /** AAAA-MM-DD. */
  em: string;
  resposta?: string;
}

export interface Avaliacoes {
  media: number;
  total: number;
  /** Quantas de cada nota, de 1 a 5. */
  distribuicao: Record<number, number>;
  itens: Avaliacao[];
}

export interface Produto {
  id: string;
  nome: string;
  tipo: string;
  pais: string;
  regiao?: string;
  uva?: string;
  vinicola?: string;
  safra?: number;
  volumeMl?: number;
  teor?: string;
  classificacao?: string;
  amadurecimento?: string;
  temperaturaServico?: string;
  potencialGuarda?: string;
  visual?: string;
  olfativo?: string;
  gustativo?: string;
  /** Ausente quando ninguém avaliou — e aí nenhuma estrela é desenhada. */
  avaliacoes?: Avaliacoes;
  preco: number;
  precoDe?: number;
  descricao: string;
  notas: string[];
  harmonizacao: string[];
  imagem?: string;
  destaque: boolean;
  disponivel: boolean;
  poucasUnidades: boolean;
  novidade: boolean;
}

export interface Banner {
  id: string;
  titulo: string;
  subtitulo?: string;
  eyebrow?: string;
  imagem?: string;
  ctaTexto?: string;
  ctaLink?: string;
}

export interface Secao {
  id: string;
  titulo: string;
  subtitulo?: string;
  produtos: string[];
}

interface Catalogo {
  geradoEm: string;
  produtos: Produto[];
  banners: Banner[];
  secoes: Secao[];
}

const catalogo = dados as Catalogo;

export const produtos: Produto[] = [...catalogo.produtos].sort((a, b) =>
  a.nome.localeCompare(b.nome, 'pt-BR'),
);

export const banners: Banner[] = catalogo.banners;

const porId = new Map(produtos.map((produto) => [produto.id, produto]));

export function produtoPorId(id: string): Produto | undefined {
  return porId.get(id);
}

/** As faixas da home já resolvidas em produto, sem id órfão. */
export const secoes: Array<Omit<Secao, 'produtos'> & { produtos: Produto[] }> = catalogo.secoes
  .map((secao) => ({
    ...secao,
    produtos: secao.produtos
      .map(produtoPorId)
      .filter((produto): produto is Produto => produto !== undefined),
  }))
  .filter((secao) => secao.produtos.length > 0);

export function produtoUrl(produto: Produto): string {
  return `/vinhos/${produto.id}/`;
}

/** Valores únicos de um campo, na ordem em que fazem sentido no filtro. */
export function opcoes(campo: 'tipo' | 'pais'): string[] {
  const valores = new Set(produtos.map((produto) => produto[campo]));
  return [...valores].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Sugestões da página de produto: mesmo tipo pesa mais que mesmo país, e
 * disponível sempre na frente de esgotado.
 */
export function relacionados(produto: Produto, limite = 4): Produto[] {
  const peso = (outro: Produto) =>
    (outro.tipo === produto.tipo ? 2 : 0) +
    (outro.pais === produto.pais ? 1 : 0) +
    (outro.disponivel ? 0.5 : 0);

  return produtos
    .filter((outro) => outro.id !== produto.id)
    .sort((a, b) => peso(b) - peso(a))
    .slice(0, limite);
}

/** Texto achatado que a busca do catálogo compara. */
export function textoDeBusca(produto: Produto): string {
  return normalizar(
    [produto.nome, produto.uva, produto.regiao, produto.pais, produto.tipo, produto.vinicola]
      .filter(Boolean)
      .join(' '),
  );
}
