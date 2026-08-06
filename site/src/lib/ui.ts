/**
 * Classes que precisam ser idênticas em componente Astro e ilha React.
 *
 * Só entra aqui o que atravessa a fronteira das duas linguagens. O resto do
 * estilo fica no próprio componente, onde é lido junto com a marcação.
 */

/** Botão redondo do header. Muda de cor conforme o estado do cabeçalho. */
export const BOTAO_ICONE =
  'relative inline-flex size-10 items-center justify-center rounded-full transition-colors ' +
  'hover:bg-white/15 group-data-[estado=solido]:hover:bg-tinta-900/[0.06]';

export const BOTAO_PRIMARIO =
  'inline-flex items-center justify-center rounded-lg bg-vinho-600 px-6 py-3 font-medium ' +
  'text-creme-100 transition-colors hover:bg-vinho-700';

export const CAMPO =
  'w-full rounded-lg border border-papel-200 bg-papel-0 px-3 py-2.5 text-sm text-tinta-900 ' +
  'placeholder:text-tinta-500 focus:border-vinho-600 focus:outline-none';
