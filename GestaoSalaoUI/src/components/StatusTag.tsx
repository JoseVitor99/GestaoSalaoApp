import { Tag } from "primereact/tag";
import { STATUS_AGENDAMENTO } from "../utilities/constants";

export default function StatusTag({ status, descricao }: { status: number; descricao: string }) {
  const severidade =
    status === STATUS_AGENDAMENTO.CONCLUIDO
      ? "success"
      : status === STATUS_AGENDAMENTO.CANCELADO
      ? "danger"
      : "warning";

  const icone =
    status === STATUS_AGENDAMENTO.CONCLUIDO
      ? "pi pi-check"
      : status === STATUS_AGENDAMENTO.CANCELADO
      ? "pi pi-times"
      : "pi pi-clock";

  return <Tag value={descricao} severity={severidade} icon={icone} rounded />;
}
