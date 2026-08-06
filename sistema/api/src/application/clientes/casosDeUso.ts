import { reservaEstoque, type Pedido } from '../../domain/pedidos/Pedido.js';
import type { Deps } from '../../infra/container.js';
import type { Centavos } from '../../shared/dinheiro.js';
import { normalizarBusca, somenteDigitos } from '../../shared/texto.js';

/**
 * CRM montado a partir dos pedidos.
 *
 * Não existe cadastro de cliente no sistema, e criar um agora seria inventar
 * dado: o que a loja tem de verdade é quem já comprou. Cada pedido carrega
 * nome, telefone e, às vezes, e-mail — juntando por telefone sai a ficha real
 * de cada pessoa, sem nada suposto.
 *
 * O telefone é a chave porque é o canal da loja: o pedido fecha no WhatsApp, e
 * é por ele que a Outvino volta a falar com a pessoa. Nome muda de grafia entre
 * um pedido e outro; número, não.
 */
export interface Cliente {
  /** Só dígitos, como veio do pedido. Também é o id da ficha. */
  telefone: string;
  /** Do pedido mais recente: é a grafia que a pessoa usou por último. */
  nome: string;
  email?: string;
  cidade?: string;
  /** Pedidos que viraram venda (rascunho e cancelado ficam de fora). */
  pedidos: number;
  totalCentavos: Centavos;
  ticketMedioCentavos: Centavos;
  primeiroEm: string;
  ultimoEm: string;
  /** Quantos dias desde a última compra. Serve para a fila de reativação. */
  diasSemComprar: number;
  /** Rascunhos abandonados e pedidos cancelados. Contexto antes de ligar. */
  rascunhos: number;
  cancelados: number;
  /** Quem comprou mais de uma vez. É a métrica que a loja quer subir. */
  recorrente: boolean;
  /** O que a pessoa mais levou, por unidades. */
  preferido?: string;
}

export interface FiltroDeClientes {
  /** Nome, telefone ou e-mail. */
  busca?: string;
  /** Só quem comprou mais de uma vez. */
  somenteRecorrentes?: boolean;
}

interface Acumulador {
  telefone: string;
  nome: string;
  email?: string;
  cidade?: string;
  pedidos: number;
  total: Centavos;
  primeiroEm: string;
  ultimoEm: string;
  /** Data do pedido que forneceu nome/e-mail/cidade — o mais recente ganha. */
  fichaDe: string;
  rascunhos: number;
  cancelados: number;
  unidadesPorProduto: Map<string, number>;
}

const DIA_EM_MS = 86_400_000;

function chaveDoCliente(pedido: Pedido): string {
  return somenteDigitos(pedido.cliente.telefone);
}

export async function listarClientes(
  deps: Deps,
  filtro: FiltroDeClientes = {},
): Promise<Cliente[]> {
  const pedidos = await deps.pedidos.listar();
  const fichas = new Map<string, Acumulador>();

  for (const pedido of pedidos) {
    const chave = chaveDoCliente(pedido);
    // Pedido manual sem telefone não vira ficha: uma linha sem canal não serve.
    if (!chave) continue;

    const ficha = fichas.get(chave) ?? {
      telefone: chave,
      nome: pedido.cliente.nome,
      pedidos: 0,
      total: 0,
      primeiroEm: pedido.criadoEm,
      ultimoEm: pedido.criadoEm,
      fichaDe: '',
      rascunhos: 0,
      cancelados: 0,
      unidadesPorProduto: new Map<string, number>(),
    };

    // Dados de contato vêm sempre do pedido mais recente que os trouxe.
    if (pedido.criadoEm >= ficha.fichaDe) {
      ficha.fichaDe = pedido.criadoEm;
      ficha.nome = pedido.cliente.nome;
      ficha.email = pedido.cliente.email ?? ficha.email;
      ficha.cidade = pedido.endereco?.cidade ?? ficha.cidade;
    }

    if (pedido.status === 'rascunho') ficha.rascunhos += 1;
    if (pedido.status === 'cancelado') ficha.cancelados += 1;

    if (reservaEstoque(pedido.status)) {
      ficha.pedidos += 1;
      ficha.total += pedido.totalCentavos;
      if (pedido.criadoEm < ficha.primeiroEm) ficha.primeiroEm = pedido.criadoEm;
      if (pedido.criadoEm > ficha.ultimoEm) ficha.ultimoEm = pedido.criadoEm;

      for (const item of pedido.itens) {
        const atual = ficha.unidadesPorProduto.get(item.nome) ?? 0;
        ficha.unidadesPorProduto.set(item.nome, atual + item.quantidade);
      }
    }

    fichas.set(chave, ficha);
  }

  const agora = Date.now();

  const clientes = [...fichas.values()].map<Cliente>((ficha) => ({
    telefone: ficha.telefone,
    nome: ficha.nome,
    email: ficha.email,
    cidade: ficha.cidade,
    pedidos: ficha.pedidos,
    totalCentavos: ficha.total,
    ticketMedioCentavos: ficha.pedidos ? Math.round(ficha.total / ficha.pedidos) : 0,
    primeiroEm: ficha.primeiroEm,
    ultimoEm: ficha.ultimoEm,
    diasSemComprar: Math.max(0, Math.floor((agora - Date.parse(ficha.ultimoEm)) / DIA_EM_MS)),
    rascunhos: ficha.rascunhos,
    cancelados: ficha.cancelados,
    recorrente: ficha.pedidos > 1,
    preferido: maisLevado(ficha.unidadesPorProduto),
  }));

  const busca = filtro.busca ? normalizarBusca(filtro.busca) : '';
  const digitosDaBusca = somenteDigitos(busca);

  return clientes
    .filter((cliente) => {
      if (filtro.somenteRecorrentes && !cliente.recorrente) return false;
      if (!busca) return true;

      return (
        normalizarBusca(cliente.nome).includes(busca) ||
        (digitosDaBusca.length > 0 && cliente.telefone.includes(digitosDaBusca)) ||
        normalizarBusca(cliente.email ?? '').includes(busca)
      );
    })
    .sort((a, b) => b.totalCentavos - a.totalCentavos || b.ultimoEm.localeCompare(a.ultimoEm));
}

function maisLevado(unidades: Map<string, number>): string | undefined {
  let campeao: string | undefined;
  let maior = 0;

  for (const [nome, quantidade] of unidades) {
    if (quantidade > maior) {
      maior = quantidade;
      campeao = nome;
    }
  }

  return campeao;
}

export interface ResumoDeClientes {
  total: number;
  recorrentes: number;
  novosNoMes: number;
  /** Sem comprar há mais de 60 dias. É a fila de reativação. */
  sumidos: number;
  ticketMedioCentavos: Centavos;
}

const DIAS_PARA_SUMIR = 60;

export function resumirClientes(clientes: Cliente[]): ResumoDeClientes {
  const compradores = clientes.filter((cliente) => cliente.pedidos > 0);
  const mesAtual = new Date().toISOString().slice(0, 7);
  const total = compradores.reduce((soma, cliente) => soma + cliente.totalCentavos, 0);
  const pedidos = compradores.reduce((soma, cliente) => soma + cliente.pedidos, 0);

  return {
    total: compradores.length,
    recorrentes: compradores.filter((cliente) => cliente.recorrente).length,
    novosNoMes: compradores.filter((cliente) => cliente.primeiroEm.slice(0, 7) === mesAtual).length,
    sumidos: compradores.filter((cliente) => cliente.diasSemComprar > DIAS_PARA_SUMIR).length,
    ticketMedioCentavos: pedidos ? Math.round(total / pedidos) : 0,
  };
}
