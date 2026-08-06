import { useCallback, useState } from 'react';
import { Conteudo } from '../componentes/Estado';
import { Modal } from '../componentes/Modal';
import { Area, Badge, Botao, Cartao, Selecao } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api, ErroDaApi, query } from '../lib/api';
import type { Avaliacao, Produto, StatusDeAvaliacao } from '../tipos';

const FILTROS: Array<{ valor: StatusDeAvaliacao | ''; rotulo: string }> = [
  { valor: 'pendente', rotulo: 'Esperando você' },
  { valor: 'publicada', rotulo: 'No site' },
  { valor: 'recusada', rotulo: 'Recusadas' },
  { valor: '', rotulo: 'Todas' },
];

const CORES: Record<StatusDeAvaliacao, string> = {
  pendente: 'bg-amber-50 text-amber-800 ring-amber-200',
  publicada: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  recusada: 'bg-stone-100 text-stone-500 ring-stone-200',
};

export function Avaliacoes() {
  const [status, setStatus] = useState<StatusDeAvaliacao | ''>('pendente');
  const [respondendo, setRespondendo] = useState<Avaliacao | null>(null);

  const buscar = useCallback(
    () => api.get<Avaliacao[]>(`/avaliacoes${query({ status })}`),
    [status],
  );
  const estado = useApi(buscar, status);

  // Só pra trocar o id do produto pelo nome na listagem.
  const buscarProdutos = useCallback(() => api.get<Produto[]>('/produtos'), []);
  const produtos = useApi(buscarProdutos);
  const nomeDoProduto = (id: string) =>
    produtos.dados?.find((produto) => produto.id === id)?.nome ?? id;

  async function mudarStatus(avaliacao: Avaliacao, novo: StatusDeAvaliacao) {
    try {
      await api.patch(`/avaliacoes/${avaliacao.id}`, { status: novo });
      estado.recarregar();
    } catch (causa) {
      alert(causa instanceof ErroDaApi ? causa.message : 'Não consegui salvar.');
    }
  }

  async function excluir(avaliacao: Avaliacao) {
    if (!confirm(`Excluir a avaliação de ${avaliacao.autor}? Não tem volta.`)) return;

    try {
      await api.remover(`/avaliacoes/${avaliacao.id}`);
      estado.recarregar();
    } catch (causa) {
      alert(causa instanceof ErroDaApi ? causa.message : 'Não consegui excluir.');
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Avaliações</h1>
          <p className="text-sm text-stone-500">
            O cliente escreve na página do vinho. Nada aparece no site antes de você publicar.
          </p>
        </div>
        <Selecao
          rotulo="Mostrar"
          className="w-52"
          value={status}
          onChange={(evento) => setStatus(evento.target.value as StatusDeAvaliacao | '')}
        >
          {FILTROS.map((filtro) => (
            <option key={filtro.rotulo} value={filtro.valor}>
              {filtro.rotulo}
            </option>
          ))}
        </Selecao>
      </header>

      <Conteudo
        estado={estado}
        vazio={{
          titulo: 'Nenhuma avaliação aqui.',
          descricao:
            status === 'pendente' ? 'Quando alguém avaliar um vinho, cai nessa fila.' : undefined,
        }}
      >
        {(avaliacoes) => (
          <ul className="space-y-3">
            {avaliacoes.map((avaliacao) => (
              <li key={avaliacao.id}>
                <Cartao className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Estrelas nota={avaliacao.nota} />
                        <span className="text-sm font-medium text-stone-900">{avaliacao.autor}</span>
                        {avaliacao.compraVerificada && (
                          <Badge classe="bg-emerald-50 text-emerald-800 ring-emerald-200">
                            compra verificada
                          </Badge>
                        )}
                        <Badge classe={CORES[avaliacao.status]}>{avaliacao.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {nomeDoProduto(avaliacao.produtoId)} ·{' '}
                        {new Date(avaliacao.criadoEm).toLocaleDateString('pt-BR')}
                        {avaliacao.email ? ` · ${avaliacao.email}` : ''}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {avaliacao.status !== 'publicada' && (
                        <Botao pequeno onClick={() => void mudarStatus(avaliacao, 'publicada')}>
                          Publicar
                        </Botao>
                      )}
                      {avaliacao.status !== 'recusada' && (
                        <Botao
                          variante="secundario"
                          pequeno
                          onClick={() => void mudarStatus(avaliacao, 'recusada')}
                        >
                          Recusar
                        </Botao>
                      )}
                      <Botao variante="secundario" pequeno onClick={() => setRespondendo(avaliacao)}>
                        {avaliacao.resposta ? 'Editar resposta' : 'Responder'}
                      </Botao>
                      <Botao variante="perigo" pequeno onClick={() => void excluir(avaliacao)}>
                        Excluir
                      </Botao>
                    </div>
                  </div>

                  {avaliacao.titulo && (
                    <p className="mt-3 font-medium text-stone-900">{avaliacao.titulo}</p>
                  )}
                  <p className="mt-1.5 text-sm whitespace-pre-line text-stone-700">
                    {avaliacao.comentario}
                  </p>

                  {avaliacao.resposta && (
                    <div className="mt-3 rounded-md border-l-2 border-vinho-600 bg-stone-50 px-3 py-2">
                      <p className="text-xs font-medium text-stone-500">Resposta da loja</p>
                      <p className="mt-1 text-sm whitespace-pre-line text-stone-700">
                        {avaliacao.resposta}
                      </p>
                    </div>
                  )}
                </Cartao>
              </li>
            ))}
          </ul>
        )}
      </Conteudo>

      {respondendo && (
        <Resposta
          avaliacao={respondendo}
          aoFechar={() => setRespondendo(null)}
          aoSalvar={() => {
            setRespondendo(null);
            estado.recarregar();
          }}
        />
      )}
    </div>
  );
}

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="text-sm text-ouro-600" aria-label={`Nota ${nota} de 5`}>
      <span aria-hidden="true" className="tracking-tight text-amber-500">
        {'★'.repeat(nota)}
        <span className="text-stone-300">{'★'.repeat(5 - nota)}</span>
      </span>
    </span>
  );
}

function Resposta({
  avaliacao,
  aoFechar,
  aoSalvar,
}: {
  avaliacao: Avaliacao;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [texto, setTexto] = useState(avaliacao.resposta ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setSalvando(true);
    setErro(null);

    try {
      await api.patch(`/avaliacoes/${avaliacao.id}`, { resposta: texto.trim() });
      aoSalvar();
    } catch (causa) {
      setErro(causa instanceof ErroDaApi ? causa.message : 'Não consegui salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto
      titulo={`Responder ${avaliacao.autor}`}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao onClick={() => void salvar()} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <div className="space-y-3">
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <blockquote className="rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
          {avaliacao.comentario}
        </blockquote>

        <Area
          rotulo="Sua resposta"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Aparece embaixo do comentário, no site."
        />
        <p className="text-xs text-stone-500">Apagar tudo e salvar remove a resposta.</p>
      </div>
    </Modal>
  );
}
