import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import { useAutenticacao } from "../services/autenticacao";
import IFuncionario from "../interfaces/IFuncionario";
import { IBloqueio, IHorarioFuncionamento } from "../interfaces/IAgenda";
import { mensagemErro, paraApiData } from "../utilities/formatters";
import { periodoNoDia } from "../utilities/bloqueios";

interface Props {
  dia: Date;
  funcionarios: IFuncionario[];
  filtroFuncionario: number | null;
  versao: number;
  onRemovido: (mensagem: string) => void;
  onErro: (mensagem: string) => void;
}

// Avisos do dia na agenda: salão fechado, quem está de folga e os bloqueios
export default function BloqueiosDia({ dia, funcionarios, filtroFuncionario, versao, onRemovido, onErro }: Props) {
  const { usuario, administrador } = useAutenticacao();
  const [horarios, setHorarios] = useState<IHorarioFuncionamento[]>([]);
  const [bloqueios, setBloqueios] = useState<IBloqueio[]>([]);
  const [recarregar, setRecarregar] = useState(0);

  useEffect(() => {
    api.get("/horarios").then((r) => setHorarios(r.data || [])).catch(() => undefined);
  }, [versao]);

  useEffect(() => {
    api
      .get("/bloqueios", { params: { inicio: paraApiData(dia), funcionarioId: filtroFuncionario ?? undefined } })
      .then((r) => setBloqueios(r.data || []))
      .catch(() => setBloqueios([]));
  }, [dia, filtroFuncionario, versao, recarregar]);

  const remover = (b: IBloqueio) =>
    confirmDialog({
      message: `Remover o bloqueio de ${b.funcionario}${b.motivo ? ` (${b.motivo})` : ""}?`,
      header: "Remover bloqueio",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Remover",
      rejectLabel: "Voltar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/bloqueios/${b.id}`);
          onRemovido("Bloqueio removido.");
          setRecarregar((v) => v + 1);
        } catch (err: any) {
          onErro(mensagemErro(err, "Erro ao remover o bloqueio."));
        }
      },
    });

  const diaSemana = dia.getDay();
  const horario = horarios.find((h) => h.diaSemana === diaSemana);
  const fechado = horario && !horario.aberto;
  const deFolga = funcionarios.filter(
    (f) => f.diasFolga?.includes(diaSemana) && (filtroFuncionario === null || f.id === filtroFuncionario)
  );

  if (!fechado && deFolga.length === 0 && bloqueios.length === 0) return null;

  return (
    <div className="avisos-dia mb-3">
      {fechado && (
        <div className="aviso-linha">
          <i className="pi pi-lock" />
          <span className="font-semibold">Salão fechado neste dia</span>
        </div>
      )}
      {deFolga.length > 0 && (
        <div className="aviso-linha">
          <i className="pi pi-sun" />
          <span>
            <span className="font-semibold">Folga:</span> {deFolga.map((f) => f.nome).join(", ")}
          </span>
        </div>
      )}
      {bloqueios.map((b) => (
        <div key={b.id} className="aviso-linha">
          <i className="pi pi-ban" />
          <span className="flex-1" style={{ minWidth: 0 }}>
            <span className="font-semibold">{periodoNoDia(b, dia)}</span> · {b.funcionario}
            {b.motivo && <span className="texto-pequeno"> · {b.motivo}</span>}
          </span>
          {(administrador || (b.funcionarioId != null && b.funcionarioId === usuario?.funcionarioId)) && (
            <Button icon="pi pi-times" className="p-button-text p-button-secondary p-button-sm" aria-label="Remover bloqueio" onClick={() => remover(b)} />
          )}
        </div>
      ))}
    </div>
  );
}
