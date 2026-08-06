import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Conteudo, Vazio } from '../componentes/Estado';
import { Badge, Cartao, Indicador, Selecao, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { moedaDeCentavos, quando } from '../lib/formato';
import type { Movimento, Resumo, TipoDeMovimento } from '../tipos';

/**
 * Estoque: o que falta comprar e o histórico de tudo que entrou e saiu.
 *
 * O ajuste de saldo de um produto continua na tela de Produtos, onde a pessoa
 * já está com o rótulo aberto. Aqui é a visão de cima — a lista de compras e a
 * auditoria: quem mexeu, quando, quanto, e qual saldo ficou.
 */
const ROTULO_DO_MOVIMENTO: Record<TipoDeMovimento, { texto: string; classe: string }> = {
  entrada: { texto: 'Entrada', classe: 'bg-emerald-100 text-emerald-900 ring-emerald-200' },
  saida: { texto: 'Saída', classe: 'bg-sky-100 text-sky-900 ring-sky-200' },
  perda: { texto: 'Perda', classe: 'bg-red-100 text-red-900 ring-red-200' },
  ajuste: { texto: 'Ajuste', classe: 'bg-amber-100 text-amber-900 ring-amber-200' },
};

const TIPOS: TipoDeMovimento[] = ['entrada', 'saida', 'perda', 'ajuste'];

export function Estoque() {
  const [tipo, setTipo] = useState('');

  const buscarResumo = useCallback(() => api.get<Resumo>('/relatorios/resumo'), []);
  const resumo = useApi(buscarResumo);

  const buscarMovimentos = useCallback(
    () => api.get<Movimento[]>(`/estoque/movimentos${tipo ? `?tipo=${tipo}` : ''}`),
    [tipo],
  );
  const movimentos = useApi(buscarMovimentos, tipo);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">Estoque</h1>
        <p className="text-sm text-stone-500">
          O que precisa repor e o histórico de cada movimento. Saldo só muda por movimento
          registrado.
        </p>
      </header>

      <Conteudo estado={resumo}>
        {(dados) => (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Indicador
                rotulo="Em estoque"
                valor={`${dados.estoque.unidades} un.`}
                detalhe={`${dados.estoque.produtos} produtos`}
              />
              <Indicador
                rotulo="Valor a custo"
                valor={moedaDeCentavos(dados.estoque.valorEmCustoCentavos)}
                detalhe="produto sem custo cadastrado entra como zero"
              />
              <Indicador
                rotulo="No mínimo"
                valor={String(dados.estoque.aRepor.length)}
                detalhe="produtos pra repor"
              />
            </div>

            <Cartao>
              <div className="border-b border-stone-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-stone-900">Lista de compras</h2>
                <p className="text-xs text-stone-500">
                  Produtos no estoque mínimo ou abaixo dele.
                </p>
              </div>

              {dados.estoque.aRepor.length === 0 ? (
                <Vazio
                  titulo="Nada no mínimo."
                  descricao="Todo rótulo está acima do estoque mínimo cadastrado."
                />
              ) : (
                <Tabela cabecalho={['Produto', 'Saldo', 'Mínimo', 'Falta']}>
                  {dados.estoque.aRepor.map((produto) => (
                    <tr key={produto.id}>
                      <td className="px-4 py-2.5">
                        <Link
                          to="/produtos"
                          className="font-medium text-stone-900 hover:text-vinho-700"
                        >
                          {produto.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          classe={
                            produto.estoque === 0
                              ? 'bg-red-100 text-red-900 ring-red-200'
                              : 'bg-amber-100 text-amber-900 ring-amber-200'
                          }
                        >
                          {produto.estoque === 0 ? 'esgotado' : `${produto.estoque} un.`}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-stone-600">{produto.estoqueMinimo}</td>
                      <td className="px-4 py-2.5 text-stone-600">
                        {Math.max(0, produto.estoqueMinimo - produto.estoque)} un.
                      </td>
                    </tr>
                  ))}
                </Tabela>
              )}
            </Cartao>
          </div>
        )}
      </Conteudo>

      <Cartao>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Movimentos</h2>
            <p className="text-xs text-stone-500">
              Do mais recente pro mais antigo. Saída com pedido veio de uma venda confirmada.
            </p>
          </div>

          <Selecao
            rotulo="Tipo"
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value)}
            className="w-40"
          >
            <option value="">Todos</option>
            {TIPOS.map((valor) => (
              <option key={valor} value={valor}>
                {ROTULO_DO_MOVIMENTO[valor].texto}
              </option>
            ))}
          </Selecao>
        </div>

        <Conteudo
          estado={movimentos}
          vazio={{
            titulo: 'Nenhum movimento.',
            descricao: 'Entrada, saída, perda e ajuste aparecem aqui assim que acontecerem.',
          }}
        >
          {(lista) => (
            <Tabela cabecalho={['Quando', 'Produto', 'Tipo', 'Qtd.', 'Saldo', 'Motivo', 'Quem']}>
              {lista.map((movimento) => (
                <tr key={movimento.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-stone-600">
                    {quando(movimento.criadoEm)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-stone-900">
                    {movimento.produtoNome}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge classe={ROTULO_DO_MOVIMENTO[movimento.tipo].classe}>
                      {ROTULO_DO_MOVIMENTO[movimento.tipo].texto}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-stone-700">
                    {movimento.quantidade > 0 ? `+${movimento.quantidade}` : movimento.quantidade}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">{movimento.saldoDepois}</td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {movimento.motivo ??
                      (movimento.pedidoId ? 'Venda confirmada' : <span aria-hidden="true">—</span>)}
                  </td>
                  <td className="px-4 py-2.5 text-stone-500">{movimento.usuarioId}</td>
                </tr>
              ))}
            </Tabela>
          )}
        </Conteudo>
      </Cartao>
    </div>
  );
}
