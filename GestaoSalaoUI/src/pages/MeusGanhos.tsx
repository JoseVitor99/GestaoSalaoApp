import { useCallback, useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";

import { api } from "../services/api";
import { useAutenticacao } from "../services/autenticacao";
import StatusTag from "../components/StatusTag";
import useIsMobile from "../hooks/useIsMobile";
import IAgendamento from "../interfaces/IAgendamento";
import { IPagamentoDiario, IRemuneracaoDiaria } from "../interfaces/IRemuneracao";
import { data, dataExtenso, hoje, hora, mensagemErro, moeda, paraApiData, somarDias } from "../utilities/formatters";

export default function MeusGanhos() {
  const { usuario } = useAutenticacao();
  const mobile = useIsMobile();

  const [dia, setDia] = useState<Date>(hoje());
  const [remuneracao, setRemuneracao] = useState<IRemuneracaoDiaria | null>(null);
  const [atendimentos, setAtendimentos] = useState<IAgendamento[]>([]);
  const [historico, setHistorico] = useState<IPagamentoDiario[]>([]);
  const [erro, setErro] = useState("");

  const funcionarioId = usuario?.funcionarioId;

  const load = useCallback(async () => {
    if (!funcionarioId) return;
    try {
      setErro("");
      const params = { data: paraApiData(dia) };
      const [r, a] = await Promise.all([
        api.get("/remuneracoes/minha", { params }),
        api.get("/agendamentos", { params: { ...params, funcionarioId } }),
      ]);
      setRemuneracao(r.data || null);
      setAtendimentos(a.data || []);
    } catch (err: any) {
      setErro(mensagemErro(err, "Erro ao carregar seus ganhos."));
    }
  }, [dia, funcionarioId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!funcionarioId) return;
    api
      .get("/remuneracoes/minha/historico")
      .then((r) => setHistorico(r.data || []))
      .catch(() => undefined);
  }, [funcionarioId]);

  if (!funcionarioId)
    return (
      <Message
        severity="warn"
        className="w-full justify-content-start"
        text="Seu usuário não está vinculado a um funcionário. Peça ao administrador para fazer o vínculo."
      />
    );

  const totalHistorico = historico.reduce((acc, p) => acc + p.valorTotal, 0);

  const valor = (rotulo: string, conteudo: string, destaque = false) => (
    <div className="col-6 md:col-3">
      <div className="texto-pequeno">{rotulo}</div>
      <div className={destaque ? "text-2xl font-bold" : "text-lg font-semibold"} style={destaque ? { color: "var(--primary-color)" } : undefined}>
        {conteudo}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="titulo-pagina">Meus ganhos</div>
          <div className="texto-pequeno">{dataExtenso(dia)}</div>
        </div>
        <div className="navegador-data" style={{ minWidth: mobile ? "100%" : "20rem" }}>
          <Button icon="pi pi-chevron-left" className="p-button-outlined" aria-label="Dia anterior" onClick={() => setDia(somarDias(dia, -1))} />
          <Calendar
            value={dia}
            onChange={(e) => e.value && setDia(e.value as Date)}
            maxDate={hoje()}
            dateFormat="dd/mm/yy"
            touchUI={mobile}
            readOnlyInput
          />
          <Button
            icon="pi pi-chevron-right"
            className="p-button-outlined"
            aria-label="Próximo dia"
            disabled={somarDias(dia, 1) > hoje()}
            onClick={() => setDia(somarDias(dia, 1))}
          />
        </div>
      </div>

      {erro && <Message severity="error" className="w-full mb-3 justify-content-start" text={erro} />}

      <Card className="mb-3">
        <div className="flex justify-content-between align-items-start mb-2">
          <div>
            <div className="text-xl font-bold">{remuneracao?.funcionario ?? usuario?.nome}</div>
            {remuneracao && (
              <div className="texto-pequeno">
                {remuneracao.tipoRemuneracaoDescricao}
                {remuneracao.percentualComissao > 0 && ` (${remuneracao.percentualComissao}%)`}
              </div>
            )}
          </div>
          {remuneracao &&
            (remuneracao.pago ? (
              <Tag value={`Pago às ${hora(remuneracao.dataPagamento!)}`} severity="success" icon="pi pi-check" rounded />
            ) : (
              <Tag value="Pendente" severity="warning" icon="pi pi-clock" rounded />
            ))}
        </div>

        {remuneracao ? (
          <>
            <div className="grid mt-2">
              {valor("Atendimentos", `${remuneracao.quantidadeAtendimentos} · ${moeda(remuneracao.totalAtendimentos)}`)}
              {valor("Comissão", moeda(remuneracao.valorComissao))}
              {valor("Diária", moeda(remuneracao.valorDiaria))}
              {valor("Total do dia", moeda(remuneracao.valorTotal), true)}
            </div>
            {!remuneracao.pago && (
              <small className="texto-pequeno block mt-2">
                Valor previsto. Ele é confirmado quando o administrador registra o pagamento do dia.
              </small>
            )}
          </>
        ) : (
          <div className="texto-pequeno">Nenhum valor para este dia.</div>
        )}
      </Card>

      <div className="grid">
        <div className="col-12 lg:col-7">
          <Card title="Meus atendimentos do dia">
            {atendimentos.length === 0 && <div className="texto-pequeno">Nenhum atendimento neste dia.</div>}
            {atendimentos.map((a) => (
              <div key={a.id} className="linha-valor">
                <div style={{ minWidth: 0 }}>
                  <div className="font-medium">
                    {hora(a.dataHora)} · {a.cliente}
                  </div>
                  <div className="texto-pequeno">{a.servico}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{moeda(a.valor)}</div>
                  <StatusTag status={a.status} descricao={a.statusDescricao} />
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div className="col-12 lg:col-5">
          <Card title="Pagamentos dos últimos 30 dias">
            {historico.length === 0 && <div className="texto-pequeno">Nenhum pagamento registrado.</div>}
            {historico.map((p) => (
              <div key={p.id} className="linha-valor">
                <div>
                  <div className="font-medium">{data(p.data)}</div>
                  <div className="texto-pequeno">
                    {p.quantidadeAtendimentos} atend. · diária {moeda(p.valorDiaria)} · comissão {moeda(p.valorComissao)}
                  </div>
                </div>
                <div className="font-bold">{moeda(p.valorTotal)}</div>
              </div>
            ))}
            {historico.length > 0 && (
              <div className="flex justify-content-between pt-3">
                <span className="font-bold">Total recebido</span>
                <span className="font-bold text-green-600">{moeda(totalHistorico)}</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
