import { existsSync } from 'node:fs';
import { join } from 'node:path';
import cors from 'cors';
import express, { type Express } from 'express';
import { env } from '../../config/env.js';
import type { Deps } from '../container.js';
import { exigirSessao, identificarOperador, naoEncontrado, tratarErros } from './middlewares.js';
import { rotasDeAvaliacoes } from './rotas/avaliacoes.js';
import { rotasDeClientes } from './rotas/clientes.js';
import { rotasDeCupons } from './rotas/cupons.js';
import { rotasDeExemplos } from './rotas/exemplos.js';
import { rotasDeEstoque } from './rotas/estoque.js';
import { rotasDePedidos } from './rotas/pedidos.js';
import { rotasDeProdutos } from './rotas/produtos.js';
import { rotasDeRelatorios } from './rotas/relatorios.js';
import { rotasDeSessao } from './rotas/sessao.js';
import { rotasDeVitrine } from './rotas/vitrine.js';
import { rotasPublicas } from './rotas/publico.js';

export function criarServidor(deps: Deps): Express {
  const app = express();

  // Não anunciar o framework: informação de graça pra quem procura CVE.
  app.disable('x-powered-by');

  // `credentials: true` porque a sessão viaja em cookie: sem isso o navegador
  // não manda o cookie quando o painel roda em outra origem (Vite em dev).
  app.use(cors({ origin: env.origensPermitidas, credentials: true }));
  app.use(express.json({ limit: '512kb' }));
  app.use(identificarOperador);

  const saude = (_req: express.Request, res: express.Response) => {
    res.json({ ok: true, ambiente: env.ambiente, em: new Date().toISOString() });
  };

  /**
   * Duas portas de propósito: `/saude` é a que monitoramento checa, e
   * `/api/saude` é a que o painel usa — só `/api` passa pelo proxy do Vite.
   */
  app.get('/saude', saude);
  app.get('/api/saude', saude);

  // Login e logout são as únicas rotas de painel abertas — é por elas que se
  // entra. Tudo depois daqui exige sessão.
  app.use('/api/sessao', rotasDeSessao());

  /**
   * Diz **se** a configuração existe, nunca o valor. Ainda assim, só logado.
   *
   * É o que alimenta a tela de Configuração do painel: dá pra ver o que está
   * ligado sem abrir o servidor, e nenhuma senha, chave ou token atravessa
   * daqui — só o booleano de "está definido".
   */
  app.get('/api/diagnostico', exigirSessao, (_req, res) => {
    res.json({
      ambiente: env.ambiente,
      armazenamento: env.armazenamento,
      dataDir: env.armazenamento === 'arquivo' ? env.dataDir : null,
      node: process.version,
      autenticacaoLigada: env.autenticacaoLigada,
      painelAberto: env.painelAberto,
      sessaoEmHoras: env.sessaoEmHoras,
      segredoDeSessaoProprio: Boolean(env.segredoDaSessao),
      origensPermitidas: env.origensPermitidas,
      integracaoDoSiteLigada: Boolean(env.chaveSite),
      painelServidoPelaApi: existsSync(join(env.pastaDoPainel, 'index.html')),
      contextoDeBlobsInjetado: Boolean(process.env.NETLIFY_BLOBS_CONTEXT),
      temSiteId: Boolean(process.env.NETLIFY_SITE_ID ?? process.env.SITE_ID),
      temToken: Boolean(process.env.NETLIFY_BLOBS_TOKEN ?? process.env.NETLIFY_AUTH_TOKEN),
    });
  });

  app.get('/api', exigirSessao, (_req, res) => {
    res.json({
      sistema: 'Outvino — API do back-office',
      recursos: {
        sessao: '/api/sessao',
        diagnostico: '/api/diagnostico',
        resumo: '/api/relatorios/resumo',
        financeiro: '/api/relatorios/financeiro',
        produtos: '/api/produtos',
        estoque: '/api/estoque/movimentos · /api/estoque/alertas',
        pedidos: '/api/pedidos',
        clientes: '/api/clientes',
        cupons: '/api/cupons',
        avaliacoes: '/api/avaliacoes',
        vitrine: '/api/vitrine/banners · /api/vitrine/secoes',
        catalogoDoSite: '/api/publico/catalogo',
        dadosDeExemplo: 'POST /api/exemplos',
      },
    });
  });

  // Gestão: só com sessão. Cada `use` recebe o guarda antes do router.
  app.use('/api/produtos', exigirSessao, rotasDeProdutos(deps));
  app.use('/api/estoque', exigirSessao, rotasDeEstoque(deps));
  app.use('/api/pedidos', exigirSessao, rotasDePedidos(deps));
  app.use('/api/clientes', exigirSessao, rotasDeClientes(deps));
  app.use('/api/cupons', exigirSessao, rotasDeCupons(deps));
  app.use('/api/avaliacoes', exigirSessao, rotasDeAvaliacoes(deps));
  app.use('/api/vitrine', exigirSessao, rotasDeVitrine(deps));
  app.use('/api/relatorios', exigirSessao, rotasDeRelatorios(deps));
  app.use('/api/exemplos', exigirSessao, rotasDeExemplos(deps));

  // Público não passa pelo guarda: quem chama é o carrinho do site, de fora, e
  // a barreira lá é a `CHAVE_SITE`.
  app.use('/api/publico', rotasPublicas(deps));

  servirPainel(app);

  app.use(naoEncontrado);
  app.use(tratarErros);

  return app;
}

/**
 * Em produção o painel buildado pode viajar junto com a API: um processo, uma
 * porta, uma URL. Some o CORS e some a variável de endereço do backend no
 * front. Em desenvolvimento a pasta não existe (o Vite serve o painel) e isso
 * simplesmente não liga.
 */
function servirPainel(app: Express): void {
  if (!existsSync(join(env.pastaDoPainel, 'index.html'))) {
    app.get('/', (_req, res) => res.redirect('/api'));
    return;
  }

  // Os assets levam hash no nome, então cache longo é seguro.
  app.use(express.static(env.pastaDoPainel, { index: false, maxAge: '1y', immutable: true }));

  /**
   * Fallback da SPA: abrir /pedidos direto na barra de endereço tem que
   * carregar o painel. O index.html nunca é cacheado, senão um deploy novo
   * não chega no navegador.
   */
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path === '/saude') {
      next();
      return;
    }
    res.set('Cache-Control', 'no-cache');
    res.sendFile(join(env.pastaDoPainel, 'index.html'));
  });
}
