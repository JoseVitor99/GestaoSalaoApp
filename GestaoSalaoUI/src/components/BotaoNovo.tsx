import { Button } from "primereact/button";
import useIsMobile from "../hooks/useIsMobile";

interface Props {
  label: string;
  icon?: string;
  onClick: () => void;
}

export default function BotaoNovo({ label, icon = "pi pi-plus", onClick }: Props) {
  const mobile = useIsMobile();
  if (!mobile) return null;

  return <Button label={label} icon={icon} className="botao-flutuante" onClick={onClick} />;
}
