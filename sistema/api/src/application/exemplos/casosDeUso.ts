import type { Deps } from '../../infra/container.js';
import { Conflito } from '../../shared/erros.js';
import { slug } from '../../shared/id.js';
import { criarAvaliacao, moderarAvaliacao } from '../avaliacoes/casosDeUso.js';
import { criarCupom } from '../cupons/casosDeUso.js';
import { criarPedido, mudarStatus } from '../pedidos/casosDeUso.js';
import { criarProduto } from '../produtos/casosDeUso.js';
import { criarBanner, criarSecao } from '../vitrine/casosDeUso.js';
import { AVALIACOES, BANNERS, PEDIDOS, PRODUTOS, SECOES } from './dados.js';

/**
 * Popula o sistema com o catálogo, a vitrine e os pedidos de amostra.
 *
 * Existe porque o mesmo código precisa rodar em dois lugares: no terminal
 * (`npm run seed`, contra os JSON em disco) e pela API (contra o Netlify Blobs,
 * que sobe vazio a cada projeto novo — não há disco pra copiar arquivo).
 *
 * Tudo aqui é fictício de propósito e some quando o catálogo real entrar.
 */
export interface ResumoDoSeed {
  produtos: number;
  banners: number;
  secoes: number;
  cupons: number;
  avaliacoes: number;
  pedidos: number;
}

export interface OpcoesDoSeed {
  /** Cadastra os exemplos mesmo com produto já existente. */
  forcar?: boolean;
}

/** A foto vive no site, com o nome do id — o mesmo caminho que o catálogo usa. */
function fotoDoProduto(nome: string): string {
  return `/produtos/${slug(nome)}-600.webp`;
}

export async function semearExemplos(
  deps: Deps,
  { forcar = false }: OpcoesDoSeed = {},
  autor = 'seed',
): Promise<ResumoDoSeed> {
  const existentes = await deps.produtos.listar();

  if (existentes.length > 0 && !forcar) {
    throw new Conflito(
      `Já existem ${existentes.length} produtos cadastrados. Os exemplos não foram criados — apague o que está aí antes, ou repita pedindo pra forçar.`,
    );
  }

  for (const entrada of PRODUTOS) {
    await criarProduto(deps, { ...entrada, imagem: entrada.imagem ?? fotoDoProduto(entrada.nome) }, autor);
  }

  for (const banner of BANNERS) {
    await criarBanner(deps, banner);
  }

  for (const secao of SECOES) {
    await criarSecao(deps, secao);
  }

  await criarCupom(deps, {
    codigo: 'PRIMEIRACOMPRA',
    descricao: '10% na primeira compra',
    tipo: 'percentual',
    valor: 10,
    minimo: 150,
    ativo: true,
  });

  // Já publicadas: sem isso o seed criaria uma fila de moderação em vez de uma
  // loja com avaliação pronta pra ver.
  for (const entrada of AVALIACOES) {
    const { id } = await criarAvaliacao(deps, entrada);
    await moderarAvaliacao(deps, id, { status: 'publicada', resposta: entrada.resposta }, autor);
  }

  for (const entrada of PEDIDOS) {
    const { statusFinal, ...pedido } = entrada;
    const criado = await criarPedido(deps, { ...pedido, frete: 0 }, autor, 'site');

    // Confirmado já baixou estoque; o resto é só andar com o pedido.
    if (statusFinal) await mudarStatus(deps, criado.id, { status: statusFinal }, autor);
  }

  return {
    produtos: PRODUTOS.length,
    banners: BANNERS.length,
    secoes: SECOES.length,
    cupons: 1,
    avaliacoes: AVALIACOES.length,
    pedidos: PEDIDOS.length,
  };
}
