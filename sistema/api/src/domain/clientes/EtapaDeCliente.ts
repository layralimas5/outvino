import { z } from 'zod';

/**
 * Em que ponto do relacionamento cada pessoa está.
 *
 * Quatro das cinco etapas os pedidos já contam sozinhos — quem nunca fechou é
 * lead, quem fechou uma vez é cliente, quem voltou é recorrente, quem sumiu é
 * sumido. `conversa` é a única que nenhum dado prova: é a loja dizendo "estou
 * negociando com essa pessoa agora". Por isso ela só existe quando alguém move
 * o card à mão.
 */
export const etapasDeCliente = ['lead', 'conversa', 'cliente', 'recorrente', 'sumido'] as const;

export type EtapaDeCliente = (typeof etapasDeCliente)[number];

/** Sem comprar há mais tempo que isso, a ficha cai na fila de reativação. */
export const DIAS_PARA_SUMIR = 60;

/** O que os pedidos contam da pessoa. É daqui que sai a etapa automática. */
export interface FatosDoCliente {
  /** Pedidos que viraram venda. Rascunho e cancelado não contam. */
  pedidos: number;
  diasSemComprar: number;
}

export function etapaAutomatica({ pedidos, diasSemComprar }: FatosDoCliente): EtapaDeCliente {
  if (pedidos === 0) return 'lead';
  if (diasSemComprar > DIAS_PARA_SUMIR) return 'sumido';
  return pedidos > 1 ? 'recorrente' : 'cliente';
}

/**
 * A etapa que alguém escolheu arrastando o card.
 *
 * Guarda junto a etapa que os pedidos indicavam **na hora do movimento**. É o
 * que permite a escolha caducar sozinha: se depois disso a pessoa comprou (ou
 * sumiu), o fato novo vale mais do que a leitura de ontem, e o card volta a
 * seguir o histórico em vez de ficar parado numa coluna mentindo.
 */
export interface EtapaEscolhida {
  /** Telefone só com dígitos — a mesma chave da ficha do CRM. */
  id: string;
  etapa: EtapaDeCliente;
  etapaAutomaticaNaEpoca: EtapaDeCliente;
  definidaEm: string;
  definidaPor: string;
}

export interface EtapaValendo {
  etapa: EtapaDeCliente;
  /** Veio de um movimento no quadro, não do histórico de pedidos. */
  manual: boolean;
}

export function etapaValendo(
  fatos: FatosDoCliente,
  escolhida: EtapaEscolhida | undefined,
): EtapaValendo {
  const automatica = etapaAutomatica(fatos);

  if (!escolhida || escolhida.etapaAutomaticaNaEpoca !== automatica) {
    return { etapa: automatica, manual: false };
  }

  return { etapa: escolhida.etapa, manual: escolhida.etapa !== automatica };
}

export const definirEtapaSchema = z.object({ etapa: z.enum(etapasDeCliente) }).strict();

export type DefinirEtapaInput = z.infer<typeof definirEtapaSchema>;
