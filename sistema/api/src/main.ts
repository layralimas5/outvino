import { mkdir } from 'node:fs/promises';
import { env } from './config/env.js';
import { criarDeps } from './infra/container.js';
import { criarServidor } from './infra/http/server.js';

async function iniciar(): Promise<void> {
  await mkdir(env.dataDir, { recursive: true });

  const servidor = criarServidor(criarDeps(env.dataDir, env.armazenamento));

  servidor.listen(env.porta, () => {
    console.log(`API do Outvino em http://localhost:${env.porta} (${env.ambiente})`);
    console.log(`Dados em ${env.dataDir}`);
  });
}

iniciar().catch((erro) => {
  console.error('Falha ao subir a API:', erro);
  process.exit(1);
});
