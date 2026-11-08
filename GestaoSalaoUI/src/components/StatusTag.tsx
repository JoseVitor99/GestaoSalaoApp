import { Tag } from "primereact/tag";
import { STATUS_AGENDAMENTO } from "../utilities/constants";

const ESTILOS: Record<number, { severidade?: "success" | "danger" | "warning"; icone: string }> = {
  [STATUS_AGENDAMENTO.AGENDADO]: { severidade: "warning", icone: "pi pi-clock" },
  [STATUS_AGENDAMENTO.CONCLUIDO]: { severidade: "success", icone: "pi pi-check" },
  [STATUS_AGENDAMENTO.CANCELADO]: { severidade: "danger", icone: "pi pi-times" },
  [STATUS_AGENDAMENTO.NAO_COMPARECEU]: { icone: "pi pi-user-minus" },
};

export default function StatusTag({ status, descricao }: { status: number; descricao: string }) {
  const estilo = ESTILOS[status] ?? ESTILOS[STATUS_AGENDAMENTO.AGENDADO];
  const cinza = status === STATUS_AGENDAMENTO.NAO_COMPARECEU ? { background: "var(--p-surface-500)", color: "#ffffff" } : undefined;
  return <Tag value={descricao} severity={estilo.severidade} icon={estilo.icone} rounded className="white-space-nowrap" style={cinza} />;
}
