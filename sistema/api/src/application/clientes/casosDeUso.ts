import type {
  AtualizarClienteInput,
  ClienteCadastrado,
  CriarClienteInput,
} from '../../domain/clientes/Cliente.js';
import {
  DIAS_PARA_SUMIR,
  etapaAutomatica,
  etapaValendo,
  type EtapaDeCliente,
  type EtapaEscolhida,
} from '../../domain/clientes/EtapaDeCliente.js';
import { reservaEstoque, type Pedido } from '../../domain/pedidos/Pedido.js';
import type { Endereco } from '../../domain/shared/Endereco.js';
import type { Deps } from '../../infra/container.js';
import type { Centavos } from '../../shared/dinheiro.js';
import { Conflito, DadoInvalido, NaoEncontrado } from '../../shared/erros.js';
import {
  normalizarBusca,
  normalizarTelefone,
  somenteDigitos,
} from '../../shared/texto.js';

/**
 * A ficha de cada pessoa, de duas fontes que se completam.
 *
 * O histórico vem dos **pedidos**: quanto gastou, quando comprou, o que levou.
 * Isso nunca é digitado — é calculado, e por isso não mente. O **cadastro**
 * (quando existe) traz o que nenhum pedido conta: CPF, aniversário, endereço de
 * sempre, preferências, o combinado por telefone.
 *
 * O telefone é a chave dos dois lados porque é o canal da loja: o pedido fecha
 * no WhatsApp, e é por ele que a Outvino volta a falar com a pessoa. Nome muda
 * de grafia entre um pedido e outro; número, não.
 *
 * Quem tem cadastro e nenhum pedido aparece com os números zerados — a loja
 * conhece gente antes da primeira venda, e isso não é o mesmo que ter comprado.
 */
export interface Cliente {
  /** Telefone normalizado. Também é o id da ficha e do cadastro. */
  telefone: string;
  /** Do cadastro, quando existe; senão, a grafia do pedido mais recente. */
  nome: string;
  email?: string;
  cidade?: string;
  /** Pedidos que viraram venda (rascunho e cancelado ficam de fora). */
  pedidos: number;
  totalCentavos: Centavos;
  ticketMedioCentavos: Centavos;
  /** Ausentes em quem só tem cadastro: nunca houve compra pra datar. */
  primeiroEm?: string;
  ultimoEm?: string;
  /** Quantos dias desde a última compra. Serve para a fila de reativação. */
  diasSemComprar: number;
  /** Rascunhos abandonados e pedidos cancelados. Contexto antes de ligar. */
  rascunhos: number;
  cancelados: number;
  /** Quem comprou mais de uma vez. É a métrica que a loja quer subir. */
  recorrente: boolean;
  /** O que a pessoa mais levou, por unidades. */
  preferido?: string;
  /** Coluna onde o card está no quadro do CRM. */
  etapa: EtapaDeCliente;
  /** Onde os pedidos, sozinhos, colocariam a pessoa. */
  etapaAutomatica: EtapaDeCliente;
  /** A etapa veio de um movimento no quadro, não do histórico. */
  etapaManual: boolean;
  /** Tem ficha cadastrada à mão, além do que os pedidos contam. */
  cadastrado: boolean;
  documento?: string;
  nascimento?: string;
  endereco?: Endereco;
  preferencias?: string;
  observacao?: string;
  /** Quando a ficha foi cadastrada. Ausente em quem só veio de pedido. */
  cadastradoEm?: string;
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
  primeiroEm?: string;
  ultimoEm?: string;
  /** Data do pedido que forneceu nome/e-mail/cidade — o mais recente ganha. */
  fichaDe: string;
  rascunhos: number;
  cancelados: number;
  unidadesPorProduto: Map<string, number>;
  cadastro?: ClienteCadastrado;
}

const DIA_EM_MS = 86_400_000;

function chaveDoCliente(pedido: Pedido): string {
  return normalizarTelefone(pedido.cliente.telefone);
}

function fichaVazia(telefone: string, nome: string): Acumulador {
  return {
    telefone,
    nome,
    pedidos: 0,
    total: 0,
    fichaDe: '',
    rascunhos: 0,
    cancelados: 0,
    unidadesPorProduto: new Map<string, number>(),
  };
}

export async function listarClientes(
  deps: Deps,
  filtro: FiltroDeClientes = {},
): Promise<Cliente[]> {
  const [pedidos, cadastros, escolhas] = await Promise.all([
    deps.pedidos.listar(),
    deps.clientes.listar(),
    deps.etapasDeClientes.listar(),
  ]);

  const escolhaPorTelefone = new Map(escolhas.map((escolha) => [escolha.id, escolha]));
  const fichas = new Map<string, Acumulador>();

  // O cadastro entra primeiro: quem foi cadastrado existe na carteira mesmo
  // sem nunca ter comprado, e o que a loja digitou manda sobre a grafia solta
  // que veio num pedido antigo.
  for (const cadastro of cadastros) {
    const ficha = fichaVazia(cadastro.id, cadastro.nome);
    ficha.email = cadastro.email;
    ficha.cidade = cadastro.endereco?.cidade;
    ficha.cadastro = cadastro;
    fichas.set(cadastro.id, ficha);
  }

  for (const pedido of pedidos) {
    const chave = chaveDoCliente(pedido);
    // Pedido manual sem telefone não vira ficha: uma linha sem canal não serve.
    if (!chave) continue;

    const ficha = fichas.get(chave) ?? fichaVazia(chave, pedido.cliente.nome);

    // Dados de contato vêm do pedido mais recente que os trouxe — a não ser
    // que exista cadastro, e aí vale o que a loja escreveu.
    if (!ficha.cadastro && pedido.criadoEm >= ficha.fichaDe) {
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
      if (!ficha.primeiroEm || pedido.criadoEm < ficha.primeiroEm) {
        ficha.primeiroEm = pedido.criadoEm;
      }
      if (!ficha.ultimoEm || pedido.criadoEm > ficha.ultimoEm) ficha.ultimoEm = pedido.criadoEm;

      for (const item of pedido.itens) {
        const atual = ficha.unidadesPorProduto.get(item.nome) ?? 0;
        ficha.unidadesPorProduto.set(item.nome, atual + item.quantidade);
      }
    }

    fichas.set(chave, ficha);
  }

  const agora = Date.now();

  const clientes = [...fichas.values()].map<Cliente>((ficha) => {
    // Sem compra não há o que contar: zero dias, e não "dias desde nunca".
    const diasSemComprar = ficha.ultimoEm
      ? Math.max(0, Math.floor((agora - Date.parse(ficha.ultimoEm)) / DIA_EM_MS))
      : 0;
    const fatos = { pedidos: ficha.pedidos, diasSemComprar };
    const valendo = etapaValendo(fatos, escolhaPorTelefone.get(ficha.telefone));

    return {
      telefone: ficha.telefone,
      nome: ficha.nome,
      email: ficha.email,
      cidade: ficha.cidade,
      pedidos: ficha.pedidos,
      totalCentavos: ficha.total,
      ticketMedioCentavos: ficha.pedidos ? Math.round(ficha.total / ficha.pedidos) : 0,
      primeiroEm: ficha.primeiroEm,
      ultimoEm: ficha.ultimoEm,
      diasSemComprar,
      rascunhos: ficha.rascunhos,
      cancelados: ficha.cancelados,
      recorrente: ficha.pedidos > 1,
      preferido: maisLevado(ficha.unidadesPorProduto),
      etapa: valendo.etapa,
      etapaAutomatica: etapaAutomatica(fatos),
      etapaManual: valendo.manual,
      cadastrado: Boolean(ficha.cadastro),
      documento: ficha.cadastro?.documento,
      nascimento: ficha.cadastro?.nascimento,
      endereco: ficha.cadastro?.endereco,
      preferencias: ficha.cadastro?.preferencias,
      observacao: ficha.cadastro?.observacao,
      cadastradoEm: ficha.cadastro?.criadoEm,
    };
  });

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
    .sort(
      (a, b) =>
        b.totalCentavos - a.totalCentavos ||
        // Quem só tem cadastro não tem data de compra: vai pro fim do empate.
        (b.ultimoEm ?? '').localeCompare(a.ultimoEm ?? '') ||
        a.nome.localeCompare(b.nome, 'pt-BR'),
    );
}

/**
 * Cadastra a ficha completa de uma pessoa.
 *
 * O telefone é normalizado com DDI antes de virar chave — é o que garante que
 * o cadastro caia em cima do histórico de pedidos dela em vez de criar uma
 * segunda ficha da mesma pessoa. Já existindo cadastro nesse número, recusa:
 * dois cadastros no mesmo telefone é sempre engano de digitação.
 */
export async function criarCliente(
  deps: Deps,
  entrada: CriarClienteInput,
  autor: string,
): Promise<Cliente> {
  const id = normalizarTelefone(entrada.telefone);
  if (id.length < 12) {
    throw new DadoInvalido('Telefone incompleto. Informe DDD + número.');
  }

  const jaExiste = await deps.clientes.buscarPorId(id);
  if (jaExiste) {
    throw new Conflito(`${jaExiste.nome} já está cadastrado nesse telefone.`);
  }

  const agora = new Date().toISOString();
  const cadastro: ClienteCadastrado = {
    id,
    nome: entrada.nome,
    email: entrada.email,
    documento: entrada.documento ? somenteDigitos(entrada.documento) : undefined,
    nascimento: entrada.nascimento,
    endereco: entrada.endereco,
    preferencias: entrada.preferencias,
    observacao: entrada.observacao,
    criadoEm: agora,
    atualizadoEm: agora,
    criadoPor: autor,
  };

  await deps.clientes.salvar(cadastro);
  return exigirCliente(deps, id);
}

/** Edita a ficha. O telefone não entra: ele é a chave que liga aos pedidos. */
export async function atualizarCliente(
  deps: Deps,
  telefone: string,
  entrada: AtualizarClienteInput,
): Promise<Cliente> {
  const id = normalizarTelefone(telefone);

  await deps.clientes.alterar(id, (cadastro) => {
    if (entrada.nome !== undefined) cadastro.nome = entrada.nome;
    if (entrada.email !== undefined) cadastro.email = entrada.email || undefined;
    if (entrada.documento !== undefined) {
      cadastro.documento = entrada.documento ? somenteDigitos(entrada.documento) : undefined;
    }
    if (entrada.nascimento !== undefined) cadastro.nascimento = entrada.nascimento || undefined;
    if (entrada.endereco !== undefined) cadastro.endereco = entrada.endereco;
    if (entrada.preferencias !== undefined) {
      cadastro.preferencias = entrada.preferencias || undefined;
    }
    if (entrada.observacao !== undefined) cadastro.observacao = entrada.observacao || undefined;
    cadastro.atualizadoEm = new Date().toISOString();
  });

  return exigirCliente(deps, id);
}

/**
 * Apaga o cadastro, não a pessoa: o histórico de pedidos continua contando a
 * ficha dela, com o nome que veio nos pedidos. Some o que a loja digitou, e
 * nada do que aconteceu de verdade.
 */
export async function removerCliente(deps: Deps, telefone: string): Promise<void> {
  await deps.clientes.remover(normalizarTelefone(telefone));
}

/**
 * A ficha de uma pessoa só. Passa pela lista inteira de propósito: a ficha é
 * calculada a partir dos pedidos, então não existe "buscar por id" mais barato
 * — e é a mesma conta que a listagem faz, sem risco de divergir.
 */
async function exigirCliente(deps: Deps, telefone: string): Promise<Cliente> {
  const chave = normalizarTelefone(telefone);
  const clientes = await listarClientes(deps);
  const cliente = clientes.find((atual) => atual.telefone === chave);

  if (!cliente) throw new NaoEncontrado('Cliente', telefone);
  return cliente;
}

/**
 * Move o card de coluna no quadro do CRM.
 *
 * Escolher a coluna que o histórico já indicava não vira registro: apaga o que
 * houver e a ficha volta a seguir os pedidos sozinha. Guardar "escolhi lead
 * para quem já era lead" só criaria um dado que envelhece sem ninguém perceber.
 */
export async function definirEtapaDeCliente(
  deps: Deps,
  telefone: string,
  etapa: EtapaDeCliente,
  autor: string,
): Promise<Cliente> {
  const cliente = await exigirCliente(deps, telefone);

  if (etapa === cliente.etapaAutomatica) {
    await deps.etapasDeClientes.limpar(cliente.telefone);
  } else {
    const escolha: EtapaEscolhida = {
      id: cliente.telefone,
      etapa,
      etapaAutomaticaNaEpoca: cliente.etapaAutomatica,
      definidaEm: new Date().toISOString(),
      definidaPor: autor,
    };
    await deps.etapasDeClientes.salvar(escolha);
  }

  return { ...cliente, etapa, etapaManual: etapa !== cliente.etapaAutomatica };
}

/** Desfaz o movimento manual: a ficha volta a seguir o histórico de pedidos. */
export async function limparEtapaDeCliente(deps: Deps, telefone: string): Promise<Cliente> {
  const cliente = await exigirCliente(deps, telefone);
  await deps.etapasDeClientes.limpar(cliente.telefone);

  return { ...cliente, etapa: cliente.etapaAutomatica, etapaManual: false };
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
  /** Quem já comprou. Cadastro sem pedido não entra: ainda não é cliente. */
  total: number;
  /** Fichas cadastradas à mão, com ou sem compra. */
  cadastrados: number;
  recorrentes: number;
  novosNoMes: number;
  /** Sem comprar há mais de 60 dias. É a fila de reativação. */
  sumidos: number;
  ticketMedioCentavos: Centavos;
}

export function resumirClientes(clientes: Cliente[]): ResumoDeClientes {
  const compradores = clientes.filter((cliente) => cliente.pedidos > 0);
  const mesAtual = new Date().toISOString().slice(0, 7);
  const total = compradores.reduce((soma, cliente) => soma + cliente.totalCentavos, 0);
  const pedidos = compradores.reduce((soma, cliente) => soma + cliente.pedidos, 0);

  return {
    total: compradores.length,
    recorrentes: compradores.filter((cliente) => cliente.recorrente).length,
    cadastrados: clientes.filter((cliente) => cliente.cadastrado).length,
    novosNoMes: compradores.filter((cliente) => (cliente.primeiroEm ?? '').slice(0, 7) === mesAtual)
      .length,
    sumidos: compradores.filter((cliente) => cliente.diasSemComprar > DIAS_PARA_SUMIR).length,
    ticketMedioCentavos: pedidos ? Math.round(total / pedidos) : 0,
  };
}
