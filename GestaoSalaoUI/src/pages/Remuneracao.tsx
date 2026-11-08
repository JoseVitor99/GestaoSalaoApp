import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import useIsMobile from "../hooks/useIsMobile";
import { IPagamentoDiario, IRemuneracaoDiaria, IVale } from "../interfaces/IRemuneracao";
import IFuncionario from "../interfaces/IFuncionario";
import { TIPO_REMUNERACAO } from "../utilities/constants";
import { data, dataExtenso, hoje, hora, mensagemErro, moeda, paraApiData, somarDias } from "../utilities/formatters";

interface Linha extends IRemuneracaoDiaria {
  trabalhou: boolean;
}

const recebeDiaria = (l: IRemuneracaoDiaria) => l.tipoRemuneracao !== TIPO_REMUNERACAO.COMISSAO;

// Dia já pago usa os valores gravados; senão recalcula a diária pela marcação "trabalhou"
const valores = (l: Linha) => {
  if (l.pago)
    return { diaria: l.valorDiaria, comissao: l.valorComissao, total: l.valorTotal, vales: l.valorVales, aPagar: l.valorTotal - l.valorVales };
  const diaria = recebeDiaria(l) && l.trabalhou ? l.valorDiariaConfigurada : 0;
  const total = diaria + l.valorComissao;
  return { diaria, comissao: l.valorComissao, total, vales: Math.min(l.valorVales, total), aPagar: Math.max(0, total - l.valorVales) };
};

const valesTexto = (valor: number) => (valor > 0 ? <span className="text-orange-600">− {moeda(valor)}</span> : <span className="texto-pequeno">—</span>);

export default function Remuneracao() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();

  const [dia, setDia] = useState<Date>(hoje());
  const [dados, setDados] = useState<IRemuneracaoDiaria[]>([]);
  const [trabalhou, setTrabalhou] = useState<Record<number, boolean>>({});
  const [carregando, setCarregando] = useState(false);

  const [periodo, setPeriodo] = useState<(Date | null)[]>([somarDias(hoje(), -30), hoje()]);
  const [funcionarios, setFuncionarios] = useState<IFuncionario[]>([]);

  const [vales, setVales] = useState<IVale[]>([]);
  const [novoVale, setNovoVale] = useState(false);
  const [valeFuncionario, setValeFuncionario] = useState<number | null>(null);
  const [valeData, setValeData] = useState<Date>(hoje());
  const [valeValor, setValeValor] = useState<number | null>(null);
  const [valeObservacao, setValeObservacao] = useState("");
  const [filtroFuncionario, setFiltroFuncionario] = useState<number | null>(null);
  const [historico, setHistorico] = useState<IPagamentoDiario[]>([]);

  const loadVales = useCallback(async () => {
    try {
      const r = await api.get("/vales");
      setVales(r.data || []);
    } catch {
      setVales([]);
    }
  }, []);

  useEffect(() => {
    loadVales();
  }, [loadVales]);

  const abrirNovoVale = () => {
    setValeFuncionario(null);
    setValeData(hoje());
    setValeValor(null);
    setValeObservacao("");
    setNovoVale(true);
  };

  const salvarVale = async () => {
    if (!valeFuncionario) return erro("Selecione o funcionário.");
    if (!valeValor || valeValor <= 0) return erro("Informe o valor do vale.");
    try {
      await api.post("/vales", {
        funcionarioId: valeFuncionario,
        data: paraApiData(valeData),
        valor: valeValor,
        observacao: valeObservacao.trim() || null,
      });
      setNovoVale(false);
      sucesso("Vale registrado. Ele será descontado no próximo pagamento.");
      loadVales();
      load();
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao registrar o vale."));
    }
  };

  const excluirVale = (v: IVale) =>
    confirmDialog({
      header: "Excluir vale",
      icon: "pi pi-exclamation-triangle",
      message: `Excluir o vale de ${moeda(v.valor)} de ${v.funcionario}?`,
      acceptLabel: "Excluir",
      rejectLabel: "Voltar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/vales/${v.id}`);
          sucesso("Vale excluído.");
          loadVales();
          load();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao excluir o vale."));
        }
      },
    });

  const sucesso = (detail: string) => toast.current?.show({ severity: "success", summary: "Sucesso", detail, life: 3000 });
  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const load = useCallback(async () => {
    try {
      setCarregando(true);
      const response = await api.get("/remuneracoes", { params: { data: paraApiData(dia) } });
      const lista: IRemuneracaoDiaria[] = response.data || [];
      setDados(lista);
      setTrabalhou(Object.fromEntries(lista.map((l) => [l.funcionarioId, l.diariaIncluida])));
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar remuneração."));
    } finally {
      setCarregando(false);
    }
  }, [dia]);

  const loadHistorico = useCallback(async () => {
    const [inicio, fim] = periodo;
    if (!inicio) return;
    try {
      const response = await api.get("/remuneracoes/historico", {
        params: {
          inicio: paraApiData(inicio),
          fim: paraApiData(fim ?? inicio),
          funcionarioId: filtroFuncionario ?? undefined,
        },
      });
      setHistorico(response.data || []);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar histórico."));
    }
  }, [periodo, filtroFuncionario]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadHistorico();
  }, [loadHistorico]);

  useEffect(() => {
    api
      .get("/funcionarios")
      .then((r) => setFuncionarios(r.data || []))
      .catch(() => undefined);
  }, []);

  // A tabela só redesenha a linha quando o objeto dela muda, por isso a marcação vai junto com os dados
  const linhas = useMemo<Linha[]>(
    () => dados.map((l) => ({ ...l, trabalhou: !!trabalhou[l.funcionarioId] })),
    [dados, trabalhou]
  );

  const totais = useMemo(() => {
    let pago = 0;
    let pendente = 0;
    let faturado = 0;
    linhas.forEach((l) => {
      faturado += l.totalAtendimentos;
      if (l.pago) pago += l.valorTotal;
      else pendente += valores(l).aPagar;
    });
    return { pago, pendente, faturado };
  }, [linhas]);

  const pagar = (l: Linha) => {
    const v = valores(l);
    confirmDialog({
      header: "Confirmar pagamento",
      icon: "pi pi-wallet",
      message: (
        <div>
          <div className="mb-2">
            Pagar <b>{moeda(v.aPagar)}</b> para <b>{l.funcionario}</b> referente a {data(paraApiData(dia))}?
          </div>
          <div className="texto-pequeno">
            Diária {moeda(v.diaria)} + comissão {moeda(v.comissao)} ({l.quantidadeAtendimentos} atendimento(s))
            {v.vales > 0 && ` − vales ${moeda(v.vales)}`}
          </div>
          {l.valorVales > v.total && (
            <div className="texto-pequeno text-orange-600 mt-2">
              Os vales passam do valor do dia; {moeda(l.valorVales - v.total)} continuam em aberto para o próximo pagamento.
            </div>
          )}
        </div>
      ),
      acceptLabel: "Pagar",
      rejectLabel: "Voltar",
      acceptClassName: "p-button-success",
      accept: async () => {
        try {
          await api.post("/remuneracoes/pagar", {
            funcionarioId: l.funcionarioId,
            data: paraApiData(dia),
            incluirDiaria: l.trabalhou,
          });
          sucesso(`Pagamento de ${l.funcionario} registrado.`);
          load();
          loadHistorico();
          loadVales();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao registrar pagamento."));
        }
      },
    });
  };

  const estornar = (pagamentoId: number, funcionario: string) => {
    confirmDialog({
      header: "Estornar pagamento",
      icon: "pi pi-exclamation-triangle",
      message: `Desfazer o pagamento de ${funcionario}? O dia volta a ficar pendente.`,
      acceptLabel: "Estornar",
      rejectLabel: "Voltar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/remuneracoes/pagamentos/${pagamentoId}`);
          sucesso("Pagamento estornado.");
          load();
          loadHistorico();
          loadVales();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao estornar."));
        }
      },
    });
  };

  const pagarTodos = () => {
    const pendentes = linhas.filter((l) => !l.pago && valores(l).total > 0);
    if (pendentes.length === 0) {
      toast.current?.show({ severity: "info", summary: "Nada a pagar", detail: "Não há pagamentos pendentes com valor.", life: 3000 });
      return;
    }
    const total = pendentes.reduce((acc, l) => acc + valores(l).aPagar, 0);

    confirmDialog({
      header: "Pagar todos",
      icon: "pi pi-wallet",
      message: `Registrar o pagamento de ${pendentes.length} funcionário(s), total ${moeda(total)}?`,
      acceptLabel: "Pagar todos",
      rejectLabel: "Voltar",
      acceptClassName: "p-button-success",
      accept: async () => {
        let erros = 0;
        for (const l of pendentes) {
          try {
            await api.post("/remuneracoes/pagar", {
              funcionarioId: l.funcionarioId,
              data: paraApiData(dia),
              incluirDiaria: l.trabalhou,
            });
          } catch {
            erros++;
          }
        }
        if (erros) erro(`${erros} pagamento(s) não puderam ser registrados.`);
        else sucesso("Todos os pagamentos foram registrados.");
        load();
        loadHistorico();
        loadVales();
      },
    });
  };

  const funcionarioTemplate = (l: Linha) => (
    <div>
      <div className="font-medium">{l.funcionario}</div>
      <div className="texto-pequeno">
        {l.funcao ? `${l.funcao} · ` : ""}
        {l.tipoRemuneracaoDescricao}
        {l.tipoRemuneracao !== TIPO_REMUNERACAO.DIARIA && ` (${l.percentualComissao}%)`}
      </div>
    </div>
  );

  const atendimentosTemplate = (l: Linha) => (
    <div>
      <div>{l.quantidadeAtendimentos}</div>
      <div className="texto-pequeno">{moeda(l.totalAtendimentos)}</div>
    </div>
  );

  const trabalhouTemplate = (l: Linha) => {
    if (!recebeDiaria(l)) return <span className="texto-pequeno">—</span>;
    return (
      <Checkbox
        checked={l.trabalhou}
        disabled={l.pago}
        onChange={(e) => setTrabalhou((t) => ({ ...t, [l.funcionarioId]: !!e.checked }))}
        tooltip="Marque se trabalhou no dia (soma a diária)"
        tooltipOptions={{ position: "top" }}
      />
    );
  };

  const situacaoTemplate = (l: Linha) =>
    l.pago ? (
      <div>
        <Tag value="Pago" severity="success" icon="pi pi-check" rounded />
        {l.dataPagamento && <div className="texto-pequeno mt-1">às {hora(l.dataPagamento)}</div>}
      </div>
    ) : (
      <Tag value="Pendente" severity="warning" icon="pi pi-clock" rounded />
    );

  const acoesTemplate = (l: Linha) =>
    l.pago ? (
      <Button
        label="Estornar"
        icon="pi pi-undo"
        className="p-button-danger p-button-text p-button-sm"
        onClick={() => estornar(l.pagamentoId!, l.funcionario)}
      />
    ) : (
      <Button
        label="Pagar"
        icon="pi pi-wallet"
        className="p-button-success p-button-sm"
        disabled={valores(l).total <= 0}
        onClick={() => pagar(l)}
      />
    );

  const totalValesAbertos = vales.filter((v) => !v.descontado).reduce((acc, v) => acc + v.valor, 0);

  const totalHistorico = historico.reduce((acc, p) => acc + p.valorTotal, 0);

  // Celular

  const resumoMobile = (
    <div className="item-lista">
      <div className="grid text-center">
        <div className="col-4">
          <div className="texto-pequeno">Faturado</div>
          <div className="font-bold mt-1">{moeda(totais.faturado)}</div>
        </div>
        <div className="col-4">
          <div className="texto-pequeno">Já pago</div>
          <div className="font-bold mt-1 text-green-600">{moeda(totais.pago)}</div>
        </div>
        <div className="col-4">
          <div className="texto-pequeno">A pagar</div>
          <div className="font-bold mt-1 text-orange-600">{moeda(totais.pendente)}</div>
        </div>
      </div>
    </div>
  );

  const pagamentoDiaMobile = (
    <>
      <div className="navegador-data mb-2">
        <Button icon="pi pi-chevron-left" className="p-button-outlined" aria-label="Dia anterior" onClick={() => setDia(somarDias(dia, -1))} />
        <Calendar value={dia} onChange={(e) => e.value && setDia(e.value as Date)} maxDate={hoje()} dateFormat="dd/mm/yy" touchUI readOnlyInput />
        <Button
          icon="pi pi-chevron-right"
          className="p-button-outlined"
          aria-label="Próximo dia"
          disabled={somarDias(dia, 1) > hoje()}
          onClick={() => setDia(somarDias(dia, 1))}
        />
      </div>
      <div className="texto-pequeno text-center mb-3">{dataExtenso(dia)} · comissão sobre atendimentos concluídos</div>

      {resumoMobile}

      {linhas.length === 0 && !carregando && (
        <div className="item-lista text-center texto-pequeno py-4">Nenhum funcionário ativo cadastrado.</div>
      )}

      {linhas.map((l) => {
        const v = valores(l);
        return (
          <div key={l.funcionarioId} className="item-lista">
            <div className="flex justify-content-between align-items-start gap-2">
              <div style={{ minWidth: 0 }}>
                <div className="item-titulo">{l.funcionario}</div>
                <div className="texto-pequeno mt-1">
                  {l.funcao ? `${l.funcao} · ` : ""}
                  {l.tipoRemuneracaoDescricao}
                  {l.tipoRemuneracao !== TIPO_REMUNERACAO.DIARIA && ` (${l.percentualComissao}%)`}
                </div>
              </div>
              {situacaoTemplate(l)}
            </div>

            <div className="grade-valores">
              <div>
                <div className="rotulo">Atendimentos</div>
                <div className="valor">
                  {l.quantidadeAtendimentos} · {moeda(l.totalAtendimentos)}
                </div>
              </div>
              <div>
                <div className="rotulo">Comissão</div>
                <div className="valor">{moeda(v.comissao)}</div>
              </div>
              <div>
                <div className="rotulo">Diária</div>
                <div className="valor">{moeda(v.diaria)}</div>
              </div>
              <div>
                <div className="rotulo">Ganho do dia</div>
                <div className="valor">{moeda(v.total)}</div>
              </div>
              <div>
                <div className="rotulo">Vales</div>
                <div className="valor">{valesTexto(v.vales)}</div>
              </div>
              <div>
                <div className="rotulo">{l.pago ? "Entregue" : "A pagar"}</div>
                <div className="valor text-lg" style={{ color: "var(--primary-color)" }}>
                  {moeda(v.aPagar)}
                </div>
              </div>
            </div>

            {recebeDiaria(l) && !l.pago && (
              <label className="flex align-items-center gap-2 mt-3">
                <Checkbox
                  checked={l.trabalhou}
                  onChange={(e) => setTrabalhou((t) => ({ ...t, [l.funcionarioId]: !!e.checked }))}
                />
                Trabalhou neste dia (soma a diária)
              </label>
            )}

            <div className="item-acoes">
              {l.pago ? (
                <Button
                  label="Estornar pagamento"
                  icon="pi pi-undo"
                  className="p-button-outlined p-button-danger"
                  onClick={() => estornar(l.pagamentoId!, l.funcionario)}
                />
              ) : (
                <Button
                  label={v.aPagar > 0 ? `Pagar ${moeda(v.aPagar)}` : "Quitar com os vales"}
                  icon="pi pi-wallet"
                  className="p-button-success"
                  disabled={v.total <= 0}
                  onClick={() => pagar(l)}
                />
              )}
            </div>
          </div>
        );
      })}

      {totais.pendente > 0 && (
        <Button label="Pagar todos os pendentes" icon="pi pi-check-square" className="p-button-success p-button-outlined w-full mt-1" onClick={pagarTodos} />
      )}
    </>
  );

  const historicoMobile = (
    <>
      <Calendar
        value={periodo}
        onChange={(e) => setPeriodo((e.value as (Date | null)[]) ?? [null, null])}
        selectionMode="range"
        readOnlyInput
        touchUI
        dateFormat="dd/mm/yy"
        showIcon
        maxDate={hoje()}
        className="w-full mb-2"
      />
      <Dropdown
        value={filtroFuncionario}
        onChange={(e) => setFiltroFuncionario(e.value ?? null)}
        options={funcionarios}
        optionLabel="nome"
        optionValue="id"
        placeholder="Todos os funcionários"
        showClear
        className="w-full mb-3"
      />

      <div className="item-lista flex justify-content-between align-items-center">
        <span>Total pago no período</span>
        <span className="font-bold text-lg">{moeda(totalHistorico)}</span>
      </div>

      {historico.length === 0 && <div className="item-lista text-center texto-pequeno py-4">Nenhum pagamento no período.</div>}

      {historico.map((p) => (
        <div key={p.id} className="item-lista">
          <div className="flex justify-content-between align-items-start">
            <div>
              <div className="item-titulo">{p.funcionario}</div>
              <div className="texto-pequeno mt-1">
                Dia {data(p.data)} · pago em {data(p.dataPagamento)} {hora(p.dataPagamento)}
              </div>
            </div>
            <div className="font-bold text-lg">{moeda(p.valorTotal)}</div>
          </div>
          <div className="flex justify-content-between align-items-center mt-2">
            <span className="texto-pequeno">
              {p.quantidadeAtendimentos} atend. · diária {moeda(p.valorDiaria)} · comissão {moeda(p.valorComissao)}
              {p.valorVales > 0 && ` · vales ${moeda(p.valorVales)} · entregue ${moeda(p.valorPago)}`}
            </span>
            <Button icon="pi pi-undo" className="p-button-text p-button-danger p-button-sm" aria-label="Estornar" onClick={() => estornar(p.id, p.funcionario)} />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <TabView>
        <TabPanel header={mobile ? "Do dia" : "Pagamento do dia"} leftIcon="pi pi-wallet mr-2">
          {mobile ? pagamentoDiaMobile : (
          <div>
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div>
                <div className="text-xl font-bold">
                  {dataExtenso(dia)}
                </div>
                <div className="texto-pequeno mt-1">
                  Comissão calculada sobre os atendimentos <b>concluídos</b> no dia.
                </div>
              </div>
              <div className="flex gap-2 align-items-center">
                <Button icon="pi pi-chevron-left" className="p-button-outlined p-button-sm" onClick={() => setDia(somarDias(dia, -1))} />
                <Calendar
                  value={dia}
                  onChange={(e) => e.value && setDia(e.value as Date)}
                  maxDate={hoje()}
                  dateFormat="dd/mm/yy"
                  showIcon
                  inputStyle={{ width: "7.5rem" }}
                />
                <Button
                  icon="pi pi-chevron-right"
                  className="p-button-outlined p-button-sm"
                  disabled={somarDias(dia, 1) > hoje()}
                  onClick={() => setDia(somarDias(dia, 1))}
                />
                <Button label="Pagar todos" icon="pi pi-check-square" className="p-button-success" onClick={pagarTodos} />
              </div>
            </div>

            <DataTable
              value={linhas}
              loading={carregando}
              dataKey="funcionarioId"
              className="p-datatable-sm"
              emptyMessage="Nenhum funcionário ativo cadastrado."
            >
              <Column header="Funcionário" body={funcionarioTemplate} />
              <Column header="Atendimentos" body={atendimentosTemplate} />
              <Column header="Trabalhou" body={trabalhouTemplate} style={{ width: "6rem" }} />
              <Column header="Diária" style={{ width: "10rem" }} body={(l: Linha) => moeda(valores(l).diaria)} />
              <Column header="Comissão" style={{ width: "10rem" }} body={(l: Linha) => moeda(valores(l).comissao)} />
              <Column header="Ganho" style={{ width: "10rem" }} body={(l: Linha) => moeda(valores(l).total)} />
              <Column header="Vales" style={{ width: "8rem" }} body={(l: Linha) => valesTexto(valores(l).vales)} />
              <Column header="A pagar" style={{ width: "8rem" }} body={(l: Linha) => <span className="font-bold">{moeda(valores(l).aPagar)}</span>} />
              <Column header="Situação" body={situacaoTemplate} />
              <Column body={acoesTemplate} style={{ width: "8rem" }} />
            </DataTable>

            <div className="mt-4 p-3 border-top-1 surface-border">
              <div className="grid text-center">
                <div className="col">
                  <strong>Faturado no dia</strong>
                  <div className="font-bold text-xl mt-1">{moeda(totais.faturado)}</div>
                </div>
                <div className="col">
                  <strong>Já pago</strong>
                  <div className="text-green-500 font-bold text-xl mt-1">{moeda(totais.pago)}</div>
                </div>
                <div className="col">
                  <strong>A pagar</strong>
                  <div className="text-orange-500 font-bold text-xl mt-1">{moeda(totais.pendente)}</div>
                </div>
              </div>
            </div>
          </div>
          )}
        </TabPanel>

        <TabPanel header={mobile ? "Histórico" : "Histórico de pagamentos"} leftIcon="pi pi-history mr-2">
          {mobile ? historicoMobile : (
          <div>
            <div className="flex flex-wrap gap-2 align-items-center mb-3">
              <Calendar
                value={periodo}
                onChange={(e) => setPeriodo((e.value as (Date | null)[]) ?? [null, null])}
                selectionMode="range"
                readOnlyInput
                dateFormat="dd/mm/yy"
                showIcon
                maxDate={hoje()}
                inputStyle={{ width: "14rem" }}
              />
              <Dropdown
                value={filtroFuncionario}
                onChange={(e) => setFiltroFuncionario(e.value ?? null)}
                options={funcionarios}
                optionLabel="nome"
                optionValue="id"
                placeholder="Todos os funcionários"
                showClear
                style={{ minWidth: "14rem" }}
              />
            </div>

            <DataTable value={historico} paginator rows={10} className="p-datatable-sm" emptyMessage="Nenhum pagamento no período.">
              <Column header="Dia" body={(p: IPagamentoDiario) => data(p.data)} />
              <Column field="funcionario" header="Funcionário" />
              <Column header="Atendimentos" body={(p: IPagamentoDiario) => `${p.quantidadeAtendimentos} · ${moeda(p.totalAtendimentos)}`} />
              <Column header="Diária" body={(p: IPagamentoDiario) => moeda(p.valorDiaria)} />
              <Column header="Comissão" body={(p: IPagamentoDiario) => moeda(p.valorComissao)} />
              <Column header="Ganho" body={(p: IPagamentoDiario) => <span className="font-bold">{moeda(p.valorTotal)}</span>} />
              <Column header="Vales" body={(p: IPagamentoDiario) => valesTexto(p.valorVales)} />
              <Column header="Entregue" body={(p: IPagamentoDiario) => moeda(p.valorPago)} />
              <Column header="Pago em" body={(p: IPagamentoDiario) => `${data(p.dataPagamento)} ${hora(p.dataPagamento)}`} />
              <Column
                body={(p: IPagamentoDiario) => (
                  <Button icon="pi pi-undo" className="p-button-danger p-button-text p-button-sm" tooltip="Estornar" onClick={() => estornar(p.id, p.funcionario)} />
                )}
                style={{ width: "4rem" }}
              />
            </DataTable>

            <div className="flex justify-content-end mt-3 text-lg">
              Total pago no período:&nbsp;<b>{moeda(totalHistorico)}</b>
            </div>
          </div>
          )}
        </TabPanel>
        <TabPanel header="Vales" leftIcon="pi pi-money-bill mr-2">
          <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <div className="texto-pequeno">Em aberto (ainda não descontado)</div>
              <div className="text-xl font-bold text-orange-600">{moeda(totalValesAbertos)}</div>
            </div>
            <Button label="Novo vale" icon="pi pi-plus" className={mobile ? "w-full" : ""} onClick={abrirNovoVale} />
          </div>
          {vales.length === 0 && <div className="item-lista text-center texto-pequeno py-4">Nenhum vale registrado nos últimos 30 dias.</div>}
          {vales.map((v) => (
            <div key={v.id} className={`item-lista ${v.descontado ? "opacity-70" : ""}`}>
              <div className="flex justify-content-between align-items-start gap-2">
                <div style={{ minWidth: 0 }}>
                  <div className="item-titulo">{v.funcionario}</div>
                  <div className="texto-pequeno mt-1">
                    {data(v.data)}
                    {v.observacao && ` · ${v.observacao}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{moeda(v.valor)}</div>
                  {v.descontado ? (
                    <Tag value={`Descontado em ${data(v.descontadoNoDia!)}`} severity="success" rounded />
                  ) : (
                    <Tag value="Em aberto" severity="warning" rounded />
                  )}
                </div>
              </div>
              {!v.descontado && (
                <div className="flex justify-content-end">
                  <Button label="Excluir" icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => excluirVale(v)} />
                </div>
              )}
            </div>
          ))}
        </TabPanel>
      </TabView>

      <Dialog
        header="Novo vale"
        visible={novoVale}
        onHide={() => setNovoVale(false)}
        style={{ width: "26rem" }}
        breakpoints={{ "640px": "95vw" }}
        position={mobile ? "bottom" : "center"}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Voltar" className={`p-button-text ${mobile ? "flex-1" : ""}`} onClick={() => setNovoVale(false)} />
            <Button label="Registrar" icon="pi pi-check" className={`p-button-success ${mobile ? "flex-1" : ""}`} onClick={salvarVale} />
          </div>
        }
      >
        <div className="field mb-3">
          <label className="block mb-2">Funcionário</label>
          <Dropdown
            value={valeFuncionario}
            onChange={(e) => setValeFuncionario(e.value)}
            options={funcionarios.filter((f) => f.ativo)}
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione"
            className="w-full"
          />
        </div>
        <div className="grid">
          <div className="col-6 pb-0">
            <label className="block mb-2">Data</label>
            <Calendar value={valeData} onChange={(e) => e.value && setValeData(e.value as Date)} maxDate={hoje()} dateFormat="dd/mm/yy" readOnlyInput touchUI={mobile} className="w-full" />
          </div>
          <div className="col-6 pb-0">
            <label className="block mb-2">Valor</label>
            <InputNumber value={valeValor} onValueChange={(e) => setValeValor(e.value ?? null)} mode="currency" currency="BRL" locale="pt-BR" className="w-full" inputClassName="w-full" />
          </div>
        </div>
        <div className="field mt-3 mb-0">
          <label className="block mb-2">Observação</label>
          <InputText value={valeObservacao} onChange={(e) => setValeObservacao(e.target.value)} className="w-full" placeholder="Opcional" maxLength={200} />
        </div>
      </Dialog>
    </>
  );
}
