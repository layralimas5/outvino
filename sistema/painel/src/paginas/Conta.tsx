import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Botao, Campo, Cartao } from '../componentes/ui';
import { useSessao } from '../hooks/useSessao';

/**
 * Minha conta.
 *
 * O sistema ainda não tem usuário por pessoa — quem entra faz tudo. O que
 * existe de verdade é o **nome que assina** movimento de estoque e histórico de
 * pedido, e é isso que essa tela deixa mudar quando o painel roda sem senha.
 * Com senha configurada, quem assina é a sessão do cookie e o nome vem de lá.
 */
export function Conta() {
  const { operador, autenticacaoLigada, renomear, sair } = useSessao();
  const nome = operador?.nome ?? 'Sistema';

  const [rascunho, setRascunho] = useState(nome === 'Sistema' ? '' : nome);
  const [salvo, setSalvo] = useState(false);
  const [saindo, setSaindo] = useState(false);

  function aoSalvar(evento: FormEvent) {
    evento.preventDefault();
    renomear(rascunho);
    setSalvo(true);
  }

  async function aoSair() {
    setSaindo(true);
    try {
      await sair();
    } finally {
      setSaindo(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-stone-900">Minha conta</h1>
        <p className="text-sm text-stone-500">
          Quem está operando o painel agora e como esse nome aparece no histórico.
        </p>
      </header>

      <Cartao className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-vinho-600 text-base font-semibold text-white">
            {nome.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-medium text-stone-900">{nome}</p>
            <p className="text-sm text-stone-500">
              Assina como <code className="text-stone-700">{operador?.id ?? 'sistema'}</code> em
              estoque e pedidos
            </p>
          </div>
          <div className="ml-auto">
            {autenticacaoLigada ? (
              <Badge classe="bg-emerald-100 text-emerald-900 ring-emerald-200">com senha</Badge>
            ) : (
              <Badge classe="bg-amber-100 text-amber-900 ring-amber-200">sem login</Badge>
            )}
          </div>
        </div>
      </Cartao>

      {autenticacaoLigada ? (
        <Cartao className="p-5">
          <h2 className="text-sm font-semibold text-stone-900">Sessão</h2>
          <p className="mt-1 text-sm text-stone-600">
            O nome vem do login e não é editável aqui: é ele que prova quem fez cada movimento. Pra
            assinar com outro nome, saia e entre de novo.
          </p>
          <Botao variante="secundario" className="mt-3" onClick={aoSair} disabled={saindo}>
            {saindo ? 'Saindo…' : 'Sair da conta'}
          </Botao>
        </Cartao>
      ) : (
        <Cartao className="p-5">
          <h2 className="text-sm font-semibold text-stone-900">Nome de quem está no balcão</h2>
          <p className="mt-1 text-sm text-stone-600">
            O painel está aberto sem senha, então não há login pra dizer quem é você. Preencher aqui
            faz o histórico de estoque e pedido ser assinado com esse nome em vez de{' '}
            <span className="text-stone-800">Sistema</span>. Fica salvo neste navegador — não é
            conta nem senha, e não protege nada.
          </p>

          <form onSubmit={aoSalvar} className="mt-4 flex flex-wrap items-end gap-3">
            <Campo
              rotulo="Nome"
              value={rascunho}
              onChange={(evento) => {
                setRascunho(evento.target.value);
                setSalvo(false);
              }}
              placeholder="Ex.: Layra"
              autoComplete="name"
              maxLength={40}
              className="w-full sm:w-64"
            />
            <div className="pb-0.5">
              <Botao type="submit">Salvar</Botao>
            </div>
          </form>

          {salvo && (
            <p role="status" className="mt-2 text-sm text-emerald-700">
              Pronto. O que você fizer daqui pra frente assina como{' '}
              <span className="font-medium">{nome}</span>.
            </p>
          )}
        </Cartao>
      )}

      <Cartao className="p-5">
        <h2 className="text-sm font-semibold text-stone-900">Acesso ao painel</h2>
        <p className="mt-1 text-sm text-stone-600">
          {autenticacaoLigada
            ? 'A entrada é por senha única. Ainda não existe usuário por pessoa nem permissão por papel: quem entra faz tudo.'
            : 'Sem SENHA_PAINEL definida a API abre o painel direto. Vale só em desenvolvimento — em produção as rotas de gestão respondem 503 até a senha existir.'}{' '}
          <Link to="/configuracao" className="font-medium text-vinho-700 hover:underline">
            Ver configurações do servidor
          </Link>
          .
        </p>
      </Cartao>
    </div>
  );
}
