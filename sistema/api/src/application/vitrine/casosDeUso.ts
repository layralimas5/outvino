import type {
  AtualizarBannerInput,
  AtualizarSecaoInput,
  Banner,
  CriarBannerInput,
  CriarSecaoInput,
  Secao,
} from '../../domain/vitrine/Vitrine.js';
import type { Deps } from '../../infra/container.js';
import { agora, novoId } from '../../shared/id.js';

export function listarBanners(deps: Deps): Promise<Banner[]> {
  return deps.banners.listar();
}

export function criarBanner(deps: Deps, entrada: CriarBannerInput): Promise<Banner> {
  const momento = agora();
  return deps.banners.salvar({
    ...entrada,
    id: novoId(),
    criadoEm: momento,
    atualizadoEm: momento,
  });
}

export function atualizarBanner(
  deps: Deps,
  id: string,
  entrada: AtualizarBannerInput,
): Promise<Banner> {
  return deps.banners.alterar(id, (banner) => {
    Object.assign(banner, entrada);
    banner.atualizadoEm = agora();
  });
}

export function removerBanner(deps: Deps, id: string): Promise<void> {
  return deps.banners.remover(id);
}

export function listarSecoes(deps: Deps): Promise<Secao[]> {
  return deps.secoes.listar();
}

export function criarSecao(deps: Deps, entrada: CriarSecaoInput): Promise<Secao> {
  const momento = agora();
  return deps.secoes.salvar({
    ...entrada,
    id: novoId(),
    criadoEm: momento,
    atualizadoEm: momento,
  });
}

export function atualizarSecao(
  deps: Deps,
  id: string,
  entrada: AtualizarSecaoInput,
): Promise<Secao> {
  return deps.secoes.alterar(id, (secao) => {
    Object.assign(secao, entrada);
    secao.atualizadoEm = agora();
  });
}

export function removerSecao(deps: Deps, id: string): Promise<void> {
  return deps.secoes.remover(id);
}
