import { useCallback, useState, type FormEvent } from 'react';
import { Conteudo } from '../componentes/Estado';
import { Modal } from '../componentes/Modal';
import { Area, Badge, Botao, Caixa, Campo, Cartao, Selecao, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api, ErroDaApi } from '../lib/api';
import { TIPOS, type Banner, type CriterioDeSecao, type Secao } from '../tipos';

const CRITERIOS: Array<{ valor: CriterioDeSecao; rotulo: string }> = [
  { valor: 'destaques', rotulo: 'Produtos marcados como destaque' },
  { valor: 'promocoes', rotulo: 'Produtos em promoção' },
  { valor: 'novidades', rotulo: 'Cadastrados nos últimos 30 dias' },
  { valor: 'tipo', rotulo: 'Um tipo específico' },
  { valor: 'pais', rotulo: 'Um país específico' },
];

export function Vitrine() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">Vitrine</h1>
        <p className="text-sm text-stone-500">
          Banners do topo e faixas de produtos da home. Depois de mudar aqui, publique o site.
        </p>
      </header>

      <Banners />
      <Secoes />
    </div>
  );
}

function Banners() {
  const buscar = useCallback(() => api.get<Banner[]>('/vitrine/banners'), []);
  const estado = useApi(buscar);
  const [editando, setEditando] = useState<Banner | 'novo' | null>(null);

  async function excluir(banner: Banner) {
    if (!confirm(`Excluir o banner "${banner.titulo}"?`)) return;
    await api.remover(`/vitrine/banners/${banner.id}`);
    estado.recarregar();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-900">Banners do topo</h2>
        <Botao pequeno onClick={() => setEditando('novo')}>
          Novo banner
        </Botao>
      </div>

      <Cartao>
        <Conteudo
          estado={estado}
          vazio={{ titulo: 'Nenhum banner.', descricao: 'A home mostra um texto padrão sem eles.' }}
        >
          {(banners) => (
            <Tabela cabecalho={['Ordem', 'Título', 'Botão', 'Ativo', '']}>
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5 text-stone-500">{banner.ordem}</td>
                  <td className="px-4 py-2.5">
                    {banner.eyebrow && (
                      <p className="text-xs tracking-wide text-stone-400 uppercase">
                        {banner.eyebrow}
                      </p>
                    )}
                    <p className="font-medium text-stone-900">{banner.titulo}</p>
                    {banner.subtitulo && (
                      <p className="text-xs text-stone-500">{banner.subtitulo}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-600">
                    {banner.ctaTexto ? `${banner.ctaTexto} → ${banner.ctaLink ?? '—'}` : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      classe={
                        banner.ativo
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                          : 'bg-stone-100 text-stone-500 ring-stone-200'
                      }
                    >
                      {banner.ativo ? 'no ar' : 'oculto'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Botao
                      variante="secundario"
                      pequeno
                      className="mr-1.5"
                      onClick={() => setEditando(banner)}
                    >
                      Editar
                    </Botao>
                    <Botao variante="perigo" pequeno onClick={() => void excluir(banner)}>
                      Excluir
                    </Botao>
                  </td>
                </tr>
              ))}
            </Tabela>
          )}
        </Conteudo>
      </Cartao>

      {editando && (
        <FormularioDeBanner
          banner={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null);
            estado.recarregar();
          }}
        />
      )}
    </section>
  );
}

function FormularioDeBanner({
  banner,
  aoFechar,
  aoSalvar,
}: {
  banner: Banner | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [dados, setDados] = useState({
    eyebrow: banner?.eyebrow ?? '',
    titulo: banner?.titulo ?? '',
    subtitulo: banner?.subtitulo ?? '',
    imagem: banner?.imagem ?? '',
    ctaTexto: banner?.ctaTexto ?? '',
    ctaLink: banner?.ctaLink ?? '',
    ordem: String(banner?.ordem ?? 0),
    ativo: banner?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudar = (campo: keyof typeof dados, valor: string | boolean) =>
    setDados((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);

    const corpo = {
      eyebrow: dados.eyebrow.trim() || undefined,
      titulo: dados.titulo.trim(),
      subtitulo: dados.subtitulo.trim() || undefined,
      imagem: dados.imagem.trim() || undefined,
      ctaTexto: dados.ctaTexto.trim() || undefined,
      ctaLink: dados.ctaLink.trim() || undefined,
      ordem: Number(dados.ordem) || 0,
      ativo: dados.ativo,
    };

    try {
      if (banner) await api.patch(`/vitrine/banners/${banner.id}`, corpo);
      else await api.post('/vitrine/banners', corpo);
      aoSalvar();
    } catch (causa) {
      setErro(causa instanceof ErroDaApi ? causa.message : 'Não consegui salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto
      largo
      titulo={banner ? 'Editar banner' : 'Novo banner'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao form="form-banner" type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id="form-banner" onSubmit={enviar} className="space-y-3">
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <Campo
          rotulo="Etiqueta"
          value={dados.eyebrow}
          onChange={(evento) => mudar('eyebrow', evento.target.value)}
          dica='Texto pequeno acima do título ("Nova safra").'
        />
        <Campo
          rotulo="Título"
          required
          value={dados.titulo}
          onChange={(evento) => mudar('titulo', evento.target.value)}
        />
        <Area
          rotulo="Subtítulo"
          value={dados.subtitulo}
          onChange={(evento) => mudar('subtitulo', evento.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            rotulo="Texto do botão"
            value={dados.ctaTexto}
            onChange={(evento) => mudar('ctaTexto', evento.target.value)}
          />
          <Campo
            rotulo="Link do botão"
            value={dados.ctaLink}
            onChange={(evento) => mudar('ctaLink', evento.target.value)}
            dica="Ex.: /vinhos/ ou /vinhos/malbec-reserva-alta-cumbre/"
          />
          <Campo
            rotulo="Imagem de fundo"
            value={dados.imagem}
            onChange={(evento) => mudar('imagem', evento.target.value)}
            dica="Caminho no site (/img/banners/x.jpg). Vazio usa o fundo padrão."
          />
          <Campo
            rotulo="Ordem"
            inputMode="numeric"
            value={dados.ordem}
            onChange={(evento) => mudar('ordem', evento.target.value)}
            dica="Menor aparece primeiro."
          />
        </div>

        <Caixa rotulo="Ativo" marcado={dados.ativo} aoMudar={(valor) => mudar('ativo', valor)} />
      </form>
    </Modal>
  );
}

function Secoes() {
  const buscar = useCallback(() => api.get<Secao[]>('/vitrine/secoes'), []);
  const estado = useApi(buscar);
  const [editando, setEditando] = useState<Secao | 'novo' | null>(null);

  async function excluir(secao: Secao) {
    if (!confirm(`Excluir a faixa "${secao.titulo}"?`)) return;
    await api.remover(`/vitrine/secoes/${secao.id}`);
    estado.recarregar();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Faixas de produtos</h2>
          <p className="text-sm text-stone-500">
            A lista é montada sozinha pelo critério — não precisa reeditar quando o catálogo muda.
          </p>
        </div>
        <Botao pequeno onClick={() => setEditando('novo')}>
          Nova faixa
        </Botao>
      </div>

      <Cartao>
        <Conteudo estado={estado} vazio={{ titulo: 'Nenhuma faixa na home.' }}>
          {(secoes) => (
            <Tabela cabecalho={['Ordem', 'Título', 'Critério', 'Limite', 'Ativa', '']}>
              {secoes.map((secao) => (
                <tr key={secao.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5 text-stone-500">{secao.ordem}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-900">{secao.titulo}</p>
                    {secao.subtitulo && <p className="text-xs text-stone-500">{secao.subtitulo}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {CRITERIOS.find((opcao) => opcao.valor === secao.criterio)?.rotulo}
                    {secao.valor ? `: ${secao.valor}` : ''}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">{secao.limite}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      classe={
                        secao.ativo
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                          : 'bg-stone-100 text-stone-500 ring-stone-200'
                      }
                    >
                      {secao.ativo ? 'no ar' : 'oculta'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Botao
                      variante="secundario"
                      pequeno
                      className="mr-1.5"
                      onClick={() => setEditando(secao)}
                    >
                      Editar
                    </Botao>
                    <Botao variante="perigo" pequeno onClick={() => void excluir(secao)}>
                      Excluir
                    </Botao>
                  </td>
                </tr>
              ))}
            </Tabela>
          )}
        </Conteudo>
      </Cartao>

      {editando && (
        <FormularioDeSecao
          secao={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null);
            estado.recarregar();
          }}
        />
      )}
    </section>
  );
}

function FormularioDeSecao({
  secao,
  aoFechar,
  aoSalvar,
}: {
  secao: Secao | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [dados, setDados] = useState({
    titulo: secao?.titulo ?? '',
    subtitulo: secao?.subtitulo ?? '',
    criterio: secao?.criterio ?? ('destaques' as CriterioDeSecao),
    valor: secao?.valor ?? '',
    limite: String(secao?.limite ?? 8),
    ordem: String(secao?.ordem ?? 0),
    ativo: secao?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const precisaDeValor = dados.criterio === 'tipo' || dados.criterio === 'pais';
  const mudar = (campo: keyof typeof dados, valor: string | boolean) =>
    setDados((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);

    const corpo = {
      titulo: dados.titulo.trim(),
      subtitulo: dados.subtitulo.trim() || undefined,
      criterio: dados.criterio,
      valor: precisaDeValor ? dados.valor.trim() : undefined,
      limite: Number(dados.limite) || 8,
      ordem: Number(dados.ordem) || 0,
      ativo: dados.ativo,
    };

    try {
      if (secao) await api.patch(`/vitrine/secoes/${secao.id}`, corpo);
      else await api.post('/vitrine/secoes', corpo);
      aoSalvar();
    } catch (causa) {
      setErro(causa instanceof ErroDaApi ? causa.message : 'Não consegui salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      aberto
      titulo={secao ? 'Editar faixa' : 'Nova faixa'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao form="form-secao" type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id="form-secao" onSubmit={enviar} className="space-y-3">
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        <Campo
          rotulo="Título"
          required
          value={dados.titulo}
          onChange={(evento) => mudar('titulo', evento.target.value)}
        />
        <Campo
          rotulo="Subtítulo"
          value={dados.subtitulo}
          onChange={(evento) => mudar('subtitulo', evento.target.value)}
        />

        <Selecao
          rotulo="Quais produtos entram"
          value={dados.criterio}
          onChange={(evento) => mudar('criterio', evento.target.value)}
        >
          {CRITERIOS.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </Selecao>

        {precisaDeValor &&
          (dados.criterio === 'tipo' ? (
            <Selecao
              rotulo="Tipo"
              value={dados.valor}
              onChange={(evento) => mudar('valor', evento.target.value)}
            >
              <option value="">Escolha…</option>
              {TIPOS.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </Selecao>
          ) : (
            <Campo
              rotulo="País"
              required
              value={dados.valor}
              onChange={(evento) => mudar('valor', evento.target.value)}
              dica="Escreva igual ao cadastro do produto (ex.: Portugal)."
            />
          ))}

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            rotulo="Quantos produtos"
            inputMode="numeric"
            value={dados.limite}
            onChange={(evento) => mudar('limite', evento.target.value)}
            dica="Entre 2 e 24."
          />
          <Campo
            rotulo="Ordem"
            inputMode="numeric"
            value={dados.ordem}
            onChange={(evento) => mudar('ordem', evento.target.value)}
          />
        </div>

        <Caixa rotulo="Ativa" marcado={dados.ativo} aoMudar={(valor) => mudar('ativo', valor)} />
      </form>
    </Modal>
  );
}
