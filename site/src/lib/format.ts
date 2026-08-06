const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function preco(valor: number): string {
  return brl.format(valor);
}

export function volume(ml: number | undefined): string | null {
  if (!ml) return null;
  return ml >= 1000 ? `${ml / 1000} L` : `${ml} ml`;
}

/** Desconto arredondado pra baixo: prometer menos e entregar mais. */
export function percentualDeDesconto(de: number, por: number): number {
  return Math.floor(((de - por) / de) * 100);
}

/** "2026-08-05" vira "5 de agosto de 2026". Entra em avaliação e histórico. */
export function dataLonga(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Média com vírgula, como se escreve nota em português. */
export function nota(valor: number): string {
  return valor.toFixed(1).replace('.', ',');
}
