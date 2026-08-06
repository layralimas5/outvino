import { Router } from 'express';
import { z } from 'zod';
import { criarAvaliacao } from '../../../application/avaliacoes/casosDeUso.js';
import { catalogoDoSite } from '../../../application/catalogo/catalogoDoSite.js';
import { aplicarCupom } from '../../../application/cupons/casosDeUso.js';
import { criarPedido } from '../../../application/pedidos/casosDeUso.js';
import { criarAvaliacaoSchema } from '../../../domain/avaliacoes/Avaliacao.js';
import { enderecoSchema } from '../../../domain/shared/Endereco.js';
import { reaisParaCentavos, centavosParaReais } from '../../../shared/dinheiro.js';
import type { Deps } from '../../container.js';
import { autenticarSite } from '../middlewares.js';

const pedidoDoSiteSchema = z
  .object({
    cliente: z.object({
      nome: z.string().min(2, 'Informe seu nome.'),
      telefone: z.string().min(10, 'Informe DDD + telefone.'),
      email: z.email('E-mail inválido.').optional(),
    }),
    itens: z
      .array(
        z.object({
          produtoId: z.string().min(1),
          quantidade: z.number().int().positive(),
        }),
      )
      .min(1, 'Carrinho vazio.'),
    cupomCodigo: z.string().optional(),
    tipoEntrega: z.enum(['retirada', 'entrega']).default('retirada'),
    endereco: enderecoSchema.optional(),
    observacao: z.string().max(500).optional(),
  })
  .refine((dado) => dado.tipoEntrega !== 'entrega' || Boolean(dado.endereco), {
    message: 'Entrega precisa de endereço.',
    path: ['endereco'],
  });

const conferirCupomSchema = z.object({
  codigo: z.string().min(3),
  subtotal: z.number().positive(),
});

/**
 * O que o site consome. Fica fora do painel porque quem chama é o build do
 * site e o navegador do cliente, não alguém com acesso ao back-office.
 */
export function rotasPublicas(deps: Deps): Router {
  const rotas = Router();

  /** Fonte da verdade do catálogo. Nunca inclui custo, margem nem saldo. */
  rotas.get('/catalogo', async (_req, res) => {
    res.json(await catalogoDoSite(deps));
  });

  /** Confere o cupom digitado no carrinho. Não consome uso. */
  rotas.post('/cupom', autenticarSite, async (req, res) => {
    const entrada = conferirCupomSchema.parse(req.body);
    const { cupom, descontoCentavos } = await aplicarCupom(
      deps,
      entrada.codigo,
      reaisParaCentavos(entrada.subtotal),
    );

    res.json({
      codigo: cupom.id,
      descricao: cupom.descricao,
      desconto: centavosParaReais(descontoCentavos),
    });
  });

  /**
   * Pedido vindo do carrinho. Entra como **rascunho** de propósito: ninguém
   * confirmou que a pessoa vai pagar, então o estoque não pode sair sozinho.
   * A loja confirma no painel e aí sim as unidades baixam.
   */
  rotas.post('/pedidos', autenticarSite, async (req, res) => {
    const entrada = pedidoDoSiteSchema.parse(req.body);

    const pedido = await criarPedido(
      deps,
      {
        cliente: entrada.cliente,
        itens: entrada.itens,
        cupomCodigo: entrada.cupomCodigo,
        frete: 0,
        tipoEntrega: entrada.tipoEntrega,
        endereco: entrada.endereco,
        observacao: entrada.observacao,
        confirmar: false,
      },
      'site',
      'site',
    );

    res.status(201).json({
      id: pedido.id,
      numero: pedido.numero,
      status: pedido.status,
      total: centavosParaReais(pedido.totalCentavos),
      desconto: centavosParaReais(pedido.descontoCentavos),
    });
  });

  /**
   * Avaliação escrita pelo cliente na página do produto. Entra como
   * **pendente**: comentário em página pública só aparece depois que a loja
   * lê e publica no painel.
   */
  rotas.post('/avaliacoes', autenticarSite, async (req, res) => {
    const entrada = criarAvaliacaoSchema.parse(req.body);
    const { status } = await criarAvaliacao(deps, entrada);

    res.status(201).json({
      status,
      mensagem: 'Recebemos sua avaliação. Ela aparece no site depois que a gente ler.',
    });
  });

  return rotas;
}
