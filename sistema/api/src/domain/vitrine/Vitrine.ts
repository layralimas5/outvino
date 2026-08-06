import { z } from 'zod';

/** Slide do topo da home. */
export interface Banner {
  id: string;
  titulo: string;
  subtitulo?: string;
  /** Etiqueta pequena acima do título ("Nova safra", "Frete grátis"). */
  eyebrow?: string;
  imagem?: string;
  ctaTexto?: string;
  ctaLink?: string;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Uma faixa de produtos da home. O critério é resolvido na hora de montar o
 * catálogo, então a seção não precisa ser reeditada quando o catálogo muda.
 */
export const criteriosDeSecao = ['destaques', 'promocoes', 'novidades', 'tipo', 'pais'] as const;

export type CriterioDeSecao = (typeof criteriosDeSecao)[number];

export interface Secao {
  id: string;
  titulo: string;
  subtitulo?: string;
  criterio: CriterioDeSecao;
  /** O valor do filtro quando o critério é `tipo` ou `pais`. */
  valor?: string;
  limite: number;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export const criarBannerSchema = z.object({
  titulo: z.string().min(2, 'Informe o título.'),
  subtitulo: z.string().max(200).optional(),
  eyebrow: z.string().max(40).optional(),
  imagem: z.string().optional(),
  ctaTexto: z.string().max(40).optional(),
  ctaLink: z.string().max(200).optional(),
  ordem: z.number().int().nonnegative().default(0),
  ativo: z.boolean().default(true),
});

export const atualizarBannerSchema = criarBannerSchema.partial();

/**
 * Base sem `.refine`: o zod recusa `.partial()` em schema já refinado, então a
 * validação cruzada só entra na ponta, em `criarSecaoSchema`.
 */
const secaoBaseSchema = z.object({
  titulo: z.string().min(2, 'Informe o título.'),
  subtitulo: z.string().max(200).optional(),
  criterio: z.enum(criteriosDeSecao),
  valor: z.string().optional(),
  limite: z.number().int().min(2).max(24).default(8),
  ordem: z.number().int().nonnegative().default(0),
  ativo: z.boolean().default(true),
});

const precisaDeValor = (criterio: CriterioDeSecao): boolean =>
  criterio === 'tipo' || criterio === 'pais';

export const criarSecaoSchema = secaoBaseSchema.refine(
  (dado) => !precisaDeValor(dado.criterio) || Boolean(dado.valor),
  { message: 'Critério por tipo ou país precisa do valor do filtro.', path: ['valor'] },
);

export const atualizarSecaoSchema = secaoBaseSchema
  .partial()
  .refine((dado) => dado.criterio === undefined || !precisaDeValor(dado.criterio) || Boolean(dado.valor), {
    message: 'Critério por tipo ou país precisa do valor do filtro.',
    path: ['valor'],
  });

export type CriarBannerInput = z.infer<typeof criarBannerSchema>;
export type AtualizarBannerInput = z.infer<typeof atualizarBannerSchema>;
export type CriarSecaoInput = z.infer<typeof criarSecaoSchema>;
export type AtualizarSecaoInput = z.infer<typeof atualizarSecaoSchema>;
