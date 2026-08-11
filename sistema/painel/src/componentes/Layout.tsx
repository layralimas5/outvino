import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSessao } from '../hooks/useSessao';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import type { Resumo } from '../tipos';
import { Icone, type NomeDeIcone } from './Icone';
import { Botao } from './ui';

interface ItemDeMenu {
  para: string;
  rotulo: string;
  icone: NomeDeIcone;
  fim?: boolean;
}

/**
 * O menu em grupos.
 *
 * Onze telas numa lista corrida viram uma parede de texto. Agrupadas por
 * momento do dia — o que se toca toda hora, o que é da loja, o que se olha uma
 * vez por semana, o que quase nunca se mexe — a barra volta a ser escaneável.
 */
const GRUPOS: Array<{ titulo: string; links: ItemDeMenu[] }> = [
  {
    titulo: 'Operação',
    links: [
      { para: '/', rotulo: 'Resumo', icone: 'resumo', fim: true },
      { para: '/pedidos', rotulo: 'Pedidos', icone: 'pedidos' },
      { para: '/produtos', rotulo: 'Produtos', icone: 'produtos' },
      { para: '/estoque', rotulo: 'Estoque', icone: 'estoque' },
    ],
  },
  {
    titulo: 'Loja',
    links: [
      { para: '/vitrine', rotulo: 'Vitrine', icone: 'vitrine' },
      { para: '/cupons', rotulo: 'Cupons', icone: 'cupons' },
      { para: '/avaliacoes', rotulo: 'Avaliações', icone: 'avaliacoes' },
    ],
  },
  {
    titulo: 'Gestão',
    links: [
      { para: '/financeiro', rotulo: 'Financeiro', icone: 'financeiro' },
      { para: '/clientes', rotulo: 'Clientes', icone: 'clientes' },
      { para: '/crm', rotulo: 'CRM', icone: 'crm' },
    ],
  },
  {
    titulo: 'Sistema',
    links: [
      /**
       * O caminho não pode ser `/api`: esse prefixo é do servidor. Em dev o
       * proxy do Vite o entrega pra API, e em produção a própria API responde
       * antes do painel — nos dois casos a tela nunca abriria.
       */
      { para: '/integracao', rotulo: 'API', icone: 'api' },
      { para: '/configuracao', rotulo: 'Configurações', icone: 'configuracao' },
    ],
  },
];

export function Layout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();

  // Trocar de tela fecha a gaveta do celular: sem isso ela cobre o conteúdo
  // que a pessoa acabou de pedir.
  useEffect(() => setMenuAberto(false), [pathname]);

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm"
      >
        Pular para o conteúdo
      </a>

      <header className="flex items-center justify-between gap-2 bg-vinho-900 px-4 py-3 text-white lg:hidden">
        <Marca />
        <div className="flex items-center gap-1">
          <Sino escuro />
          <Usuario escuro />
          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/25 transition-colors hover:bg-white/10"
          >
            Menu
          </button>
        </div>
      </header>

      <nav
        id="menu-principal"
        aria-label="Principal"
        className={`${menuAberto ? 'block' : 'hidden'} bg-vinho-900 px-3 pb-4 text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:px-3 lg:py-5`}
      >
        <div className="hidden px-2 pb-6 lg:block">
          <Marca />
        </div>

        <div className="space-y-5">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="px-3 pb-1.5 text-[0.6875rem] font-medium tracking-[0.12em] text-white/45 uppercase">
                {grupo.titulo}
              </p>

              <ul className="space-y-0.5">
                {grupo.links.map((link) => (
                  <li key={link.para}>
                    <NavLink
                      to={link.para}
                      end={link.fim}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <Icone nome={link.icone} className="size-4 shrink-0" />
                      {link.rotulo}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra de topo: só no desktop. No celular os mesmos botões estão no
            cabeçalho vinho, que já ocupa a linha. */}
        <header className="hidden items-center justify-end gap-1 border-b border-stone-200 bg-white px-6 py-2.5 lg:flex">
          <Sino />
          <Usuario />
        </header>

        <main id="conteudo" className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Marca() {
  return (
    <Link to="/" className="block leading-tight">
      <span className="block text-lg font-semibold tracking-tight text-white">Outvino</span>
      <span className="block text-xs text-white/55">Painel do Admin</span>
    </Link>
  );
}

/**
 * Fecha o menu ao clicar fora ou apertar Esc — o que todo menu suspenso
 * precisa fazer pra não ficar preso na tela.
 */
function useFechaFora<T extends HTMLElement>(aberto: boolean, fechar: () => void) {
  const referencia = useRef<T>(null);

  useEffect(() => {
    if (!aberto) return;

    const aoClicar = (evento: MouseEvent) => {
      if (!referencia.current?.contains(evento.target as Node)) fechar();
    };
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fechar();
    };

    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto, fechar]);

  return referencia;
}

const BOTAO_DE_TOPO =
  'relative inline-flex size-9 items-center justify-center rounded-full transition-colors';

const ITEM_DO_MENU =
  'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100';

/**
 * O sino não inventa notificação: ele lista o que está de fato parado
 * esperando alguém — pedido do site sem confirmar, avaliação sem moderar e
 * produto no estoque mínimo. Tudo já vem do resumo, numa chamada só.
 */
function Sino({ escuro = false }: { escuro?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);
  const caixa = useFechaFora<HTMLDivElement>(aberto, fechar);

  const buscar = useCallback(() => api.get<Resumo>('/relatorios/resumo'), []);
  const { dados } = useApi(buscar);

  const pendencias = dados
    ? [
        {
          quantos: dados.aguardando.rascunhos,
          texto: 'pedido do site esperando confirmação',
          plural: 'pedidos do site esperando confirmação',
          para: '/pedidos',
        },
        {
          quantos: dados.avaliacoes.pendentes,
          texto: 'avaliação esperando moderação',
          plural: 'avaliações esperando moderação',
          para: '/avaliacoes',
        },
        {
          quantos: dados.estoque.aRepor.length,
          texto: 'produto no estoque mínimo',
          plural: 'produtos no estoque mínimo',
          para: '/estoque',
        },
      ].filter((item) => item.quantos > 0)
    : [];

  const total = pendencias.reduce((soma, item) => soma + item.quantos, 0);

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        aria-label={total > 0 ? `Avisos: ${total} pendências` : 'Avisos'}
        className={`${BOTAO_DE_TOPO} ${escuro ? 'text-white hover:bg-white/15' : 'text-stone-600 hover:bg-stone-100'}`}
      >
        <Icone nome="sino" className="size-5" />
        {total > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-vinho-600 px-1 text-[0.625rem] font-semibold text-white ring-2 ring-white"
          >
            {total}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-20 mt-1 w-72 rounded-lg border border-stone-200 bg-white p-1.5 text-left shadow-lg">
          <p className="px-2.5 py-1.5 text-xs font-medium tracking-wide text-stone-500 uppercase">
            Esperando você
          </p>

          {pendencias.length === 0 ? (
            <p className="px-2.5 pt-1 pb-2.5 text-sm text-stone-500">
              Nada parado. A loja está em dia.
            </p>
          ) : (
            <ul>
              {pendencias.map((item) => (
                <li key={item.para}>
                  <Link
                    to={item.para}
                    onClick={fechar}
                    className="flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100"
                  >
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-vinho-50 text-xs font-semibold text-vinho-700">
                      {item.quantos}
                    </span>
                    {item.quantos === 1 ? item.texto : item.plural}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Quem está operando. O nome assina movimento de estoque e histórico de pedido. */
function Usuario({ escuro = false }: { escuro?: boolean }) {
  const { operador, autenticacaoLigada, sair } = useSessao();
  const [aberto, setAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);
  const caixa = useFechaFora<HTMLDivElement>(aberto, fechar);

  const nome = operador?.nome ?? 'Sistema';
  const inicial = nome.trim().charAt(0).toUpperCase();

  async function aoSair() {
    setSaindo(true);
    try {
      await sair();
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        aria-label={`Conta: ${nome}`}
        className={`${BOTAO_DE_TOPO} ${escuro ? 'text-white hover:bg-white/15' : 'text-stone-600 hover:bg-stone-100'}`}
      >
        <span className="grid size-7 place-items-center rounded-full bg-vinho-600 text-xs font-semibold text-white">
          {inicial}
        </span>
      </button>

      {aberto && (
        <div className="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-stone-200 bg-white p-1.5 text-left shadow-lg">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-vinho-600 text-xs font-semibold text-white">
              {inicial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">{nome}</p>
              <p className="truncate text-xs text-stone-500">
                {autenticacaoLigada ? 'Sessão com senha' : 'Painel sem login'}
              </p>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-1.5">
            <Link to="/conta" onClick={fechar} className={ITEM_DO_MENU}>
              <Icone nome="usuario" />
              Minha conta
            </Link>

            <Link to="/configuracao" onClick={fechar} className={ITEM_DO_MENU}>
              <Icone nome="configuracao" />
              Configurações
            </Link>

            {autenticacaoLigada ? (
              <Botao
                variante="fantasma"
                onClick={aoSair}
                disabled={saindo}
                className="w-full justify-start px-2.5 py-2"
              >
                <Icone nome="sair" />
                {saindo ? 'Saindo…' : 'Sair'}
              </Botao>
            ) : (
              /* Sem senha na API não existe sessão pra encerrar: o painel
                 entraria sozinho de novo. Aparece desligado, com o motivo, em
                 vez de sumir — some, e a pergunta vira "cadê o sair?". */
              <div className="px-2.5 pt-1 pb-1.5">
                <span className="flex items-center gap-1.5 text-sm text-stone-400">
                  <Icone nome="sair" />
                  Sair
                </span>
                <span className="mt-0.5 block text-xs text-stone-400">
                  Nada pra encerrar: o painel está aberto sem senha.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
