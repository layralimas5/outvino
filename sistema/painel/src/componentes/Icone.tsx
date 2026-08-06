/**
 * Ícones de interface em SVG inline: sem requisição, herdam `currentColor` e
 * escalam com a fonte. Traço de 1.6 pra combinar com o peso da Inter, o mesmo
 * do site.
 */
export type NomeDeIcone =
  | 'resumo'
  | 'pedidos'
  | 'produtos'
  | 'estoque'
  | 'vitrine'
  | 'cupons'
  | 'avaliacoes'
  | 'financeiro'
  | 'crm'
  | 'api'
  | 'configuracao'
  | 'sino'
  | 'usuario'
  | 'sair';

const CAMINHOS: Record<NomeDeIcone, string[]> = {
  resumo: ['M4 19V10', 'M10 19V5', 'M16 19v-6', 'M3 19h18'],
  pedidos: ['M6 3h9l4 4v14H6z', 'M15 3v4h4', 'M9 12h7', 'M9 16h7'],
  produtos: ['M9 3h6l-.5 5a2.5 2.5 0 0 1-5 0Z', 'M12 8v6', 'M9 21h6l-.6-7H9.6Z'],
  estoque: ['M3 8h18v12H3z', 'M3 8l2-4h14l2 4', 'M10 12h4'],
  vitrine: ['M4 9h16v11H4z', 'M4 9l1.5-5h13L20 9', 'M9 20v-6h6v6'],
  cupons: ['M3 9V6h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4Z', 'M13 8v1', 'M13 14v1'],
  avaliacoes: ['M12 4.5l2.2 4.5 5 .7-3.6 3.5.9 4.9-4.5-2.4-4.5 2.4.9-4.9L4.8 9.7l5-.7Z'],
  financeiro: ['M4 18V7', 'M9 18V4', 'M14 18v-8', 'M19 18v-4', 'M3 21h18'],
  crm: ['M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 5 18.5V20', 'M10.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M19 20v-1.5a3.5 3.5 0 0 0-2.5-3.35', 'M15 4.2a3.5 3.5 0 0 1 0 6.6'],
  api: ['M8 6 3 12l5 6', 'M16 6l5 6-5 6', 'M13.5 4.5l-3 15'],
  configuracao: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M19.4 14.5a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.88 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.88.34H9.1a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88v.09a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.56 1.03Z',
  ],
  sino: ['M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6', 'M13.7 20a2 2 0 0 1-3.4 0'],
  usuario: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  sair: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
};

interface Props {
  nome: NomeDeIcone;
  className?: string;
}

export function Icone({ nome, className = 'size-4' }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {CAMINHOS[nome].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
