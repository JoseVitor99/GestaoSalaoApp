import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProgressSpinner } from "primereact/progressspinner";

import Menu from "./layout/Menu";
import Login from "./pages/Login";
import Painel from "./pages/Painel";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Funcionarios from "./pages/Funcionarios";
import Servicos from "./pages/Servicos";
import Remuneracao from "./pages/Remuneracao";
import Usuarios from "./pages/Usuarios";
import MeusGanhos from "./pages/MeusGanhos";
import Horarios from "./pages/Horarios";
import Caixa from "./pages/Caixa";
import Relatorios from "./pages/Relatorios";
import { useAutenticacao } from "./services/autenticacao";

function App() {
  const { usuario, carregando, administrador } = useAutenticacao();

  if (carregando)
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <ProgressSpinner style={{ width: "3rem", height: "3rem" }} />
      </div>
    );

  if (!usuario) return <Login />;

  return (
    <BrowserRouter>
      <Menu />

      <main className="conteudo">
        <Routes>
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />

          {administrador ? (
            <>
              <Route path="/" element={<Painel />} />
              <Route path="/funcionarios" element={<Funcionarios />} />
              <Route path="/servicos" element={<Servicos />} />
              <Route path="/remuneracao" element={<Remuneracao />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/horarios" element={<Horarios />} />
              <Route path="/caixa" element={<Caixa />} />
              <Route path="/relatorios" element={<Relatorios />} />
            </>
          ) : (
            <Route path="/meus-ganhos" element={<MeusGanhos />} />
          )}

          <Route path="*" element={<Navigate to={administrador ? "/" : "/agenda"} replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
