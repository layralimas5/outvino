import { z } from 'zod';

/**
 * `entrada` recebimento de mercadoria · `saida` venda ou consumo ·
 * `perda` quebra/vencimento · `ajuste` correção de contagem (pode ser negativa).
 */
export const tiposDeMovimento = ['entrada', 'saida', 'perda', 'ajuste'] as const;

export type TipoDeMovimento = (typeof tiposDeMovimento)[number];

export interface MovimentoEstoque {
  id: string;
  produtoId: string;
  /** Snapshot: o produto pode ser renomeado, o histórico não muda. */
  produtoNome: string;
  tipo: TipoDeMovimento;
  /** Sempre positiva, exceto em `ajuste`, onde negativo corrige pra baixo. */
  quantidade: number;
  /** Saldo do produto depois do movimento. É o que permite auditar sem recalcular. */
  saldoDepois: number;
  motivo?: string;
  /** Preenchido quando a saída veio de um pedido confirmado. */
  pedidoId?: string;
  custoUnitarioCentavos?: number;
  usuarioId: string;
  criadoEm: string;
}

export const registrarMovimentoSchema = z
  .object({
    tipo: z.enum(tiposDeMovimento),
    quantidade: z.number().int('Quantidade em unidades inteiras.'),
    motivo: z.string().optional(),
    custoUnitario: z.number().nonnegative().optional(),
  })
  .refine((dado) => dado.tipo === 'ajuste' || dado.quantidade > 0, {
    message: 'Quantidade precisa ser maior que zero.',
    path: ['quantidade'],
  })
  .refine((dado) => dado.tipo !== 'ajuste' || dado.quantidade !== 0, {
    message: 'Ajuste de zero não muda nada.',
    path: ['quantidade'],
  });

export type RegistrarMovimentoInput = z.infer<typeof registrarMovimentoSchema>;

export interface FiltroMovimentos {
  produtoId?: string;
  tipo?: TipoDeMovimento;
  desde?: string;
}

/** Quanto o movimento soma (ou subtrai) do saldo do produto. */
export function efeitoNoSaldo(tipo: TipoDeMovimento, quantidade: number): number {
  if (tipo === 'entrada') return Math.abs(quantidade);
  if (tipo === 'saida' || tipo === 'perda') return -Math.abs(quantidade);
  return quantidade;
}
