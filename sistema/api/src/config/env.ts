import { resolve } from 'node:path';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATA_DIR: z.string().default('./dados'),
  /**
   * Onde os dados ficam. `arquivo` exige disco persistente; `blobs` usa o
   * Netlify Blobs e é o que permite rodar em função serverless.
   */
  ARMAZENAMENTO: z.enum(['arquivo', 'blobs']).default('arquivo'),
  /**
   * Pasta com o painel já buildado. Existindo, a API serve o painel no mesmo
   * endereço — um serviço só pra publicar, sem CORS e sem duas URLs.
   */
  PASTA_DO_PAINEL: z.string().default('../painel/dist'),
  ORIGENS_PERMITIDAS: z.string().default('http://localhost:5173,http://localhost:4321'),
  /** Chave que o carrinho do site manda pra criar pedido. Vazia desliga a rota. */
  CHAVE_SITE: z.string().default(''),
  /**
   * Senha de acesso ao painel. Preenchida, liga a autenticação; vazia, o painel
   * fica aberto (só aceitável em desenvolvimento — em produção as rotas de
   * gestão se fecham sozinhas).
   */
  SENHA_PAINEL: z.string().default(''),
  /**
   * Segredo que assina o cookie de sessão. Opcional: sem ele, a chave é
   * derivada da própria senha — o efeito colateral é bom, trocar a senha
   * invalida as sessões abertas.
   */
  SEGREDO_SESSAO: z.string().default(''),
  /** Duração da sessão. Curta o bastante pra um balcão, longa pra um expediente. */
  SESSAO_HORAS: z.coerce.number().int().positive().max(720).default(12),
});

/**
 * Senha curta com hash rápido é senha quebrada em minutos. Como a chave de
 * assinatura pode ser derivada dela, o mínimo é maior que o de um login comum.
 */
const MINIMO_DA_SENHA = 12;

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', z.treeifyError(parsed.error));
  process.exit(1);
}

const bruto = parsed.data;
const producao = bruto.NODE_ENV === 'production';
const senhaDoPainel = bruto.SENHA_PAINEL.trim();

if (senhaDoPainel && senhaDoPainel.length < MINIMO_DA_SENHA) {
  console.error(
    `SENHA_PAINEL precisa ter pelo menos ${MINIMO_DA_SENHA} caracteres. Subir com senha fraca é pior que subir sem senha, porque dá falsa sensação de proteção.`,
  );
  process.exit(1);
}

const autenticacaoLigada = senhaDoPainel.length > 0;

/**
 * Sem `SENHA_PAINEL`, quem alcança a URL lê pedido, cliente e faturamento. Em
 * desenvolvimento isso é conveniência; em produção as rotas de gestão respondem
 * 503 até a senha existir — o mesmo critério da integração do site: faltar é
 * melhor do que ficar aberto.
 */
if (!autenticacaoLigada) {
  console.warn(
    producao
      ? '\n  PAINEL FECHADO: falta SENHA_PAINEL.\n' +
          '  As rotas de gestão respondem 503 até a variável ser configurada.\n'
      : '\n  Painel sem autenticação (SENHA_PAINEL vazia). Vale só em desenvolvimento.\n',
  );
}

export const env = {
  ambiente: bruto.NODE_ENV,
  producao,
  porta: bruto.PORT,
  dataDir: resolve(process.cwd(), bruto.DATA_DIR),
  armazenamento: bruto.ARMAZENAMENTO,
  pastaDoPainel: resolve(process.cwd(), bruto.PASTA_DO_PAINEL),
  origensPermitidas: bruto.ORIGENS_PERMITIDAS.split(',')
    .map((origem) => origem.trim())
    .filter(Boolean),
  chaveSite: bruto.CHAVE_SITE,
  autenticacaoLigada,
  senhaDoPainel,
  segredoDaSessao: bruto.SEGREDO_SESSAO.trim(),
  sessaoEmHoras: bruto.SESSAO_HORAS,
} as const;
