import { useState } from 'react';
import { avaliacaoLigada, enviarAvaliacao } from '../../lib/avaliacao';

interface Props {
  produtoId: string;
  produtoNome: string;
}

const ROTULOS = ['', 'Não gostei', 'Fraco', 'Bom', 'Muito bom', 'Excelente'] as const;

export default function FormularioDeAvaliacao({ produtoId, produtoNome }: Props) {
  const [aberto, setAberto] = useState(false);
  const [nota, setNota] = useState(0);
  const [passandoPor, setPassandoPor] = useState(0);
  const [autor, setAutor] = useState('');
  const [email, setEmail] = useState('');
  const [titulo, setTitulo] = useState('');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState<string | null>(null);

  if (!avaliacaoLigada) return null;

  async function enviar() {
    setErro(null);

    if (nota === 0) {
      setErro('Escolhe de 1 a 5 estrelas.');
      return;
    }

    setEnviando(true);

    try {
      setPronto(
        await enviarAvaliacao({
          produtoId,
          autor: autor.trim(),
          email: email.trim() || undefined,
          nota,
          titulo: titulo.trim() || undefined,
          comentario: comentario.trim(),
        }),
      );
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não consegui enviar sua avaliação.');
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <div
        role="status"
        className="rounded-xl border border-papel-200 bg-papel-50 p-5 text-sm text-tinta-700"
      >
        <p className="font-medium text-tinta-900">Obrigado!</p>
        <p className="mt-1 leading-relaxed">{pronto}</p>
      </div>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-lg border border-papel-300 px-5 py-2.5 text-sm font-medium text-tinta-900 transition-colors hover:border-vinho-600 hover:text-vinho-600"
      >
        Avaliar esse vinho
      </button>
    );
  }

  // A nota que o dedo/cursor está escolhendo ganha da nota já marcada.
  const acesas = passandoPor || nota;

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        void enviar();
      }}
      className="rounded-xl border border-papel-200 bg-papel-0 p-5 sm:p-6"
    >
      <h3 className="font-display text-xl">Avaliar {produtoNome}</h3>

      <fieldset className="mt-4">
        <legend className="text-xs tracking-wide text-tinta-500">Sua nota</legend>

        <div className="mt-2 flex items-center gap-2" onMouseLeave={() => setPassandoPor(0)}>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => setNota(valor)}
                onMouseEnter={() => setPassandoPor(valor)}
                onFocus={() => setPassandoPor(valor)}
                onBlur={() => setPassandoPor(0)}
                aria-pressed={nota === valor}
                aria-label={`${valor} de 5 estrelas`}
                className={`rounded transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho-600 ${
                  valor <= acesas ? 'text-ouro-500' : 'text-papel-300'
                }`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-7">
                  <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.21l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z" />
                </svg>
              </button>
            ))}
          </div>
          <span className="text-sm text-tinta-500">{ROTULOS[acesas] ?? ''}</span>
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs tracking-wide text-tinta-500">Seu nome</span>
          <input
            value={autor}
            onChange={(evento) => setAutor(evento.target.value)}
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            className="w-full rounded-lg border border-papel-300 bg-papel-0 px-3 py-2.5 text-sm text-tinta-900 focus:border-vinho-600 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-tinta-500">
            No site aparece só o primeiro nome e a inicial.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs tracking-wide text-tinta-500">
            E-mail <span className="text-tinta-400">(opcional)</span>
          </span>
          <input
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            autoComplete="email"
            className="w-full rounded-lg border border-papel-300 bg-papel-0 px-3 py-2.5 text-sm text-tinta-900 focus:border-vinho-600 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-tinta-500">
            Não aparece no site. Serve pra marcar sua compra como verificada.
          </span>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs tracking-wide text-tinta-500">
          Título <span className="text-tinta-400">(opcional)</span>
        </span>
        <input
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          maxLength={80}
          className="w-full rounded-lg border border-papel-300 bg-papel-0 px-3 py-2.5 text-sm text-tinta-900 focus:border-vinho-600 focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs tracking-wide text-tinta-500">Seu comentário</span>
        <textarea
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
          required
          minLength={10}
          maxLength={1200}
          rows={4}
          placeholder="Como estava na taça? Com o que você bebeu?"
          className="w-full resize-y rounded-lg border border-papel-300 bg-papel-0 px-3 py-2.5 text-sm text-tinta-900 focus:border-vinho-600 focus:outline-none"
        />
      </label>

      {erro && (
        <p role="alert" className="mt-3 text-sm text-vinho-700">
          {erro}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-vinho-600 px-5 py-2.5 text-sm font-medium text-creme-100 transition-colors hover:bg-vinho-700 disabled:bg-papel-300"
        >
          {enviando ? 'Enviando…' : 'Enviar avaliação'}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-sm text-tinta-500 underline underline-offset-4 hover:text-tinta-900"
        >
          Cancelar
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-tinta-500">
        A gente lê antes de publicar. Comentário com ofensa ou que não fala do vinho não entra.
      </p>
    </form>
  );
}
