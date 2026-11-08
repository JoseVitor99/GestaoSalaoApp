import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

import { api } from "../services/api";
import IAgendamento from "../interfaces/IAgendamento";
import { FORMA_PAGAMENTO } from "../utilities/constants";
import { hora, mensagemErro, moeda } from "../utilities/formatters";
import useIsMobile from "../hooks/useIsMobile";

interface Props {
  agendamento: IAgendamento | null;
  onFechar: () => void;
  onConcluido: (mensagem: string) => void;
  onErro: (mensagem: string) => void;
}

export default function ConcluirAtendimentoDialog({ agendamento, onFechar, onConcluido, onErro }: Props) {
  const [formaPagamento, setFormaPagamento] = useState<number | null>(null);
  const [valor, setValor] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const mobile = useIsMobile();

  useEffect(() => {
    setFormaPagamento(null);
    setValor(agendamento?.valor ?? null);
  }, [agendamento]);

  const confirmar = async () => {
    if (!agendamento) return;

    if (!formaPagamento) {
      onErro("Escolha a forma de pagamento.");
      return;
    }

    if (!valor || valor <= 0) {
      onErro("Informe um valor maior que zero.");
      return;
    }

    try {
      setSalvando(true);
      await api.put(`/agendamentos/${agendamento.id}/concluir`, { formaPagamento, valor });
      onConcluido(`Atendimento de ${agendamento.cliente} concluído: ${moeda(valor)}.`);
    } catch (err: any) {
      onErro(mensagemErro(err, "Erro ao concluir atendimento."));
    } finally {
      setSalvando(false);
    }
  };

  const desconto = agendamento && valor !== null ? agendamento.valor - valor : 0;

  const rodape = (
    <div className="flex justify-content-end gap-2">
      <Button label="Voltar" icon="pi pi-arrow-left" className={`p-button-text ${mobile ? "flex-1" : ""}`} onClick={onFechar} />
      <Button
        label={mobile ? "Confirmar" : "Confirmar pagamento"}
        icon="pi pi-check"
        className={`p-button-success ${mobile ? "flex-1" : ""}`}
        loading={salvando}
        onClick={confirmar}
      />
    </div>
  );

  return (
    <Dialog
      header="Concluir atendimento"
      visible={!!agendamento}
      onHide={onFechar}
      footer={rodape}
      style={{ width: "34rem" }}
      breakpoints={{ "640px": "95vw" }}
      modal
      position={mobile ? "bottom" : "center"}
    >
      {agendamento && (
        <>
          <div className="surface-100 border-round p-3 mb-4">
            <div className="font-semibold text-lg">{agendamento.cliente}</div>
            <div className="texto-pequeno mt-1">
              {agendamento.servico} com {agendamento.funcionario} · {hora(agendamento.dataHora)}
            </div>
          </div>

          <label className="block mb-2 font-medium">Forma de pagamento</label>
          <div className="grid mb-3">
            {FORMA_PAGAMENTO.map((f) => (
              <div key={f.value} className="col-6">
                <Button
                  label={mobile ? f.curto : f.descricao}
                  icon={f.icone}
                  className={`w-full ${formaPagamento === f.value ? "" : "p-button-outlined p-button-secondary"}`}
                  onClick={() => setFormaPagamento(f.value)}
                />
              </div>
            ))}
          </div>

          <label className="block mb-2 font-medium">Valor cobrado</label>
          <InputNumber
            value={valor}
            onValueChange={(e) => setValor(e.value ?? null)}
            mode="currency"
            currency="BRL"
            locale="pt-BR"
            className="w-full"
            inputClassName="w-full text-xl font-bold"
          />
          {desconto > 0 && (
            <small className="block mt-2 text-orange-600">
              Desconto de {moeda(desconto)} sobre o valor do serviço.
            </small>
          )}
        </>
      )}
    </Dialog>
  );
}
