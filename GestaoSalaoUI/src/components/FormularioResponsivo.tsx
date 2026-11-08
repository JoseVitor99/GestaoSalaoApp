import { ReactNode } from "react";
import { Card } from "primereact/card";
import { Sidebar } from "primereact/sidebar";

import useIsMobile from "../hooks/useIsMobile";

interface Props {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  children: ReactNode;
}

export default function FormularioResponsivo({ titulo, aberto, onFechar, children }: Props) {
  const mobile = useIsMobile();

  if (!mobile) return <Card title={titulo}>{children}</Card>;

  return (
    <Sidebar
      visible={aberto}
      position="bottom"
      onHide={onFechar}
      blockScroll
      className="folha-inferior"
      header={<span className="text-xl font-bold">{titulo}</span>}
    >
      {children}
    </Sidebar>
  );
}
