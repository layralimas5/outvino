import { useCallback, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Conteudo, Vazio } from '../componentes/Estado';
import { Modal } from '../componentes/Modal';
import { Area, Badge, Botao, Caixa, Campo, Cartao, Indicador, Selecao, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api, ErroDaApi } from '../lib/api';
import { linkWhatsapp, moedaDeCentavos, quando, telefone } from '../lib/formato';
import {
  COLUNA_DA_ETAPA,
  ETAPAS,
  type CarteiraDeClientes,
  type Cliente,
  type EtapaDeCliente,
  type FichaDeCliente,
} from '../tipos';

/**
 * A carteira inteira em lista, e o lugar de cadastrar ficha.
 *
 * O CRM é o quadro — bom pra ver o funil e mover gente de coluna. Aqui é a
 * outra pergunta: quem gastou mais, quem sumiu, quem levou o quê. E é daqui que
 * sai o cadastro: o histórico continua nascendo dos pedidos, mas CPF,
 * aniversário, endereço e preferência ninguém adivinha — alguém digita.
 */
const DIAS_PARA_SUMIR = 60;

export function Clientes() {
  const [busca, setBusca] = useState('');
  const [somenteRecorrentes, setSomenteRecorrentes] = useState(false);
  const [etapa, setEtapa] = useState<EtapaDeCliente | ''>('');
  const [editando, setEditando] = useState<Cliente | 'novo' | null>(null);

  const chave = `${busca}|${somenteRecorrentes}`;

  const buscar = useCallback(() => {
    const parametros = new URLSearchParams();
    if (busca.trim()) parametros.set('busca', busca.trim());
    if (somenteRecorrentes) parametros.set('recorrentes', 'true');

    const consulta = parametros.toString();
    return api.get<CarteiraDeClientes>(`/clientes${consulta ? `?${consulta}` : ''}`);
  }, [busca, somenteRecorrentes]);

  const estado = useApi(buscar, chave);

  async function excluirCadastro(cliente: Cliente) {
    const aviso = cliente.pedidos
      ? `Apagar o cadastro de ${cliente.nome}? Os ${cliente.pedidos} pedido(s) dela continuam, e a ficha volta a ser só o que o histórico conta.`
      : `Apagar o cadastro de ${cliente.nome}? Como ela não tem pedido nenhum, a ficha some da carteira.`;

    if (!confirm(aviso)) return;

    try {
      await api.remover(`/clientes/${cliente.telefone}`);
      estado.recarregar();
    } catch (causa) {
      alert(causa instanceof ErroDaApi ? causa.message : 'Não consegui apagar o cadastro.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Clientes</h1>
          <p className="text-sm text-stone-500">
            A carteira inteira em lista. Pra mover gente de etapa, use o{' '}
            <Link to="/crm" className="font-medium text-vinho-700 hover:underline">
              quadro do CRM
            </Link>
            .
          </p>
        </div>
        <Botao onClick={() => setEditando('novo')}>Cadastrar cliente</Botao>
      </header>

      <Conteudo estado={estado}>
        {(carteira) => {
          const clientes = etapa
            ? carteira.clientes.filter((cliente) => cliente.etapa === etapa)
            : carteira.clientes;

          return (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Indicador
                  rotulo="Clientes"
                  valor={String(carteira.resumo.total)}
                  detalhe={`${carteira.resumo.cadastrados} com ficha cadastrada`}
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

                  <Selecao
                    rotulo="Etapa"
                    className="w-full sm:w-44"
                    value={etapa}
                    onChange={(evento) => setEtapa(evento.target.value as EtapaDeCliente | '')}
                  >
                    <option value="">Todas</option>
                    {ETAPAS.map((valor) => (
                      <option key={valor} value={valor}>
                        {COLUNA_DA_ETAPA[valor].titulo}
                      </option>
                    ))}
                  </Selecao>

                  <div className="pb-2">
                    <Caixa
                      rotulo="Só recorrentes"
                      marcado={somenteRecorrentes}
                      aoMudar={setSomenteRecorrentes}
                    />
                  </div>
                </div>

                {clientes.length === 0 ? (
                  <Vazio
                    titulo="Ninguém com esses filtros."
                    descricao="A ficha aparece aqui quando a pessoa faz o primeiro pedido — ou assim que você cadastrar."
                  />
                ) : (
                  <Tabela
                    cabecalho={[
                      'Cliente',
                      'Etapa',
                      'Contato',
                      'Pedidos',
                      'Total',
                      'Ticket',
                      'Última compra',
                      'Preferido',
                      '',
                    ]}
                  >
                    {clientes.map((cliente) => (
                      <Linha
                        key={cliente.telefone}
                        cliente={cliente}
                        aoEditar={() => setEditando(cliente)}
                        aoExcluir={() => void excluirCadastro(cliente)}
                      />
                    ))}
                  </Tabela>
                )}
              </Cartao>
            </div>
          );
        }}
      </Conteudo>

      {editando && (
        <Ficha
          cliente={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null);
            estado.recarregar();
          }}
        />
      )}
    </div>
  );
}

interface LinhaProps {
  cliente: Cliente;
  aoEditar: () => void;
  aoExcluir: () => void;
}

function Linha({ cliente, aoEditar, aoExcluir }: LinhaProps) {
  /** Quem nunca fechou pedido aparece, mas marcado: é lead, não cliente. */
  const semCompra = cliente.pedidos === 0;
  const coluna = COLUNA_DA_ETAPA[cliente.etapa];

  return (
    <tr className="hover:bg-stone-50">
      <td className="px-4 py-2.5">
        <p className="font-medium text-stone-900">{cliente.nome}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          {cliente.cadastrado ? (
            <span className="text-stone-500">ficha cadastrada</span>
          ) : (
            <span className="text-stone-400">só do histórico</span>
          )}
          {!semCompra && cliente.diasSemComprar > DIAS_PARA_SUMIR && (
            <span className="text-orange-700">sumido há {cliente.diasSemComprar} dias</span>
          )}
        </div>
      </td>

      <td className="px-4 py-2.5">
        <Badge classe={coluna.badge}>{coluna.titulo}</Badge>
        {cliente.etapaManual && (
          <span className="mt-1 block text-xs text-stone-500">movido à mão</span>
        )}
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
        {cliente.ultimoEm ? quando(cliente.ultimoEm) : <span aria-hidden="true">—</span>}
      </td>

      <td className="px-4 py-2.5 text-stone-600">
        {cliente.preferido ?? <span aria-hidden="true">—</span>}
      </td>

      <td className="px-4 py-2.5 text-right whitespace-nowrap">
        <Botao variante="secundario" pequeno className="mr-1.5" onClick={aoEditar}>
          {cliente.cadastrado ? 'Ficha' : 'Cadastrar'}
        </Botao>
        {cliente.cadastrado && (
          <Botao variante="perigo" pequeno className="mr-1.5" onClick={aoExcluir}>
            Apagar ficha
          </Botao>
        )}
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

const CAMPOS_DO_ENDERECO = ['logradouro', 'numero', 'bairro', 'cidade', 'uf'] as const;

/**
 * A ficha completa.
 *
 * Serve pra três situações: cadastrar alguém do zero, completar a ficha de quem
 * já apareceu num pedido (aí nome, telefone e e-mail já vêm preenchidos) e
 * editar o que já foi cadastrado. O telefone só é editável no cadastro novo —
 * é a chave que liga a ficha ao histórico de pedidos.
 */
function Ficha({
  cliente,
  aoFechar,
  aoSalvar,
}: {
  cliente: Cliente | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const editando = cliente?.cadastrado ?? false;

  const [dados, setDados] = useState({
    nome: cliente?.nome ?? '',
    telefone: cliente?.telefone ?? '',
    email: cliente?.email ?? '',
    documento: cliente?.documento ?? '',
    nascimento: cliente?.nascimento ?? '',
    cep: cliente?.endereco?.cep ?? '',
    logradouro: cliente?.endereco?.logradouro ?? '',
    numero: cliente?.endereco?.numero ?? '',
    complemento: cliente?.endereco?.complemento ?? '',
    bairro: cliente?.endereco?.bairro ?? '',
    cidade: cliente?.endereco?.cidade ?? cliente?.cidade ?? '',
    uf: cliente?.endereco?.uf ?? '',
    referencia: cliente?.endereco?.referencia ?? '',
    preferencias: cliente?.preferencias ?? '',
    observacao: cliente?.observacao ?? '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudar = (campo: keyof typeof dados, valor: string) =>
    setDados((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    // Endereço é tudo ou nada: meio endereço não entrega vinho em lugar nenhum.
    const preenchidos = CAMPOS_DO_ENDERECO.filter((campo) => dados[campo].trim());
    if (preenchidos.length > 0 && preenchidos.length < CAMPOS_DO_ENDERECO.length) {
      setErro('Endereço incompleto: preencha rua, número, bairro, cidade e UF — ou deixe tudo em branco.');
      return;
    }

    const endereco =
      preenchidos.length === CAMPOS_DO_ENDERECO.length
        ? {
            cep: dados.cep.trim() || undefined,
            logradouro: dados.logradouro.trim(),
            numero: dados.numero.trim(),
            complemento: dados.complemento.trim() || undefined,
            bairro: dados.bairro.trim(),
            cidade: dados.cidade.trim(),
            uf: dados.uf.trim().toUpperCase(),
            referencia: dados.referencia.trim() || undefined,
          }
        : undefined;

    const ficha: FichaDeCliente = {
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim(),
      email: dados.email.trim() || undefined,
      documento: dados.documento.trim() || undefined,
      nascimento: dados.nascimento || undefined,
      endereco,
      preferencias: dados.preferencias.trim() || undefined,
      observacao: dados.observacao.trim() || undefined,
    };

    setSalvando(true);
    setErro(null);

    try {
      if (editando && cliente) {
        const { telefone: _naoMuda, ...alteracoes } = ficha;
        await api.patch(`/clientes/${cliente.telefone}`, alteracoes);
      } else {
        await api.post('/clientes', ficha);
      }
      aoSalvar();
    } catch (causa) {
      setErro(causa instanceof ErroDaApi ? causa.message : 'Não consegui salvar a ficha.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto
      largo
      titulo={editando ? `Ficha de ${cliente?.nome}` : 'Cadastrar cliente'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao form="form-cliente" type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar ficha'}
          </Botao>
        </>
      }
    >
      <form id="form-cliente" onSubmit={enviar} className="space-y-5">
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        {cliente && !editando && (
          <p className="rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-600">
            Essa pessoa já apareceu em pedido. O que você preencher aqui completa a ficha dela — o
            histórico de compras continua igual.
          </p>
        )}

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Identificação
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <Campo
              rotulo="Nome"
              required
              value={dados.nome}
              onChange={(evento) => mudar('nome', evento.target.value)}
              autoComplete="name"
              maxLength={80}
            />
            <Campo
              rotulo="Telefone (WhatsApp)"
              required
              readOnly={editando}
              value={editando ? telefone(dados.telefone) : dados.telefone}
              onChange={(evento) => mudar('telefone', evento.target.value)}
              placeholder="(27) 99999-0000"
              inputMode="tel"
              autoComplete="tel"
              dica={
                editando
                  ? 'Não muda: é a chave que liga a ficha aos pedidos.'
                  : 'É por ele que a ficha encontra os pedidos da pessoa.'
              }
              className={editando ? 'opacity-70' : undefined}
            />
            <Campo
              rotulo="E-mail"
              type="email"
              value={dados.email}
              onChange={(evento) => mudar('email', evento.target.value)}
              autoComplete="email"
            />
            <Campo
              rotulo="CPF ou CNPJ"
              value={dados.documento}
              onChange={(evento) => mudar('documento', evento.target.value)}
              inputMode="numeric"
              dica="Só quando a nota precisar. É conferido o dígito."
            />
            <Campo
              rotulo="Nascimento"
              type="date"
              value={dados.nascimento}
              onChange={(evento) => mudar('nascimento', evento.target.value)}
              dica="Pra lembrar de mandar algo no aniversário."
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Endereço de entrega
          </legend>
          <p className="text-xs text-stone-500">
            Opcional. Se preencher, vá até o fim: rua, número, bairro, cidade e UF.
          </p>

          <div className="grid gap-3 sm:grid-cols-6">
            <Campo
              rotulo="CEP"
              className="sm:col-span-2"
              value={dados.cep}
              onChange={(evento) => mudar('cep', evento.target.value)}
              inputMode="numeric"
              autoComplete="postal-code"
            />
            <Campo
              rotulo="Rua"
              className="sm:col-span-3"
              value={dados.logradouro}
              onChange={(evento) => mudar('logradouro', evento.target.value)}
              autoComplete="address-line1"
            />
            <Campo
              rotulo="Número"
              value={dados.numero}
              onChange={(evento) => mudar('numero', evento.target.value)}
            />
            <Campo
              rotulo="Complemento"
              className="sm:col-span-2"
              value={dados.complemento}
              onChange={(evento) => mudar('complemento', evento.target.value)}
            />
            <Campo
              rotulo="Bairro"
              className="sm:col-span-2"
              value={dados.bairro}
              onChange={(evento) => mudar('bairro', evento.target.value)}
            />
            <Campo
              rotulo="Cidade"
              className="sm:col-span-1"
              value={dados.cidade}
              onChange={(evento) => mudar('cidade', evento.target.value)}
            />
            <Campo
              rotulo="UF"
              maxLength={2}
              value={dados.uf}
              onChange={(evento) => mudar('uf', evento.target.value.toUpperCase())}
            />
            <Campo
              rotulo="Referência"
              className="sm:col-span-6"
              value={dados.referencia}
              onChange={(evento) => mudar('referencia', evento.target.value)}
              dica="Quem entrega usa mais isso que o CEP."
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Atendimento
          </legend>

          <Area
            rotulo="Preferências"
            value={dados.preferencias}
            onChange={(evento) => mudar('preferencias', evento.target.value)}
            placeholder="Gosta de tinto seco, evita doce, costuma levar kit de presente…"
            maxLength={300}
          />
          <Area
            rotulo="Observações"
            value={dados.observacao}
            onChange={(evento) => mudar('observacao', evento.target.value)}
            placeholder="Combinados, restrições de entrega, o que for útil na próxima conversa."
            maxLength={600}
          />
        </fieldset>

        {cliente?.pedidos ? (
          <p className="border-t border-stone-100 pt-3 text-xs text-stone-500">
            Histórico: {cliente.pedidos} pedido(s), {moedaDeCentavos(cliente.totalCentavos)} no
            total{cliente.ultimoEm ? `, último em ${quando(cliente.ultimoEm)}` : ''}. Isso vem dos
            pedidos e não se edita aqui.
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
