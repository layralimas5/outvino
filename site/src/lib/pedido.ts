import { API } from '../config/site';
import type { ItemDoCarrinho } from './cart';

/**
 * Conversa do carrinho com o sistema.
 *
 * Tudo aqui é **melhor esforço**: se a API estiver fora, sem chave configurada
 * ou recusar, o checkout continua e o pedido vai pelo WhatsApp do mesmo jeito.
 * Perder uma venda porque o back-office caiu seria o pior desfecho possível.
 */

export const integracaoLigada = Boolean(API.url && API.chave);

interface RespostaDeErro {
  erro?: { mensagem?: string };
}

async function chamar<T>(caminho: string, corpo: unknown): Promise<T> {
  const resposta = await fetch(`${API.url}/api/publico${caminho}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-chave-site': API.chave },
    body: JSON.stringify(corpo),
  });

  const texto = await resposta.text();
  const dado: unknown = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    const mensagem = (dado as RespostaDeErro)?.erro?.mensagem ?? 'Não consegui completar.';
    throw new Error(mensagem);
  }

  return dado as T;
}

export interface CupomConferido {
  codigo: string;
  descricao?: string;
  desconto: number;
}

/** Erro aqui é mostrado pro cliente: ele precisa saber por que o cupom não colou. */
export function conferirCupom(codigo: string, subtotal: number): Promise<CupomConferido> {
  if (!integracaoLigada) {
    return Promise.reject(new Error('Confira o cupom com a gente pelo WhatsApp.'));
  }
  return chamar<CupomConferido>('/cupom', { codigo, subtotal });
}

export interface DadosDoPedido {
  cliente: { nome: string; telefone: string; email?: string };
  itens: ItemDoCarrinho[];
  cupomCodigo?: string;
  tipoEntrega: 'retirada' | 'entrega';
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    referencia?: string;
  };
  observacao?: string;
}

export interface PedidoRegistrado {
  numero: number;
  total: number;
  desconto: number;
}

/**
 * Registra o pedido como rascunho no sistema. Devolve `null` quando não deu
 * certo, e aí o carrinho segue pro WhatsApp sem número de pedido.
 */
export async function registrarPedido(dados: DadosDoPedido): Promise<PedidoRegistrado | null> {
  if (!integracaoLigada) return null;

  try {
    return await chamar<PedidoRegistrado>('/pedidos', {
      cliente: dados.cliente,
      itens: dados.itens.map((item) => ({ produtoId: item.id, quantidade: item.quantidade })),
      cupomCodigo: dados.cupomCodigo,
      tipoEntrega: dados.tipoEntrega,
      endereco: dados.endereco,
      observacao: dados.observacao,
    });
  } catch (erro) {
    console.warn('Pedido não registrado no sistema; seguindo pelo WhatsApp.', erro);
    return null;
  }
}
