import { useCallback, useEffect, useState } from 'react';
import { ErroDaApi } from '../lib/api';

interface EstadoDaBusca<T> {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
}

/**
 * Carrega dados da API e devolve os três estados que toda tela precisa cobrir.
 *
 * `buscar` precisa ser estável (`useCallback`), senão cada render dispara uma
 * requisição nova. `chave` existe pra refazer a busca quando um filtro muda.
 */
export function useApi<T>(buscar: () => Promise<T>, chave: string = ''): EstadoDaBusca<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;

    setCarregando(true);
    setErro(null);

    buscar()
      .then((resultado) => {
        // Resposta de uma busca antiga não pode sobrescrever a atual.
        if (!cancelado) setDados(resultado);
      })
      .catch((causa: unknown) => {
        if (cancelado) return;
        setErro(causa instanceof ErroDaApi ? causa.message : 'Falha ao carregar.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, versao]);

  const recarregar = useCallback(() => setVersao((atual) => atual + 1), []);

  return { dados, carregando, erro, recarregar };
}
