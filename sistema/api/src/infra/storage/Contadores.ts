import type { Armazenamento } from './Armazenamento.js';

interface Contador {
  id: string;
  valor: number;
}

/**
 * Número sequencial legível ("Pedido #1042"). UUID não serve pro cliente
 * falar no WhatsApp. Incrementa dentro da transação do arquivo, então dois
 * pedidos simultâneos nunca recebem o mesmo número.
 */
export class Contadores {
  constructor(private readonly store: Armazenamento<Contador>) {}

  async proximo(nome: string, inicio = 1000): Promise<number> {
    return this.store.transacao((contadores) => {
      const atual = contadores.find((contador) => contador.id === nome);
      if (!atual) {
        contadores.push({ id: nome, valor: inicio });
        return inicio;
      }
      atual.valor += 1;
      return atual.valor;
    });
  }
}
