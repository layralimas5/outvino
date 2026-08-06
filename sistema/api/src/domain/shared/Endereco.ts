import { z } from 'zod';

export const enderecoSchema = z.object({
  cep: z.string().optional(),
  logradouro: z.string().min(3, 'Informe a rua.'),
  numero: z.string().min(1, 'Informe o número.'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Informe o bairro.'),
  cidade: z.string().min(2, 'Informe a cidade.'),
  uf: z.string().length(2, 'UF tem 2 letras.').toUpperCase(),
  /** "Portão azul ao lado da padaria" — quem entrega usa mais isso que o CEP. */
  referencia: z.string().optional(),
});

export type Endereco = z.infer<typeof enderecoSchema>;

export function enderecoEmUmaLinha(endereco: Endereco): string {
  const partes = [
    `${endereco.logradouro}, ${endereco.numero}`,
    endereco.complemento,
    endereco.bairro,
    `${endereco.cidade}/${endereco.uf}`,
  ];
  return partes.filter(Boolean).join(' · ');
}

/** Data no formato AAAA-MM-DD. Usado em vencimento, aniversário e entrega. */
export const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.');
