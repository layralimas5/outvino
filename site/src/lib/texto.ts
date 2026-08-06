/** Sem acento e em minúscula: "Rosé" e "rose" precisam bater na busca. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
