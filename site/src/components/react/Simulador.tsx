import { useEffect, useMemo, useRef, useState } from 'react';
import type { Produto } from '../../lib/catalogo';
import { produtoUrl } from '../../lib/catalogo';
import { fontesDaFoto } from '../../lib/fotos';
import { preco as formatarPreco } from '../../lib/format';
import { linkDeContato } from '../../lib/whatsapp';
import {
  PERGUNTAS,
  respondidas,
  rotuloDaResposta,
  sugerir,
  TOTAL_DE_PERGUNTAS,
  type Respostas,
  type Sugestao,
} from '../../lib/simulador';
import AdicionarAoCarrinho from './AdicionarAoCarrinho';

interface Props {
  produtos: Produto[];
}

/** Quantos rótulos a vitrine da direita mostra. */
const QUANTOS = 6;

export default function Simulador({ produtos }: Props) {
  const [respostas, setRespostas] = useState<Respostas>({});
  const [passo, setPasso] = useState(0);

  const tituloRef = useRef<HTMLHeadingElement>(null);
  const resultadosRef = useRef<HTMLElement>(null);
  /** Só mexe no foco depois de uma escolha — nunca no carregamento da página. */
  const interagiu = useRef(false);

  const sugestoes = useMemo(() => sugerir(produtos, respostas), [produtos, respostas]);

  const respondeu = respondidas(respostas);
  const pergunta = PERGUNTAS[passo];
  const terminou = pergunta === undefined;

  useEffect(() => {
    if (interagiu.current) tituloRef.current?.focus();
  }, [passo]);

  function escolher(perguntaId: string, opcaoId: string): void {
    interagiu.current = true;
    setRespostas((atuais) => ({ ...atuais, [perguntaId]: opcaoId }));
    setPasso((atual) => atual + 1);

    /**
     * No celular a vitrine fica embaixo do quiz: sem isso, quem termina de
     * responder continua olhando para o formulário e não vê o resultado. No
     * desktop as duas colunas já estão à vista, então não mexe na rolagem.
     */
    const ultima = passo === TOTAL_DE_PERGUNTAS - 1;
    if (ultima && window.matchMedia('(max-width: 63.99rem)').matches) {
      window.requestAnimationFrame(() =>
        resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  }

  function recomecar(): void {
    interagiu.current = true;
    setRespostas({});
    setPasso(0);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[23rem_1fr] lg:items-start lg:gap-10">
      <section
        aria-label="Simulador"
        className="rounded-2xl border border-papel-200 bg-papel-0 p-5 sm:p-6 lg:sticky lg:top-24"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs tracking-[0.14em] text-tinta-500 uppercase">
            {terminou ? 'Tudo respondido' : `Pergunta ${passo + 1} de ${TOTAL_DE_PERGUNTAS}`}
          </p>
          {respondeu > 0 && (
            <button
              type="button"
              onClick={recomecar}
              className="text-xs text-tinta-500 underline decoration-papel-300 underline-offset-4 transition-colors hover:text-vinho-600"
            >
              Recomeçar
            </button>
          )}
        </div>

        {/* Barra de progresso: `aria-hidden` porque o texto acima já diz o mesmo. */}
        <div aria-hidden="true" className="mt-3 h-1 overflow-hidden rounded-full bg-papel-100">
          <div
            className="h-full rounded-full bg-vinho-600 transition-[width] duration-300"
            style={{ width: `${(respondeu / TOTAL_DE_PERGUNTAS) * 100}%` }}
          />
        </div>

        {terminou ? (
          <Resumo
            respostas={respostas}
            aoEditar={(indice) => {
              interagiu.current = true;
              setPasso(indice);
            }}
          />
        ) : (
          <fieldset className="mt-6">
            <legend className="sr-only">{pergunta.titulo}</legend>

            <h2
              ref={tituloRef}
              tabIndex={-1}
              className="font-display text-2xl text-tinta-900 outline-none"
            >
              {pergunta.titulo}
            </h2>
            <p className="mt-1.5 text-sm text-tinta-500">{pergunta.ajuda}</p>

            <div className="mt-5 space-y-2">
              {pergunta.opcoes.map((opcao) => {
                const marcada = respostas[pergunta.id] === opcao.id;

                return (
                  <label
                    key={opcao.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      marcada
                        ? 'border-vinho-600 bg-vinho-600/[0.06]'
                        : 'border-papel-200 hover:border-papel-300 hover:bg-papel-50'
                    } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-vinho-600`}
                  >
                    <input
                      type="radio"
                      name={pergunta.id}
                      value={opcao.id}
                      checked={marcada}
                      onChange={() => escolher(pergunta.id, opcao.id)}
                      className="mt-0.5 size-4 shrink-0 accent-vinho-600"
                    />
                    <span>
                      <span className="block text-sm font-medium text-tinta-900">
                        {opcao.rotulo}
                      </span>
                      {opcao.ajuda && (
                        <span className="mt-0.5 block text-xs text-tinta-500">{opcao.ajuda}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  interagiu.current = true;
                  setPasso((atual) => Math.max(0, atual - 1));
                }}
                disabled={passo === 0}
                className="text-tinta-500 transition-colors hover:text-tinta-900 disabled:invisible"
              >
                ← Voltar
              </button>

              <button
                type="button"
                onClick={() => {
                  interagiu.current = true;
                  setPasso((atual) => atual + 1);
                }}
                className="text-tinta-500 underline decoration-papel-300 underline-offset-4 transition-colors hover:text-vinho-600"
              >
                Pular essa
              </button>
            </div>
          </fieldset>
        )}
      </section>

      <section ref={resultadosRef} aria-label="Rótulos indicados" className="min-w-0 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-papel-100 pb-4">
          <div>
            <h2 className="font-display text-2xl text-tinta-900">
              {respondeu === 0 ? 'A adega inteira' : 'O que combina com você'}
            </h2>
            <p aria-live="polite" className="mt-1 text-sm text-tinta-500">
              {respondeu === 0
                ? 'Responde ao lado que a lista se reorganiza a cada resposta.'
                : `Ordenado pelas suas ${respondeu === 1 ? 'resposta' : `${respondeu} respostas`}.`}
            </p>
          </div>

          <a
            href="/vinhos/"
            className="border-b border-vinho-600/30 pb-0.5 text-sm text-vinho-600 transition-colors hover:border-vinho-600"
          >
            Ver o catálogo
          </a>
        </div>

        <ol className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
          {sugestoes.slice(0, QUANTOS).map((sugestao, indice) => (
            <li key={sugestao.produto.id} className="grid">
              <CartaoIndicado sugestao={sugestao} destacado={indice === 0 && respondeu > 0} />
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl border border-papel-200 bg-papel-50 px-6 py-8 text-center">
          <h3 className="font-display text-xl text-tinta-900">Ainda na dúvida?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-tinta-700">
            Chama a gente no WhatsApp contando o que vai rolar. A indicação sai na hora, de gente
            pra gente.
          </p>
          <a
            href={linkDeContato('Oi! Fiz o simulador no site e queria uma indicação.')}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-lg bg-vinho-600 px-5 py-2.5 text-sm font-medium text-creme-100 transition-colors hover:bg-vinho-700"
          >
            Pedir indicação no WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

/** Respostas dadas, cada uma clicável pra voltar direto naquela pergunta. */
function Resumo({
  respostas,
  aoEditar,
}: {
  respostas: Respostas;
  aoEditar: (indice: number) => void;
}) {
  return (
    <div className="mt-6">
      <h2 className="font-display text-2xl text-tinta-900">Prontinho</h2>
      <p className="mt-1.5 text-sm text-tinta-500">
        A lista ao lado já está na sua ordem. Clica numa resposta pra trocar.
      </p>

      <ul className="mt-5 space-y-2">
        {PERGUNTAS.map((pergunta, indice) => {
          const escolhida = respostas[pergunta.id];

          return (
            <li key={pergunta.id}>
              <button
                type="button"
                onClick={() => aoEditar(indice)}
                className="w-full rounded-xl border border-papel-200 px-4 py-3 text-left transition-colors hover:border-papel-300 hover:bg-papel-50"
              >
                <span className="block text-xs text-tinta-500">{pergunta.titulo}</span>
                <span className="mt-0.5 block text-sm font-medium text-tinta-900">
                  {escolhida ? rotuloDaResposta(pergunta.id, escolhida) : 'Sem resposta'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CartaoIndicado({ sugestao, destacado }: { sugestao: Sugestao; destacado: boolean }) {
  const { produto, motivos } = sugestao;
  const url = produtoUrl(produto);
  const fontes = produto.imagem ? fontesDaFoto(produto.imagem) : null;

  /**
   * No máximo duas etiquetas, e o aviso de orçamento na frente quando existir.
   * Além de duas, a fileira de cartões desalinha e a leitura vira lista.
   */
  const etiquetas = (sugestao.dentroDoOrcamento ? motivos : ['Acima do seu teto', ...motivos]).slice(
    0,
    2,
  );

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-papel-0 transition-[border-color,box-shadow] ${
        destacado
          ? 'border-vinho-600/40 shadow-[0_12px_28px_-16px_rgba(142,27,49,0.4)]'
          : 'border-papel-200 hover:border-papel-300'
      }`}
    >
      <a href={url} tabIndex={-1} aria-hidden="true" className="relative block p-3 sm:p-4">
        {destacado && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-vinho-600 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-creme-100 uppercase">
            a mais a ver
          </span>
        )}

        <div className="aspect-square">
          {produto.imagem ? (
            <img
              src={fontes?.padrao ?? produto.imagem}
              srcSet={fontes?.srcset}
              sizes="(min-width: 64rem) 14rem, 45vw"
              alt={`Garrafa de ${produto.nome}`}
              width={600}
              height={600}
              loading="lazy"
              decoding="async"
              className="size-full object-contain"
            />
          ) : (
            <div className="grid size-full place-items-center rounded-xl bg-papel-50 text-xs text-tinta-500">
              {produto.tipo}
            </div>
          )}
        </div>
      </a>

      <div className="flex flex-1 flex-col p-3 pt-0 sm:p-4 sm:pt-0">
        <p className="text-[11px] tracking-[0.14em] text-tinta-500 uppercase">
          {produto.tipo} · {produto.pais}
        </p>

        <h3 className="mt-1.5 font-produto text-base leading-snug font-semibold">
          <a href={url} className="transition-colors hover:text-vinho-600">
            {produto.nome}
          </a>
        </h3>

        {etiquetas.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {etiquetas.map((etiqueta) => (
              <li
                key={etiqueta}
                className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                  etiqueta === 'Acima do seu teto'
                    ? 'border border-ouro-500/50 text-ouro-700'
                    : 'border border-papel-200 bg-papel-50 text-tinta-700'
                }`}
              >
                {etiqueta}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-auto pt-4 font-produto text-xl font-semibold text-vinho-600">
          {formatarPreco(produto.preco)}
        </p>

        <div className="mt-3">
          <AdicionarAoCarrinho
            produto={{
              id: produto.id,
              nome: produto.nome,
              preco: produto.preco,
              volumeMl: produto.volumeMl,
              url,
            }}
            disponivel={produto.disponivel}
            compacto
          />
        </div>
      </div>
    </article>
  );
}
