import type { FiltroPedidos, Pedido } from '../../domain/pedidos/Pedido.js';
import { contem, somenteDigitos } from '../../shared/texto.js';
import type { Armazenamento } from '../storage/Armazenamento.js';
import { RepositorioJson } from '../storage/RepositorioJson.js';

export class JsonPedidoRepository extends RepositorioJson<Pedido> {
  constructor(store: Armazenamento<Pedido>) {
    super(store, 'Pedido');
  }

  /** Mais recente primeiro: pedido novo é o que a loja precisa ver. */
  override async listar(filtro: FiltroPedidos = {}): Promise<Pedido[]> {
    const pedidos = await this.store.lerTodos();

    return pedidos
      .filter((pedido) => {
        if (filtro.status && pedido.status !== filtro.status) return false;
        if (filtro.origem && pedido.origem !== filtro.origem) return false;
        if (filtro.desde && pedido.criadoEm.slice(0, 10) < filtro.desde) return false;
        if (filtro.ate && pedido.criadoEm.slice(0, 10) > filtro.ate) return false;
        if (filtro.busca && !casaBusca(pedido, filtro.busca)) return false;
        return true;
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}

function casaBusca(pedido: Pedido, busca: string): boolean {
  const digitos = somenteDigitos(busca);

  return (
    contem(pedido.cliente.nome, busca) ||
    String(pedido.numero) === digitos ||
    (digitos.length >= 4 && pedido.cliente.telefone.includes(digitos)) ||
    pedido.itens.some((item) => contem(item.nome, busca))
  );
}
