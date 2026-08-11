import { type Request, Router } from 'express';
import { z } from 'zod';
import { env } from '../../../config/env.js';
import { ConfiguracaoPendente, MuitasTentativas, NaoAutenticado } from '../../../shared/erros.js';
import { operadorDaRequisicao } from '../contexto.js';
import { exigirJson } from '../middlewares.js';
import { criarToken, gravarCookie, limparCookie, senhaConfere } from '../sessao.js';

const loginSchema = z.object({
  nome: z.string().trim().min(2, 'Diga quem está operando.').max(60),
  senha: z.string().min(1, 'Informe a senha.'),
});

const LIMITE_DE_ERROS = 5;
const CASTIGO_EM_MINUTOS = 5;

/**
 * Trava simples de força bruta, em memória.
 *
 * Em função serverless a memória some junto com o container, então isso é
 * encarecimento de ataque, não garantia — a barreira de verdade é o `scrypt`
 * do login, que custa caro por tentativa. Persistir tentativa em Blobs
 * custaria uma escrita por request e não vale a troca aqui.
 */
const tentativas = new Map<string, { erros: number; liberaEm: number }>();

/**
 * `x-nf-client-connection-ip` é a Netlify quem escreve, na borda — não dá pra
 * forjar de fora, ao contrário de `x-forwarded-for`. Fora dela, sobra o IP do
 * socket. Sem nenhum dos dois, todo mundo cai no mesmo balde: a trava fica mais
 * rígida que o ideal, nunca mais frouxa.
 */
function chaveDaOrigem(req: Request): string {
  return req.header('x-nf-client-connection-ip') ?? req.ip ?? 'desconhecido';
}

function verificarTrava(chave: string): void {
  const registro = tentativas.get(chave);
  if (!registro) return;

  if (registro.liberaEm > Date.now()) {
    const faltam = Math.ceil((registro.liberaEm - Date.now()) / 60_000);
    throw new MuitasTentativas(`Muitas tentativas. Tente de novo em ${faltam} min.`);
  }

  // Castigo cumprido: zera pra não punir a próxima tentativa legítima.
  if (registro.liberaEm > 0) tentativas.delete(chave);
}

function registrarErro(chave: string): void {
  const registro = tentativas.get(chave) ?? { erros: 0, liberaEm: 0 };
  registro.erros += 1;
  if (registro.erros >= LIMITE_DE_ERROS) {
    registro.erros = 0;
    registro.liberaEm = Date.now() + CASTIGO_EM_MINUTOS * 60_000;
  }
  tentativas.set(chave, registro);
}

export function rotasDeSessao(): Router {
  const rotas = Router();

  /**
   * Quem está logado e em que modo o painel roda. É o primeiro request do
   * front: é daqui que ele decide entre a tela de login e a de nome livre.
   */
  rotas.get('/', (req, res) => {
    const configuracaoPendente = env.producao && !env.autenticacaoLigada && !env.painelAberto;

    /**
     * `req.operador` já resolve os dois modos: com senha vem do cookie, sem
     * senha vem do nome que o front informou. Travado por configuração ninguém
     * está dentro — devolver operador faria o painel abrir e bater 503 em cada
     * tela em vez de mostrar o aviso do que configurar.
     */
    const dentro = !configuracaoPendente && Boolean(req.operador);

    res.json({
      autenticacaoLigada: env.autenticacaoLigada,
      configuracaoPendente,
      operador: dentro ? operadorDaRequisicao(req) : null,
    });
  });

  rotas.post('/', (req, res) => {
    exigirJson(req);

    if (!env.autenticacaoLigada) {
      throw new ConfiguracaoPendente(
        env.producao
          ? 'Painel sem senha configurada. Defina SENHA_PAINEL nas variáveis de ambiente.'
          : 'Autenticação desligada em desenvolvimento: não há login pra fazer.',
      );
    }

    const chave = chaveDaOrigem(req);
    verificarTrava(chave);

    const { nome, senha } = loginSchema.parse(req.body);

    if (!senhaConfere(senha)) {
      registrarErro(chave);
      throw new NaoAutenticado('Senha incorreta.');
    }

    tentativas.delete(chave);

    const { token, operador, expiraEm } = criarToken(nome);
    gravarCookie(res, token, expiraEm);
    res.json({ operador, expiraEm: expiraEm.toISOString() });
  });

  /** Sair é sempre possível, logado ou não: limpar cookie não falha. */
  rotas.delete('/', (_req, res) => {
    limparCookie(res);
    res.status(204).end();
  });

  return rotas;
}
