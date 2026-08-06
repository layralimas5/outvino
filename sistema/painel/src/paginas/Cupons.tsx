import { useCallback, useState, type FormEvent } from 'react';
import { Conteudo } from '../componentes/Estado';
import { Modal } from '../componentes/Modal';
import { Badge, Botao, Caixa, Campo, Cartao, Selecao, Tabela } from '../componentes/ui';
import { useApi } from '../hooks/useApi';
import { api, ErroDaApi } from '../lib/api';
import { moeda } from '../lib/formato';
import type { Cupom } from '../tipos';

export function Cupons() {
  const buscar = useCallback(() => api.get<Cupom[]>('/cupons'), []);
  const estado = useApi(buscar);
  const [editando, setEditando] = useState<Cupom | 'novo' | null>(null);

  async function alternar(cupom: Cupom) {
    await api.patch(`/cupons/${cupom.id}`, { ativo: !cupom.ativo });
    estado.recarregar();
  }

  async function excluir(cupom: Cupom) {
    if (!confirm(`Excluir o cupom ${cupom.id}?`)) return;

    try {
      await api.remover(`/cupons/${cupom.id}`);
      estado.recarregar();
    } catch (causa) {
      alert(causa instanceof ErroDaApi ? causa.message : 'Não consegui excluir.');
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Cupons</h1>
          <p className="text-sm text-stone-500">
            O cliente digita no carrinho. O uso só conta quando o pedido é confirmado.
          </p>
        </div>
        <Botao onClick={() => setEditando('novo')}>Novo cupom</Botao>
      </header>

      <Cartao>
        <Conteudo estado={estado} vazio={{ titulo: 'Nenhum cupom criado.' }}>
          {(cupons) => (
            <Tabela cabecalho={['Código', 'Desconto', 'Mínimo', 'Usos', 'Validade', 'Estado', '']}>
              {cupons.map((cupom) => (
                <tr key={cupom.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-stone-900">{cupom.id}</p>
                    {cupom.descricao && <p className="text-xs text-stone-500">{cupom.descricao}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-stone-800">
                    {cupom.tipo === 'percentual' ? `${cupom.valor}%` : moeda(cupom.valor)}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {cupom.minimo > 0 ? moeda(cupom.minimo) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {cupom.usos}
                    {cupom.usosMaximos ? ` / ${cupom.usosMaximos}` : ''}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {cupom.validoAte
                      ? new Date(`${cupom.validoAte}T12:00:00`).toLocaleDateString('pt-BR')
                      : 'sem prazo'}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      classe={
                        cupom.ativo
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                          : 'bg-stone-100 text-stone-500 ring-stone-200'
                      }
                    >
                      {cupom.ativo ? 'ativo' : 'desativado'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Botao
                      variante="secundario"
                      pequeno
                      className="mr-1.5"
                      onClick={() => void alternar(cupom)}
                    >
                      {cupom.ativo ? 'Desativar' : 'Ativar'}
                    </Botao>
                    <Botao
                      variante="secundario"
                      pequeno
                      className="mr-1.5"
                      onClick={() => setEditando(cupom)}
                    >
                      Editar
                    </Botao>
                    <Botao variante="perigo" pequeno onClick={() => void excluir(cupom)}>
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
        <Formulario
          cupom={editando === 'novo' ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null);
            estado.recarregar();
          }}
        />
      )}
    </div>
  );
}

function Formulario({
  cupom,
  aoFechar,
  aoSalvar,
}: {
  cupom: Cupom | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [dados, setDados] = useState({
    codigo: cupom?.id ?? '',
    descricao: cupom?.descricao ?? '',
    tipo: cupom?.tipo ?? ('percentual' as Cupom['tipo']),
    valor: cupom ? String(cupom.valor) : '10',
    minimo: cupom ? String(cupom.minimo) : '0',
    validoAte: cupom?.validoAte ?? '',
    usosMaximos: cupom?.usosMaximos ? String(cupom.usosMaximos) : '',
    ativo: cupom?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudar = (campo: keyof typeof dados, valor: string | boolean) =>
    setDados((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);

    const comum = {
      descricao: dados.descricao.trim() || undefined,
      valor: Number(dados.valor.replace(',', '.')),
      minimo: Number(dados.minimo.replace(',', '.')) || 0,
      validoAte: dados.validoAte || undefined,
      usosMaximos: dados.usosMaximos ? Number(dados.usosMaximos) : undefined,
      ativo: dados.ativo,
    };

    try {
      if (cupom) await api.patch(`/cupons/${cupom.id}`, comum);
      else
        await api.post('/cupons', {
          ...comum,
          codigo: dados.codigo.trim().toUpperCase(),
          tipo: dados.tipo,
        });
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
      titulo={cupom ? `Editar ${cupom.id}` : 'Novo cupom'}
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao form="form-cupom" type="submit" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Botao>
        </>
      }
    >
      <form id="form-cupom" onSubmit={enviar} className="space-y-3">
        {erro && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}

        {!cupom && (
          <>
            <Campo
              rotulo="Código"
              required
              value={dados.codigo}
              onChange={(evento) => mudar('codigo', evento.target.value)}
              dica="Vira caixa alta. Não muda depois de criado."
            />
            <Selecao
              rotulo="Tipo de desconto"
              value={dados.tipo}
              onChange={(evento) => mudar('tipo', evento.target.value)}
            >
              <option value="percentual">Percentual (%)</option>
              <option value="valor">Valor fixo (R$)</option>
            </Selecao>
          </>
        )}

        <Campo
          rotulo="Descrição"
          value={dados.descricao}
          onChange={(evento) => mudar('descricao', evento.target.value)}
          dica="Só pra você se lembrar do que é."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            rotulo={`Desconto ${(cupom?.tipo ?? dados.tipo) === 'percentual' ? '(%)' : '(R$)'}`}
            required
            inputMode="decimal"
            value={dados.valor}
            onChange={(evento) => mudar('valor', evento.target.value)}
            dica={(cupom?.tipo ?? dados.tipo) === 'percentual' ? 'Máximo de 90%.' : undefined}
          />
          <Campo
            rotulo="Compra mínima (R$)"
            inputMode="decimal"
            value={dados.minimo}
            onChange={(evento) => mudar('minimo', evento.target.value)}
            dica="0 libera pra qualquer valor."
          />
          <Campo
            rotulo="Válido até"
            type="date"
            value={dados.validoAte}
            onChange={(evento) => mudar('validoAte', evento.target.value)}
            dica="Vazio é sem prazo."
          />
          <Campo
            rotulo="Limite de usos"
            inputMode="numeric"
            value={dados.usosMaximos}
            onChange={(evento) => mudar('usosMaximos', evento.target.value)}
            dica="Vazio é ilimitado."
          />
        </div>

        <Caixa rotulo="Ativo" marcado={dados.ativo} aoMudar={(valor) => mudar('ativo', valor)} />
      </form>
    </Modal>
  );
}
