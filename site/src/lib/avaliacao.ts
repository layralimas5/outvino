import { API } from '../config/site';

/**
 * Envio de avaliação pro sistema.
 *
 * Diferente do carrinho, aqui **não** existe plano B: se a API estiver fora, a
 * pessoa precisa saber que o texto não foi gravado, senão escreve e perde.
 */
export const avaliacaoLigada = Boolean(API.url && API.chave);

export interface NovaAvaliacao {
  produtoId: string;
  autor: string;
  email?: string;
  nota: number;
  titulo?: string;
  comentario: string;
}

interface RespostaDeErro {
  erro?: { mensagem?: string };
}

export async function enviarAvaliacao(dados: NovaAvaliacao): Promise<string> {
  if (!avaliacaoLigada) {
    throw new Error('As avaliações estão fora do ar agora. Tenta de novo mais tarde.');
  }

  let resposta: Response;

  try {
    resposta = await fetch(`${API.url}/api/publico/avaliacoes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-chave-site': API.chave },
      body: JSON.stringify(dados),
    });
  } catch {
    throw new Error('Não consegui falar com o servidor. Confere a conexão e tenta de novo.');
  }

  const texto = await resposta.text();
  const corpo: unknown = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    throw new Error(
      (corpo as RespostaDeErro)?.erro?.mensagem ?? 'Não consegui enviar sua avaliação.',
    );
  }

  return (
    (corpo as { mensagem?: string })?.mensagem ??
    'Recebemos sua avaliação. Ela aparece no site depois que a gente ler.'
  );
}
