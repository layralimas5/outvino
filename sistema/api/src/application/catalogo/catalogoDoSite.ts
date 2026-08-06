import { resumir, type Avaliacao } from '../../domain/avaliacoes/Avaliacao.js';
import { disponivel, emPromocao, type Produto } from '../../domain/produtos/Produto.js';
import type { CriterioDeSecao, Secao } from '../../domain/vitrine/Vitrine.js';
import type { Deps } from '../../infra/container.js';
import { centavosParaReais } from '../../shared/dinheiro.js';
import { agora } from '../../shared/id.js';

/**
 * O que o site publica. **Nunca** carrega custo, margem ou saldo exato de
 * estoque: o arquivo fica público num CDN, e número de estoque é informação
 * que a concorrência agradece.
 */
export interface ProdutoDoSite {
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
  /** Em reais. */
  preco: number;
  precoDe?: number;
  descricao: string;
  notas: string[];
  harmonizacao: string[];
  imagem?: string;
  destaque: boolean;
  disponivel: boolean;
  /** Últimas unidades — vira selo de urgência, sem revelar o número. */
  poucasUnidades: boolean;
  novidade: boolean;
  /** Ausente quando ninguém avaliou: o site não desenha estrela vazia. */
  avaliacoes?: AvaliacoesDoSite;
}

/** O que o site publica de avaliação. Sem e-mail: o arquivo vai pro CDN. */
export interface AvaliacaoDoSite {
  id: string;
  autor: string;
  nota: number;
  titulo?: string;
  comentario: string;
  compraVerificada: boolean;
  /** AAAA-MM-DD. Hora exata de quem escreveu não interessa a ninguém. */
  em: string;
  resposta?: string;
}

export interface AvaliacoesDoSite {
  media: number;
  total: number;
  distribuicao: Record<number, number>;
  itens: AvaliacaoDoSite[];
}

export interface CatalogoDoSite {
  geradoEm: string;
  produtos: ProdutoDoSite[];
  banners: Array<{
    id: string;
    titulo: string;
    subtitulo?: string;
    eyebrow?: string;
    imagem?: string;
    ctaTexto?: string;
    ctaLink?: string;
  }>;
  secoes: Array<{
    id: string;
    titulo: string;
    subtitulo?: string;
    /** Ids de produto, na ordem em que devem aparecer. */
    produtos: string[];
  }>;
}

const LIMITE_POUCAS_UNIDADES = 3;
const DIAS_DE_NOVIDADE = 30;

export async function catalogoDoSite(deps: Deps): Promise<CatalogoDoSite> {
  const [produtos, banners, secoes, publicadas] = await Promise.all([
    deps.produtos.listar({ publicadoNoSite: true }),
    deps.banners.listar(),
    deps.secoes.listar(),
    deps.avaliacoes.listar({ status: 'publicada' }),
  ]);

  const avaliacoesPorProduto = agruparAvaliacoes(publicadas);
  const doSite = produtos.map((produto) =>
    paraOSite(produto, avaliacoesPorProduto.get(produto.id)),
  );

  return {
    geradoEm: agora(),
    produtos: doSite,
    banners: banners
      .filter((banner) => banner.ativo)
      .map(({ id, titulo, subtitulo, eyebrow, imagem, ctaTexto, ctaLink }) => ({
        id,
        titulo,
        subtitulo,
        eyebrow,
        imagem,
        ctaTexto,
        ctaLink,
      })),
    secoes: secoes
      .filter((secao) => secao.ativo)
      .map((secao) => ({
        id: secao.id,
        titulo: secao.titulo,
        subtitulo: secao.subtitulo,
        produtos: resolverSecao(secao, produtos).map((produto) => produto.id),
      }))
      // Seção sem produto na home fica um buraco na página; some.
      .filter((secao) => secao.produtos.length > 0),
  };
}

function paraOSite(produto: Produto, avaliacoes?: AvaliacoesDoSite): ProdutoDoSite {
  return {
    id: produto.id,
    nome: produto.nome,
    tipo: produto.tipo,
    pais: produto.pais,
    regiao: produto.regiao,
    uva: produto.uva,
    vinicola: produto.vinicola,
    safra: produto.safra,
    volumeMl: produto.volumeMl,
    teor: produto.teor,
    classificacao: produto.classificacao,
    amadurecimento: produto.amadurecimento,
    temperaturaServico: produto.temperaturaServico,
    potencialGuarda: produto.potencialGuarda,
    visual: produto.visual,
    olfativo: produto.olfativo,
    gustativo: produto.gustativo,
    avaliacoes,
    preco: centavosParaReais(produto.precoCentavos),
    precoDe: emPromocao(produto) ? centavosParaReais(produto.precoDeCentavos ?? 0) : undefined,
    descricao: produto.descricao,
    notas: produto.notas,
    harmonizacao: produto.harmonizacao,
    imagem: produto.imagem,
    destaque: produto.destaque,
    disponivel: disponivel(produto),
    poucasUnidades: produto.estoque > 0 && produto.estoque <= LIMITE_POUCAS_UNIDADES,
    novidade: ehNovidade(produto),
  };
}

/**
 * Junta as avaliações publicadas por produto, já com média e distribuição
 * calculadas — o site é estático e não faz conta em runtime.
 */
function agruparAvaliacoes(publicadas: Avaliacao[]): Map<string, AvaliacoesDoSite> {
  const porProduto = new Map<string, Avaliacao[]>();

  for (const avaliacao of publicadas) {
    const lista = porProduto.get(avaliacao.produtoId) ?? [];
    lista.push(avaliacao);
    porProduto.set(avaliacao.produtoId, lista);
  }

  return new Map(
    [...porProduto].map(([produtoId, lista]) => {
      const { media, total, distribuicao } = resumir(lista);
      return [
        produtoId,
        {
          media,
          total,
          distribuicao,
          itens: lista.map((avaliacao) => ({
            id: avaliacao.id,
            autor: avaliacao.autor,
            nota: avaliacao.nota,
            titulo: avaliacao.titulo,
            comentario: avaliacao.comentario,
            compraVerificada: avaliacao.compraVerificada,
            em: avaliacao.criadoEm.slice(0, 10),
            resposta: avaliacao.resposta,
          })),
        },
      ];
    }),
  );
}

function ehNovidade(produto: Produto): boolean {
  const limite = Date.now() - DIAS_DE_NOVIDADE * 24 * 60 * 60 * 1000;
  return new Date(produto.criadoEm).getTime() >= limite;
}

/** Traduz o critério da seção numa lista de produtos, já ordenada e cortada. */
function resolverSecao(secao: Secao, produtos: Produto[]): Produto[] {
  const escolhidos = produtos.filter((produto) => casaCriterio(secao.criterio, secao.valor, produto));

  if (secao.criterio === 'novidades') {
    escolhidos.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  // Esgotado no fim: a vitrine mostra primeiro o que dá pra comprar.
  escolhidos.sort((a, b) => Number(disponivel(b)) - Number(disponivel(a)));

  return escolhidos.slice(0, secao.limite);
}

function casaCriterio(criterio: CriterioDeSecao, valor: string | undefined, produto: Produto): boolean {
  switch (criterio) {
    case 'destaques':
      return produto.destaque;
    case 'promocoes':
      return emPromocao(produto);
    case 'novidades':
      return ehNovidade(produto);
    case 'tipo':
      return produto.tipo === valor;
    case 'pais':
      return produto.pais === valor;
  }
}
