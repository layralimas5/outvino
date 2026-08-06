import { randomUUID } from 'node:crypto';

export function novoId(): string {
  return randomUUID();
}

/**
 * Vira URL no site (`/vinhos/<slug>/`), então precisa ser estável e sem acento.
 */
export function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function agora(): string {
  return new Date().toISOString();
}

/** Só a data, sem hora — usado em vencimento, aniversário e janela de entrega. */
export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
