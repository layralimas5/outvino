/**
 * Popula o sistema com os dados de exemplo, pela linha de comando.
 *
 * Uso: `npm run seed` (recusa se já houver produto) · `npm run seed -- --forcar`
 *
 * A regra de negócio vive em `application/exemplos`, porque o painel também
 * chama isso: em produção os dados ficam no Netlify Blobs, onde não existe
 * arquivo pra copiar — lá o caminho é o botão da tela de Configurações.
 */
import { mkdir } from 'node:fs/promises';
import { semearExemplos } from '../../application/exemplos/casosDeUso.js';
import { env } from '../../config/env.js';
import { ErroDeAplicacao } from '../../shared/erros.js';
import { criarDeps } from '../container.js';

async function semear(): Promise<void> {
  const forcar = process.argv.includes('--forcar');
  await mkdir(env.dataDir, { recursive: true });

  const deps = criarDeps(env.dataDir, env.armazenamento);

  try {
    const resumo = await semearExemplos(deps, { forcar });

    console.log(
      `produtos: ${resumo.produtos}\n` +
        `banners: ${resumo.banners}\n` +
        `seções: ${resumo.secoes}\n` +
        `cupons: ${resumo.cupons}\n` +
        `avaliações: ${resumo.avaliacoes}\n` +
        `pedidos: ${resumo.pedidos}\n\n` +
        'Pronto. Suba a API com "npm run dev".',
    );
  } catch (erro) {
    if (erro instanceof ErroDeAplicacao) {
      console.log(`${erro.message}\nUse "npm run seed -- --forcar" pra cadastrar mesmo assim.`);
      return;
    }
    throw erro;
  }
}

semear().catch((erro) => {
  console.error('Falha ao popular:', erro);
  process.exit(1);
});
