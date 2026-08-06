import { useCallback, useState } from 'react';
import { Conteudo } from '../componentes/Estado';
import { Modal } from '../componentes/Modal';
import { Badge, Botao, Cartao, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api, ErroDaApi, query } from '../lib/api';
import { linkWhatsapp, moeda, quando, telefone } from '../lib/formato';
import {
  PROXIMOS_STATUS,
  ROTULO_DO_STATUS,
  STATUS,
  type Pedido,
  type StatusDePedido,
} from '../tipos';

export function Pedidos() {
  const [status, setStatus] = useState<'' | StatusDePedido>('');
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<Pedido | null>(null);

  const filtro = query({ status, busca });
  const buscar = useCallback(() => api.get<Pedido[]>(`/pedidos${filtro}`), [filtro]);
  const estado = useApi(buscar, filtro);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Pedidos</h1>
          <p className="text-sm text-stone-500">
            Pedido do site entra como <strong>novo</strong>. O estoque só baixa quando você confirma.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Nome, telefone ou número do pedido"
          aria-label="Buscar pedido"
          className="min-w-56 flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-vinho-600 focus:outline-none"
        />
        <select
          value={status}
          onChange={(evento) => setStatus(evento.target.value as '' | StatusDePedido)}
          aria-label="Filtrar por status"
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-vinho-600 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {STATUS.map((valor) => (
            <option key={valor} value={valor}>
              {ROTULO_DO_STATUS[valor].texto}
            </option>
          ))}
        </select>
      </div>

      <Cartao>
        <Conteudo
          estado={estado}
          vazio={{ titulo: 'Nenhum pedido aqui.', descricao: 'Ajuste os filtros ou espere o site.' }}
        >
          {(pedidos) => (
            <Tabela cabecalho={['Nº', 'Cliente', 'Itens', 'Total', 'Status', 'Quando', '']}>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-medium text-stone-900">#{pedido.numero}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-stone-800">{pedido.cliente.nome}</p>
                    <p className="text-xs text-stone-500">{telefone(pedido.cliente.telefone)}</p>
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {pedido.itens.reduce((total, item) => total + item.quantidade, 0)} un.
                  </td>
                  <td className="px-4 py-2.5 text-stone-800">{moeda(pedido.total)}</td>
                  <td className="px-4 py-2.5">
                    <Badge classe={ROTULO_DO_STATUS[pedido.status].classe}>
                      {ROTULO_DO_STATUS[pedido.status].texto}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-500">{quando(pedido.criadoEm)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Botao variante="secundario" pequeno onClick={() => setAberto(pedido)}>
                      Abrir
                    </Botao>
                  </td>
                </tr>
              ))}
            </Tabela>
          )}
        </Conteudo>
      </Cartao>

      {aberto && (
        <Detalhe
          pedido={aberto}
          aoFechar={() => setAberto(null)}
          aoMudar={(atualizado) => {
            setAberto(atualizado);
            estado.recarregar();
          }}
        />
      )}
    </div>
  );
}

function Detalhe({
  pedido,
  aoFechar,
  aoMudar,
}: {
  pedido: Pedido;
  aoFechar: () => void;
  aoMudar: (pedido: Pedido) => void;
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function mudarPara(status: StatusDePedido) {
    if (status === 'cancelado' && !confirm('Cancelar esse pedido? O estoque volta pro catálogo.')) {
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const atualizado = await api.post<Pedido>(`/pedidos/${pedido.id}/status`, { status });
      aoMudar(atualizado);
    } catch (causa) {
      setErro(causa instanceof ErroDaApi ? causa.message : 'Não consegui mudar o status.');
    } finally {
      setSalvando(false);
    }
  }

  const mensagem = [
    `Oi ${pedido.cliente.nome.split(' ')[0]}! Aqui é da Outvino, sobre o pedido #${pedido.numero}:`,
    '',
    ...pedido.itens.map((item) => `• ${item.quantidade}x ${item.nome}`),
    '',
    `Total: ${moeda(pedido.total)}`,
  ].join('\n');

  return (
    <Modal
      largo
      aberto
      titulo={`Pedido #${pedido.numero}`}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Fechar
          </Botao>
          {PROXIMOS_STATUS[pedido.status].map((destino) => (
            <Botao
              key={destino}
              variante={destino === 'cancelado' ? 'perigo' : 'primario'}
              disabled={salvando}
              onClick={() => void mudarPara(destino)}
            >
              {destino === 'confirmado' ? 'Confirmar (baixa estoque)' : ROTULO_DO_STATUS[destino].texto}
            </Botao>
          ))}
        </>
      }
    >
      <div className="space-y-5 text-sm">
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-700">
            {erro}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge classe={ROTULO_DO_STATUS[pedido.status].classe}>
            {ROTULO_DO_STATUS[pedido.status].texto}
          </Badge>
          <Badge>{pedido.origem === 'site' ? 'veio do site' : 'balcão'}</Badge>
          <Badge>{pedido.tipoEntrega === 'entrega' ? 'entrega' : 'retirada'}</Badge>
        </div>

        <section>
          <h3 className="text-xs font-medium tracking-wide text-stone-500 uppercase">Cliente</h3>
          <p className="mt-1 text-stone-900">{pedido.cliente.nome}</p>
          <p className="text-stone-600">{telefone(pedido.cliente.telefone)}</p>
          {pedido.cliente.email && <p className="text-stone-600">{pedido.cliente.email}</p>}
          <a
            href={linkWhatsapp(pedido.cliente.telefone, mensagem)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-medium text-vinho-700 underline"
          >
            Chamar no WhatsApp
          </a>
        </section>

        {pedido.endereco && (
          <section>
            <h3 className="text-xs font-medium tracking-wide text-stone-500 uppercase">Entrega</h3>
            <p className="mt-1 text-stone-700">
              {pedido.endereco.logradouro}, {pedido.endereco.numero}
              {pedido.endereco.complemento ? ` · ${pedido.endereco.complemento}` : ''} —{' '}
              {pedido.endereco.bairro}, {pedido.endereco.cidade}/{pedido.endereco.uf}
            </p>
            {pedido.endereco.referencia && (
              <p className="text-stone-500">Referência: {pedido.endereco.referencia}</p>
            )}
          </section>
        )}

        <section>
          <h3 className="text-xs font-medium tracking-wide text-stone-500 uppercase">Itens</h3>
          <ul className="mt-2 divide-y divide-stone-100">
            {pedido.itens.map((item) => (
              <li key={item.produtoId} className="flex justify-between gap-3 py-2">
                <span className="text-stone-800">
                  {item.quantidade}x {item.nome}
                  <span className="block text-xs text-stone-500">
                    {moeda(item.precoUnitario)} cada
                  </span>
                </span>
                <span className="shrink-0 text-stone-900">{moeda(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-1 border-t border-stone-200 pt-3 text-stone-700">
            <Linha rotulo="Subtotal" valor={moeda(pedido.subtotal)} />
            {pedido.desconto > 0 && (
              <Linha
                rotulo={`Desconto${pedido.cupomCodigo ? ` (${pedido.cupomCodigo})` : ''}`}
                valor={`− ${moeda(pedido.desconto)}`}
              />
            )}
            {pedido.frete > 0 && <Linha rotulo="Frete" valor={moeda(pedido.frete)} />}
            <div className="flex justify-between pt-1 text-base font-semibold text-stone-900">
              <dt>Total</dt>
              <dd>{moeda(pedido.total)}</dd>
            </div>
          </dl>
        </section>

        {pedido.observacao && (
          <section>
            <h3 className="text-xs font-medium tracking-wide text-stone-500 uppercase">
              Observação
            </h3>
            <p className="mt-1 text-stone-700">{pedido.observacao}</p>
          </section>
        )}

        <section>
          <h3 className="text-xs font-medium tracking-wide text-stone-500 uppercase">Histórico</h3>
          <ol className="mt-2 space-y-1 text-xs text-stone-500">
            {pedido.historico.map((evento, indice) => (
              <li key={`${evento.em}-${indice}`}>
                {quando(evento.em)} — {ROTULO_DO_STATUS[evento.status].texto} por {evento.por}
                {evento.observacao ? ` · ${evento.observacao}` : ''}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex justify-between">
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
