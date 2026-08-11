import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Variante = 'primario' | 'secundario' | 'perigo' | 'fantasma';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-vinho-600 text-white hover:bg-vinho-700 disabled:bg-stone-300',
  secundario:
    'bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 disabled:text-stone-400',
  perigo: 'bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50',
  fantasma: 'text-stone-600 hover:bg-stone-200/70',
};

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  pequeno?: boolean;
}

export function Botao({ variante = 'primario', pequeno, className = '', ...props }: BotaoProps) {
  const tamanho = pequeno ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm';

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${tamanho} ${VARIANTES[variante]} ${className}`}
    />
  );
}

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  dica?: string;
}

const ENTRADA =
  'w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-vinho-600 focus:outline-none';

export function Campo({ rotulo, dica, className = '', ...props }: CampoProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-600">{rotulo}</span>
      <input {...props} className={ENTRADA} />
      {dica && <span className="mt-1 block text-xs text-stone-500">{dica}</span>}
    </label>
  );
}

interface SelecaoProps extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo: string;
  children: ReactNode;
}

export function Selecao({ rotulo, className = '', children, ...props }: SelecaoProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-600">{rotulo}</span>
      <select {...props} className={ENTRADA}>
        {children}
      </select>
    </label>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo: string;
}

export function Area({ rotulo, className = '', ...props }: AreaProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-600">{rotulo}</span>
      <textarea {...props} className={`${ENTRADA} min-h-24 resize-y`} />
    </label>
  );
}

interface CaixaProps {
  rotulo: string;
  marcado: boolean;
  aoMudar: (valor: boolean) => void;
}

export function Caixa({ rotulo, marcado, aoMudar }: CaixaProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(evento) => aoMudar(evento.target.checked)}
        className="size-4 rounded border-stone-300 accent-vinho-600"
      />
      {rotulo}
    </label>
  );
}

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`pulsa rounded-lg border border-stone-200 bg-white ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, classe = '' }: { children: ReactNode; classe?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classe || 'bg-stone-100 text-stone-700 ring-stone-200'}`}
    >
      {children}
    </span>
  );
}

/** Número grande com rótulo. O bloco do dashboard. */
export function Indicador({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
}) {
  return (
    <Cartao className="p-4">
      <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">{rotulo}</p>
      <p className="mt-1.5 text-2xl font-semibold text-stone-900">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-stone-500">{detalhe}</p>}
    </Cartao>
  );
}

/** Tabela que vira rolagem horizontal no celular em vez de espremer coluna. */
export function Tabela({ cabecalho, children }: { cabecalho: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs tracking-wide text-stone-500 uppercase">
            {cabecalho.map((titulo) => (
              <th key={titulo} scope="col" className="px-4 py-2.5 font-medium whitespace-nowrap">
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">{children}</tbody>
      </table>
    </div>
  );
}
