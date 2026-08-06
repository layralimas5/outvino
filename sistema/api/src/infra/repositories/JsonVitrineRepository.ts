import type { Banner, Secao } from '../../domain/vitrine/Vitrine.js';
import type { Armazenamento } from '../storage/Armazenamento.js';
import { RepositorioJson } from '../storage/RepositorioJson.js';

/** Ordem de exibição, com desempate estável pelo id. */
function porOrdem<T extends { ordem: number; id: string }>(a: T, b: T): number {
  return a.ordem - b.ordem || a.id.localeCompare(b.id);
}

export class JsonBannerRepository extends RepositorioJson<Banner> {
  constructor(store: Armazenamento<Banner>) {
    super(store, 'Banner');
  }

  override async listar(): Promise<Banner[]> {
    const banners = await this.store.lerTodos();
    return banners.sort(porOrdem);
  }
}

export class JsonSecaoRepository extends RepositorioJson<Secao> {
  constructor(store: Armazenamento<Secao>) {
    super(store, 'Seção da vitrine');
  }

  override async listar(): Promise<Secao[]> {
    const secoes = await this.store.lerTodos();
    return secoes.sort(porOrdem);
  }
}
