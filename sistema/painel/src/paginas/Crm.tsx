import { useCallback, useState } from 'react';
import { Conteudo, Vazio } from '../componentes/Estado';
import { Badge, Campo, Cartao, Caixa, Indicador, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { linkWhatsapp, moedaDeCentavos, quando, telefone } from '../lib/formato';
import type { CarteiraDeClientes, Cliente } from '../tipos';

/**
 * CRM montado a partir dos pedidos.
 *
 * Não existe cadastro de cliente no sistema, e criar um agora seria inventar
 * dado: o que a loja tem de verdade é quem já comprou. Cada linha é uma pessoa
 * agrupada pelo telefone, com o histórico que os pedidos dela contam — e o
 * botão que importa, que é voltar a falar com ela no WhatsApp.
 */
const DIAS_PARA_SUMIR = 60;

export function Crm() {
  const [busca, setBusca] = useState('');
  const [somenteRecorrentes, setSomenteRecorrentes] = useState(false);

  const chave = `${busca}|${somenteRecorrentes}`;

  const buscar = useCallback(() => {
    const parametros = new URLSearchParams();
    if (busca.trim()) parametros.set('busca', busca.trim());
    if (somenteRecorrentes) parametros.set('recorrentes', 'true');

    const consulta = parametros.toString();
    return api.get<CarteiraDeClientes>(`/clientes${consulta ? `?${consulta}` : ''}`);
  }, [busca, somenteRecorrentes]);

  const estado = useApi(buscar, chave);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">CRM</h1>
        <p className="text-sm text-stone-500">
          Quem já comprou, quanto gastou e há quanto tempo não aparece. Montado a partir dos
          pedidos.
        </p>
      </header>

      <Conteudo estado={estado}>
        {(carteira) => (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Indicador
                rotulo="Clientes"
                valor={String(carteira.resumo.total)}
                detalhe={`${carteira.resumo.novosNoMes} ${carteira.resumo.novosNoMes === 1 ? 'novo' : 'novos'} neste mês`}
              />
              <Indicador
                rotulo="Recorrentes"
                valor={String(carteira.resumo.recorrentes)}
                detalhe="compraram mais de uma vez"
              />
              <Indicador
                rotulo="Sumidos"
                valor={String(carteira.resumo.sumidos)}
                detalhe={`sem comprar há mais de ${DIAS_PARA_SUMIR} dias`}
              />
              <Indicador
                rotulo="Ticket médio"
                valor={moedaDeCentavos(carteira.resumo.ticketMedioCentavos)}
                detalhe="por pedido, na carteira toda"
              />
            </div>

            <Cartao>
              <div className="flex flex-wrap items-end gap-4 border-b border-stone-200 px-4 py-3">
                <Campo
                  rotulo="Buscar"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Nome, telefone ou e-mail"
                  type="search"
                  autoComplete="off"
                  className="w-full sm:w-72"
                />

                <div className="pb-2">
                  <Caixa
                    rotulo="Só recorrentes"
                    marcado={somenteRecorrentes}
                    aoMudar={setSomenteRecorrentes}
                  />
                </div>
              </div>

              {carteira.clientes.length === 0 ? (
                <Vazio
                  titulo="Ninguém com esses filtros."
                  descricao="A ficha aparece aqui assim que a pessoa fizer o primeiro pedido."
                />
              ) : (
                <Tabela
                  cabecalho={[
                    'Cliente',
                    'Contato',
                    'Pedidos',
                    'Total',
                    'Ticket',
                    'Última compra',
                    'Preferido',
                    '',
                  ]}
                >
                  {carteira.clientes.map((cliente) => (
                    <Linha key={cliente.telefone} cliente={cliente} />
                  ))}
                </Tabela>
              )}
            </Cartao>
          </div>
        )}
      </Conteudo>
    </div>
  );
}

function Linha({ cliente }: { cliente: Cliente }) {
  /** Quem nunca fechou pedido aparece, mas marcado: é lead, não cliente. */
  const soRascunho = cliente.pedidos === 0;

  return (
    <tr>
      <td className="px-4 py-2.5">
        <p className="font-medium text-stone-900">{cliente.nome}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {soRascunho ? (
            <Badge classe="bg-stone-100 text-stone-600 ring-stone-200">só rascunho</Badge>
          ) : cliente.recorrente ? (
            <Badge classe="bg-emerald-100 text-emerald-900 ring-emerald-200">recorrente</Badge>
          ) : (
            <Badge classe="bg-sky-100 text-sky-900 ring-sky-200">primeira compra</Badge>
          )}

          {!soRascunho && cliente.diasSemComprar > DIAS_PARA_SUMIR && (
            <Badge classe="bg-amber-100 text-amber-900 ring-amber-200">
              sumido há {cliente.diasSemComprar} dias
            </Badge>
          )}
        </div>
      </td>

      <td className="px-4 py-2.5 text-stone-600">
        <p>{telefone(cliente.telefone)}</p>
        {cliente.email && <p className="text-xs text-stone-500">{cliente.email}</p>}
        {cliente.cidade && <p className="text-xs text-stone-500">{cliente.cidade}</p>}
      </td>

      <td className="px-4 py-2.5 text-stone-700">
        {cliente.pedidos}
        {cliente.cancelados > 0 && (
          <span className="block text-xs text-stone-500">{cliente.cancelados} cancelado(s)</span>
        )}
      </td>

      <td className="px-4 py-2.5 font-medium text-stone-900">
        {moedaDeCentavos(cliente.totalCentavos)}
      </td>

      <td className="px-4 py-2.5 text-stone-600">{moedaDeCentavos(cliente.ticketMedioCentavos)}</td>

      <td className="px-4 py-2.5 whitespace-nowrap text-stone-600">
        {soRascunho ? <span aria-hidden="true">—</span> : quando(cliente.ultimoEm)}
      </td>

      <td className="px-4 py-2.5 text-stone-600">
        {cliente.preferido ?? <span aria-hidden="true">—</span>}
      </td>

      <td className="px-4 py-2.5 text-right">
        <a
          href={linkWhatsapp(
            cliente.telefone,
            `Oi, ${cliente.nome.split(' ')[0]}! Aqui é da Outvino.`,
          )}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium whitespace-nowrap text-vinho-700 hover:underline"
        >
          Chamar
        </a>
      </td>
    </tr>
  );
}
