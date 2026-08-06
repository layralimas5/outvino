/**
 * O que a API devolve, do jeito que ela devolve. Dinheiro chega em **reais**
 * (a conversão de centavos acontece na borda do back).
 */

export type Tipo = 'Tinto' | 'Branco' | 'Rosé' | 'Espumante' | 'Sobremesa' | 'Kit';

export const TIPOS: Tipo[] = ['Tinto', 'Branco', 'Rosé', 'Espumante', 'Sobremesa', 'Kit'];

export interface Produto {
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
  classificacao?: string;
  amadurecimento?: string;
  temperaturaServico?: string;
  potencialGuarda?: string;
  visual?: string;
  olfativo?: string;
  gustativo?: string;
  preco: number;
  precoDe?: number;
  custo?: number;
  margem?: number;
  descricao: string;
  notas: string[];
  harmonizacao: string[];
  imagem?: string;
  destaque: boolean;
  publicadoNoSite: boolean;
  estoque: number;
  estoqueMinimo: number;
  aRepor: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoDeMovimento = 'entrada' | 'saida' | 'perda' | 'ajuste';

export interface Movimento {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: TipoDeMovimento;
  quantidade: number;
  saldoDepois: number;
  motivo?: string;
  pedidoId?: string;
  usuarioId: string;
  criadoEm: string;
}

export type StatusDePedido =
  | 'rascunho'
  | 'confirmado'
  | 'separando'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export const STATUS: StatusDePedido[] = [
  'rascunho',
  'confirmado',
  'separando',
  'enviado',
  'entregue',
  'cancelado',
];

/** Rótulo e cor de cada status. Fonte única pra badge e filtro não divergirem. */
export const ROTULO_DO_STATUS: Record<StatusDePedido, { texto: string; classe: string }> = {
  rascunho: { texto: 'Novo do site', classe: 'bg-amber-100 text-amber-900 ring-amber-200' },
  confirmado: { texto: 'Confirmado', classe: 'bg-sky-100 text-sky-900 ring-sky-200' },
  separando: { texto: 'Separando', classe: 'bg-indigo-100 text-indigo-900 ring-indigo-200' },
  enviado: { texto: 'Enviado', classe: 'bg-violet-100 text-violet-900 ring-violet-200' },
  entregue: { texto: 'Entregue', classe: 'bg-emerald-100 text-emerald-900 ring-emerald-200' },
  cancelado: { texto: 'Cancelado', classe: 'bg-stone-200 text-stone-600 ring-stone-300' },
};

/** Pra onde cada status pode ir. Espelha as regras do domínio na API. */
export const PROXIMOS_STATUS: Record<StatusDePedido, StatusDePedido[]> = {
  rascunho: ['confirmado', 'cancelado'],
  confirmado: ['separando', 'enviado', 'entregue', 'cancelado'],
  separando: ['enviado', 'entregue', 'cancelado'],
  enviado: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
};

export interface ItemDePedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Endereco {
  cep?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  referencia?: string;
}

export interface Pedido {
  id: string;
  numero: number;
  cliente: { nome: string; telefone: string; email?: string };
  itens: ItemDePedido[];
  subtotal: number;
  cupomCodigo?: string;
  desconto: number;
  frete: number;
  total: number;
  tipoEntrega: 'retirada' | 'entrega';
  endereco?: Endereco;
  observacao?: string;
  status: StatusDePedido;
  origem: 'site' | 'manual';
  historico: Array<{ em: string; status: StatusDePedido; por: string; observacao?: string }>;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Cupom {
  id: string;
  descricao?: string;
  tipo: 'percentual' | 'valor';
  valor: number;
  minimo: number;
  validoAte?: string;
  usosMaximos?: number;
  usos: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Banner {
  id: string;
  titulo: string;
  subtitulo?: string;
  eyebrow?: string;
  imagem?: string;
  ctaTexto?: string;
  ctaLink?: string;
  ordem: number;
  ativo: boolean;
}

export type CriterioDeSecao = 'destaques' | 'promocoes' | 'novidades' | 'tipo' | 'pais';

export interface Secao {
  id: string;
  titulo: string;
  subtitulo?: string;
  criterio: CriterioDeSecao;
  valor?: string;
  limite: number;
  ordem: number;
  ativo: boolean;
}

export interface Resumo {
  hoje: { pedidos: number; faturamentoCentavos: number };
  mes: { pedidos: number; faturamentoCentavos: number; ticketMedioCentavos: number };
  aguardando: { rascunhos: number; separando: number; enviados: number };
  avaliacoes: { pendentes: number };
  porStatus: Record<StatusDePedido, number>;
  faturamentoDiario: Array<{ dia: string; centavos: number }>;
  maisVendidos: Array<{ produtoId: string; nome: string; unidades: number; centavos: number }>;
  estoque: {
    produtos: number;
    unidades: number;
    valorEmCustoCentavos: number;
    aRepor: Array<{ id: string; nome: string; estoque: number; estoqueMinimo: number }>;
  };
}

/**
 * Fechamento do período. Dinheiro aqui chega em **centavos**, ao contrário do
 * resto da API: é relatório, não formulário, e nenhum valor destes é editado —
 * converter na borda só criaria arredondamento no meio do caminho.
 */
export interface Financeiro {
  periodo: { desde: string; ate: string; dias: number };
  pedidos: number;
  faturamentoCentavos: number;
  ticketMedioCentavos: number;
  subtotalCentavos: number;
  descontosCentavos: number;
  freteCentavos: number;
  custoCentavos: number;
  margemCentavos: number;
  margemPercentual: number;
  /** Unidades vendidas de produto sem custo cadastrado: a margem fica otimista. */
  unidadesSemCusto: number;
  porStatus: Record<StatusDePedido, number>;
  porDia: Array<{ dia: string; centavos: number; pedidos: number }>;
  porProduto: Array<{
    produtoId: string;
    nome: string;
    unidades: number;
    receitaCentavos: number;
    custoCentavos: number;
    margemCentavos: number;
    custoCompleto: boolean;
  }>;
  pipeline: { pedidos: number; centavos: number };
}

/** Ficha montada a partir dos pedidos. Não existe cadastro de cliente. */
export interface Cliente {
  telefone: string;
  nome: string;
  email?: string;
  cidade?: string;
  pedidos: number;
  totalCentavos: number;
  ticketMedioCentavos: number;
  primeiroEm: string;
  ultimoEm: string;
  diasSemComprar: number;
  rascunhos: number;
  cancelados: number;
  recorrente: boolean;
  preferido?: string;
}

export interface CarteiraDeClientes {
  resumo: {
    total: number;
    recorrentes: number;
    novosNoMes: number;
    sumidos: number;
    ticketMedioCentavos: number;
  };
  clientes: Cliente[];
}

/** O que a API diz de si mesma. Só flags: nenhuma senha ou chave passa por aqui. */
export interface Diagnostico {
  ambiente: 'development' | 'test' | 'production';
  armazenamento: 'arquivo' | 'blobs';
  dataDir: string | null;
  node: string;
  autenticacaoLigada: boolean;
  sessaoEmHoras: number;
  segredoDeSessaoProprio: boolean;
  origensPermitidas: string[];
  integracaoDoSiteLigada: boolean;
  painelServidoPelaApi: boolean;
  contextoDeBlobsInjetado: boolean;
  temSiteId: boolean;
  temToken: boolean;
}

export interface MapaDaApi {
  sistema: string;
  recursos: Record<string, string>;
}

export interface Operador {
  id: string;
  nome: string;
}

/** Como o painel entra: com senha, sem senha (dev) ou travado por configuração. */
export interface Sessao {
  autenticacaoLigada: boolean;
  /** API em produção sem `SENHA_PAINEL`: as rotas de gestão respondem 503. */
  configuracaoPendente: boolean;
  operador: Operador | null;
}

export type StatusDeAvaliacao = 'pendente' | 'publicada' | 'recusada';

export interface Avaliacao {
  id: string;
  produtoId: string;
  autor: string;
  email?: string;
  nota: number;
  titulo?: string;
  comentario: string;
  /** O e-mail bate com um pedido confirmado que tem esse produto. */
  compraVerificada: boolean;
  status: StatusDeAvaliacao;
  resposta?: string;
  criadoEm: string;
  atualizadoEm: string;
  moderadoPor?: string;
}
