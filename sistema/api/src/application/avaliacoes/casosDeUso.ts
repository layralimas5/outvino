import {
  nomePublico,
  resumir,
  type Avaliacao,
  type CriarAvaliacaoInput,
  type FiltroAvaliacoes,
  type ModerarAvaliacaoInput,
  type ResumoDeAvaliacoes,
} from '../../domain/avaliacoes/Avaliacao.js';
import { reservaEstoque } from '../../domain/pedidos/Pedido.js';
import type { Deps } from '../../infra/container.js';
import { Conflito } from '../../shared/erros.js';
import { agora, novoId } from '../../shared/id.js';

export function listarAvaliacoes(deps: Deps, filtro: FiltroAvaliacoes): Promise<Avaliacao[]> {
  return deps.avaliacoes.listar(filtro);
}

/**
 * Registra a avaliação vinda do site. Entra sempre como `pendente` — publicar
 * é decisão da loja, no painel.
 */
export async function criarAvaliacao(
  deps: Deps,
  entrada: CriarAvaliacaoInput,
): Promise<{ id: string; status: Avaliacao['status'] }> {
  // Produto inexistente ou fora do site vira avaliação órfã: recusa na entrada.
  const produto = await deps.produtos.exigirPorId(entrada.produtoId);

  await recusarSeRepetida(deps, entrada);

  const momento = agora();
  const avaliacao = await deps.avaliacoes.salvar({
    id: novoId(),
    produtoId: produto.id,
    autor: nomePublico(entrada.autor),
    email: entrada.email,
    nota: entrada.nota,
    titulo: entrada.titulo,
    comentario: entrada.comentario,
    compraVerificada: await comprou(deps, produto.id, entrada.email),
    status: 'pendente',
    criadoEm: momento,
    atualizadoEm: momento,
  });

  return { id: avaliacao.id, status: avaliacao.status };
}

export async function moderarAvaliacao(
  deps: Deps,
  id: string,
  entrada: ModerarAvaliacaoInput,
  usuarioId: string,
): Promise<Avaliacao> {
  return deps.avaliacoes.alterar(id, (avaliacao) => {
    if (entrada.status !== undefined) avaliacao.status = entrada.status;
    // String vazia é o jeito do painel apagar a resposta.
    if (entrada.resposta !== undefined) {
      avaliacao.resposta = entrada.resposta.length > 0 ? entrada.resposta : undefined;
    }
    avaliacao.moderadoPor = usuarioId;
    avaliacao.atualizadoEm = agora();
  });
}

export async function removerAvaliacao(deps: Deps, id: string): Promise<void> {
  await deps.avaliacoes.remover(id);
}

/** Média e distribuição por produto, contando só o que está publicado. */
export async function resumoPorProduto(deps: Deps): Promise<Map<string, ResumoDeAvaliacoes>> {
  const publicadas = await deps.avaliacoes.listar({ status: 'publicada' });

  const porProduto = new Map<string, Avaliacao[]>();
  for (const avaliacao of publicadas) {
    const lista = porProduto.get(avaliacao.produtoId) ?? [];
    lista.push(avaliacao);
    porProduto.set(avaliacao.produtoId, lista);
  }

  return new Map([...porProduto].map(([produtoId, lista]) => [produtoId, resumir(lista)]));
}

/**
 * Selo de compra verificada: existe pedido que não foi cancelado, já saiu de
 * rascunho e tem esse produto, no mesmo e-mail. Sem e-mail não tem como provar,
 * e sem prova o selo não aparece.
 */
async function comprou(deps: Deps, produtoId: string, email?: string): Promise<boolean> {
  if (!email) return false;

  const alvo = email.trim().toLowerCase();
  const pedidos = await deps.pedidos.listar();

  return pedidos.some(
    (pedido) =>
      pedido.cliente.email?.trim().toLowerCase() === alvo &&
      reservaEstoque(pedido.status) &&
      pedido.itens.some((item) => item.produtoId === produtoId),
  );
}

const JANELA_DE_REPETICAO_EM_HORAS = 24;

/**
 * Trava contra o mesmo e-mail despejando avaliação no mesmo produto. Não é
 * antifraude — é evitar que um engano de clique vire cinco comentários iguais
 * na fila de moderação.
 */
async function recusarSeRepetida(deps: Deps, entrada: CriarAvaliacaoInput): Promise<void> {
  if (!entrada.email) return;

  const alvo = entrada.email.trim().toLowerCase();
  const limite = Date.now() - JANELA_DE_REPETICAO_EM_HORAS * 60 * 60 * 1000;

  const doProduto = await deps.avaliacoes.listar({ produtoId: entrada.produtoId });
  const repetida = doProduto.some(
    (avaliacao) =>
      avaliacao.email?.trim().toLowerCase() === alvo &&
      new Date(avaliacao.criadoEm).getTime() >= limite,
  );

  if (repetida) {
    throw new Conflito('Você já avaliou esse vinho. Fala com a gente se quiser mudar o que escreveu.');
  }
}
