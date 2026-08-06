import type {
  AtualizarProdutoInput,
  CriarProdutoInput,
  FiltroProdutos,
  Produto,
} from '../../domain/produtos/Produto.js';
import type { Deps } from '../../infra/container.js';
import { reaisParaCentavos } from '../../shared/dinheiro.js';
import { Conflito, DadoInvalido } from '../../shared/erros.js';
import { agora, slug } from '../../shared/id.js';
import { aplicarMovimento } from '../estoque/casosDeUso.js';

export function listarProdutos(deps: Deps, filtro: FiltroProdutos): Promise<Produto[]> {
  return deps.produtos.listar(filtro);
}

export function buscarProduto(deps: Deps, id: string): Promise<Produto> {
  return deps.produtos.exigirPorId(id);
}

export async function criarProduto(
  deps: Deps,
  entrada: CriarProdutoInput,
  usuarioId: string,
): Promise<Produto> {
  const id = entrada.id ?? slug(entrada.nome);
  if (!id) throw new DadoInvalido('Não consegui gerar um id a partir desse nome. Informe um id.');

  if (await deps.produtos.buscarPorId(id)) {
    throw new Conflito(
      `Já existe um produto com o id "${id}". Mude o nome ou informe um id diferente.`,
    );
  }
  if (entrada.sku && (await deps.produtos.buscarPorSku(entrada.sku))) {
    throw new Conflito(`O SKU "${entrada.sku}" já está em outro produto.`);
  }

  const momento = agora();
  const { preco, precoDe, custo, estoque, id: _idIgnorado, ...resto } = entrada;

  const produto = await deps.produtos.salvar({
    ...resto,
    id,
    precoCentavos: reaisParaCentavos(preco),
    precoDeCentavos: precoDe === undefined ? undefined : reaisParaCentavos(precoDe),
    custoCentavos: custo === undefined ? undefined : reaisParaCentavos(custo),
    // Nasce zerado: o estoque inicial entra como movimento, pra ficar no histórico.
    estoque: 0,
    criadoEm: momento,
    atualizadoEm: momento,
  });

  if (estoque > 0) {
    const { produto: atualizado } = await aplicarMovimento(deps, {
      produtoId: id,
      tipo: 'entrada',
      quantidade: estoque,
      custoUnitarioCentavos: produto.custoCentavos,
      motivo: 'Estoque inicial do cadastro',
      usuarioId,
    });
    return atualizado;
  }

  return produto;
}

export async function atualizarProduto(
  deps: Deps,
  id: string,
  entrada: AtualizarProdutoInput,
): Promise<Produto> {
  if (entrada.sku) {
    const outro = await deps.produtos.buscarPorSku(entrada.sku);
    if (outro && outro.id !== id) {
      throw new Conflito(`O SKU "${entrada.sku}" já está no produto "${outro.nome}".`);
    }
  }

  const { preco, precoDe, custo, ...resto } = entrada;

  const atualizado = await deps.produtos.alterar(id, (produto) => {
    Object.assign(produto, resto);
    if (preco !== undefined) produto.precoCentavos = reaisParaCentavos(preco);
    if (custo !== undefined) produto.custoCentavos = reaisParaCentavos(custo);
    // Zero é o jeito do painel dizer "tira a promoção".
    if (precoDe !== undefined) {
      produto.precoDeCentavos = precoDe === 0 ? undefined : reaisParaCentavos(precoDe);
    }
    produto.atualizadoEm = agora();
  });

  if (
    atualizado.precoDeCentavos !== undefined &&
    atualizado.precoDeCentavos <= atualizado.precoCentavos
  ) {
    throw new DadoInvalido('O preço "de" precisa ser maior que o preço de venda.');
  }

  return atualizado;
}

/**
 * Produto que já foi vendido não sai do catálogo — sairia do histórico junto.
 * O caminho é despublicar do site e deixar o estoque zerar.
 */
export async function removerProduto(deps: Deps, id: string): Promise<void> {
  const pedidos = await deps.pedidos.listar();
  const vendido = pedidos.some((pedido) => pedido.itens.some((item) => item.produtoId === id));

  if (vendido) {
    throw new Conflito(
      'Esse produto já apareceu em pedido. Em vez de excluir, desmarque "publicado no site".',
    );
  }

  await deps.produtos.remover(id);
}
