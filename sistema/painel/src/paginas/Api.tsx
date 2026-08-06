import { useCallback } from 'react';
import { Conteudo } from '../componentes/Estado';
import { Badge, Cartao, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import type { Diagnostico, MapaDaApi } from '../tipos';

/**
 * A API vista de dentro do painel.
 *
 * Serve pra duas perguntas que aparecem sempre: "o site está conseguindo falar
 * com o sistema?" e "qual é o endereço de tal recurso?". O mapa de recursos vem
 * do próprio servidor (`GET /api`), então esta tela não tem lista escrita à
 * mão pra desatualizar quando uma rota nova nascer.
 */
export function Api() {
  const buscarMapa = useCallback(() => api.get<MapaDaApi>(''), []);
  const mapa = useApi(buscarMapa);

  const buscarDiagnostico = useCallback(() => api.get<Diagnostico>('/diagnostico'), []);
  const diagnostico = useApi(buscarDiagnostico);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">API</h1>
        <p className="text-sm text-stone-500">
          O que o sistema expõe e como o site conversa com ele.
        </p>
      </header>

      <Conteudo estado={diagnostico}>
        {(dados) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Cartao className="p-4">
              <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                Integração do site
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-sm text-stone-700">
                {dados.integracaoDoSiteLigada ? (
                  <>
                    <Badge classe="bg-emerald-100 text-emerald-900 ring-emerald-200">ligada</Badge>
                    O carrinho consegue registrar pedido no sistema.
                  </>
                ) : (
                  <>
                    <Badge classe="bg-amber-100 text-amber-900 ring-amber-200">desligada</Badge>
                    Sem <code className="font-mono text-xs">CHAVE_SITE</code>, o pedido vai direto
                    pro WhatsApp sem passar pelo sistema.
                  </>
                )}
              </p>
            </Cartao>

            <Cartao className="p-4">
              <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                Catálogo do site
              </p>
              <p className="mt-1.5 text-sm text-stone-700">
                O site é estático: ele lê um JSON gerado a partir daqui. Depois de mexer em produto,
                preço, banner ou vitrine, rode{' '}
                <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                  npm run sync
                </code>{' '}
                na pasta do site e publique.
              </p>
            </Cartao>
          </div>
        )}
      </Conteudo>

      <Cartao>
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-stone-900">Recursos</h2>
          <p className="text-xs text-stone-500">
            Tudo sob <code className="font-mono">/api</code> exige sessão, menos{' '}
            <code className="font-mono">/api/publico</code>, que é o que o site chama.
          </p>
        </div>

        <Conteudo estado={mapa}>
          {(dados) => (
            <Tabela cabecalho={['Recurso', 'Endereço']}>
              {Object.entries(dados.recursos).map(([nome, caminho]) => (
                <tr key={nome}>
                  <td className="px-4 py-2.5 font-medium text-stone-900 capitalize">
                    {nome.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-stone-600">{caminho}</td>
                </tr>
              ))}
            </Tabela>
          )}
        </Conteudo>
      </Cartao>

      <Cartao className="p-4">
        <h2 className="text-sm font-semibold text-stone-900">Como o site autentica</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
          O carrinho manda a chave no cabeçalho{' '}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">x-chave-site</code>
          . Ela viaja no bundle do site, então é barreira contra robô, não segredo: com ela só dá
          pra criar pedido em rascunho, que ninguém atende sem a loja confirmar aqui dentro.
        </p>
      </Cartao>
    </div>
  );
}
