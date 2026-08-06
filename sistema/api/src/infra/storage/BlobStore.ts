import { getStore, type Store } from '@netlify/blobs';
import type { Armazenamento } from './Armazenamento.js';

/**
 * Coleção guardada no Netlify Blobs, para quando o sistema roda em função
 * serverless — onde o disco é descartado a cada invocação e a fila de escrita
 * em memória não vale nada, porque cada requisição pode cair numa instância
 * diferente.
 *
 * A consistência vem de **escrita condicional**: lê junto com o etag e só grava
 * se o etag ainda for aquele. Se outra instância gravou no meio, a gravação é
 * recusada e a operação recomeça a partir do estado novo — que é exatamente o
 * que precisa acontecer quando duas vendas disputam a última garrafa: a segunda
 * relê o estoque já baixado e falha por falta, em vez de sobrescrever a
 * primeira.
 */
export class BlobStore<T> implements Armazenamento<T> {
  private store: Store | null = null;

  constructor(
    private readonly chave: string,
    private readonly nomeDoStore = 'outvino',
  ) {}

  private obterStore(): Store {
    // Preguiçoso de propósito: getStore precisa do contexto da função, que só
    // existe durante a requisição, não na montagem do container.
    if (this.store) return this.store;

    /**
     * Dentro da Netlify o contexto vem injetado e nada disso é necessário.
     * Quando não vem — deploy por CLI, execução local, runtime que não injeta —
     * dá pra suprir na mão com o id do site e um token de acesso.
     */
    const siteID = process.env.NETLIFY_SITE_ID ?? process.env.SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN ?? process.env.NETLIFY_AUTH_TOKEN;

    try {
      this.store =
        siteID && token
          ? getStore({ name: this.nomeDoStore, consistency: 'strong', siteID, token })
          : getStore({ name: this.nomeDoStore, consistency: 'strong' });
    } catch (erro) {
      throw new Error(
        'O armazenamento (Netlify Blobs) não está configurado neste ambiente. ' +
          'Conecte o repositório na Netlify para o build acontecer lá, ou defina ' +
          'NETLIFY_SITE_ID e NETLIFY_BLOBS_TOKEN nas variáveis do site. ' +
          `Detalhe: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }

    return this.store;
  }

  async lerTodos(): Promise<T[]> {
    const { itens } = await this.ler();
    return itens;
  }

  async transacao<R>(mutar: (itens: T[]) => R | Promise<R>): Promise<R> {
    for (let tentativa = 0; tentativa < MAXIMO_DE_TENTATIVAS; tentativa += 1) {
      const { itens, etag } = await this.ler();
      const resultado = await mutar(itens);

      // Sem etag, a coleção ainda não existe: `onlyIfNew` evita que duas
      // instâncias criem a primeira versão em cima uma da outra.
      const escrita = await this.obterStore().setJSON(
        this.chave,
        itens,
        etag ? { onlyIfMatch: etag } : { onlyIfNew: true },
      );

      if (escrita.modified) return resultado;
      await esperar(tentativa);
    }

    throw new Error(
      `Não consegui gravar "${this.chave}": muitas escritas concorrentes seguidas. Tente de novo.`,
    );
  }

  private async ler(): Promise<{ itens: T[]; etag?: string }> {
    const resultado = await this.obterStore().getWithMetadata(this.chave, {
      type: 'json',
      consistency: 'strong',
    });

    if (!resultado) return { itens: [] };

    const dado: unknown = resultado.data;
    if (!Array.isArray(dado)) {
      throw new Error(`A coleção "${this.chave}" deveria ser uma lista JSON.`);
    }

    return { itens: dado as T[], etag: resultado.etag };
  }
}

const MAXIMO_DE_TENTATIVAS = 6;

/** Espera crescente pra duas instâncias em conflito não colidirem de novo juntas. */
function esperar(tentativa: number): Promise<void> {
  const ms = 25 * 2 ** tentativa;
  return new Promise((resolver) => setTimeout(resolver, ms));
}
