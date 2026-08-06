/**
 * Uma coleção persistida, seja lá onde for.
 *
 * Os repositórios só conhecem essa interface. Trocar arquivo em disco por
 * Netlify Blobs — ou por PostgreSQL depois — é escrever outro adaptador; regra
 * de negócio nenhuma muda.
 */
export interface Armazenamento<T> {
  /** Cópia da lista inteira. Quem lê não consegue mutar o que está guardado. */
  lerTodos(): Promise<T[]>;

  /**
   * Lê, deixa `mutar` alterar a lista e grava o resultado — sem que outra
   * escrita concorrente se perca no meio.
   *
   * Cada adaptador garante isso do seu jeito: em arquivo, serializando numa
   * fila; em Blobs, com escrita condicional por etag e nova tentativa. Se
   * `mutar` lançar, nada é gravado.
   *
   * Importante: `mutar` pode ser executada mais de uma vez quando há conflito,
   * então ela precisa decidir tudo a partir da lista que recebe, e não de
   * estado lido antes.
   */
  transacao<R>(mutar: (itens: T[]) => R | Promise<R>): Promise<R>;
}
