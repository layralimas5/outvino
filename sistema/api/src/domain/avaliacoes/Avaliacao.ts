import { z } from 'zod';

/**
 * Avaliação de produto escrita por cliente.
 *
 * Nasce `pendente` e **só aparece no site depois que a loja publica**. Nada
 * entra sozinho: comentário em página pública é responsabilidade da loja, e
 * nota inventada não existe aqui — se ninguém avaliou, o produto não tem
 * estrela nenhuma.
 */
export const statusDeAvaliacao = ['pendente', 'publicada', 'recusada'] as const;

export type StatusDeAvaliacao = (typeof statusDeAvaliacao)[number];

export interface Avaliacao {
  id: string;
  produtoId: string;
  /** Nome que aparece no site. Só o primeiro nome + inicial, montado no envio. */
  autor: string;
  /** Guardado pra conferir a compra e responder; **nunca** vai pro catálogo. */
  email?: string;
  nota: number;
  titulo?: string;
  comentario: string;
  /**
   * O e-mail bate com um pedido confirmado que tem esse produto. É um selo que
   * a loja não digita: ou o histórico prova, ou não aparece.
   */
  compraVerificada: boolean;
  status: StatusDeAvaliacao;
  /** Resposta pública da loja embaixo do comentário. */
  resposta?: string;
  criadoEm: string;
  atualizadoEm: string;
  moderadoPor?: string;
}

export const NOTA_MINIMA = 1;
export const NOTA_MAXIMA = 5;

export const criarAvaliacaoSchema = z.object({
  produtoId: z.string().min(1, 'Diga qual produto está sendo avaliado.'),
  autor: z.string().trim().min(2, 'Informe seu nome.').max(60),
  email: z.email('E-mail inválido.').optional(),
  nota: z
    .number()
    .int('A nota vai de 1 a 5.')
    .min(NOTA_MINIMA, 'A nota vai de 1 a 5.')
    .max(NOTA_MAXIMA, 'A nota vai de 1 a 5.'),
  titulo: z.string().trim().max(80).optional(),
  comentario: z
    .string()
    .trim()
    .min(10, 'Escreva um pouco mais sobre o vinho.')
    .max(1200, 'Ficou longo demais. Resuma em até 1200 caracteres.'),
});

export const moderarAvaliacaoSchema = z
  .object({
    status: z.enum(statusDeAvaliacao).optional(),
    resposta: z.string().trim().max(600).optional(),
  })
  .strict()
  .refine((dado) => dado.status !== undefined || dado.resposta !== undefined, {
    message: 'Nada pra mudar.',
  });

export type CriarAvaliacaoInput = z.infer<typeof criarAvaliacaoSchema>;
export type ModerarAvaliacaoInput = z.infer<typeof moderarAvaliacaoSchema>;

export interface FiltroAvaliacoes {
  produtoId?: string;
  status?: StatusDeAvaliacao;
}

/** Média e contagem de um conjunto de avaliações já publicadas. */
export interface ResumoDeAvaliacoes {
  /** Uma casa decimal. Zero quando ninguém avaliou. */
  media: number;
  total: number;
  /** Quantas de cada nota, de 1 a 5 — é o gráfico de barras da página. */
  distribuicao: Record<number, number>;
}

export function resumir(avaliacoes: Avaliacao[]): ResumoDeAvaliacoes {
  const distribuicao: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const avaliacao of avaliacoes) {
    distribuicao[avaliacao.nota] = (distribuicao[avaliacao.nota] ?? 0) + 1;
  }

  if (avaliacoes.length === 0) return { media: 0, total: 0, distribuicao };

  const soma = avaliacoes.reduce((total, avaliacao) => total + avaliacao.nota, 0);
  return {
    media: Math.round((soma / avaliacoes.length) * 10) / 10,
    total: avaliacoes.length,
    distribuicao,
  };
}

/**
 * "Maria Fernanda Silva" vira "Maria S.". O comentário é público e o nome
 * inteiro de quem comprou não precisa estar num CDN.
 */
export function nomePublico(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeiro = partes[0] ?? '';
  const sobrenome = partes.length > 1 ? partes[partes.length - 1] : undefined;
  return sobrenome ? `${primeiro} ${sobrenome[0]?.toUpperCase()}.` : primeiro;
}

export interface AvaliacaoRepository {
  listar(filtro?: FiltroAvaliacoes): Promise<Avaliacao[]>;
  buscarPorId(id: string): Promise<Avaliacao | null>;
  exigirPorId(id: string): Promise<Avaliacao>;
  salvar(avaliacao: Avaliacao): Promise<Avaliacao>;
  alterar(id: string, mutar: (avaliacao: Avaliacao) => void): Promise<Avaliacao>;
  remover(id: string): Promise<void>;
}
