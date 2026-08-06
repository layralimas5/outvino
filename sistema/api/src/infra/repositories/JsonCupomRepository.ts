import type { Cupom } from '../../domain/cupons/Cupom.js';
import type { Armazenamento } from '../storage/Armazenamento.js';
import { RepositorioJson } from '../storage/RepositorioJson.js';

export class JsonCupomRepository extends RepositorioJson<Cupom> {
  constructor(store: Armazenamento<Cupom>) {
    super(store, 'Cupom');
  }

  override async listar(): Promise<Cupom[]> {
    const cupons = await this.store.lerTodos();
    return cupons.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  /** O cliente digita como quiser; o código é guardado em caixa alta. */
  async buscarPorCodigo(codigo: string): Promise<Cupom | null> {
    return this.buscarPorId(codigo.trim().toUpperCase());
  }
}
