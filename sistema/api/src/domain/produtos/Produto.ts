import { z } from 'zod';

/** Mesmos valores que o site conhece em `site/src/content.config.ts`. */
export const tipos = ['Tinto', 'Branco', 'Rosé', 'Espumante', 'Sobremesa', 'Kit'] as const;

export type Tipo = (typeof tipos)[number];

export interface Produto {
  /** Slug. Vira a URL no site (`/vinhos/<id>/`), então NÃO muda depois de publicado. */
  id: string;
  nome: string;
  tipo: Tipo;
  pais: string;
  regiao?: string;
  uva?: string;
  vinicola?: string;
  safra?: number;
  volumeMl?: number;
  teor?: string;
  sku?: string;

  /**
   * Ficha técnica do rótulo. Tudo opcional: a ficha do site só mostra o que
   * existir, e campo em branco some em vez de virar "—".
   */
  classificacao?: string;
  amadurecimento?: string;
  temperaturaServico?: string;
  potencialGuarda?: string;

  /** Análise sensorial, do jeito que a vinícola descreve. */
  visual?: string;
  olfativo?: string;
  gustativo?: string;

  precoCentavos: number;
  /** Preço riscado ao lado. Só faz sentido se for maior que o preço atual. */
  precoDeCentavos?: number;
  /** Quanto a loja pagou. Nunca sai no catálogo do site. */
  custoCentavos?: number;

  descricao: string;
  notas: string[];
  harmonizacao: string[];

  /** Caminho da imagem servida pelo site (`/img/vinhos/x.jpg`) ou URL absoluta. */
  imagem?: string;
  destaque: boolean;
  /** Fora do ar no site, mas continua vendável no balcão. */
  publicadoNoSite: boolean;

  estoque: number;
  /** No mínimo ou abaixo dele, o produto entra na lista de reposição. */
  estoqueMinimo: number;

  criadoEm: string;
  atualizadoEm: string;
}

const reais = z.number().positive('Precisa ser maior que zero.');

export const criarProdutoSchema = z
  .object({
    /** Se não vier, é gerado a partir do nome. */
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'O id só aceita letras minúsculas, números e hífen.')
      .optional(),
    nome: z.string().min(2, 'Informe o nome do produto.'),
    tipo: z.enum(tipos),
    pais: z.string().min(2, 'Informe o país.'),
    regiao: z.string().optional(),
    uva: z.string().optional(),
    vinicola: z.string().optional(),
    safra: z.number().int().min(1900).max(2100).optional(),
    volumeMl: z.number().int().positive().optional(),
    teor: z.string().optional(),
    sku: z.string().optional(),

    classificacao: z.string().optional(),
    amadurecimento: z.string().optional(),
    temperaturaServico: z.string().optional(),
    potencialGuarda: z.string().optional(),
    visual: z.string().optional(),
    olfativo: z.string().optional(),
    gustativo: z.string().optional(),

    /** Em reais na entrada; convertido pra centavos no caso de uso. */
    preco: reais,
    precoDe: reais.optional(),
    custo: z.number().nonnegative().optional(),

    descricao: z.string().min(10, 'A descrição precisa de pelo menos 10 caracteres.'),
    notas: z.array(z.string()).default([]),
    harmonizacao: z.array(z.string()).default([]),

    imagem: z.string().optional(),
    destaque: z.boolean().default(false),
    publicadoNoSite: z.boolean().default(true),

    /** Estoque inicial. Depois só muda por movimento, nunca por edição direta. */
    estoque: z.number().int().nonnegative().default(0),
    estoqueMinimo: z.number().int().nonnegative().default(3),
  })
  .refine((dado) => dado.precoDe === undefined || dado.precoDe > dado.preco, {
    message: 'O preço "de" precisa ser maior que o preço de venda.',
    path: ['precoDe'],
  });

/** `id` e `estoque` ficam de fora: um é imutável, o outro só muda por movimento. */
export const atualizarProdutoSchema = z
  .object({
    nome: z.string().min(2).optional(),
    tipo: z.enum(tipos).optional(),
    pais: z.string().min(2).optional(),
    regiao: z.string().optional(),
    uva: z.string().optional(),
    vinicola: z.string().optional(),
    safra: z.number().int().min(1900).max(2100).optional(),
    volumeMl: z.number().int().positive().optional(),
    teor: z.string().optional(),
    sku: z.string().optional(),
    classificacao: z.string().optional(),
    amadurecimento: z.string().optional(),
    temperaturaServico: z.string().optional(),
    potencialGuarda: z.string().optional(),
    visual: z.string().optional(),
    olfativo: z.string().optional(),
    gustativo: z.string().optional(),
    preco: reais.optional(),
    /** Zero limpa a promoção — é como o painel tira o preço riscado. */
    precoDe: z.number().nonnegative().optional(),
    custo: z.number().nonnegative().optional(),
    descricao: z.string().min(10).optional(),
    notas: z.array(z.string()).optional(),
    harmonizacao: z.array(z.string()).optional(),
    imagem: z.string().optional(),
    destaque: z.boolean().optional(),
    publicadoNoSite: z.boolean().optional(),
    estoqueMinimo: z.number().int().nonnegative().optional(),
  })
  .strict();

export type CriarProdutoInput = z.infer<typeof criarProdutoSchema>;
export type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>;

export interface FiltroProdutos {
  busca?: string;
  tipo?: Tipo;
  pais?: string;
  publicadoNoSite?: boolean;
  destaque?: boolean;
  /** Só os que estão no mínimo ou abaixo. */
  abaixoDoMinimo?: boolean;
  semEstoque?: boolean;
}

export interface ProdutoRepository {
  listar(filtro?: FiltroProdutos): Promise<Produto[]>;
  buscarPorId(id: string): Promise<Produto | null>;
  exigirPorId(id: string): Promise<Produto>;
  buscarPorSku(sku: string): Promise<Produto | null>;
  salvar(produto: Produto): Promise<Produto>;
  alterar(id: string, mutar: (produto: Produto) => void): Promise<Produto>;
  remover(id: string): Promise<void>;
}

/** O site mostra "esgotado" a partir daqui, sem campo manual pra esquecer de virar. */
export function disponivel(produto: Produto): boolean {
  return produto.estoque > 0;
}

export function precisaRepor(produto: Produto): boolean {
  return produto.estoque <= produto.estoqueMinimo;
}

export function emPromocao(produto: Produto): boolean {
  return produto.precoDeCentavos !== undefined && produto.precoDeCentavos > produto.precoCentavos;
}
