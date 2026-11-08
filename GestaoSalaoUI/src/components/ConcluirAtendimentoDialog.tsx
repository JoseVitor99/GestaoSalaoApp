import { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Checkbox } from "primereact/checkbox";
import { ProgressSpinner } from "primereact/progressspinner";

import { api } from "../services/api";
import { useAutenticacao } from "../services/autenticacao";
import IAgendamento from "../interfaces/IAgendamento";
import { FORMA_PAGAMENTO, STATUS_AGENDAMENTO } from "../utilities/constants";
import { hora, mensagemErro, moeda, paraApiData, daApi } from "../utilities/formatters";
import useIsMobile from "../hooks/useIsMobile";

interface Props {
  agendamento: IAgendamento | null;
  onFechar: () => void;
  onConcluido: (mensagem: string) => void;
  onErro: (mensagem: string) => void;
}

interface ItemComanda {
  agendamento: IAgendamento;
  incluido: boolean;
  valor: number | null;
}

// Comanda da cliente no dia: junta os serviços pendentes dela e fecha com um pagamento só
export default function ConcluirAtendimentoDialog({ agendamento, onFechar, onConcluido, onErro }: Props) {
  const [itens, setItens] = useState<ItemComanda[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const mobile = useIsMobile();
  const { usuario, administrador } = useAutenticacao();
  const meuFuncionario = administrador ? null : usuario?.funcionarioId ?? null;
  const avisarErro = useRef(onErro);
  avisarErro.current = onErro;

  useEffect(() => {
    setFormaPagamento(null);
    setItens([]);
    if (!agendamento) return;

    setCarregando(true);
    api
      .get<IAgendamento[]>("/agendamentos", {
        params: { data: paraApiData(daApi(agendamento.dataHora)), clienteId: agendamento.clienteId },
      })
      .then((r) => {
        // Funcionário fecha só os serviços que ele mesmo fez
        const pendentes = (r.data || []).filter(
          (a) => a.status === STATUS_AGENDAMENTO.AGENDADO && (meuFuncionario === null || a.funcionarioId === meuFuncionario)
        );
        setItens(pendentes.map((a) => ({ agendamento: a, incluido: true, valor: a.valor })));
      })
      .catch((err) => {
        avisarErro.current(mensagemErro(err, "Erro ao carregar a comanda."));
        setItens([{ agendamento, incluido: true, valor: agendamento.valor }]);
      })
      .finally(() => setCarregando(false));
  }, [agendamento, meuFuncionario]);

  const alterar = (id: number, mudanca: Partial<ItemComanda>) =>
    setItens((lista) => lista.map((i) => (i.agendamento.id === id ? { ...i, ...mudanca } : i)));

  const incluidos = itens.filter((i) => i.incluido);
  const total = incluidos.reduce((acc, i) => acc + (i.valor ?? 0), 0);
  const original = incluidos.reduce((acc, i) => acc + i.agendamento.valor, 0);
  const desconto = original - total;

  const confirmar = async () => {
    if (!agendamento) return;
    if (incluidos.length === 0) return onErro("Selecione pelo menos um serviço.");
    if (!formaPagamento) return onErro("Escolha a forma de pagamento.");
    if (incluidos.some((i) => !i.valor || i.valor <= 0)) return onErro("Cada serviço precisa ter valor maior que zero.");

    try {
      setSalvando(true);
      await api.post("/agendamentos/fechar-comanda", {
        formaPagamento,
        itens: incluidos.map((i) => ({ agendamentoId: i.agendamento.id, valor: i.valor })),
      });
      const servicos = incluidos.length === 1 ? "1 serviço" : `${incluidos.length} serviços`;
      onConcluido(`Comanda de ${agendamento.cliente} fechada: ${moeda(total)} (${servicos}).`);
    } catch (err: any) {
      onErro(mensagemErro(err, "Erro ao fechar a comanda."));
    } finally {
      setSalvando(false);
    }
  };

  const rodape = (
    <div className="flex justify-content-end gap-2">
      <Button label="Voltar" icon="pi pi-arrow-left" className={`p-button-text ${mobile ? "flex-1" : ""}`} onClick={onFechar} />
      <Button
        label={mobile ? `Receber ${moeda(total)}` : `Confirmar pagamento · ${moeda(total)}`}
        icon="pi pi-check"
        className={`p-button-success ${mobile ? "flex-1" : ""}`}
        loading={salvando}
        disabled={carregando}
        onClick={confirmar}
      />
    </div>
  );

  return (
    <Dialog
      header={agendamento ? `Comanda · ${agendamento.cliente}` : "Comanda"}
      visible={!!agendamento}
      onHide={onFechar}
      footer={rodape}
      style={{ width: "38rem" }}
      breakpoints={{ "640px": "95vw" }}
      modal
      position={mobile ? "bottom" : "center"}
    >
      {carregando ? (
        <div className="flex justify-content-center p-4">
          <ProgressSpinner style={{ width: "2.5rem", height: "2.5rem" }} />
        </div>
      ) : (
        <>
          <label className="block mb-2 font-medium">Serviços do dia</label>
          <div className="surface-100 border-round px-3 py-1 mb-3">
            {itens.map((i) => (
              <div key={i.agendamento.id} className="linha-valor gap-2">
                <label className="flex align-items-center gap-2 flex-1 cursor-pointer" style={{ minWidth: 0 }}>
                  <Checkbox
                    checked={i.incluido}
                    disabled={i.agendamento.id === agendamento?.id}
                    onChange={(e) => alterar(i.agendamento.id, { incluido: !!e.checked })}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span className="block font-medium">{i.agendamento.servico}</span>
                    <span className="texto-pequeno">
                      {hora(i.agendamento.dataHora)} · {i.agendamento.funcionario}
                    </span>
                  </span>
                </label>
                <InputNumber
                  value={i.valor}
                  onValueChange={(e) => alterar(i.agendamento.id, { valor: e.value ?? null })}
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                  disabled={!i.incluido}
                  inputStyle={{ width: mobile ? "6.5rem" : "8rem", textAlign: "right" }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-content-between align-items-center mb-3">
            <span className="font-bold text-lg">Total</span>
            <span className="text-right">
              <span className="font-bold text-2xl">{moeda(total)}</span>
              {desconto > 0 && <span className="block texto-pequeno text-orange-600">desconto de {moeda(desconto)}</span>}
            </span>
          </div>

          <label className="block mb-2 font-medium">Forma de pagamento</label>
          <div className="grid">
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
        </>
      )}
    </Dialog>
  );
}
