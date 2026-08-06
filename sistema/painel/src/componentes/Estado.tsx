import type { ReactNode } from 'react';
import { Botao } from './ui';

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <p role="status" className="px-4 py-10 text-center text-sm text-stone-500">
      {texto}
    </p>
  );
}

export function Vazio({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-medium text-stone-700">{titulo}</p>
      {descricao && <p className="mt-1 text-sm text-stone-500">{descricao}</p>}
    </div>
  );
}

export function Erro({ mensagem, aoTentarDeNovo }: { mensagem: string; aoTentarDeNovo?: () => void }) {
  return (
    <div role="alert" className="px-4 py-10 text-center">
      <p className="text-sm text-red-700">{mensagem}</p>
      {aoTentarDeNovo && (
        <Botao variante="secundario" className="mt-3" onClick={aoTentarDeNovo}>
          Tentar de novo
        </Botao>
      )}
    </div>
  );
}

/**
 * Cobre carregando/erro/vazio numa linha só, pra cada tela não repetir os três
 * ifs. Só renderiza o conteúdo quando há dado de verdade.
 */
export function Conteudo<T>({
  estado,
  vazio,
  children,
}: {
  estado: { dados: T | null; carregando: boolean; erro: string | null; recarregar: () => void };
  vazio?: { titulo: string; descricao?: string };
  children: (dados: T) => ReactNode;
}) {
  if (estado.carregando && estado.dados === null) return <Carregando />;
  if (estado.erro) return <Erro mensagem={estado.erro} aoTentarDeNovo={estado.recarregar} />;
  if (estado.dados === null) return <Vazio titulo="Nada por aqui." />;

  if (vazio && Array.isArray(estado.dados) && estado.dados.length === 0) {
    return <Vazio titulo={vazio.titulo} descricao={vazio.descricao} />;
  }

  return <>{children(estado.dados)}</>;
}
