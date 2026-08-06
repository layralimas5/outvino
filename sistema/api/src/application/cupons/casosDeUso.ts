import {
  descontoDoCupom,
  recusarCupom,
  type AtualizarCupomInput,
  type CriarCupomInput,
  type Cupom,
} from '../../domain/cupons/Cupom.js';
import type { Deps } from '../../infra/container.js';
import { reaisParaCentavos } from '../../shared/dinheiro.js';
import { Conflito, NaoEncontrado, RegraDeNegocio } from '../../shared/erros.js';
import { agora, hoje } from '../../shared/id.js';

export function listarCupons(deps: Deps): Promise<Cupom[]> {
  return deps.cupons.listar();
}

export async function criarCupom(deps: Deps, entrada: CriarCupomInput): Promise<Cupom> {
  const id = entrada.codigo.trim().toUpperCase();

  if (await deps.cupons.buscarPorId(id)) {
    throw new Conflito(`O cupom "${id}" já existe.`);
  }

  const momento = agora();

  return deps.cupons.salvar({
    id,
    descricao: entrada.descricao,
    tipo: entrada.tipo,
    // Percentual fica como veio; valor fixo vira centavos.
    valor: entrada.tipo === 'percentual' ? entrada.valor : reaisParaCentavos(entrada.valor),
    minimoCentavos: reaisParaCentavos(entrada.minimo),
    validoAte: entrada.validoAte,
    usosMaximos: entrada.usosMaximos,
    usos: 0,
    ativo: entrada.ativo,
    criadoEm: momento,
    atualizadoEm: momento,
  });
}

export function atualizarCupom(
  deps: Deps,
  codigo: string,
  entrada: AtualizarCupomInput,
): Promise<Cupom> {
  return deps.cupons.alterar(codigo.trim().toUpperCase(), (cupom) => {
    if (entrada.descricao !== undefined) cupom.descricao = entrada.descricao;
    if (entrada.valor !== undefined) {
      cupom.valor = cupom.tipo === 'percentual' ? entrada.valor : reaisParaCentavos(entrada.valor);
    }
    if (entrada.minimo !== undefined) cupom.minimoCentavos = reaisParaCentavos(entrada.minimo);
    if (entrada.validoAte !== undefined) cupom.validoAte = entrada.validoAte;
    if (entrada.usosMaximos !== undefined) cupom.usosMaximos = entrada.usosMaximos;
    if (entrada.ativo !== undefined) cupom.ativo = entrada.ativo;
    cupom.atualizadoEm = agora();
  });
}

/** Cupom já usado não some do histórico: desative em vez de excluir. */
export async function removerCupom(deps: Deps, codigo: string): Promise<void> {
  const id = codigo.trim().toUpperCase();
  const cupom = await deps.cupons.exigirPorId(id);

  if (cupom.usos > 0) {
    throw new Conflito(
      `O cupom "${id}" já foi usado ${cupom.usos}x. Desative em vez de excluir, senão o histórico de pedidos fica sem referência.`,
    );
  }

  await deps.cupons.remover(id);
}

export interface CupomAplicado {
  cupom: Cupom;
  descontoCentavos: number;
}

/**
 * Valida o cupom contra o subtotal e devolve quanto ele desconta. Não consome
 * uso nenhum — quem consome é a confirmação do pedido.
 */
export async function aplicarCupom(
  deps: Deps,
  codigo: string,
  subtotalCentavos: number,
): Promise<CupomAplicado> {
  const cupom = await deps.cupons.buscarPorCodigo(codigo);
  if (!cupom) throw new NaoEncontrado('Cupom', codigo.trim().toUpperCase());

  const recusa = recusarCupom(cupom, subtotalCentavos, hoje());
  if (recusa) throw new RegraDeNegocio(recusa);

  return { cupom, descontoCentavos: descontoDoCupom(cupom, subtotalCentavos) };
}

/** Incrementa dentro da transação: dois pedidos juntos não estouram o limite. */
export async function consumirCupom(deps: Deps, codigo: string): Promise<void> {
  await deps.cupons.alterar(codigo.trim().toUpperCase(), (cupom) => {
    if (cupom.usosMaximos !== undefined && cupom.usos >= cupom.usosMaximos) {
      throw new RegraDeNegocio(`O cupom "${cupom.id}" já atingiu o limite de usos.`);
    }
    cupom.usos += 1;
    cupom.atualizadoEm = agora();
  });
}

/** Cancelamento devolve o uso, senão uma desistência queima o cupom à toa. */
export async function devolverUsoDoCupom(deps: Deps, codigo: string): Promise<void> {
  const cupom = await deps.cupons.buscarPorCodigo(codigo);
  if (!cupom) return;

  await deps.cupons.alterar(cupom.id, (atual) => {
    atual.usos = Math.max(0, atual.usos - 1);
    atual.atualizadoEm = agora();
  });
}
