import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Carregando, Vazio } from './componentes/Estado';
import { Layout } from './componentes/Layout';
import { ProvedorDeSessao, useSessao } from './hooks/useSessao';
import { Api } from './paginas/Api';
import { Avaliacoes } from './paginas/Avaliacoes';
import { Clientes } from './paginas/Clientes';
import { Configuracao } from './paginas/Configuracao';
import { Conta } from './paginas/Conta';
import { Crm } from './paginas/Crm';
import { Cupons } from './paginas/Cupons';
import { Estoque } from './paginas/Estoque';
import { Financeiro } from './paginas/Financeiro';
import { Login } from './paginas/Login';
import { Pedidos } from './paginas/Pedidos';
import { Produtos } from './paginas/Produtos';
import { Resumo } from './paginas/Resumo';
import { Vitrine } from './paginas/Vitrine';

export function App() {
  return (
    <ProvedorDeSessao>
      <Portao />
    </ProvedorDeSessao>
  );
}

/**
 * Sem sessão o painel nem monta — nenhuma tela chega a pedir dado que a API
 * recusaria. O login fica fora do roteador de propósito: não é uma URL, é o
 * estado anterior ao sistema.
 */
function Portao() {
  const { operador, carregando } = useSessao();

  if (carregando) return <Carregando texto="Abrindo o sistema…" />;
  if (!operador) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Resumo />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="vitrine" element={<Vitrine />} />
          <Route path="cupons" element={<Cupons />} />
          <Route path="avaliacoes" element={<Avaliacoes />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="crm" element={<Crm />} />
          <Route path="conta" element={<Conta />} />
          {/* `integracao`, e não `api`: o prefixo `/api` é do servidor. */}
          <Route path="integracao" element={<Api />} />
          <Route path="configuracao" element={<Configuracao />} />
          <Route
            path="*"
            element={<Vazio titulo="Página não encontrada" descricao="Use o menu ao lado." />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
