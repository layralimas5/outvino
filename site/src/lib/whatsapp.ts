import { SITE } from '../config/site';
import type { ItemDoCarrinho } from './cart';
import { preco } from './format';

function link(mensagem: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

/** CTA genérico, pros botões que não passam por carrinho. */
export function linkDeContato(mensagem: string): string {
  return link(mensagem);
}

export function linkDoProduto(nome: string): string {
  return link(`Oi! Tenho interesse no ${nome}. Ainda tem?`);
}

export interface ResumoDoPedido {
  itens: ItemDoCarrinho[];
  total: number;
  desconto?: number;
  cupom?: string;
  /** Número do pedido no sistema, quando a API registrou. */
  numero?: number;
  cliente?: { nome: string; telefone: string };
  entrega?: string;
  observacao?: string;
}

/** Monta o pedido como mensagem pronta, de forma que a loja só precise responder. */
export function linkDoPedido(resumo: ResumoDoPedido): string {
  const linhas = [
    resumo.numero
      ? `Oi! Fiz o pedido *#${resumo.numero}* no site da ${SITE.name}:`
      : `Oi! Quero fechar esse pedido no site da ${SITE.name}:`,
    '',
    ...resumo.itens.map(
      (item) => `• ${item.quantidade}x ${item.nome}: ${preco(item.preco * item.quantidade)}`,
    ),
  ];

  if (resumo.desconto && resumo.cupom) {
    linhas.push('', `Cupom ${resumo.cupom}: − ${preco(resumo.desconto)}`);
  }

  linhas.push('', `*Total: ${preco(resumo.total)}*`);

  if (resumo.cliente) linhas.push('', `Nome: ${resumo.cliente.nome}`);
  if (resumo.entrega) linhas.push(`Entrega: ${resumo.entrega}`);
  if (resumo.observacao) linhas.push(`Observação: ${resumo.observacao}`);

  return link(linhas.join('\n'));
}
