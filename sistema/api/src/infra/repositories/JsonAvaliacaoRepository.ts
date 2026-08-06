import type { Avaliacao, FiltroAvaliacoes } from '../../domain/avaliacoes/Avaliacao.js';
import type { Armazenamento } from '../storage/Armazenamento.js';
import { RepositorioJson } from '../storage/RepositorioJson.js';

export class JsonAvaliacaoRepository extends RepositorioJson<Avaliacao> {
  constructor(store: Armazenamento<Avaliacao>) {
    super(store, 'Avaliação');
  }

  /** Mais recente primeiro: é a ordem que a moderação e o site querem. */
  override async listar(filtro: FiltroAvaliacoes = {}): Promise<Avaliacao[]> {
    const avaliacoes = await this.store.lerTodos();

    return avaliacoes
      .filter((avaliacao) => !filtro.produtoId || avaliacao.produtoId === filtro.produtoId)
      .filter((avaliacao) => !filtro.status || avaliacao.status === filtro.status)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}
