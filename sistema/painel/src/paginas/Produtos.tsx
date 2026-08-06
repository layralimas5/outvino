import { useCallback, useState, type FormEvent } from 'react';
import { Conteudo } from '../componentes/Estado';
import { Modal } from '../componentes/Modal';
import { Area, Badge, Botao, Caixa, Campo, Cartao, Selecao, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api, ErroDaApi, query } from '../lib/api';
import { moeda } from '../lib/formato';
import { TIPOS, type Produto, type Tipo, type TipoDeMovimento } from '../tipos';

export function Produtos() {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [aRepor, setARepor] = useState(false);
  const [editando, setEditando] = useState<Produto | 'novo' | null>(null);
  const [movimentando, setMovimentando] = useState<Produto | null>(null);

  const filtro = query({ busca, tipo, abaixoDoMinimo: aRepor || undefined });
  const buscar = useCallback(() => api.get<Produto[]>(`/produtos${filtro}`), [filtro]);
  const estado = useApi(buscar, filtro);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Produtos</h1>
          <p className="text-sm text-stone-500">
            O catálogo do site sai daqui. Estoque só muda por movimento.
          </p>
        </div>
        <Botao onClick={() => setEditando('novo')}>Novo produto</Botao>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          placeholder="Nome, uva, país, SKU"
          aria-label="Buscar produto"
          className="min-w-56 flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-vinho-600 focus:outline-none"
        />
        <select
          value={tipo}
          onChange={(evento) => setTipo(evento.target.value)}
          aria-label="Filtrar por tipo"
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-vinho-600 focus:outline-none"
        >
          <option value="">Todos os tipos</option>
          {TIPOS.map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </select>
        <Caixa rotulo="Só o que precisa repor" marcado={aRepor} aoMudar={setARepor} />
      </div>

      <Cartao>
        <Conteudo
          estado={estado}
          vazio={{ titulo: 'Nenhum produto.', descricao: 'Cadastre o primeiro em "Novo produto".' }}
        >
          {(produtos) => (
            <Tabela cabecalho={['Produto', 'Preço', 'Estoque', 'Site', '']}>
              {produtos.map((produto) => (
                <tr key={produto.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-900">{produto.nome}</p>
                    <p className="text-xs text-stone-500">
                      {produto.tipo} · {produto.pais}
                      {produto.safra ? ` · ${produto.safra}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-stone-900">{moeda(produto.preco)}</p>
                    {produto.precoDe && (
                      <p className="text-xs text-stone-400 line-through">{moeda(produto.precoDe)}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      classe={
                        produto.estoque === 0
                          ? 'bg-red-100 text-red-800 ring-red-200'
                          : produto.aRepor
                            ? 'bg-amber-100 text-amber-900 ring-amber-200'
                            : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                      }
                    >
                      {produto.estoque === 0 ? 'esgotado' : `${produto.estoque} un.`}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {produto.publicadoNoSite ? <Badge>no ar</Badge> : <Badge>fora</Badge>}
                      {produto.destaque && (
                        <Badge classe="bg-vinho-50 text-vinho-700 ring-vinho-100">destaque</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Botao
                      variante="secundario"
                      pequeno
                      className="mr-1.5"
                      onClick={() => setMovimentando(produto)}
                    >
                      Estoque
                    </Botao>
                    <Botao variante="secundario" pequeno onClick={() => setEditando(produto)}>
                      Editar
                    </Botao>
                  </td>
                </tr>
              ))}
            </Tabela>
          )}
        </Conteudo>
      </Cartao>

      {editando && (
        <Formulario
          produto={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null);
            estado.recarregar();
          }}
        />
      )}

      {movimentando && (
        <MovimentoDeEstoque
          produto={movimentando}
          aoFechar={() => setMovimentando(null)}
          aoSalvar={() => {
            setMovimentando(null);
            estado.recarregar();
          }}
        />
      )}
    </div>
  );
}

/** O formulário guarda tudo como texto e converte na hora de enviar. */
type Rascunho = Record<string, string | boolean>;

function rascunhoDe(produto: Produto | null): Rascunho {
  return {
    nome: produto?.nome ?? '',
    tipo: produto?.tipo ?? 'Tinto',
    pais: produto?.pais ?? '',
    regiao: produto?.regiao ?? '',
    uva: produto?.uva ?? '',
    vinicola: produto?.vinicola ?? '',
    safra: produto?.safra ? String(produto.safra) : '',
    volumeMl: produto?.volumeMl ? String(produto.volumeMl) : '750',
    teor: produto?.teor ?? '',
    sku: produto?.sku ?? '',
    preco: produto?.preco ? String(produto.preco) : '',
    precoDe: produto?.precoDe ? String(produto.precoDe) : '',
    custo: produto?.custo ? String(produto.custo) : '',
    classificacao: produto?.classificacao ?? '',
    amadurecimento: produto?.amadurecimento ?? '',
    temperaturaServico: produto?.temperaturaServico ?? '',
    potencialGuarda: produto?.potencialGuarda ?? '',
    visual: produto?.visual ?? '',
    olfativo: produto?.olfativo ?? '',
    gustativo: produto?.gustativo ?? '',
    descricao: produto?.descricao ?? '',
    notas: produto?.notas.join(', ') ?? '',
    harmonizacao: produto?.harmonizacao.join(', ') ?? '',
    imagem: produto?.imagem ?? '',
    estoque: '0',
    estoqueMinimo: produto ? String(produto.estoqueMinimo) : '3',
    destaque: produto?.destaque ?? false,
    publicadoNoSite: produto?.publicadoNoSite ?? true,
  };
}

function Formulario({
  produto,
  aoFechar,
  aoSalvar,
}: {
  produto: Produto | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [dados, setDados] = useState<Rascunho>(() => rascunhoDe(produto));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const texto = (campo: string) => String(dados[campo] ?? '');
  const mudar = (campo: string, valor: string | boolean) =>
    setDados((atual) => ({ ...atual, [campo]: valor }));

  function corpo(): Record<string, unknown> {
    const numero = (campo: string): number | undefined => {
      const valor = texto(campo).replace(',', '.').trim();
      return valor === '' ? undefined : Number(valor);
    };
    const lista = (campo: string): string[] =>
      texto(campo)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    const opcional = (campo: string): string | undefined => texto(campo).trim() || undefined;

    const comum = {
      nome: texto('nome').trim(),
      tipo: texto('tipo') as Tipo,
      pais: texto('pais').trim(),
      regiao: opcional('regiao'),
      uva: opcional('uva'),
      vinicola: opcional('vinicola'),
      safra: numero('safra'),
      volumeMl: numero('volumeMl'),
      teor: opcional('teor'),
      sku: opcional('sku'),
      classificacao: opcional('classificacao'),
      amadurecimento: opcional('amadurecimento'),
      temperaturaServico: opcional('temperaturaServico'),
      potencialGuarda: opcional('potencialGuarda'),
      visual: opcional('visual'),
      olfativo: opcional('olfativo'),
      gustativo: opcional('gustativo'),
      preco: numero('preco'),
      // Zero limpa a promoção; ausente mantém o que estava.
      precoDe: produto ? (numero('precoDe') ?? 0) : numero('precoDe'),
      custo: numero('custo'),
      descricao: texto('descricao').trim(),
      notas: lista('notas'),
      harmonizacao: lista('harmonizacao'),
      imagem: opcional('imagem'),
      estoqueMinimo: numero('estoqueMinimo'),
      destaque: Boolean(dados.destaque),
      publicadoNoSite: Boolean(dados.publicadoNoSite),
    };

    return produto ? comum : { ...comum, estoque: numero('estoque') ?? 0 };
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      if (produto) await api.patch(`/produtos/${produto.id}`, corpo());
      else await api.post('/produtos', corpo());
      aoSalvar();
    } catch (causa) {
      setErro(causa instanceof ErroDaApi ? causa.message : 'Não consegui salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      largo
      aberto
      titulo={produto ? `Editar ${produto.nome}` : 'Novo produto'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao form="form-produto" type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id="form-produto" onSubmit={enviar} className="space-y-4">
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            rotulo="Nome"
            required
            className="sm:col-span-2"
            value={texto('nome')}
            onChange={(evento) => mudar('nome', evento.target.value)}
            dica={produto ? undefined : 'Vira o endereço no site e não muda depois.'}
          />
          <Selecao
            rotulo="Tipo"
            value={texto('tipo')}
            onChange={(evento) => mudar('tipo', evento.target.value)}
          >
            {TIPOS.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </Selecao>
          <Campo
            rotulo="País"
            required
            value={texto('pais')}
            onChange={(evento) => mudar('pais', evento.target.value)}
          />
          <Campo
            rotulo="Região"
            value={texto('regiao')}
            onChange={(evento) => mudar('regiao', evento.target.value)}
          />
          <Campo
            rotulo="Uva"
            value={texto('uva')}
            onChange={(evento) => mudar('uva', evento.target.value)}
          />
          <Campo
            rotulo="Vinícola"
            value={texto('vinicola')}
            onChange={(evento) => mudar('vinicola', evento.target.value)}
          />
          <Campo
            rotulo="Safra"
            inputMode="numeric"
            value={texto('safra')}
            onChange={(evento) => mudar('safra', evento.target.value)}
          />
          <Campo
            rotulo="Volume (ml)"
            inputMode="numeric"
            value={texto('volumeMl')}
            onChange={(evento) => mudar('volumeMl', evento.target.value)}
          />
          <Campo
            rotulo="Teor alcoólico"
            value={texto('teor')}
            onChange={(evento) => mudar('teor', evento.target.value)}
            dica="Ex.: 14,5% ABV"
          />
        </div>

        {/* Ficha técnica do site: tudo opcional, campo vazio simplesmente não aparece lá. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            rotulo="Classificação"
            value={texto('classificacao')}
            onChange={(evento) => mudar('classificacao', evento.target.value)}
            dica="Seco, Meio seco, Brut, Demi-sec…"
          />
          <Campo
            rotulo="Amadurecimento"
            value={texto('amadurecimento')}
            onChange={(evento) => mudar('amadurecimento', evento.target.value)}
            dica="Ex.: 5 meses em barricas de carvalho francês"
          />
          <Campo
            rotulo="Temperatura de serviço"
            value={texto('temperaturaServico')}
            onChange={(evento) => mudar('temperaturaServico', evento.target.value)}
            dica="Ex.: 16 °C"
          />
          <Campo
            rotulo="Potencial de guarda"
            value={texto('potencialGuarda')}
            onChange={(evento) => mudar('potencialGuarda', evento.target.value)}
            dica="Ex.: 5 anos"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Area
            rotulo="Visual"
            value={texto('visual')}
            onChange={(evento) => mudar('visual', evento.target.value)}
          />
          <Area
            rotulo="Olfativo"
            value={texto('olfativo')}
            onChange={(evento) => mudar('olfativo', evento.target.value)}
          />
          <Area
            rotulo="Gustativo"
            value={texto('gustativo')}
            onChange={(evento) => mudar('gustativo', evento.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Campo
            rotulo="Preço (R$)"
            required
            inputMode="decimal"
            value={texto('preco')}
            onChange={(evento) => mudar('preco', evento.target.value)}
          />
          <Campo
            rotulo="Preço de (riscado)"
            inputMode="decimal"
            value={texto('precoDe')}
            onChange={(evento) => mudar('precoDe', evento.target.value)}
            dica="Vazio ou 0 tira a promoção."
          />
          <Campo
            rotulo="Custo (R$)"
            inputMode="decimal"
            value={texto('custo')}
            onChange={(evento) => mudar('custo', evento.target.value)}
            dica="Nunca aparece no site."
          />
        </div>

        <Area
          rotulo="Descrição"
          required
          value={texto('descricao')}
          onChange={(evento) => mudar('descricao', evento.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            rotulo="Notas de degustação"
            value={texto('notas')}
            onChange={(evento) => mudar('notas', evento.target.value)}
            dica="Separadas por vírgula."
          />
          <Campo
            rotulo="Harmoniza com"
            value={texto('harmonizacao')}
            onChange={(evento) => mudar('harmonizacao', evento.target.value)}
            dica="Separadas por vírgula."
          />
          <Campo
            rotulo="Imagem"
            value={texto('imagem')}
            onChange={(evento) => mudar('imagem', evento.target.value)}
            dica="Caminho no site (/img/vinhos/x.jpg) ou URL."
          />
          <Campo
            rotulo="SKU"
            value={texto('sku')}
            onChange={(evento) => mudar('sku', evento.target.value)}
          />
          {!produto && (
            <Campo
              rotulo="Estoque inicial"
              inputMode="numeric"
              value={texto('estoque')}
              onChange={(evento) => mudar('estoque', evento.target.value)}
              dica="Entra como movimento de entrada."
            />
          )}
          <Campo
            rotulo="Estoque mínimo"
            inputMode="numeric"
            value={texto('estoqueMinimo')}
            onChange={(evento) => mudar('estoqueMinimo', evento.target.value)}
            dica="Abaixo disso entra na lista de reposição."
          />
        </div>

        <div className="flex flex-wrap gap-5 pt-1">
          <Caixa
            rotulo="Publicado no site"
            marcado={Boolean(dados.publicadoNoSite)}
            aoMudar={(valor) => mudar('publicadoNoSite', valor)}
          />
          <Caixa
            rotulo="Destaque na vitrine"
            marcado={Boolean(dados.destaque)}
            aoMudar={(valor) => mudar('destaque', valor)}
          />
        </div>
      </form>
    </Modal>
  );
}

const MOVIMENTOS: Array<{ valor: TipoDeMovimento; rotulo: string }> = [
  { valor: 'entrada', rotulo: 'Entrada (recebi mercadoria)' },
  { valor: 'saida', rotulo: 'Saída (venda no balcão)' },
  { valor: 'perda', rotulo: 'Perda (quebra, vencimento)' },
  { valor: 'ajuste', rotulo: 'Ajuste de contagem (aceita negativo)' },
];

function MovimentoDeEstoque({
  produto,
  aoFechar,
  aoSalvar,
}: {
  produto: Produto;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoDeMovimento>('entrada');
  const [quantidade, setQuantidade] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      await api.post(`/produtos/${produto.id}/estoque`, {
        tipo,
        quantidade: Number(quantidade),
        motivo: motivo.trim() || undefined,
      });
      aoSalvar();
    } catch (causa) {
      setErro(causa instanceof ErroDaApi ? causa.message : 'Não consegui registrar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto
      titulo={`Estoque · ${produto.nome}`}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao form="form-estoque" type="submit" disabled={salvando}>
            {salvando ? 'Registrando…' : 'Registrar'}
          </Botao>
        </>
      }
    >
      <form id="form-estoque" onSubmit={enviar} className="space-y-4">
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <p className="text-sm text-stone-600">
          Saldo atual: <strong className="text-stone-900">{produto.estoque} un.</strong>
        </p>

        <Selecao
          rotulo="O que aconteceu"
          value={tipo}
          onChange={(evento) => setTipo(evento.target.value as TipoDeMovimento)}
        >
          {MOVIMENTOS.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </Selecao>

        <Campo
          rotulo="Quantidade"
          required
          inputMode="numeric"
          value={quantidade}
          onChange={(evento) => setQuantidade(evento.target.value)}
          dica={tipo === 'ajuste' ? 'Use -2 para tirar 2 unidades da contagem.' : undefined}
        />

        <Campo
          rotulo="Motivo"
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          dica="Aparece no histórico. Ajuda a auditar depois."
        />
      </form>
    </Modal>
  );
}
