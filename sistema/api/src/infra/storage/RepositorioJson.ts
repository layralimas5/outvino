import { NaoEncontrado } from '../../shared/erros.js';
import type { Armazenamento } from './Armazenamento.js';

export interface Entidade {
  id: string;
}

/**
 * O CRUD que todo repositório repete. Cada repositório concreto herda daqui e
 * acrescenta só as buscas que são dele (por documento, por pedido, por status).
 */
export abstract class RepositorioJson<T extends Entidade> {
  protected constructor(
    protected readonly store: Armazenamento<T>,
    private readonly nomeDoRecurso: string,
  ) {}

  async listar(): Promise<T[]> {
    return this.store.lerTodos();
  }

  async buscarPorId(id: string): Promise<T | null> {
    const itens = await this.store.lerTodos();
    return itens.find((item) => item.id === id) ?? null;
  }

  async exigirPorId(id: string): Promise<T> {
    const item = await this.buscarPorId(id);
    if (!item) throw new NaoEncontrado(this.nomeDoRecurso, id);
    return item;
  }

  /** Insere se o id é novo, substitui se já existe. */
  async salvar(item: T): Promise<T> {
    return this.store.transacao((itens) => {
      const indice = itens.findIndex((atual) => atual.id === item.id);
      if (indice >= 0) itens[indice] = item;
      else itens.push(item);
      return structuredClone(item);
    });
  }

  /**
   * Lê e grava dentro da mesma transação. Use isso — e não `buscarPorId` +
   * `salvar` — sempre que o novo valor depender do valor atual.
   */
  async alterar(id: string, mutar: (item: T) => void): Promise<T> {
    return this.store.transacao((itens) => {
      const indice = itens.findIndex((atual) => atual.id === id);
      if (indice < 0) throw new NaoEncontrado(this.nomeDoRecurso, id);
      const item = itens[indice] as T;
      mutar(item);
      return structuredClone(item);
    });
  }

  async remover(id: string): Promise<void> {
    await this.store.transacao((itens) => {
      const indice = itens.findIndex((item) => item.id === id);
      if (indice < 0) throw new NaoEncontrado(this.nomeDoRecurso, id);
      itens.splice(indice, 1);
    });
  }
}
