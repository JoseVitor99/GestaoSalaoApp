import { Menubar } from "primereact/menubar";
import { MenuItem } from "primereact/menuitem";
import { useLocation, useNavigate } from "react-router-dom";

import useIsMobile from "../hooks/useIsMobile";
import { NOME_APP, NOME_CLIENTE } from "../utilities/constants";

const PAGINAS = [
  { label: "Painel", curto: "Início", icon: "pi pi-home", rota: "/" },
  { label: "Agenda", curto: "Agenda", icon: "pi pi-calendar", rota: "/agenda" },
  { label: "Clientes", curto: "Clientes", icon: "pi pi-users", rota: "/clientes" },
  { label: "Funcionários", curto: "Equipe", icon: "pi pi-id-card", rota: "/funcionarios" },
  { label: "Serviços", curto: "Serviços", icon: "pi pi-list", rota: "/servicos" },
  { label: "Remuneração", curto: "Pagar", icon: "pi pi-wallet", rota: "/remuneracao" },
];

export default function Menu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mobile = useIsMobile();

  const marca = (
    <div className="flex align-items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
      <span className="marca-icone">
        <i className="pi pi-star-fill" />
      </span>
      <span className="flex flex-column" style={{ lineHeight: 1.15 }}>
        <span className="font-bold text-lg text-900">{NOME_APP}</span>
        <span className="texto-pequeno">{NOME_CLIENTE}</span>
      </span>
    </div>
  );

  // Celular
  if (mobile) {
    const atual = PAGINAS.find((p) => p.rota === pathname);

    return (
      <>
        <header className="barra-topo-mobile">
          {marca}
          {atual && atual.rota !== "/" && <span className="barra-topo-pagina">{atual.label}</span>}
        </header>

        <nav className="nav-inferior" aria-label="Navegação principal">
          {PAGINAS.map((p) => (
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
  const items: MenuItem[] = PAGINAS.map((p) => ({
    label: p.label,
    icon: p.icon,
    command: () => navigate(p.rota),
    className: pathname === p.rota ? "menu-ativo" : undefined,
  }));

  return (
    <Menubar
      model={items}
      start={<div className="mr-4">{marca}</div>}
      className="border-noround border-x-none border-top-none px-3"
    />
  );
}
