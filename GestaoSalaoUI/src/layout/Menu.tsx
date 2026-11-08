import { useState } from "react";
import { Menubar } from "primereact/menubar";
import { MenuItem } from "primereact/menuitem";
import { InputSwitch } from "primereact/inputswitch";
import { useLocation, useNavigate } from "react-router-dom";

import useIsMobile from "../hooks/useIsMobile";
import MenuUsuario from "../components/MenuUsuario";
import { useAutenticacao } from "../services/autenticacao";
import { NOME_APP, NOME_CLIENTE } from "../utilities/constants";
import { aplicarTema, Tema, temaAtual } from "../utilities/tema";

const PAGINAS = [
  { label: "Painel", curto: "Início", icon: "pi pi-home", rota: "/", admin: true },
  { label: "Agenda", curto: "Agenda", icon: "pi pi-calendar", rota: "/agenda", admin: false },
  { label: "Funcionários", curto: "Equipe", icon: "pi pi-id-card", rota: "/funcionarios", admin: true },
  { label: "Clientes", curto: "Clientes", icon: "pi pi-users", rota: "/clientes", admin: false },
  // No celular, Serviços fica no menu do usuário para a barra inferior não passar de seis itens
  { label: "Serviços", curto: "Serviços", icon: "pi pi-list", rota: "/servicos", admin: true, somenteComputador: true },
  { label: "Remuneração", curto: "Pagar", icon: "pi pi-wallet", rota: "/remuneracao", admin: true },
  { label: "Caixa", curto: "Caixa", icon: "pi pi-chart-bar", rota: "/caixa", admin: true },
  { label: "Relatórios", curto: "Relatórios", icon: "pi pi-chart-line", rota: "/relatorios", admin: true, somenteComputador: true },
  { label: "Meus ganhos", curto: "Ganhos", icon: "pi pi-wallet", rota: "/meus-ganhos", admin: false, somenteFuncionario: true },
];

export default function Menu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mobile = useIsMobile();
  const { administrador } = useAutenticacao();
  const paginas = PAGINAS.filter(
    (p) => (administrador ? !p.somenteFuncionario : !p.admin) && !(mobile && p.somenteComputador)
  );
  const [tema, setTema] = useState<Tema>(temaAtual);

  const trocarTema = async (escuro: boolean) => {
    const novo: Tema = escuro ? "escuro" : "claro";
    await aplicarTema(novo);
    setTema(novo);
  };

  const seletorTema = (
    <label className="seletor-tema" title={tema === "escuro" ? "Mudar para o modo claro" : "Mudar para o modo escuro"}>
      <i className={`pi pi-sun ${tema === "claro" ? "ativo" : ""}`} />
      <InputSwitch checked={tema === "escuro"} onChange={(e) => trocarTema(!!e.value)} aria-label="Modo escuro" />
      <i className={`pi pi-moon ${tema === "escuro" ? "ativo" : ""}`} />
    </label>
  );

  const marca = (
    <div className="flex align-items-center gap-2 cursor-pointer" onClick={() => navigate(paginas[0].rota)}>
      <span className="marca-icone">
        <i className="pi pi-star-fill" />
      </span>
      <span className="flex flex-column" style={{ lineHeight: 1.15 }}>
        <span className="font-bold text-lg text-900 white-space-nowrap">{NOME_APP}</span>
        <span className="texto-pequeno">{NOME_CLIENTE}</span>
      </span>
    </div>
  );

  const ferramentas = (
    <div className="flex align-items-center gap-3">
      {seletorTema}
      <MenuUsuario />
    </div>
  );

  // Celular
  if (mobile) {
    return (
      <>
        <header className="barra-topo-mobile">
          {marca}
          {ferramentas}
        </header>

        <nav
          className="nav-inferior"
          aria-label="Navegação principal"
          style={{ gridTemplateColumns: `repeat(${paginas.length}, 1fr)` }}
        >
          {paginas.map((p) => (
            <button
              key={p.rota}
              type="button"
              className={pathname === p.rota ? "ativo" : ""}
              onClick={() => navigate(p.rota)}
              aria-current={pathname === p.rota ? "page" : undefined}
            >
              <span className="icone">
                <i className={p.icon} />
              </span>
              {p.curto}
            </button>
          ))}
        </nav>
      </>
    );
  }

  // Computador
  const items: MenuItem[] = paginas.map((p) => ({
    label: p.label,
    icon: p.icon,
    command: () => navigate(p.rota),
    className: pathname === p.rota ? "menu-ativo" : undefined,
  }));

  return (
    <Menubar
      model={items}
      start={<div className="mr-4">{marca}</div>}
      end={ferramentas}
      className="border-noround border-x-none border-top-none px-3"
    />
  );
}
