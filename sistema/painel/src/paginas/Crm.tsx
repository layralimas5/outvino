import { useCallback, useEffect, useState, type DragEvent } from 'react';
import { Conteudo, Vazio } from '../componentes/Estado';
import { Badge, Campo, Cartao, Indicador } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api, ErroDaApi } from '../lib/api';
import { linkWhatsapp, moedaDeCentavos, quando, telefone } from '../lib/formato';
import {
  COLUNA_DA_ETAPA,
  ETAPAS,
  type CarteiraDeClientes,
  type Cliente,
  type EtapaDeCliente,
} from '../tipos';

/**
 * CRM em quadro, montado a partir dos pedidos.
 *
 * Não existe cadastro de cliente no sistema: cada card é uma pessoa agrupada
 * pelo telefone, com o histórico que os pedidos dela contam. A coluna sai desse
 * histórico sozinha — e arrastar o card grava uma escolha por cima, que a
 * própria API deixa caducar quando o fato muda (quem estava em "Lead" e comprou
 * volta pra fila certa em vez de ficar parado numa coluna mentindo).
 */
const DIAS_PARA_SUMIR = 60;

export function Crm() {
  const [busca, setBusca] = useState('');
  /** Cards já movidos nesta tela, por cima do que a busca trouxe. */
  const [movidos, setMovidos] = useState<Record<string, Cliente>>({});
  const [erroAoMover, setErroAoMover] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<EtapaDeCliente | null>(null);

  const buscar = useCallback(() => {
    const termo = busca.trim();
    return api.get<CarteiraDeClientes>(`/clientes${termo ? `?busca=${encodeURIComponent(termo)}` : ''}`);
  }, [busca]);

  const estado = useApi(buscar, busca);

  // Busca nova traz fichas novas do servidor: o que estava por cima já valeu.
  useEffect(() => setMovidos({}), [busca]);

  async function mover(cliente: Cliente, etapa: EtapaDeCliente) {
    if (cliente.etapa === etapa) return;

    const anterior = movidos[cliente.telefone];
    setErroAoMover(null);
    // Otimista: o card acompanha o mouse. Falhando, volta pra onde estava.
    setMovidos((atual) => ({ ...atual, [cliente.telefone]: { ...cliente, etapa } }));

    try {
      const salvo = await api.patch<Cliente>(`/clientes/${cliente.telefone}/etapa`, { etapa });
      setMovidos((atual) => ({ ...atual, [cliente.telefone]: salvo }));
    } catch (causa) {
      setMovidos((atual) => {
        const revertido = { ...atual };
        if (anterior) revertido[cliente.telefone] = anterior;
        else delete revertido[cliente.telefone];
        return revertido;
      });
      setErroAoMover(
        causa instanceof ErroDaApi ? causa.message : 'Não consegui mover o card. Tente de novo.',
      );
    }
  }

  async function voltarAoAutomatico(cliente: Cliente) {
    setErroAoMover(null);

    try {
      const salvo = await api.remover<Cliente>(`/clientes/${cliente.telefone}/etapa`);
      setMovidos((atual) => ({ ...atual, [cliente.telefone]: salvo }));
    } catch (causa) {
      setErroAoMover(
        causa instanceof ErroDaApi ? causa.message : 'Não consegui desfazer. Tente de novo.',
      );
    }
  }

  function aoSoltar(evento: DragEvent<HTMLDivElement>, etapa: EtapaDeCliente, cartoes: Cliente[]) {
    evento.preventDefault();
    setColunaAlvo(null);
    setArrastando(null);

    const telefoneArrastado = evento.dataTransfer.getData('text/plain');
    const cliente = cartoes.find((atual) => atual.telefone === telefoneArrastado);
    if (cliente) void mover(cliente, etapa);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">CRM</h1>
        <p className="text-sm text-stone-500">
          Quem já comprou, quanto gastou e há quanto tempo não aparece. A coluna sai dos pedidos —
          arraste o card pra mudar à mão.
        </p>
      </header>

      <Conteudo estado={estado}>
        {(carteira) => {
          const clientes = carteira.clientes.map(
            (cliente) => movidos[cliente.telefone] ?? cliente,
          );

          return (
            <div className="space-y-5">
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

              <Campo
                rotulo="Buscar"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Nome, telefone ou e-mail"
                type="search"
                autoComplete="off"
                className="w-full sm:w-72"
              />

              {erroAoMover && (
                <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erroAoMover}
                </p>
              )}

              {clientes.length === 0 ? (
                <Cartao>
                  <Vazio
                    titulo="Ninguém com essa busca."
                    descricao="A ficha aparece aqui assim que a pessoa fizer o primeiro pedido."
                  />
                </Cartao>
              ) : (
                <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                  {ETAPAS.map((etapa) => {
                    const cartoes = clientes.filter((cliente) => cliente.etapa === etapa);

                    return (
                      <Coluna
                        key={etapa}
                        etapa={etapa}
                        cartoes={cartoes}
                        alvo={colunaAlvo === etapa}
                        arrastando={arrastando}
                        aoEntrar={() => setColunaAlvo(etapa)}
                        aoSair={() => setColunaAlvo((atual) => (atual === etapa ? null : atual))}
                        aoSoltar={(evento) => aoSoltar(evento, etapa, clientes)}
                        aoIniciarArrasto={setArrastando}
                        aoTerminarArrasto={() => {
                          setArrastando(null);
                          setColunaAlvo(null);
                        }}
                        aoMover={mover}
                        aoVoltarAoAutomatico={voltarAoAutomatico}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        }}
      </Conteudo>
    </div>
  );
}

interface ColunaProps {
  etapa: EtapaDeCliente;
  cartoes: Cliente[];
  alvo: boolean;
  arrastando: string | null;
  aoEntrar: () => void;
  aoSair: () => void;
  aoSoltar: (evento: DragEvent<HTMLDivElement>) => void;
  aoIniciarArrasto: (telefone: string) => void;
  aoTerminarArrasto: () => void;
  aoMover: (cliente: Cliente, etapa: EtapaDeCliente) => void;
  aoVoltarAoAutomatico: (cliente: Cliente) => void;
}

function Coluna({
  etapa,
  cartoes,
  alvo,
  arrastando,
  aoEntrar,
  aoSair,
  aoSoltar,
  aoIniciarArrasto,
  aoTerminarArrasto,
  aoMover,
  aoVoltarAoAutomatico,
}: ColunaProps) {
  const coluna = COLUNA_DA_ETAPA[etapa];
  const total = cartoes.reduce((soma, cliente) => soma + cliente.totalCentavos, 0);

  return (
    <div
      onDragOver={(evento) => {
        // Sem o preventDefault o navegador recusa a soltura.
        evento.preventDefault();
        evento.dataTransfer.dropEffect = 'move';
        aoEntrar();
      }}
      onDragLeave={(evento) => {
        // Passar por cima de um card filho não conta como sair da coluna.
        if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) aoSair();
      }}
      onDrop={aoSoltar}
      className={`flex w-72 shrink-0 flex-col rounded-lg border bg-stone-50 transition-colors ${
        alvo ? 'border-vinho-500 bg-vinho-50' : 'border-stone-200'
      }`}
    >
      <div className="rounded-t-lg border-b border-stone-200 bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${coluna.faixa}`} aria-hidden="true" />
          <h2 className="text-sm font-semibold text-stone-900">{coluna.titulo}</h2>
          <span className="ml-auto text-xs font-medium text-stone-500">{cartoes.length}</span>
        </div>
        <p className="mt-0.5 text-xs text-stone-500">{coluna.descricao}</p>
        {total > 0 && (
          <p className="mt-1 text-xs font-medium text-stone-700">{moedaDeCentavos(total)}</p>
        )}
      </div>

      <ul className="flex min-h-32 flex-1 flex-col gap-2 p-2">
        {cartoes.length === 0 ? (
          <li className="px-2 py-6 text-center text-xs text-stone-400">
            Solte um card aqui{etapa === 'conversa' && ' pra marcar que a conversa começou'}.
          </li>
        ) : (
          cartoes.map((cliente) => (
            <Card
              key={cliente.telefone}
              cliente={cliente}
              arrastando={arrastando === cliente.telefone}
              aoIniciarArrasto={aoIniciarArrasto}
              aoTerminarArrasto={aoTerminarArrasto}
              aoMover={aoMover}
              aoVoltarAoAutomatico={aoVoltarAoAutomatico}
            />
          ))
        )}
      </ul>
    </div>
  );
}

interface CardProps {
  cliente: Cliente;
  arrastando: boolean;
  aoIniciarArrasto: (telefone: string) => void;
  aoTerminarArrasto: () => void;
  aoMover: (cliente: Cliente, etapa: EtapaDeCliente) => void;
  aoVoltarAoAutomatico: (cliente: Cliente) => void;
}

function Card({
  cliente,
  arrastando,
  aoIniciarArrasto,
  aoTerminarArrasto,
  aoMover,
  aoVoltarAoAutomatico,
}: CardProps) {
  const soRascunho = cliente.pedidos === 0;

  return (
    <li>
      <article
        draggable
        onDragStart={(evento) => {
          evento.dataTransfer.setData('text/plain', cliente.telefone);
          evento.dataTransfer.effectAllowed = 'move';
          aoIniciarArrasto(cliente.telefone);
        }}
        onDragEnd={aoTerminarArrasto}
        className={`cursor-grab rounded-md border border-stone-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
          // Card em arrasto não pulsa: quem manda no movimento é o mouse.
          arrastando ? 'opacity-40' : 'pulsa'
        }`}
      >
        <p className="text-sm font-medium text-stone-900">{cliente.nome}</p>
        <p className="mt-0.5 text-xs text-stone-500">{telefone(cliente.telefone)}</p>
        {cliente.cidade && <p className="text-xs text-stone-500">{cliente.cidade}</p>}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {cliente.etapaManual && (
            <Badge classe="bg-vinho-50 text-vinho-800 ring-vinho-100">movido à mão</Badge>
          )}
          {!soRascunho && cliente.diasSemComprar > DIAS_PARA_SUMIR && (
            <Badge classe="bg-orange-100 text-orange-900 ring-orange-200">
              {cliente.diasSemComprar} dias sem comprar
            </Badge>
          )}
          {cliente.cancelados > 0 && (
            <Badge classe="bg-stone-100 text-stone-600 ring-stone-200">
              {cliente.cancelados} cancelado{cliente.cancelados > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <div>
            <dt className="text-stone-500">Pedidos</dt>
            <dd className="font-medium text-stone-800">{cliente.pedidos}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Total</dt>
            <dd className="font-medium text-stone-800">{moedaDeCentavos(cliente.totalCentavos)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Ticket</dt>
            <dd className="text-stone-700">{moedaDeCentavos(cliente.ticketMedioCentavos)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Última compra</dt>
            <dd className="text-stone-700">
              {cliente.ultimoEm ? quando(cliente.ultimoEm) : '—'}
            </dd>
          </div>
        </dl>

        {cliente.preferido && (
          <p className="mt-2 truncate text-xs text-stone-500" title={cliente.preferido}>
            Preferido: <span className="text-stone-700">{cliente.preferido}</span>
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-2.5">
          {/*
            O arrasto não existe pra teclado nem pro celular. Esse seletor é o
            mesmo movimento, pelo caminho que funciona em todo lugar.
          */}
          <select
            aria-label={`Mover ${cliente.nome} de coluna`}
            value={cliente.etapa}
            onChange={(evento) => aoMover(cliente, evento.target.value as EtapaDeCliente)}
            className="min-w-0 flex-1 rounded border border-stone-300 bg-white px-1.5 py-1 text-xs text-stone-700 focus:border-vinho-600 focus:outline-none"
          >
            {ETAPAS.map((etapa) => (
              <option key={etapa} value={etapa}>
                {COLUNA_DA_ETAPA[etapa].titulo}
              </option>
            ))}
          </select>

          {cliente.etapaManual && (
            <button
              type="button"
              onClick={() => aoVoltarAoAutomatico(cliente)}
              title="Voltar a seguir o histórico de pedidos"
              className="rounded px-1.5 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-700"
            >
              Auto
            </button>
          )}

          <a
            href={linkWhatsapp(cliente.telefone, `Oi, ${cliente.nome.split(' ')[0]}! Aqui é da Outvino.`)}
            target="_blank"
            rel="noreferrer"
            className="rounded px-1.5 py-1 text-xs font-medium whitespace-nowrap text-vinho-700 hover:underline"
          >
            Chamar
          </a>
        </div>
      </article>
    </li>
  );
}
