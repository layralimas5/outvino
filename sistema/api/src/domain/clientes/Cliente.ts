import { z } from 'zod';
import { dataSchema, enderecoSchema, type Endereco } from '../shared/Endereco.js';
import { documentoValido } from '../../shared/texto.js';

/**
 * Cliente cadastrado à mão pela loja.
 *
 * A ficha do CRM continua nascendo dos pedidos — o cadastro **não substitui**
 * esse cálculo, ele completa. É onde entra o que nenhum pedido conta: CPF,
 * aniversário, endereço de sempre, do que a pessoa gosta, o que combinaram por
 * telefone. Quem nunca comprou também cabe aqui: a loja conhece gente antes da
 * primeira venda.
 *
 * A chave é o telefone normalizado, a mesma que agrupa os pedidos. É o que faz
 * cadastro e histórico caírem na mesma ficha em vez de virarem duas pessoas.
 */
export interface ClienteCadastrado {
  /** Telefone normalizado com DDI (`5527998541983`). Também é o id. */
  id: string;
  nome: string;
  email?: string;
  /** CPF ou CNPJ, só dígitos. Guardado quando a nota precisa dele. */
  documento?: string;
  /** AAAA-MM-DD. Serve pra lembrar de mandar algo no aniversário. */
  nascimento?: string;
  endereco?: Endereco;
  /** "Gosta de tinto seco, evita doce" — o que orienta a próxima indicação. */
  preferencias?: string;
  observacao?: string;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
}

const documentoOpcional = z
  .string()
  .trim()
  .optional()
  .refine((valor) => !valor || documentoValido(valor), 'CPF ou CNPJ inválido.');

export const criarClienteSchema = z
  .object({
    nome: z.string().trim().min(2, 'Informe o nome.').max(80),
    telefone: z.string().min(10, 'Informe DDD + telefone.'),
    email: z.email('E-mail inválido.').optional(),
    documento: documentoOpcional,
    nascimento: dataSchema.optional(),
    endereco: enderecoSchema.optional(),
    preferencias: z.string().trim().max(300).optional(),
    observacao: z.string().trim().max(600).optional(),
  })
  .strict();

/**
 * O telefone não muda: ele é a chave que liga o cadastro ao histórico de
 * pedidos. Trocar o número aqui desgrudaria a ficha das compras dela — pra
 * isso, cadastre a pessoa de novo no número certo.
 */
export const atualizarClienteSchema = criarClienteSchema.omit({ telefone: true }).partial();

export type CriarClienteInput = z.infer<typeof criarClienteSchema>;
export type AtualizarClienteInput = z.infer<typeof atualizarClienteSchema>;
