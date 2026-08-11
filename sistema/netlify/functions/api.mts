import serverless from 'serverless-http';
import { criarDeps } from '../../api/dist/infra/container.js';
import { criarServidor } from '../../api/dist/infra/http/server.js';

/**
 * A API inteira dentro de uma função da Netlify.
 *
 * O mesmo app Express que roda em VPS roda aqui — o que muda é só o
 * armazenamento: em vez de arquivos em disco (que a Netlify descarta a cada
 * invocação), usa Netlify Blobs. Foi pra isso que o storage virou interface.
 *
 * Formato **v2** (default export com Request/Response) e não o `handler`
 * legado: o contexto do Netlify Blobs só é injetado nas funções v2. No formato
 * antigo, `getStore` estoura MissingBlobsEnvironmentError em produção.
 */
export const config = {
  path: '/api/*',
};

const app = criarServidor(criarDeps('', 'blobs'));

/** serverless-http fala o dialeto de evento da AWS; a ponte fica contida aqui. */
const executar = serverless(app, { provider: 'aws' });

/**
 * Status que **não podem** ter corpo.
 *
 * O `serverless-http` devolve `body: ''` mesmo num 204, e o construtor de
 * `Response` recusa qualquer corpo nesses status — nem string vazia passa. Sem
 * este filtro a função estourava TypeError **depois** de o Express já ter feito
 * o trabalho: o produto era excluído, o cupom apagado, a sessão encerrada, e
 * mesmo assim o painel recebia 502. Erro que só aparece em produção, porque em
 * desenvolvimento o Express responde direto, sem passar por esta ponte.
 */
const SEM_CORPO = new Set([204, 205, 304]);

interface RespostaDaPonte {
  statusCode: number;
  headers?: Record<string, string | number | boolean>;
  multiValueHeaders?: Record<string, (string | number | boolean)[]>;
  body?: string;
  isBase64Encoded?: boolean;
}

export default async function api(requisicao: Request): Promise<Response> {
  const url = new URL(requisicao.url);
  const temCorpo = requisicao.method !== 'GET' && requisicao.method !== 'HEAD';

  const evento = {
    httpMethod: requisicao.method,
    // O caminho já vem original (/api/...), que é onde as rotas estão montadas.
    path: url.pathname,
    queryStringParameters: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(requisicao.headers),
    body: temCorpo ? await requisicao.text() : null,
    isBase64Encoded: false,
  };

  const resposta = (await executar(evento, {})) as RespostaDaPonte;

  const cabecalhos = new Headers();
  for (const [nome, valor] of Object.entries(resposta.headers ?? {})) {
    cabecalhos.set(nome, String(valor));
  }
  // Set-Cookie e afins chegam por aqui, um valor por linha.
  for (const [nome, valores] of Object.entries(resposta.multiValueHeaders ?? {})) {
    for (const valor of valores) cabecalhos.append(nome, String(valor));
  }

  const corpo = SEM_CORPO.has(resposta.statusCode)
    ? null
    : resposta.isBase64Encoded
      ? Buffer.from(resposta.body ?? '', 'base64')
      : (resposta.body ?? null);

  return new Response(corpo, { status: resposta.statusCode, headers: cabecalhos });
}
