import { BrowserRouter, Routes, Route } from "react-router-dom";

import Menu from "./layout/Menu";
import Painel from "./pages/Painel";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Funcionarios from "./pages/Funcionarios";
import Servicos from "./pages/Servicos";
import Remuneracao from "./pages/Remuneracao";

function App() {
  return (
    <BrowserRouter>
      <Menu />

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Painel />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/funcionarios" element={<Funcionarios />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/remuneracao" element={<Remuneracao />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
