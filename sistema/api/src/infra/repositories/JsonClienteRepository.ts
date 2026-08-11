import type { ClienteCadastrado } from '../../domain/clientes/Cliente.js';
import type { Armazenamento } from '../storage/Armazenamento.js';
import { RepositorioJson } from '../storage/RepositorioJson.js';

export class JsonClienteRepository extends RepositorioJson<ClienteCadastrado> {
  constructor(store: Armazenamento<ClienteCadastrado>) {
    super(store, 'Cliente');
  }
}
