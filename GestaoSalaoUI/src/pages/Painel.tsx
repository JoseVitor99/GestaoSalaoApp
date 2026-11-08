import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import IAgendamento from "../interfaces/IAgendamento";
import { IPainelDia, IRemuneracaoDiaria } from "../interfaces/IRemuneracao";
import TabelaAgendamentos from "../components/TabelaAgendamentos";
import ConcluirAtendimentoDialog from "../components/ConcluirAtendimentoDialog";
import BotaoNovo from "../components/BotaoNovo";
import useIsMobile from "../hooks/useIsMobile";
import { FORMA_PAGAMENTO } from "../utilities/constants";
import { dataExtenso, hoje, mensagemErro, mesmoDia, moeda, paraApiData } from "../utilities/formatters";

export default function Painel() {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const mobile = useIsMobile();

  const [dia, setDia] = useState<Date>(hoje());
  const [painel, setPainel] = useState<IPainelDia | null>(null);
  const [agendamentos, setAgendamentos] = useState<IAgendamento[]>([]);
  const [remuneracoes, setRemuneracoes] = useState<IRemuneracaoDiaria[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [concluindo, setConcluindo] = useState<IAgendamento | null>(null);

  const sucesso = (detail: string) => toast.current?.show({ severity: "success", summary: "Sucesso", detail, life: 3000 });
  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const load = useCallback(async () => {
    const params = { data: paraApiData(dia) };
    try {
      setCarregando(true);
      const [p, a, r] = await Promise.all([
        api.get("/painel", { params }),
        api.get("/agendamentos", { params }),
        api.get("/remuneracoes", { params }),
      ]);
      setPainel(p.data);
      setAgendamentos(a.data || []);
      setRemuneracoes(r.data || []);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar o painel."));
    } finally {
      setCarregando(false);
    }
  }, [dia]);

  useEffect(() => {
    load();
  }, [load]);

  const cancelar = (a: IAgendamento) => {
    confirmDialog({
      message: `Cancelar o horário de ${a.cliente} (${a.servico})?`,
      header: "Cancelar horário",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim, cancelar",
      rejectLabel: "Não",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.put(`/agendamentos/${a.id}/cancelar`);
          sucesso("Horário cancelado.");
          load();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao cancelar."));
        }
      },
    });
  };

  const naoCompareceu = (a: IAgendamento) => {
    confirmDialog({
      message: `Marcar que ${a.cliente} não compareceu (${a.servico})?`,
      header: "Não compareceu",
      icon: "pi pi-user-minus",
      acceptLabel: "Sim, marcar falta",
      rejectLabel: "Não",
      accept: async () => {
        try {
          await api.put(`/agendamentos/${a.id}/nao-compareceu`);
          sucesso("Falta registrada.");
          load();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao registrar a falta."));
        }
      },
    });
  };

  const aPagar = remuneracoes.filter((r) => !r.pago).reduce((acc, r) => acc + r.valorAPagar, 0);
  const pago = remuneracoes.filter((r) => r.pago).reduce((acc, r) => acc + r.valorTotal, 0);

  const indicador = (rotulo: string, valor: string, icone: string, cor: string, detalhe?: string) => (
    <div className="col-6 lg:col">
      <div className="surface-card border-round shadow-1 p-3 indicador h-full" style={{ borderLeftColor: cor }}>
        <div className="flex justify-content-between align-items-start">
          <div>
            <div className="rotulo">{rotulo}</div>
            <div className="valor mt-1">{valor}</div>
            {detalhe && <div className="texto-pequeno mt-1">{detalhe}</div>}
          </div>
          <i className={`${icone} text-2xl`} style={{ color: cor }} />
        </div>
      </div>
    </div>
  );

  const formasPagamento = (
    <>
      {FORMA_PAGAMENTO.map((f) => {
        const total = painel?.porFormaPagamento.find((p) => p.formaPagamento === f.value);
        return (
          <div key={f.value} className="linha-valor">
            <span className="flex align-items-center gap-2">
              <i className={`${f.icone} text-500`} />
              {f.descricao}
              {total && <span className="texto-pequeno">({total.quantidade})</span>}
            </span>
            <span className="font-semibold">{moeda(total?.total ?? 0)}</span>
          </div>
        );
      })}
      <div className="flex justify-content-between align-items-center pt-3">
        <span className="font-bold">Total</span>
        <span className="font-bold text-xl text-green-600">{moeda(painel?.faturamento)}</span>
      </div>
    </>
  );

  const remuneracaoDia = (
    <>
      {remuneracoes.length === 0 && <div className="texto-pequeno">Nenhum funcionário ativo cadastrado.</div>}
      {remuneracoes.map((r) => (
        <div key={r.funcionarioId} className="linha-valor">
          <span>
            {r.funcionario}
            <div className="texto-pequeno">
              {r.quantidadeAtendimentos} atendimento(s)
              {r.valorVales > 0 && !r.pago && ` · vales ${moeda(Math.min(r.valorVales, r.valorTotal))}`}
            </div>
          </span>
          <span className={`font-semibold ${r.pago ? "text-green-600" : ""}`}>
            {r.pago && <i className="pi pi-check-circle mr-1" />}
            {moeda(r.valorTotal)}
          </span>
        </div>
      ))}
      <div className="flex justify-content-between pt-3">
        <span>Pago</span>
        <span className="font-semibold text-green-600">{moeda(pago)}</span>
      </div>
      <div className="flex justify-content-between pt-1 mb-3">
        <span>A pagar</span>
        <span className="font-bold text-orange-600">{moeda(aPagar)}</span>
      </div>
      <Button label="Ir para remuneração" icon="pi pi-wallet" className="p-button-outlined w-full" onClick={() => navigate("/remuneracao")} />
    </>
  );

  const indicadores = (
    <div className="grid mb-2">
      {indicador("Faturamento", moeda(painel?.faturamento), "pi pi-dollar", "var(--green-500)",
        painel && painel.previsaoPendentes > 0 ? `+ ${moeda(painel.previsaoPendentes)} previstos` : undefined)}
      {indicador("Concluídos", String(painel?.concluidos ?? 0), "pi pi-check-circle", "var(--primary-color)",
        `de ${painel?.totalAgendamentos ?? 0} marcados`)}
      {indicador("Aguardando", String(painel?.pendentes ?? 0), "pi pi-clock", "var(--orange-500)",
        [painel?.cancelados ? `${painel.cancelados} cancelado(s)` : "", painel?.faltas ? `${painel.faltas} falta(s)` : ""]
          .filter(Boolean)
          .join(" · ") || undefined)}
      {indicador("Ticket médio", moeda(painel?.ticketMedio), "pi pi-chart-line", "var(--blue-500)")}
    </div>
  );

  const agendaDia = (
    <TabelaAgendamentos agendamentos={agendamentos} carregando={carregando} onConcluir={setConcluindo} onCancelar={cancelar} onNaoCompareceu={naoCompareceu} />
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      {mobile ? (
        <>
          <div className="flex align-items-center justify-content-between gap-2 mb-3">
            <div>
              <div className="titulo-pagina">{mesmoDia(dia, hoje()) ? "Movimento de hoje" : "Movimento do dia"}</div>
              <div className="texto-pequeno">{dataExtenso(dia)}</div>
            </div>
            <div className="flex gap-2">
              <Calendar
                value={dia}
                onChange={(e) => e.value && setDia(e.value as Date)}
                dateFormat="dd/mm"
                touchUI
                readOnlyInput
                inputStyle={{ width: "4.75rem", textAlign: "center", fontWeight: 600 }}
                aria-label="Escolher dia"
              />
              <Button icon="pi pi-refresh" className="p-button-outlined" aria-label="Atualizar" onClick={load} />
            </div>
          </div>

          {indicadores}

          <div className="secao-titulo">Agenda do dia</div>
          {agendaDia}

          <div className="secao-titulo">Recebido por forma de pagamento</div>
          <div className="item-lista">{formasPagamento}</div>

          <div className="secao-titulo">Remuneração do dia</div>
          <div className="item-lista">{remuneracaoDia}</div>

          <BotaoNovo label="Agendar" icon="pi pi-calendar-plus" onClick={() => navigate("/agenda?novo=1")} />
        </>
      ) : (
        <>
          <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <h2 className="m-0">{mesmoDia(dia, hoje()) ? "Movimento de hoje" : "Movimento do dia"}</h2>
              <div className="texto-pequeno mt-1">{dataExtenso(dia)}</div>
            </div>
            <div className="flex gap-2 align-items-center">
              <Calendar value={dia} onChange={(e) => e.value && setDia(e.value as Date)} dateFormat="dd/mm/yy" showIcon inputStyle={{ width: "7.5rem" }} />
              <Button icon="pi pi-refresh" className="p-button-outlined" onClick={load} tooltip="Atualizar" tooltipOptions={{ position: "left" }} />
              <Button label="Marcar horário" icon="pi pi-calendar-plus" onClick={() => navigate("/agenda?novo=1")} />
            </div>
          </div>

          {indicadores}

          <div className="grid">
            <div className="col-12 lg:col-8">
              <Card title="Agenda do dia">{agendaDia}</Card>
            </div>
            <div className="col-12 lg:col-4">
              <Card title="Recebido por forma de pagamento" className="mb-3">
                {formasPagamento}
              </Card>
              <Card title="Remuneração do dia">{remuneracaoDia}</Card>
            </div>
          </div>
        </>
      )}

      <ConcluirAtendimentoDialog
        agendamento={concluindo}
        onFechar={() => setConcluindo(null)}
        onConcluido={(msg) => {
          setConcluindo(null);
          sucesso(msg);
          load();
        }}
        onErro={erro}
      />
    </>
  );
}
