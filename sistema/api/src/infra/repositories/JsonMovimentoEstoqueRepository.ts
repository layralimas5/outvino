import type {
  FiltroMovimentos,
  MovimentoEstoque,
} from '../../domain/estoque/MovimentoEstoque.js';
import type { Armazenamento } from '../storage/Armazenamento.js';
import { RepositorioJson } from '../storage/RepositorioJson.js';

export class JsonMovimentoEstoqueRepository extends RepositorioJson<MovimentoEstoque> {
  constructor(store: Armazenamento<MovimentoEstoque>) {
    super(store, 'Movimento de estoque');
  }

  /** Mais recente primeiro: é assim que a tela de histórico lê. */
  override async listar(filtro: FiltroMovimentos = {}): Promise<MovimentoEstoque[]> {
    const movimentos = await this.store.lerTodos();

    return movimentos
      .filter((movimento) => {
        if (filtro.produtoId && movimento.produtoId !== filtro.produtoId) return false;
        if (filtro.tipo && movimento.tipo !== filtro.tipo) return false;
        if (filtro.desde && movimento.criadoEm < filtro.desde) return false;
        return true;
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}
