import { useStore } from '@nanostores/react';
import { abrirCarrinho, quantidadeTotal } from '../../lib/cart';
import { BOTAO_ICONE } from '../../lib/ui';

export default function CartButton() {
  const quantidade = useStore(quantidadeTotal);

  return (
    <button type="button" onClick={abrirCarrinho} className={BOTAO_ICONE}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {quantidade > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 flex size-4.5 items-center justify-center rounded-full bg-vinho-600 text-[10px] font-semibold text-creme-100"
        >
          {quantidade}
        </span>
      )}

      <span className="sr-only">
        {quantidade === 0
          ? 'Abrir carrinho, vazio'
          : `Abrir carrinho, ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`}
      </span>
    </button>
  );
}
