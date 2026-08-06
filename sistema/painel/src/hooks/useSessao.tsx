import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { EVENTO_SESSAO_EXPIRADA, api, definirOperador } from '../lib/api';
import type { Operador, Sessao } from '../tipos';

interface EstadoDaSessao extends Sessao {
  carregando: boolean;
  entrar: (nome: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const Contexto = createContext<EstadoDaSessao | null>(null);

/** Quem assina o histórico quando a API roda sem senha. Espelha o padrão dela. */
const OPERADOR_PADRAO: Operador = { id: 'sistema', nome: 'Sistema' };

/**
 * Fonte única de "quem está logado".
 *
 * A verdade vive no cookie `httpOnly`, que o JavaScript não lê — então o estado
 * daqui é só um espelho do que a API respondeu em `GET /api/sessao`. Quando o
 * cookie vence, a próxima requisição volta 401, o evento chega aqui e a tela
 * volta pro login sem precisar recarregar a página.
 */
export function ProvedorDeSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  const consultar = useCallback(async () => {
    try {
      setSessao(await api.get<Sessao>('/sessao'));
    } catch {
      // API fora do ar: trata como deslogado. A tela de login mostra o erro
      // real quando a pessoa tentar entrar.
      setSessao({ autenticacaoLigada: true, configuracaoPendente: false, operador: null });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void consultar();
  }, [consultar]);

  /**
   * API sem senha: entra direto, sem tela nenhuma.
   *
   * Não havendo o que autenticar, pedir nome seria só um formulário no
   * caminho. O histórico continua assinado — como `Sistema`, que é o autor
   * padrão da API quando ninguém se identifica, e é a verdade do que
   * aconteceu: uma ação feita num painel sem login.
   *
   * Só vale em desenvolvimento. Em produção sem `SENHA_PAINEL` a API marca
   * `configuracaoPendente` e o painel mostra o aviso em vez de abrir.
   */
  useEffect(() => {
    if (!sessao || sessao.autenticacaoLigada || sessao.configuracaoPendente) return;
    if (sessao.operador) return;

    definirOperador('');
    setSessao({ ...sessao, operador: OPERADOR_PADRAO });
  }, [sessao]);

  useEffect(() => {
    const aoExpirar = () => setSessao((atual) => (atual ? { ...atual, operador: null } : atual));
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const entrar = useCallback(async (nome: string, senha: string) => {
    const { operador } = await api.post<{ operador: Operador }>('/sessao', { nome, senha });
    setSessao((atual) => ({
      autenticacaoLigada: atual?.autenticacaoLigada ?? true,
      configuracaoPendente: false,
      operador,
    }));
  }, []);

  const sair = useCallback(async () => {
    try {
      await api.remover('/sessao');
    } finally {
      definirOperador('');
      setSessao((atual) => ({
        autenticacaoLigada: atual?.autenticacaoLigada ?? true,
        configuracaoPendente: atual?.configuracaoPendente ?? false,
        operador: null,
      }));
    }
  }, []);

  return (
    <Contexto.Provider
      value={{
        autenticacaoLigada: sessao?.autenticacaoLigada ?? true,
        configuracaoPendente: sessao?.configuracaoPendente ?? false,
        operador: sessao?.operador ?? null,
        carregando,
        entrar,
        sair,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useSessao(): EstadoDaSessao {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSessao precisa estar dentro de <ProvedorDeSessao>.');
  return contexto;
}
