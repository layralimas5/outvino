import { join } from 'node:path';
import type { Avaliacao } from '../domain/avaliacoes/Avaliacao.js';
import type { Cupom } from '../domain/cupons/Cupom.js';
import type { MovimentoEstoque } from '../domain/estoque/MovimentoEstoque.js';
import type { Pedido } from '../domain/pedidos/Pedido.js';
import type { Produto } from '../domain/produtos/Produto.js';
import type { Banner, Secao } from '../domain/vitrine/Vitrine.js';
import { JsonAvaliacaoRepository } from './repositories/JsonAvaliacaoRepository.js';
import { JsonCupomRepository } from './repositories/JsonCupomRepository.js';
import { JsonMovimentoEstoqueRepository } from './repositories/JsonMovimentoEstoqueRepository.js';
import { JsonPedidoRepository } from './repositories/JsonPedidoRepository.js';
import { JsonProdutoRepository } from './repositories/JsonProdutoRepository.js';
import { JsonBannerRepository, JsonSecaoRepository } from './repositories/JsonVitrineRepository.js';
import type { Armazenamento } from './storage/Armazenamento.js';
import { BlobStore } from './storage/BlobStore.js';
import { Contadores } from './storage/Contadores.js';
import { JsonStore } from './storage/JsonStore.js';

/**
 * Tudo que os casos de uso precisam, montado num lugar só. Os casos de uso
 * recebem isso como parâmetro e não sabem que por baixo tem arquivo JSON — é o
 * ponto onde trocar por PostgreSQL vira uma troca de construtor.
 */
export interface Deps {
  produtos: JsonProdutoRepository;
  movimentos: JsonMovimentoEstoqueRepository;
  pedidos: JsonPedidoRepository;
  cupons: JsonCupomRepository;
  avaliacoes: JsonAvaliacaoRepository;
  banners: JsonBannerRepository;
  secoes: JsonSecaoRepository;
  contadores: Contadores;
}

/**
 * `arquivo` para servidor com disco (dev, VPS, Docker).
 * `blobs` para função serverless, onde o disco é descartado a cada invocação.
 */
export type TipoDeArmazenamento = 'arquivo' | 'blobs';

export function criarDeps(dataDir: string, tipo: TipoDeArmazenamento = 'arquivo'): Deps {
  const colecao = <T,>(nome: string): Armazenamento<T> =>
    tipo === 'blobs' ? new BlobStore<T>(nome) : new JsonStore<T>(join(dataDir, `${nome}.json`));

  return {
    produtos: new JsonProdutoRepository(colecao<Produto>('produtos')),
    movimentos: new JsonMovimentoEstoqueRepository(colecao<MovimentoEstoque>('movimentos-estoque')),
    pedidos: new JsonPedidoRepository(colecao<Pedido>('pedidos')),
    cupons: new JsonCupomRepository(colecao<Cupom>('cupons')),
    avaliacoes: new JsonAvaliacaoRepository(colecao<Avaliacao>('avaliacoes')),
    banners: new JsonBannerRepository(colecao<Banner>('banners')),
    secoes: new JsonSecaoRepository(colecao<Secao>('secoes')),
    contadores: new Contadores(colecao('contadores')),
  };
}
