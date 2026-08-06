import { z } from 'zod';

export interface Cupom {
  /** O próprio código, em caixa alta. É o que o cliente digita. */
  id: string;
  descricao?: string;
  tipo: 'percentual' | 'valor';
  /** Percentual de 1 a 90, ou o desconto em centavos quando `tipo` é `valor`. */
  valor: number;
  /** Só vale a partir desse subtotal. Zero libera pra qualquer pedido. */
  minimoCentavos: number;
  /** AAAA-MM-DD. Ausente é sem prazo. */
  validoAte?: string;
  /** Ausente é ilimitado. */
  usosMaximos?: number;
  usos: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Base sem `.refine`: o zod recusa `.partial()` em schema já refinado, então a
 * validação cruzada só entra na ponta, em `criarCupomSchema`.
 */
const cupomBaseSchema = z.object({
  codigo: z
    .string()
    .min(3, 'O código precisa de pelo menos 3 caracteres.')
    .regex(/^[A-Za-z0-9-]+$/, 'Só letras, números e hífen.'),
  descricao: z.string().max(120).optional(),
  tipo: z.enum(['percentual', 'valor']),
  /** Percentual (1–90) ou desconto em reais, conforme o tipo. */
  valor: z.number().positive('Informe o valor do desconto.'),
  minimo: z.number().nonnegative().default(0),
  validoAte: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.')
    .optional(),
  usosMaximos: z.number().int().positive().optional(),
  ativo: z.boolean().default(true),
});

export const criarCupomSchema = cupomBaseSchema.refine(
  (dado) => dado.tipo !== 'percentual' || dado.valor <= 90,
  { message: 'Percentual máximo de 90%.', path: ['valor'] },
);

/** Código e tipo não mudam: virariam outro cupom, com o histórico do antigo. */
export const atualizarCupomSchema = cupomBaseSchema
  .omit({ codigo: true, tipo: true })
  .partial();

export type CriarCupomInput = z.infer<typeof criarCupomSchema>;
export type AtualizarCupomInput = z.infer<typeof atualizarCupomSchema>;

/** Motivo pelo qual o cupom não vale, ou `null` quando está tudo certo. */
export function recusarCupom(cupom: Cupom, subtotalCentavos: number, hoje: string): string | null {
  if (!cupom.ativo) return 'Esse cupom está desativado.';
  if (cupom.validoAte && cupom.validoAte < hoje) return 'Esse cupom venceu.';
  if (cupom.usosMaximos !== undefined && cupom.usos >= cupom.usosMaximos) {
    return 'Esse cupom já atingiu o limite de usos.';
  }
  if (subtotalCentavos < cupom.minimoCentavos) {
    const minimo = (cupom.minimoCentavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return `Esse cupom vale a partir de ${minimo}.`;
  }
  return null;
}

/** Nunca passa do subtotal: desconto maior que a compra viraria total negativo. */
export function descontoDoCupom(cupom: Cupom, subtotalCentavos: number): number {
  const bruto =
    cupom.tipo === 'percentual'
      ? Math.round((subtotalCentavos * cupom.valor) / 100)
      : cupom.valor;

  return Math.min(bruto, subtotalCentavos);
}
