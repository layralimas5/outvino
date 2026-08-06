import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Armazenamento } from './Armazenamento.js';

/**
 * Coleção persistida num único arquivo JSON.
 *
 * Enquanto não existe banco, esse é o substituto, com três garantias:
 *
 * 1. **Escrita atômica** — grava num `.tmp` e faz rename. Rename é atômico no
 *    sistema de arquivos, então uma queda no meio da gravação nunca deixa o
 *    arquivo pela metade. Ou está o conteúdo antigo, ou o novo.
 * 2. **Escrita serializada** — toda `transacao` entra numa fila. Dois pedidos
 *    confirmados no mesmo instante não dão baixa de estoque em cima um do
 *    outro (o clássico read-modify-write perdido).
 * 3. **Cache que percebe mudança de fora** — o cache é validado por mtime e
 *    tamanho do arquivo. Sem isso, `npm run seed` e `importar-catalogo` (que
 *    rodam em outro processo) ficariam invisíveis pro servidor até reiniciar,
 *    e editar o JSON à mão não teria efeito nenhum.
 *
 * Trocar por PostgreSQL depois é reimplementar os repositórios; regra de
 * negócio nenhuma encosta nessa classe.
 */
export class JsonStore<T> implements Armazenamento<T> {
  private cache: T[] | null = null;
  /** `mtime:tamanho` do arquivo quando o cache foi montado. */
  private assinatura: string | null = null;
  private fila: Promise<unknown> = Promise.resolve();

  constructor(private readonly caminho: string) {}

  /** Cópia defensiva: quem lê não consegue mutar o cache por acidente. */
  async lerTodos(): Promise<T[]> {
    const itens = await this.carregar();
    return structuredClone(itens);
  }

  /**
   * Lê, deixa `mutar` alterar a lista e grava o resultado. Se `mutar` lançar,
   * nada é gravado e o cache é descartado (a lista pode ter sido mexida pela
   * metade antes da exceção).
   */
  async transacao<R>(mutar: (itens: T[]) => R | Promise<R>): Promise<R> {
    return this.enfileirar(async () => {
      const itens = await this.carregar();
      try {
        const resultado = await mutar(itens);
        await this.persistir(itens);
        return resultado;
      } catch (erro) {
        this.cache = null;
        throw erro;
      }
    });
  }

  private enfileirar<R>(tarefa: () => Promise<R>): Promise<R> {
    const proxima = this.fila.then(tarefa, tarefa);
    // A fila só marca o tempo; erro de uma tarefa não pode derrubar a seguinte.
    this.fila = proxima.then(
      () => undefined,
      () => undefined,
    );
    return proxima;
  }

  private async carregar(): Promise<T[]> {
    const assinaturaAtual = await this.assinaturaDoArquivo();
    if (this.cache && assinaturaAtual === this.assinatura) return this.cache;

    try {
      const conteudo = await readFile(this.caminho, 'utf8');
      const dado: unknown = JSON.parse(conteudo);
      if (!Array.isArray(dado)) {
        throw new Error(`${this.caminho} deveria conter uma lista JSON.`);
      }
      this.cache = dado as T[];
    } catch (erro) {
      if (!ehArquivoInexistente(erro)) throw erro;
      this.cache = [];
    }

    // Relê a assinatura depois da leitura: se o arquivo mudou no meio, a
    // próxima chamada percebe e carrega de novo em vez de fixar dado velho.
    this.assinatura = await this.assinaturaDoArquivo();
    return this.cache;
  }

  private async persistir(itens: T[]): Promise<void> {
    await mkdir(dirname(this.caminho), { recursive: true });

    const temporario = `${this.caminho}.tmp`;
    // Indentado de propósito: o arquivo é pra ser legível e diffável no git.
    await writeFile(temporario, `${JSON.stringify(itens, null, 2)}\n`, 'utf8');
    await rename(temporario, this.caminho);

    this.cache = itens;
    this.assinatura = await this.assinaturaDoArquivo();
  }

  /** `null` quando o arquivo ainda não existe — é um estado válido, não erro. */
  private async assinaturaDoArquivo(): Promise<string | null> {
    try {
      const info = await stat(this.caminho);
      return `${info.mtimeMs}:${info.size}`;
    } catch (erro) {
      if (!ehArquivoInexistente(erro)) throw erro;
      return null;
    }
  }
}

function ehArquivoInexistente(erro: unknown): boolean {
  return erro instanceof Error && (erro as NodeJS.ErrnoException).code === 'ENOENT';
}
