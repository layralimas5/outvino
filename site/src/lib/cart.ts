import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';

export interface ItemDoCarrinho {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  volumeMl?: number;
  url: string;
}

const CHAVE = 'outvino:carrinho:v1';
const MAXIMO_POR_ITEM = 24;

function decodificar(bruto: string): ItemDoCarrinho[] {
  try {
    const dado: unknown = JSON.parse(bruto);
    if (!Array.isArray(dado)) return [];
    return dado.filter(ehItem);
  } catch {
    // localStorage corrompido ou de uma versão antiga do carrinho: recomeça vazio.
    return [];
  }
}

function ehItem(valor: unknown): valor is ItemDoCarrinho {
  if (typeof valor !== 'object' || valor === null) return false;
  const item = valor as Record<string, unknown>;

  return (
    typeof item.id === 'string' &&
    typeof item.nome === 'string' &&
    typeof item.preco === 'number' &&
    typeof item.quantidade === 'number' &&
    item.quantidade > 0 &&
    typeof item.url === 'string'
  );
}

export const itens = persistentAtom<ItemDoCarrinho[]>(CHAVE, [], {
  encode: JSON.stringify,
  decode: decodificar,
});

export const carrinhoAberto = atom(false);

export const quantidadeTotal = computed(itens, (lista) =>
  lista.reduce((total, item) => total + item.quantidade, 0),
);

export const valorTotal = computed(itens, (lista) =>
  lista.reduce((total, item) => total + item.preco * item.quantidade, 0),
);

function limitar(quantidade: number): number {
  return Math.min(Math.max(Math.trunc(quantidade), 1), MAXIMO_POR_ITEM);
}

export function adicionar(item: Omit<ItemDoCarrinho, 'quantidade'>, quantidade = 1): void {
  const lista = itens.get();
  const existente = lista.find((atual) => atual.id === item.id);

  if (existente) {
    definirQuantidade(item.id, existente.quantidade + quantidade);
    return;
  }

  itens.set([...lista, { ...item, quantidade: limitar(quantidade) }]);
}

export function definirQuantidade(id: string, quantidade: number): void {
  if (quantidade < 1) {
    remover(id);
    return;
  }

  itens.set(
    itens.get().map((item) => (item.id === id ? { ...item, quantidade: limitar(quantidade) } : item)),
  );
}

export function remover(id: string): void {
  itens.set(itens.get().filter((item) => item.id !== id));
}

export function esvaziar(): void {
  itens.set([]);
}

export function abrirCarrinho(): void {
  carrinhoAberto.set(true);
}

export function fecharCarrinho(): void {
  carrinhoAberto.set(false);
}
