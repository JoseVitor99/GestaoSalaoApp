import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { ProgressSpinner } from "primereact/progressspinner";

import { api } from "../services/api";
import { useAutenticacao } from "../services/autenticacao";
import IAgendamento from "../interfaces/IAgendamento";
import { NOME_CLIENTE, STATUS_AGENDAMENTO } from "../utilities/constants";
import { formatarTelefone, hoje, hora, linkWhatsApp, mensagemErro, paraApiData, somarDias } from "../utilities/formatters";
import useIsMobile from "../hooks/useIsMobile";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

interface Lembrete {
  clienteId: number;
  cliente: string;
  telefone: string;
  horarios: IAgendamento[];
}

const chaveEnviados = (dia: Date) => `lembretes-${paraApiData(dia)}`;

const lerEnviados = (dia: Date): number[] => {
  try {
    return JSON.parse(localStorage.getItem(chaveEnviados(dia)) || "[]");
  } catch {
    return [];
  }
};

const descricaoDia = (dia: Date) => {
  const quando = dia.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  if (paraApiData(dia) === paraApiData(somarDias(hoje(), 1))) return `amanhã (${quando})`;
  if (paraApiData(dia) === paraApiData(hoje())) return `hoje (${quando})`;
  return quando;
};

const montarMensagem = (l: Lembrete, dia: Date) => {
  const primeiroNome = l.cliente.split(" ")[0];
  const servicos = l.horarios.map((a) => `${hora(a.dataHora)} - ${a.servico} com ${a.funcionario.split(" ")[0]}`).join("\n");
  return (
    `Olá, ${primeiroNome}! Passando para lembrar do seu horário ${descricaoDia(dia)} na ${NOME_CLIENTE}:\n\n` +
    `${servicos}\n\n` +
    "Podemos confirmar? Se precisar remarcar, é só avisar por aqui."
  );
};

// Lista as clientes do dia escolhido, cada uma com a mensagem pronta para o WhatsApp
export default function LembretesDialog({ aberto, onFechar }: Props) {
  const { usuario, administrador } = useAutenticacao();
  const mobile = useIsMobile();

  const [dia, setDia] = useState<Date>(somarDias(hoje(), 1));
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [enviados, setEnviados] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    setErro("");
    setEnviados(lerEnviados(dia));
    api
      .get<IAgendamento[]>("/agendamentos", {
        params: { data: paraApiData(dia), funcionarioId: administrador ? undefined : usuario?.funcionarioId },
      })
      .then((r) => {
        const porCliente = new Map<number, Lembrete>();
        (r.data || [])
          .filter((a) => a.status === STATUS_AGENDAMENTO.AGENDADO)
          .forEach((a) => {
            const item = porCliente.get(a.clienteId) ?? { clienteId: a.clienteId, cliente: a.cliente, telefone: a.clienteTelefone, horarios: [] };
            item.horarios.push(a);
            porCliente.set(a.clienteId, item);
          });
        setLembretes(Array.from(porCliente.values()));
      })
      .catch((err) => setErro(mensagemErro(err, "Erro ao carregar os horários.")))
      .finally(() => setCarregando(false));
  }, [aberto, dia, administrador, usuario?.funcionarioId]);

  const enviar = (l: Lembrete) => {
    window.open(linkWhatsApp(l.telefone, montarMensagem(l, dia)), "_blank");
    const lista = enviados.includes(l.clienteId) ? enviados : [...enviados, l.clienteId];
    setEnviados(lista);
    try {
      localStorage.setItem(chaveEnviados(dia), JSON.stringify(lista));
    } catch {
      // Sem armazenamento a marcação vale só enquanto a tela estiver aberta
    }
  };

  const faltam = lembretes.filter((l) => !enviados.includes(l.clienteId)).length;

  return (
    <Dialog
      header="Lembretes por WhatsApp"
      visible={aberto}
      onHide={onFechar}
      style={{ width: "34rem" }}
      breakpoints={{ "640px": "95vw" }}
      position={mobile ? "bottom" : "center"}
      modal
    >
      <div className="flex align-items-center gap-2 mb-3">
        <Calendar
          value={dia}
          onChange={(e) => e.value && setDia(e.value as Date)}
          minDate={hoje()}
          dateFormat="dd/mm/yy"
          showIcon
          readOnlyInput
          touchUI={mobile}
          inputStyle={{ width: "7.5rem" }}
        />
        <span className="texto-pequeno">
          {lembretes.length === 0 ? "" : faltam === 0 ? "Todos enviados" : `${faltam} de ${lembretes.length} para enviar`}
        </span>
      </div>

      {erro && <div className="text-red-500 mb-2">{erro}</div>}

      {carregando ? (
        <div className="flex justify-content-center p-4">
          <ProgressSpinner style={{ width: "2.5rem", height: "2.5rem" }} />
        </div>
      ) : lembretes.length === 0 ? (
        <div className="texto-pequeno text-center py-4">Nenhum horário pendente neste dia.</div>
      ) : (
        lembretes.map((l) => {
          const enviado = enviados.includes(l.clienteId);
          return (
            <div key={l.clienteId} className={`linha-valor gap-2 ${enviado ? "opacity-60" : ""}`}>
              <div style={{ minWidth: 0 }}>
                <div className="font-medium">{l.cliente}</div>
                <div className="texto-pequeno">
                  {formatarTelefone(l.telefone)} · {l.horarios.map((a) => hora(a.dataHora)).join(", ")}
                </div>
              </div>
              <Button
                label={enviado ? "Reenviar" : "Enviar"}
                icon={enviado ? "pi pi-check" : "pi pi-whatsapp"}
                className={`${mobile ? "" : "p-button-sm"} ${enviado ? "p-button-text p-button-secondary" : "p-button-success"}`}
                style={{ flexShrink: 0 }}
                onClick={() => enviar(l)}
              />
            </div>
          );
        })
      )}

      <small className="texto-pequeno block mt-3">
        Cada botão abre o WhatsApp com a mensagem pronta; é só conferir e enviar.
      </small>
    </Dialog>
  );
}
