import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";

import IAgendamento from "../interfaces/IAgendamento";
import StatusTag from "./StatusTag";
import { STATUS_AGENDAMENTO } from "../utilities/constants";
import { hora, linkTelefone, linkWhatsApp, moeda } from "../utilities/formatters";
import useIsMobile from "../hooks/useIsMobile";

interface Props {
  agendamentos: IAgendamento[];
  carregando?: boolean;
  onConcluir: (a: IAgendamento) => void;
  onCancelar: (a: IAgendamento) => void;
  onEditar?: (a: IAgendamento) => void;
  onExcluir?: (a: IAgendamento) => void;
  mensagemVazia?: string;
}

export default function TabelaAgendamentos({
  agendamentos,
  carregando,
  onConcluir,
  onCancelar,
  onEditar,
  onExcluir,
  mensagemVazia = "Nenhum horário marcado para este dia.",
}: Props) {
  const mobile = useIsMobile();

  const horarioTemplate = (a: IAgendamento) => (
    <div>
      <div className="font-bold">{hora(a.dataHora)}</div>
      <div className="texto-pequeno">até {hora(a.dataHoraFim)}</div>
    </div>
  );

  const clienteTemplate = (a: IAgendamento) => (
    <div>
      <div className="font-medium">{a.cliente}</div>
      <div className="texto-pequeno white-space-nowrap">
        <i className="pi pi-phone mr-1" style={{ fontSize: "0.7rem" }} />
        {a.clienteTelefone}
      </div>
      {a.observacao && <div className="texto-pequeno font-italic mt-1">“{a.observacao}”</div>}
    </div>
  );

  const servicoTemplate = (a: IAgendamento) => (
    <div>
      <div>{a.servico}</div>
      <div className="texto-pequeno">
        <i className="pi pi-user mr-1" style={{ fontSize: "0.7rem" }} />
        {a.funcionario}
      </div>
    </div>
  );

  const valorTemplate = (a: IAgendamento) => (
    <div>
      <div className="font-medium">{moeda(a.valor)}</div>
      {a.formaPagamentoDescricao && <div className="texto-pequeno">{a.formaPagamentoDescricao}</div>}
    </div>
  );

  const acoesTemplate = (a: IAgendamento) => {
    const pendente = a.status === STATUS_AGENDAMENTO.AGENDADO;

    return (
      <div className="flex gap-1 justify-content-end">
        {pendente && (
          <Button
            icon="pi pi-check"
            className="p-button-success p-button-sm"
            tooltip="Concluir atendimento (receber)"
            tooltipOptions={{ position: "top" }}
            onClick={() => onConcluir(a)}
          />
        )}
        {pendente && onEditar && (
          <Button
            icon="pi pi-pencil"
            className="p-button-warning p-button-sm p-button-outlined"
            tooltip="Remarcar / editar"
            tooltipOptions={{ position: "top" }}
            onClick={() => onEditar(a)}
          />
        )}
        {pendente && (
          <Button
            icon="pi pi-times"
            className="p-button-secondary p-button-sm p-button-outlined"
            tooltip="Cancelar horário"
            tooltipOptions={{ position: "top" }}
            onClick={() => onCancelar(a)}
          />
        )}
        {a.status !== STATUS_AGENDAMENTO.CONCLUIDO && onExcluir && (
          <Button
            icon="pi pi-trash"
            className="p-button-danger p-button-sm p-button-text"
            tooltip="Excluir"
            tooltipOptions={{ position: "top" }}
            onClick={() => onExcluir(a)}
          />
        )}
      </div>
    );
  };

  // Celular
  if (mobile) {
    if (carregando && agendamentos.length === 0)
      return (
        <div className="flex justify-content-center p-4">
          <ProgressSpinner style={{ width: "2.5rem", height: "2.5rem" }} />
        </div>
      );

    if (agendamentos.length === 0)
      return (
        <div className="item-lista text-center texto-pequeno py-4">
          <i className="pi pi-calendar-times text-2xl mb-2 block" />
          {mensagemVazia}
        </div>
      );

    return (
      <div>
        {agendamentos.map((a) => {
          const pendente = a.status === STATUS_AGENDAMENTO.AGENDADO;
          const classe =
            a.status === STATUS_AGENDAMENTO.CONCLUIDO ? "concluido" : a.status === STATUS_AGENDAMENTO.CANCELADO ? "cancelado" : "";

          return (
            <div key={a.id} className={`item-lista ${classe}`}>
              <div className="flex">
                <div className="horario-bloco">
                  <div className="hora">{hora(a.dataHora)}</div>
                  <div className="texto-pequeno">{hora(a.dataHoraFim)}</div>
                </div>

                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div className="flex justify-content-between align-items-start gap-2">
                    <div className="item-titulo">{a.cliente}</div>
                    <StatusTag status={a.status} descricao={a.statusDescricao} />
                  </div>
                  <div className="mt-1">{a.servico}</div>
                  <div className="texto-pequeno mt-1">
                    <i className="pi pi-user mr-1" style={{ fontSize: "0.7rem" }} />
                    {a.funcionario}
                  </div>
                  <div className="flex justify-content-between align-items-end mt-2">
                    <a href={linkTelefone(a.clienteTelefone)} className="texto-pequeno no-underline">
                      <i className="pi pi-phone mr-1" style={{ fontSize: "0.7rem" }} />
                      {a.clienteTelefone}
                    </a>
                    <div className="text-right">
                      <div className="font-bold">{moeda(a.valor)}</div>
                      {a.formaPagamentoDescricao && <div className="texto-pequeno">{a.formaPagamentoDescricao}</div>}
                    </div>
                  </div>
                  {a.observacao && <div className="texto-pequeno font-italic mt-2">“{a.observacao}”</div>}
                </div>
              </div>

              {pendente && (
                <div className="item-acoes">
                  <Button label="Concluir" icon="pi pi-check" className="p-button-success" onClick={() => onConcluir(a)} />
                  <Button
                    icon="pi pi-whatsapp"
                    className="p-button-outlined p-button-success"
                    aria-label="WhatsApp"
                    onClick={() => window.open(linkWhatsApp(a.clienteTelefone), "_blank")}
                  />
                  {onEditar && (
                    <Button icon="pi pi-pencil" className="p-button-outlined p-button-warning" aria-label="Remarcar" onClick={() => onEditar(a)} />
                  )}
                  <Button icon="pi pi-times" className="p-button-outlined p-button-secondary" aria-label="Cancelar horário" onClick={() => onCancelar(a)} />
                </div>
              )}

              {!pendente && a.status === STATUS_AGENDAMENTO.CANCELADO && onExcluir && (
                <div className="item-acoes">
                  <Button label="Excluir" icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => onExcluir(a)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Computador
  return (
    <DataTable
      value={agendamentos}
      loading={carregando}
      dataKey="id"
      emptyMessage={mensagemVazia}
      className="p-datatable-sm"
      rowClassName={(a: IAgendamento) => (a.status === STATUS_AGENDAMENTO.CANCELADO ? "linha-cancelada" : "")}
    >
      <Column header="Horário" body={horarioTemplate} style={{ width: "5.5rem" }} />
      <Column header="Cliente" body={clienteTemplate} style={{ minWidth: "10rem" }} />
      <Column header="Serviço / Profissional" body={servicoTemplate} />
      <Column header="Valor" body={valorTemplate} style={{ width: "9rem" }} />
      <Column header="Situação" body={(a: IAgendamento) => <StatusTag status={a.status} descricao={a.statusDescricao} />} style={{ width: "8rem" }} />
      <Column body={acoesTemplate} style={{ width: "1%", whiteSpace: "nowrap" }} />
    </DataTable>
  );
}
