import { useState, type FormEvent } from 'react';
import { useSessao } from '../hooks/useSessao';
import { ErroDaApi } from '../lib/api';
import { Botao, Campo } from '../componentes/ui';

/**
 * Porta de entrada do painel.
 *
 * Só aparece nos dois estados em que existe barreira: API com senha (o login
 * de verdade) e API em produção sem senha, que é bloqueio e não login — aí a
 * tela explica o que configurar. Sem senha em desenvolvimento não há o que
 * perguntar, e o painel abre direto, sem passar por aqui.
 */
export function Login() {
  const { configuracaoPendente, entrar } = useSessao();
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (nome.trim().length < 2) {
      setErro('Diga quem está operando.');
      return;
    }

    setEnviando(true);
    try {
      await entrar(nome.trim(), senha);
    } catch (causa) {
      setErro(causa instanceof ErroDaApi ? causa.message : 'Não consegui entrar. Tente de novo.');
      setSenha('');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-xl font-semibold tracking-tight text-stone-900">
          Outvino <span className="text-xs font-normal text-stone-500">sistema</span>
        </h1>

        {configuracaoPendente ? (
          <Bloqueado />
        ) : (
          <form
            onSubmit={aoEnviar}
            className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-white p-6"
          >
            <Campo
              rotulo="Quem está operando"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              placeholder="Seu nome"
              autoComplete="username"
              autoFocus
              required
              dica="Assina o histórico de estoque e pedidos."
            />

            <Campo
              rotulo="Senha do painel"
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              autoComplete="current-password"
              required
            />

            {erro && (
              <p role="alert" className="text-sm text-red-700">
                {erro}
              </p>
            )}

            <Botao type="submit" disabled={enviando} className="w-full">
              {enviando ? 'Entrando…' : 'Entrar'}
            </Botao>
          </form>
        )}
      </div>
    </main>
  );
}

function Bloqueado() {
  return (
    <div
      role="alert"
      className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"
    >
      <p className="font-medium">Painel fechado por segurança.</p>
      <p className="mt-2">
        A API está em produção sem senha definida, então as rotas de gestão estão bloqueadas.
        Configure <code className="font-mono text-xs">SENHA_PAINEL</code> nas variáveis de ambiente
        da Netlify (mínimo 12 caracteres) e publique de novo.
      </p>
    </div>
  );
}
