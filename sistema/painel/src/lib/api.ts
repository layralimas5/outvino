/**
 * Cliente HTTP da API. O Vite faz proxy de `/api` pro backend em dev, e em
 * produção o painel é servido do mesmo host — então não existe URL de servidor
 * espalhada pelo código.
 */

/**
 * Nome de quem está operando **quando a API roda sem autenticação** (só
 * desenvolvimento). Com senha configurada, quem assina é a sessão do cookie e
 * esse cabeçalho é ignorado pelo servidor.
 */
const CHAVE_OPERADOR = 'outvino:operador';

/**
 * Sessão vencida no meio do uso não pode virar "erro ao carregar" em cada tela.
 * A requisição avisa por evento e o provedor de sessão devolve pro login.
 */
export const EVENTO_SESSAO_EXPIRADA = 'outvino:sessao-expirada';

export function operadorAtual(): string {
  return localStorage.getItem(CHAVE_OPERADOR) ?? '';
}

export function definirOperador(nome: string): void {
  if (nome.trim()) localStorage.setItem(CHAVE_OPERADOR, nome.trim());
  else localStorage.removeItem(CHAVE_OPERADOR);
}

/** Erro da API já com a mensagem que o back escreveu, pronta pra tela. */
export class ErroDaApi extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
    readonly codigo?: string,
  ) {
    super(mensagem);
    this.name = 'ErroDaApi';
  }
}

interface RespostaDeErro {
  erro?: { codigo?: string; mensagem?: string };
}

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  const operador = operadorAtual();

  try {
    resposta = await fetch(`/api${caminho}`, {
      ...init,
      // O cookie de sessão é httpOnly: só chega se a requisição pedir.
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        ...(operador ? { 'x-operador': operador } : {}),
        ...init?.headers,
      },
    });
  } catch {
    // Rede fora ou API desligada: mensagem útil em vez de "Failed to fetch".
    throw new ErroDaApi(0, 'Não consegui falar com o servidor. A API está rodando?');
  }

  if (resposta.status === 204) return undefined as T;

  const texto = await resposta.text();
  const dado: unknown = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    const corpo = dado as RespostaDeErro;

    // O login responde 401 também, e ali quem trata é a própria tela.
    if (resposta.status === 401 && caminho !== '/sessao') {
      window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA));
    }

    throw new ErroDaApi(
      resposta.status,
      corpo?.erro?.mensagem ?? 'Algo deu errado.',
      corpo?.erro?.codigo,
    );
  }

  return dado as T;
}

/** Monta a query string ignorando filtro vazio. */
export function query(filtros: Record<string, string | number | boolean | undefined>): string {
  const partes = Object.entries(filtros)
    .filter(([, valor]) => valor !== undefined && valor !== '')
    .map(([chave, valor]) => `${chave}=${encodeURIComponent(String(valor))}`);
  return partes.length ? `?${partes.join('&')}` : '';
}

export const api = {
  get: <T,>(caminho: string) => requisitar<T>(caminho),
  post: <T,>(caminho: string, corpo?: unknown) =>
    requisitar<T>(caminho, { method: 'POST', body: JSON.stringify(corpo ?? {}) }),
  patch: <T,>(caminho: string, corpo: unknown) =>
    requisitar<T>(caminho, { method: 'PATCH', body: JSON.stringify(corpo) }),
  remover: (caminho: string) => requisitar<void>(caminho, { method: 'DELETE' }),
};
