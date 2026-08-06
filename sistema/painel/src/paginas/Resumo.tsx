import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Conteudo } from '../componentes/Estado';
import { Badge, Cartao, Indicador, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { diaCurto, moedaDeCentavos } from '../lib/formato';
import { ROTULO_DO_STATUS, type Resumo as ResumoDoPainel } from '../tipos';

export function Resumo() {
  const buscar = useCallback(() => api.get<ResumoDoPainel>('/relatorios/resumo'), []);
  const estado = useApi(buscar);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">Resumo</h1>
        <p className="text-sm text-stone-500">Como a loja está hoje.</p>
      </header>

      <Conteudo estado={estado}>
        {(resumo) => (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Indicador
                rotulo="Hoje"
                valor={moedaDeCentavos(resumo.hoje.faturamentoCentavos)}
                detalhe={`${resumo.hoje.pedidos} ${resumo.hoje.pedidos === 1 ? 'pedido' : 'pedidos'}`}
              />
              <Indicador
                rotulo="No mês"
                valor={moedaDeCentavos(resumo.mes.faturamentoCentavos)}
                detalhe={`${resumo.mes.pedidos} pedidos · ticket ${moedaDeCentavos(resumo.mes.ticketMedioCentavos)}`}
              />
              <Indicador
                rotulo="Esperando você"
                valor={String(resumo.aguardando.rascunhos)}
                detalhe="pedidos do site pra confirmar"
              />
              <Indicador
                rotulo="Estoque"
                valor={`${resumo.estoque.unidades} un.`}
                detalhe={`${resumo.estoque.produtos} produtos · ${moedaDeCentavos(resumo.estoque.valorEmCustoCentavos)} em custo`}
              />
            </div>

            {resumo.aguardando.rascunhos > 0 && (
              <Cartao className="border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">
                  <strong>
                    {resumo.aguardando.rascunhos}{' '}
                    {resumo.aguardando.rascunhos === 1 ? 'pedido novo' : 'pedidos novos'} do site
                  </strong>{' '}
                  esperando confirmação. O estoque só baixa quando você confirma.{' '}
                  <Link to="/pedidos" className="font-medium underline">
                    Ver pedidos
                  </Link>
                </p>
              </Cartao>
            )}

            <Grafico dados={resumo.faturamentoDiario} />

            <div className="grid gap-4 lg:grid-cols-2">
              <Cartao>
                <h2 className="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-900">
                  Mais vendidos
                </h2>
                {resumo.maisVendidos.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-stone-500">Nenhuma venda registrada ainda.</p>
                ) : (
                  <Tabela cabecalho={['Produto', 'Unidades', 'Total']}>
                    {resumo.maisVendidos.map((item) => (
                      <tr key={item.produtoId}>
                        <td className="px-4 py-2.5 text-stone-800">{item.nome}</td>
                        <td className="px-4 py-2.5 text-stone-600">{item.unidades}</td>
                        <td className="px-4 py-2.5 text-stone-800">
                          {moedaDeCentavos(item.centavos)}
                        </td>
                      </tr>
                    ))}
                  </Tabela>
                )}
              </Cartao>

              <Cartao>
                <h2 className="border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-900">
                  Repor no estoque
                </h2>
                {resumo.estoque.aRepor.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-stone-500">
                    Nenhum produto abaixo do mínimo.
                  </p>
                ) : (
                  <Tabela cabecalho={['Produto', 'Estoque', 'Mínimo']}>
                    {resumo.estoque.aRepor.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2.5 text-stone-800">{item.nome}</td>
                        <td className="px-4 py-2.5">
                          <Badge
                            classe={
                              item.estoque === 0
                                ? 'bg-red-100 text-red-800 ring-red-200'
                                : 'bg-amber-100 text-amber-900 ring-amber-200'
                            }
                          >
                            {item.estoque === 0 ? 'esgotado' : `${item.estoque} un.`}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-stone-500">{item.estoqueMinimo}</td>
                      </tr>
                    ))}
                  </Tabela>
                )}
              </Cartao>
            </div>

            <Cartao className="p-4">
              <h2 className="text-sm font-semibold text-stone-900">Pedidos por status</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {Object.entries(resumo.porStatus).map(([status, total]) => {
                  const rotulo = ROTULO_DO_STATUS[status as keyof typeof ROTULO_DO_STATUS];
                  return (
                    <li key={status}>
                      <Badge classe={rotulo.classe}>
                        {rotulo.texto}: {total}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </Cartao>
          </div>
        )}
      </Conteudo>
    </div>
  );
}

/** Barras em CSS puro: 14 pontos não justificam uma biblioteca de gráfico. */
function Grafico({ dados }: { dados: Array<{ dia: string; centavos: number }> }) {
  const maior = Math.max(...dados.map((ponto) => ponto.centavos), 1);
  const total = dados.reduce((soma, ponto) => soma + ponto.centavos, 0);

  return (
    <Cartao className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">Últimos 14 dias</h2>
        <p className="text-sm text-stone-500">{moedaDeCentavos(total)} no período</p>
      </div>

      <ol className="mt-4 flex h-32 items-end gap-1.5" aria-label="Faturamento por dia">
        {dados.map((ponto) => (
          <li
            key={ponto.dia}
            className="flex h-full flex-1 flex-col justify-end"
            title={`${diaCurto(ponto.dia)}: ${moedaDeCentavos(ponto.centavos)}`}
          >
            <div
              className="rounded-t bg-vinho-500/85"
              style={{ height: `${Math.max((ponto.centavos / maior) * 100, 2)}%` }}
            />
            <span className="mt-1 text-center text-[10px] text-stone-400">
              {diaCurto(ponto.dia)}
            </span>
          </li>
        ))}
      </ol>
    </Cartao>
  );
}
