import { useCallback, type ReactNode } from 'react';
import { Conteudo } from '../componentes/Estado';
import { Badge, Cartao } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import type { Diagnostico } from '../tipos';

/**
 * Configuração do servidor, em modo leitura.
 *
 * Nada aqui é editável de propósito: senha, chave e armazenamento são variáveis
 * de ambiente, e mudá-las por dentro do painel significaria o sistema poder
 * afrouxar a própria segurança com um clique. A tela mostra **o que está
 * valendo** e onde trocar — e nenhum valor secreto atravessa a API, só o
 * booleano de "está definido".
 */
export function Configuracao() {
  const buscar = useCallback(() => api.get<Diagnostico>('/diagnostico'), []);
  const estado = useApi(buscar);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">Configurações</h1>
        <p className="text-sm text-stone-500">
          Como o servidor está rodando agora. Para mudar, altere a variável de ambiente e reinicie
          a API.
        </p>
      </header>

      <Conteudo estado={estado}>
        {(dados) => (
          <div className="space-y-6">
            {!dados.autenticacaoLigada && (
              <Cartao className="border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">
                  <strong>O painel está sem login.</strong> Vale em desenvolvimento, mas antes de
                  publicar é obrigatório definir{' '}
                  <code className="font-mono text-xs">SENHA_PAINEL</code> (mínimo 12 caracteres) nas
                  variáveis da Netlify. Em produção sem ela, as rotas de gestão respondem 503 de
                  propósito e o sistema não abre.
                </p>
              </Cartao>
            )}

            <Cartao>
              <Titulo>Servidor</Titulo>
              <dl className="divide-y divide-stone-100">
                <Linha rotulo="Ambiente" variavel="NODE_ENV">
                  <Badge
                    classe={
                      dados.ambiente === 'production'
                        ? 'bg-emerald-100 text-emerald-900 ring-emerald-200'
                        : 'bg-stone-100 text-stone-700 ring-stone-200'
                    }
                  >
                    {dados.ambiente}
                  </Badge>
                </Linha>

                <Linha rotulo="Node" >
                  <span className="font-mono text-xs">{dados.node}</span>
                </Linha>

                <Linha
                  rotulo="Armazenamento"
                  variavel="ARMAZENAMENTO"
                  dica={
                    dados.armazenamento === 'arquivo'
                      ? 'JSON em disco. Precisa de disco persistente — não serve em função serverless.'
                      : 'Netlify Blobs. É o que permite rodar em função serverless.'
                  }
                >
                  <span className="font-mono text-xs">{dados.armazenamento}</span>
                </Linha>

                {dados.dataDir && (
                  <Linha rotulo="Pasta dos dados" variavel="DATA_DIR">
                    <span className="font-mono text-xs break-all">{dados.dataDir}</span>
                  </Linha>
                )}

                <Linha
                  rotulo="Painel servido pela API"
                  dica="Existindo o build do painel, a API o serve no mesmo endereço: um serviço só, sem CORS."
                >
                  <Sim valor={dados.painelServidoPelaApi} />
                </Linha>
              </dl>
            </Cartao>

            <Cartao>
              <Titulo>Acesso</Titulo>
              <dl className="divide-y divide-stone-100">
                <Linha
                  rotulo="Login do painel"
                  variavel="SENHA_PAINEL"
                  dica="Vazia em desenvolvimento abre o painel direto. Vazia em produção fecha o sistema."
                >
                  {dados.autenticacaoLigada ? (
                    <Badge classe="bg-emerald-100 text-emerald-900 ring-emerald-200">
                      com senha
                    </Badge>
                  ) : (
                    <Badge classe="bg-amber-100 text-amber-900 ring-amber-200">sem senha</Badge>
                  )}
                </Linha>

                <Linha rotulo="Duração da sessão" variavel="SESSAO_HORAS">
                  {dados.sessaoEmHoras} h
                </Linha>

                <Linha
                  rotulo="Segredo próprio de sessão"
                  variavel="SEGREDO_SESSAO"
                  dica="Sem ele, a chave é derivada da senha — e trocar a senha derruba todas as sessões abertas, o que é desejado."
                >
                  <Sim valor={dados.segredoDeSessaoProprio} />
                </Linha>

                <Linha
                  rotulo="Origens permitidas"
                  variavel="ORIGENS_PERMITIDAS"
                  dica="De onde o painel e o site podem chamar a API."
                >
                  <span className="font-mono text-xs break-all">
                    {dados.origensPermitidas.join(', ') || '—'}
                  </span>
                </Linha>
              </dl>
            </Cartao>

            <Cartao>
              <Titulo>Integrações</Titulo>
              <dl className="divide-y divide-stone-100">
                <Linha
                  rotulo="Chave do site"
                  variavel="CHAVE_SITE"
                  dica="Vazia desliga as rotas de cupom e de pedido do site: o carrinho passa a mandar tudo direto pro WhatsApp."
                >
                  <Sim valor={dados.integracaoDoSiteLigada} />
                </Linha>

                <Linha rotulo="Contexto de Blobs injetado">
                  <Sim valor={dados.contextoDeBlobsInjetado} />
                </Linha>

                <Linha rotulo="Site ID da Netlify">
                  <Sim valor={dados.temSiteId} />
                </Linha>

                <Linha rotulo="Token da Netlify">
                  <Sim valor={dados.temToken} />
                </Linha>
              </dl>
            </Cartao>

            <p className="text-xs text-stone-500">
              Nenhuma senha, chave ou token passa por esta tela: a API responde só se a variável
              está definida, nunca o valor dela.
            </p>
          </div>
        )}
      </Conteudo>
    </div>
  );
}

function Titulo({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-900">
      {children}
    </h2>
  );
}

function Linha({
  rotulo,
  variavel,
  dica,
  children,
}: {
  rotulo: string;
  variavel?: string;
  dica?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-4 py-3">
      <div className="min-w-0">
        <dt className="text-sm font-medium text-stone-800">
          {rotulo}
          {variavel && (
            <code className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs font-normal text-stone-600">
              {variavel}
            </code>
          )}
        </dt>
        {dica && <p className="mt-0.5 max-w-xl text-xs text-stone-500">{dica}</p>}
      </div>

      <dd className="text-sm text-stone-700">{children}</dd>
    </div>
  );
}

function Sim({ valor }: { valor: boolean }) {
  return valor ? (
    <Badge classe="bg-emerald-100 text-emerald-900 ring-emerald-200">definido</Badge>
  ) : (
    <Badge classe="bg-stone-100 text-stone-600 ring-stone-200">não</Badge>
  );
}
