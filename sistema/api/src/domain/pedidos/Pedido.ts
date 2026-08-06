import { z } from 'zod';
import { enderecoSchema, type Endereco } from '../shared/Endereco.js';

/**
 * O fluxo de um pedido:
 *
 * `rascunho` — chegou do carrinho, ninguém confirmou que vai pagar.
 * `confirmado` — a loja aceitou. **É aqui que o estoque baixa.**
 * `separando` → `enviado` → `entregue` — logística.
 * `cancelado` — se já tinha baixado estoque, devolve.
 */
export const statusDePedido = [
  'rascunho',
  'confirmado',
  'separando',
  'enviado',
  'entregue',
  'cancelado',
] as const;

export type StatusDePedido = (typeof statusDePedido)[number];

/** Pra onde cada status pode ir. Vazio significa fim de linha. */
const TRANSICOES: Record<StatusDePedido, readonly StatusDePedido[]> = {
  rascunho: ['confirmado', 'cancelado'],
  confirmado: ['separando', 'enviado', 'entregue', 'cancelado'],
  separando: ['enviado', 'entregue', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
};

export function podeIrPara(atual: StatusDePedido, destino: StatusDePedido): boolean {
  return TRANSICOES[atual].includes(destino);
}

/** Depois de confirmado, as unidades já saíram do estoque. */
export function reservaEstoque(status: StatusDePedido): boolean {
  return status !== 'rascunho' && status !== 'cancelado';
}

export interface ItemDePedido {
  produtoId: string;
  /** Snapshot de nome e preço: mudar o produto depois não reescreve a venda. */
  nome: string;
  precoUnitarioCentavos: number;
  quantidade: number;
  subtotalCentavos: number;
}

export interface EventoDePedido {
  em: string;
  status: StatusDePedido;
  por: string;
  observacao?: string;
}

export interface Pedido {
  id: string;
  /** Número curto pro cliente citar no WhatsApp ("pedido 1042"). */
  numero: number;
  cliente: {
    nome: string;
    telefone: string;
    email?: string;
  };
  itens: ItemDePedido[];
  subtotalCentavos: number;
  cupomCodigo?: string;
  descontoCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  tipoEntrega: 'retirada' | 'entrega';
  endereco?: Endereco;
  observacao?: string;
  status: StatusDePedido;
  origem: 'site' | 'manual';
  historico: EventoDePedido[];
  criadoEm: string;
  atualizadoEm: string;
}

export const itemDePedidoSchema = z.object({
  produtoId: z.string().min(1),
  quantidade: z.number().int().positive('Quantidade precisa ser pelo menos 1.'),
});

export const criarPedidoSchema = z
  .object({
    cliente: z.object({
      nome: z.string().min(2, 'Informe o nome do cliente.'),
      telefone: z.string().min(10, 'Informe DDD + telefone.'),
      email: z.email('E-mail inválido.').optional(),
    }),
    itens: z.array(itemDePedidoSchema).min(1, 'O pedido precisa de pelo menos um item.'),
    cupomCodigo: z.string().optional(),
    frete: z.number().nonnegative().default(0),
    tipoEntrega: z.enum(['retirada', 'entrega']).default('retirada'),
    endereco: enderecoSchema.optional(),
    observacao: z.string().max(500).optional(),
    /** Pedido de balcão já nasce confirmado; o do site nasce rascunho. */
    confirmar: z.boolean().default(false),
  })
  .refine((dado) => dado.tipoEntrega !== 'entrega' || Boolean(dado.endereco), {
    message: 'Entrega precisa de endereço.',
    path: ['endereco'],
  });

export const mudarStatusSchema = z.object({
  status: z.enum(statusDePedido),
  observacao: z.string().max(300).optional(),
});

export type CriarPedidoInput = z.infer<typeof criarPedidoSchema>;
export type MudarStatusInput = z.infer<typeof mudarStatusSchema>;

export interface FiltroPedidos {
  status?: StatusDePedido;
  origem?: 'site' | 'manual';
  busca?: string;
  /** AAAA-MM-DD; compara com a data de criação. */
  desde?: string;
  ate?: string;
}
