import { useState } from 'react';
import { abrirCarrinho, adicionar, type ItemDoCarrinho } from '../../lib/cart';

interface Props {
  produto: Omit<ItemDoCarrinho, 'quantidade'>;
  disponivel: boolean;
  /** Versão do card: botão único, sem seletor de quantidade. */
  compacto?: boolean;
}

export default function AdicionarAoCarrinho({ produto, disponivel, compacto }: Props) {
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  if (!disponivel) {
    return (
      <p className="rounded-lg border border-papel-200 px-3 py-2 text-center text-sm text-tinta-500">
        Esgotado
      </p>
    );
  }

  function aoAdicionar(): void {
    adicionar(produto, quantidade);
    setAdicionado(true);

    if (compacto) {
      // No card, o retorno visual é o próprio botão; o drawer atrapalharia
      // quem está varrendo a vitrine.
      window.setTimeout(() => setAdicionado(false), 1600);
      return;
    }

    abrirCarrinho();
  }

  const botao = (
    <button
      type="button"
      onClick={aoAdicionar}
      /**
       * No card, o rótulo visível é curto porque no celular o cartão tem
       * ~150px e "Adicionar ao carrinho" quebra em três linhas. O nome do
       * rótulo entra no `aria-label`, que é o que faltava pra quem navega por
       * lista de botões saber qual vinho é qual.
       */
      aria-label={compacto ? `Adicionar ${produto.nome} ao carrinho` : undefined}
      /* A borda transparente do compacto existe pra ele ter a mesma altura do
         aviso "Esgotado", que é uma caixa com borda: sem ela, um cartão
         esgotado no meio da fileira fica 2px fora de linha. */
      className={`w-full rounded-lg font-medium transition-colors ${
        compacto ? 'border border-transparent px-3 py-2 text-sm sm:px-4' : 'px-4 py-3'
      } ${
        adicionado
          ? 'bg-papel-100 text-tinta-900'
          : 'bg-vinho-600 text-creme-100 hover:bg-vinho-700'
      }`}
    >
      {adicionado ? 'Adicionado ✓' : compacto ? 'Adicionar' : 'Adicionar ao carrinho'}
    </button>
  );

  if (compacto) return botao;

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <div className="flex items-center rounded-lg border border-papel-200">
        <button
          type="button"
          onClick={() => setQuantidade((atual) => Math.max(1, atual - 1))}
          aria-label="Diminuir quantidade"
          className="px-3.5 py-3 text-tinta-500 transition-colors hover:text-tinta-900"
        >
          −
        </button>
        <span aria-live="polite" className="w-8 text-center text-tinta-900">
          {quantidade}
        </span>
        <button
          type="button"
          onClick={() => setQuantidade((atual) => Math.min(24, atual + 1))}
          aria-label="Aumentar quantidade"
          className="px-3.5 py-3 text-tinta-500 transition-colors hover:text-tinta-900"
        >
          +
        </button>
      </div>

      <div className="min-w-48 flex-1">{botao}</div>
    </div>
  );
}
