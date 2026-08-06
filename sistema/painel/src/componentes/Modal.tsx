import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  titulo: string;
  aberto: boolean;
  aoFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
  largo?: boolean;
}

/**
 * `<dialog>` nativo: já traz foco preso, fechar no Esc e fundo inerte sem
 * biblioteca nenhuma.
 */
export function Modal({ titulo, aberto, aoFechar, children, rodape, largo }: ModalProps) {
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;

    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={referencia}
      onCancel={(evento) => {
        // Esc: deixa o React fechar, senão o estado e o DOM saem de sincronia.
        evento.preventDefault();
        aoFechar();
      }}
      onClick={(evento) => {
        // Clique no backdrop (o alvo é o próprio dialog) fecha.
        if (evento.target === referencia.current) aoFechar();
      }}
      className={`m-auto w-[calc(100vw-2rem)] rounded-xl p-0 backdrop:bg-stone-900/40 ${largo ? 'max-w-3xl' : 'max-w-lg'}`}
    >
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5">
        <h2 className="text-base font-semibold text-stone-900">{titulo}</h2>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

      {rodape && (
        <div className="flex justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3">
          {rodape}
        </div>
      )}
    </dialog>
  );
}
