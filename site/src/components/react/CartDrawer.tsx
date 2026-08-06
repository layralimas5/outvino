import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import {
  carrinhoAberto,
  definirQuantidade,
  esvaziar,
  fecharCarrinho,
  itens as itensDoCarrinho,
  remover,
  valorTotal,
} from '../../lib/cart';
import { preco } from '../../lib/format';
import { conferirCupom, registrarPedido, type CupomConferido } from '../../lib/pedido';
import { linkDoPedido } from '../../lib/whatsapp';

type Etapa = 'itens' | 'dados';

export default function CartDrawer() {
  const aberto = useStore(carrinhoAberto);
  const itens = useStore(itensDoCarrinho);
  const subtotal = useStore(valorTotal);

  const [etapa, setEtapa] = useState<Etapa>('itens');
  const [cupom, setCupom] = useState<CupomConferido | null>(null);
  const painel = useRef<HTMLDivElement>(null);

  const desconto = cupom?.desconto ?? 0;
  const total = Math.max(subtotal - desconto, 0);

  // Esc fecha, e o corpo trava pra página de trás não rolar junto.
  useEffect(() => {
    if (!aberto) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fecharCarrinho();
    };

    document.addEventListener('keydown', aoTeclar);
    document.body.style.overflow = 'hidden';
    painel.current?.focus();

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
    };
  }, [aberto]);

  // Cupom conferido contra um subtotal que mudou não vale mais.
  useEffect(() => {
    setCupom(null);
  }, [subtotal]);

  useEffect(() => {
    if (!aberto) setEtapa('itens');
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-tinta-900/40 backdrop-blur-sm"
        onClick={fecharCarrinho}
        aria-hidden="true"
      />

      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-papel-200 bg-papel-0 shadow-2xl focus:outline-none"
      >
        <header className="flex items-center justify-between border-b border-papel-200 px-5 py-4">
          <h2 className="font-display text-xl text-tinta-900">
            {etapa === 'itens' ? 'Seu carrinho' : 'Seus dados'}
          </h2>
          <button
            type="button"
            onClick={fecharCarrinho}
            aria-label="Fechar carrinho"
            className="rounded-lg px-2 py-1 text-tinta-700 transition-colors hover:text-tinta-900"
          >
            ✕
          </button>
        </header>

        {itens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-tinta-700">Seu carrinho está vazio.</p>
            <a
              href="/vinhos/"
              className="rounded-lg bg-vinho-600 px-5 py-2.5 text-sm font-medium text-creme-100 transition-colors hover:bg-vinho-700"
            >
              Ver os vinhos
            </a>
          </div>
        ) : etapa === 'itens' ? (
          <ListaDeItens
            itens={itens}
            subtotal={subtotal}
            desconto={desconto}
            total={total}
            cupom={cupom}
            aoAplicarCupom={setCupom}
            aoAvancar={() => setEtapa('dados')}
          />
        ) : (
          <Checkout
            itens={itens}
            total={total}
            desconto={desconto}
            cupom={cupom}
            aoVoltar={() => setEtapa('itens')}
          />
        )}
      </div>
    </div>
  );
}

function ListaDeItens({
  itens,
  subtotal,
  desconto,
  total,
  cupom,
  aoAplicarCupom,
  aoAvancar,
}: {
  itens: ReturnType<typeof itensDoCarrinho.get>;
  subtotal: number;
  desconto: number;
  total: number;
  cupom: CupomConferido | null;
  aoAplicarCupom: (cupom: CupomConferido | null) => void;
  aoAvancar: () => void;
}) {
  const [codigo, setCodigo] = useState('');
  const [conferindo, setConferindo] = useState(false);
  const [erroDoCupom, setErroDoCupom] = useState<string | null>(null);

  async function aplicar(evento: SyntheticEvent) {
    evento.preventDefault();
    if (!codigo.trim()) return;

    setConferindo(true);
    setErroDoCupom(null);

    try {
      aoAplicarCupom(await conferirCupom(codigo.trim(), subtotal));
    } catch (causa) {
      aoAplicarCupom(null);
      setErroDoCupom(causa instanceof Error ? causa.message : 'Cupom inválido.');
    } finally {
      setConferindo(false);
    }
  }

  return (
    <>
      <ul className="flex-1 divide-y divide-papel-100 overflow-y-auto px-5">
        {itens.map((item) => (
          <li key={item.id} className="flex gap-3 py-4">
            <div className="min-w-0 flex-1">
              <a
                href={item.url}
                className="block truncate text-sm text-tinta-900 transition-colors hover:text-vinho-600"
              >
                {item.nome}
              </a>
              <p className="mt-0.5 text-xs text-tinta-500">{preco(item.preco)} cada</p>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-papel-200">
                  <button
                    type="button"
                    onClick={() => definirQuantidade(item.id, item.quantidade - 1)}
                    aria-label={`Diminuir ${item.nome}`}
                    className="px-2.5 py-1 text-tinta-700 hover:text-tinta-900"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm text-tinta-900">{item.quantidade}</span>
                  <button
                    type="button"
                    onClick={() => definirQuantidade(item.id, item.quantidade + 1)}
                    aria-label={`Aumentar ${item.nome}`}
                    className="px-2.5 py-1 text-tinta-700 hover:text-tinta-900"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remover(item.id)}
                  className="text-xs text-tinta-500 underline transition-colors hover:text-vinho-600"
                >
                  remover
                </button>
              </div>
            </div>

            <p className="shrink-0 text-sm text-vinho-600">
              {preco(item.preco * item.quantidade)}
            </p>
          </li>
        ))}
      </ul>

      <footer className="space-y-3 border-t border-papel-200 px-5 py-4">
        <form onSubmit={aplicar} className="flex gap-2">
          <input
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            placeholder="Cupom de desconto"
            aria-label="Cupom de desconto"
            className="min-w-0 flex-1 rounded-lg border border-papel-200 bg-papel-50 px-3 py-2 text-sm text-tinta-900 placeholder:text-tinta-500 focus:border-vinho-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={conferindo}
            className="rounded-lg border border-papel-300 px-3 py-2 text-sm text-tinta-700 transition-colors hover:border-vinho-600 disabled:opacity-50"
          >
            {conferindo ? '…' : 'Aplicar'}
          </button>
        </form>

        {erroDoCupom && (
          <p role="alert" className="text-xs text-vinho-600">
            {erroDoCupom}
          </p>
        )}
        {cupom && (
          <p className="text-xs text-vinho-600">
            Cupom {cupom.codigo} aplicado: − {preco(cupom.desconto)}
          </p>
        )}

        <dl className="space-y-1 text-sm text-tinta-700">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{preco(subtotal)}</dd>
          </div>
          {desconto > 0 && (
            <div className="flex justify-between text-vinho-600">
              <dt>Desconto</dt>
              <dd>− {preco(desconto)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-papel-100 pt-2 text-base text-tinta-900">
            <dt className="font-medium">Total</dt>
            <dd className="font-produto text-xl font-semibold text-vinho-600">{preco(total)}</dd>
          </div>
        </dl>

        <p className="text-xs text-tinta-500">Frete combinado no WhatsApp.</p>

        <button
          type="button"
          onClick={aoAvancar}
          className="w-full rounded-lg bg-vinho-600 px-4 py-3 font-medium text-creme-100 transition-colors hover:bg-vinho-700"
        >
          Fechar pedido
        </button>
      </footer>
    </>
  );
}

function Checkout({
  itens,
  total,
  desconto,
  cupom,
  aoVoltar,
}: {
  itens: ReturnType<typeof itensDoCarrinho.get>;
  total: number;
  desconto: number;
  cupom: CupomConferido | null;
  aoVoltar: () => void;
}) {
  const [dados, setDados] = useState({
    nome: '',
    telefone: '',
    tipoEntrega: 'retirada' as 'retirada' | 'entrega',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    observacao: '',
  });
  const [enviando, setEnviando] = useState(false);

  const mudar = (campo: keyof typeof dados, valor: string) =>
    setDados((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(evento: SyntheticEvent) {
    evento.preventDefault();
    setEnviando(true);

    const entrega = dados.tipoEntrega === 'entrega';

    const registrado = await registrarPedido({
      cliente: { nome: dados.nome.trim(), telefone: dados.telefone.trim() },
      itens,
      cupomCodigo: cupom?.codigo,
      tipoEntrega: dados.tipoEntrega,
      endereco: entrega
        ? {
            logradouro: dados.logradouro.trim(),
            numero: dados.numero.trim(),
            complemento: dados.complemento.trim() || undefined,
            bairro: dados.bairro.trim(),
            cidade: dados.cidade.trim(),
            uf: dados.uf.trim().toUpperCase(),
          }
        : undefined,
      observacao: dados.observacao.trim() || undefined,
    });

    const endereco = entrega
      ? `${dados.logradouro}, ${dados.numero}${dados.complemento ? ` (${dados.complemento})` : ''}, ${dados.bairro}, ${dados.cidade}/${dados.uf.toUpperCase()}`
      : 'retirar na loja';

    const url = linkDoPedido({
      itens,
      total: registrado?.total ?? total,
      desconto: registrado?.desconto ?? desconto,
      cupom: cupom?.codigo,
      numero: registrado?.numero,
      cliente: { nome: dados.nome.trim(), telefone: dados.telefone.trim() },
      entrega: endereco,
      observacao: dados.observacao.trim() || undefined,
    });

    /**
     * O carrinho só é esvaziado depois que a conversa abriu. Se a aba do
     * WhatsApp for bloqueada, o cliente ainda tem o pedido montado aqui.
     */
    const aba = window.open(url, '_blank', 'noopener');
    if (aba) {
      esvaziar();
      fecharCarrinho();
    } else {
      window.location.href = url;
    }

    setEnviando(false);
  }

  const entrada =
    'w-full rounded-lg border border-papel-200 bg-papel-50 px-3 py-2 text-sm text-tinta-900 placeholder:text-tinta-500 focus:border-vinho-600 focus:outline-none';

  return (
    <form onSubmit={enviar} className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 px-5 py-4">
        <p className="text-sm text-tinta-700">
          O pedido vai pro nosso WhatsApp com tudo preenchido. A gente confirma o estoque, combina o
          pagamento e a entrega por lá.
        </p>

        <label className="block">
          <span className="mb-1 block text-xs text-tinta-500">Seu nome</span>
          <input
            required
            minLength={2}
            value={dados.nome}
            onChange={(evento) => mudar('nome', evento.target.value)}
            className={entrada}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-tinta-500">WhatsApp com DDD</span>
          <input
            required
            inputMode="tel"
            minLength={10}
            placeholder="(27) 99999-9999"
            value={dados.telefone}
            onChange={(evento) => mudar('telefone', evento.target.value)}
            className={entrada}
          />
        </label>

        <fieldset>
          <legend className="mb-1.5 text-xs text-tinta-500">Como você quer receber</legend>
          <div className="flex gap-2">
            {(['retirada', 'entrega'] as const).map((opcao) => (
              <label
                key={opcao}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors ${
                  dados.tipoEntrega === opcao
                    ? 'border-vinho-600 text-tinta-900'
                    : 'border-papel-200 text-tinta-700'
                }`}
              >
                <input
                  type="radio"
                  name="tipoEntrega"
                  value={opcao}
                  checked={dados.tipoEntrega === opcao}
                  onChange={() => mudar('tipoEntrega', opcao)}
                  className="sr-only"
                />
                {opcao === 'retirada' ? 'Retirar na loja' : 'Receber em casa'}
              </label>
            ))}
          </div>
        </fieldset>

        {dados.tipoEntrega === 'entrega' && (
          <div className="grid grid-cols-3 gap-2">
            <label className="col-span-2 block">
              <span className="mb-1 block text-xs text-tinta-500">Rua</span>
              <input
                required
                value={dados.logradouro}
                onChange={(evento) => mudar('logradouro', evento.target.value)}
                className={entrada}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-tinta-500">Número</span>
              <input
                required
                value={dados.numero}
                onChange={(evento) => mudar('numero', evento.target.value)}
                className={entrada}
              />
            </label>
            <label className="col-span-3 block">
              <span className="mb-1 block text-xs text-tinta-500">Complemento</span>
              <input
                value={dados.complemento}
                onChange={(evento) => mudar('complemento', evento.target.value)}
                className={entrada}
              />
            </label>
            <label className="col-span-3 block">
              <span className="mb-1 block text-xs text-tinta-500">Bairro</span>
              <input
                required
                value={dados.bairro}
                onChange={(evento) => mudar('bairro', evento.target.value)}
                className={entrada}
              />
            </label>
            <label className="col-span-2 block">
              <span className="mb-1 block text-xs text-tinta-500">Cidade</span>
              <input
                required
                value={dados.cidade}
                onChange={(evento) => mudar('cidade', evento.target.value)}
                className={entrada}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-tinta-500">UF</span>
              <input
                required
                maxLength={2}
                value={dados.uf}
                onChange={(evento) => mudar('uf', evento.target.value)}
                className={`${entrada} uppercase`}
              />
            </label>
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-xs text-tinta-500">Alguma observação?</span>
          <textarea
            rows={2}
            value={dados.observacao}
            onChange={(evento) => mudar('observacao', evento.target.value)}
            className={`${entrada} resize-y`}
          />
        </label>
      </div>

      <footer className="space-y-2 border-t border-papel-200 px-5 py-4">
        <div className="flex justify-between text-tinta-900">
          <span>Total</span>
          <span className="font-produto text-xl font-semibold text-vinho-600">{preco(total)}</span>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-vinho-600 px-4 py-3 font-medium text-creme-100 transition-colors hover:bg-vinho-700 disabled:opacity-60"
        >
          {enviando ? 'Montando o pedido…' : 'Enviar pedido no WhatsApp'}
        </button>

        <button
          type="button"
          onClick={aoVoltar}
          className="w-full py-1 text-sm text-tinta-500 underline transition-colors hover:text-tinta-700"
        >
          Voltar ao carrinho
        </button>
      </footer>
    </form>
  );
}
