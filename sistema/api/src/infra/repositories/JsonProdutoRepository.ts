import {
  precisaRepor,
  type FiltroProdutos,
  type Produto,
  type ProdutoRepository,
} from '../../domain/produtos/Produto.js';
import { contem } from '../../shared/texto.js';
import type { Armazenamento } from '../storage/Armazenamento.js';
import { RepositorioJson } from '../storage/RepositorioJson.js';

export class JsonProdutoRepository extends RepositorioJson<Produto> implements ProdutoRepository {
  constructor(store: Armazenamento<Produto>) {
    super(store, 'Produto');
  }

  override async listar(filtro: FiltroProdutos = {}): Promise<Produto[]> {
    const produtos = await this.store.lerTodos();

    return produtos
      .filter((produto) => {
        if (filtro.busca && !casaBusca(produto, filtro.busca)) return false;
        if (filtro.tipo && produto.tipo !== filtro.tipo) return false;
        if (filtro.pais && !contem(produto.pais, filtro.pais)) return false;
        if (
          filtro.publicadoNoSite !== undefined &&
          produto.publicadoNoSite !== filtro.publicadoNoSite
        ) {
          return false;
        }
        if (filtro.destaque !== undefined && produto.destaque !== filtro.destaque) return false;
        if (filtro.abaixoDoMinimo && !precisaRepor(produto)) return false;
        if (filtro.semEstoque && produto.estoque > 0) return false;
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  async buscarPorSku(sku: string): Promise<Produto | null> {
    const produtos = await this.store.lerTodos();
    const alvo = sku.trim().toLowerCase();
    return produtos.find((produto) => produto.sku?.trim().toLowerCase() === alvo) ?? null;
  }
}

function casaBusca(produto: Produto, busca: string): boolean {
  return (
    contem(produto.nome, busca) ||
    contem(produto.sku, busca) ||
    contem(produto.uva, busca) ||
    contem(produto.pais, busca) ||
    contem(produto.regiao, busca) ||
    contem(produto.vinicola, busca) ||
    contem(produto.id, busca)
  );
}
