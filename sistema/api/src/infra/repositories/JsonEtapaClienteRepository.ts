import type { EtapaEscolhida } from '../../domain/clientes/EtapaDeCliente.js';
import type { Armazenamento } from '../storage/Armazenamento.js';
import { RepositorioJson } from '../storage/RepositorioJson.js';

export class JsonEtapaClienteRepository extends RepositorioJson<EtapaEscolhida> {
  constructor(store: Armazenamento<EtapaEscolhida>) {
    super(store, 'Etapa de cliente');
  }

  /**
   * Apaga a escolha, se existir. Diferente de `remover`, não reclama de ausência:
   * "voltar a seguir o histórico" é o estado natural de quem nunca foi movido, e
   * pedir isso duas vezes não é erro.
   */
  async limpar(telefone: string): Promise<void> {
    await this.store.transacao((escolhas) => {
      const indice = escolhas.findIndex((escolha) => escolha.id === telefone);
      if (indice >= 0) escolhas.splice(indice, 1);
    });
  }
}
