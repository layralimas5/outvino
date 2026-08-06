import { useCallback, useState } from 'react';
import { Conteudo } from '../componentes/Estado';
import { Badge, Cartao, Indicador, Selecao, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { diaCurto, moedaDeCentavos } from '../lib/formato';
import { ROTULO_DO_STATUS, STATUS, type Financeiro as Fechamento } from '../tipos';

/**
 * Fechamento do período.
 *
 * Duas coisas a tela deixa explícitas em vez de esconder atrás de um número
 * bonito: o custo é o cadastrado hoje (o pedido não guarda custo histórico), e
 * rascunho não é receita — aparece como pipeline, separado do faturamento.
 */
const PERIODOS = [
  { id: '7', rotulo: 'Últimos 7 dias' },
  { id: '30', rotulo: 'Últimos 30 dias' },
  { id: '90', rotulo: 'Últimos 90 dias' },
  { id: '365', rotulo: 'Últimos 12 meses' },
];

const PERIODO_PADRAO = '30';

function desdeDe(dias: string): string {
  const data = new Date();
  data.setUTCDate(data.getUTCDate() - (Number(dias) - 1));
  return data.toISOString().slice(0, 10);
}

export function Financeiro() {
  const [periodo, setPeriodo] = useState(PERIODO_PADRAO);

  const buscar = useCallback(
    () => api.get<Fechamento>(`/relatorios/financeiro?desde=${desdeDe(periodo)}`),
    [periodo],
  );
  const estado = useApi(buscar, periodo);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Financeiro</h1>
          <p className="text-sm text-stone-500">
            Quanto entrou, quanto custou e o que sobrou. Só pedido confirmado conta como venda.
          </p>
        </div>

        <Selecao
          rotulo="Período"
          value={periodo}
          onChange={(evento) => setPeriodo(evento.target.value)}
          className="w-48"
        >
          {PERIODOS.map((opcao) => (
            <option key={opcao.id} value={opcao.id}>
              {opcao.rotulo}
            </option>
          ))}
        </Selecao>
      </header>

      <Conteudo estado={estado}>
        {(dados) => (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Indicador
                rotulo="Faturamento"
                valor={moedaDeCentavos(dados.faturamentoCentavos)}
                detalhe={`${dados.pedidos} ${dados.pedidos === 1 ? 'venda' : 'vendas'} em ${dados.periodo.dias} dias`}
              />
              <Indicador
                rotulo="Ticket médio"
                valor={moedaDeCentavos(dados.ticketMedioCentavos)}
                detalhe={`desconto ${moedaDeCentavos(dados.descontosCentavos)} · frete ${moedaDeCentavos(dados.freteCentavos)}`}
              />
              <Indicador
                rotulo="Custo das vendas"
                valor={moedaDeCentavos(dados.custoCentavos)}
                detalhe="ao custo cadastrado hoje"
              />
              <Indicador
                rotulo="Margem bruta"
                valor={moedaDeCentavos(dados.margemCentavos)}
                detalhe={`${dados.margemPercentual.toString().replace('.', ',')}% do faturamento`}
              />
            </div>

            {dados.unidadesSemCusto > 0 && (
              <Cartao className="border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">
                  <strong>
                    {dados.unidadesSemCusto}{' '}
                    {dados.unidadesSemCusto === 1 ? 'unidade vendida' : 'unidades vendidas'}
                  </strong>{' '}
                  são de produto sem custo cadastrado, então entraram como custo zero. A margem
                  acima está otimista até esses custos serem preenchidos em Produtos.
                </p>
              </Cartao>
            )}

            {dados.pipeline.pedidos > 0 && (
              <Cartao className="p-4">
                <p className="text-sm text-stone-700">
                  <strong className="text-stone-900">
                    {moedaDeCentavos(dados.pipeline.centavos)}
                  </strong>{' '}
                  em {dados.pipeline.pedidos}{' '}
                  {dados.pipeline.pedidos === 1 ? 'rascunho' : 'rascunhos'} do site. Não está no
                  faturamento porque ninguém confirmou ainda.
                </p>
              </Cartao>
            )}

            <Grafico serie={dados.porDia} />

            <Cartao>
              <div className="border-b border-stone-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-stone-900">Onde o dinheiro entrou</h2>
                <p className="text-xs text-stone-500">
                  Por rótulo, do que mais faturou pro que menos faturou.
                </p>
              </div>

              {dados.porProduto.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-stone-500">
                  Nenhuma venda no período.
                </p>
              ) : (
                <Tabela cabecalho={['Produto', 'Un.', 'Receita', 'Custo', 'Margem', '%']}>
                  {dados.porProduto.map((linha) => (
                    <tr key={linha.produtoId}>
                      <td className="px-4 py-2.5 font-medium text-stone-900">
                        {linha.nome}
                        {!linha.custoCompleto && (
                          <span className="ml-2 text-xs font-normal text-amber-700">
                            sem custo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-stone-600">{linha.unidades}</td>
                      <td className="px-4 py-2.5 text-stone-700">
                        {moedaDeCentavos(linha.receitaCentavos)}
                      </td>
                      <td className="px-4 py-2.5 text-stone-600">
                        {moedaDeCentavos(linha.custoCentavos)}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-stone-900">
                        {moedaDeCentavos(linha.margemCentavos)}
                      </td>
                      <td className="px-4 py-2.5 text-stone-600">
                        {linha.receitaCentavos > 0
                          ? `${Math.round((linha.margemCentavos / linha.receitaCentavos) * 100)}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </Tabela>
              )}
            </Cartao>

            <Cartao className="p-4">
              <h2 className="text-sm font-semibold text-stone-900">Pedidos do período</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS.map((status) => (
                  <Badge key={status} classe={ROTULO_DO_STATUS[status].classe}>
                    {ROTULO_DO_STATUS[status].texto}: {dados.porStatus[status]}
                  </Badge>
                ))}
              </div>
            </Cartao>
          </div>
        )}
      </Conteudo>
    </div>
  );
}

/**
 * Barras em CSS puro, sem biblioteca de gráfico.
 *
 * São no máximo 365 colunas de um valor só: uma dependência de 50 kB para
 * desenhar retângulo não se paga. A escala é o maior dia do período — com
 * altura fixa, um período fraco pareceria igual a um forte.
 */
function Grafico({ serie }: { serie: Fechamento['porDia'] }) {
  const maior = Math.max(...serie.map((ponto) => ponto.centavos), 1);
  const total = serie.reduce((soma, ponto) => soma + ponto.centavos, 0);

  // Em período longo, marcar todo dia vira borrão: rotula umas seis datas.
  const passo = Math.max(1, Math.ceil(serie.length / 6));

  return (
    <Cartao className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">Faturamento por dia</h2>
        <p className="text-sm text-stone-500">{moedaDeCentavos(total)} no período</p>
      </div>

      <div className="mt-4 flex h-40 items-end gap-px">
        {serie.map((ponto) => (
          <div
            key={ponto.dia}
            title={`${diaCurto(ponto.dia)}: ${moedaDeCentavos(ponto.centavos)}`}
            className="flex-1 rounded-t-sm bg-vinho-600/85 transition-colors hover:bg-vinho-700"
            style={{ height: `${Math.max(2, (ponto.centavos / maior) * 100)}%` }}
          />
        ))}
      </div>

      <div className="mt-1.5 flex gap-px text-[0.625rem] text-stone-400">
        {serie.map((ponto, indice) => (
          <span key={ponto.dia} className="flex-1 text-center whitespace-nowrap">
            {indice % passo === 0 ? diaCurto(ponto.dia) : ''}
          </span>
        ))}
      </div>
    </Cartao>
  );
}
