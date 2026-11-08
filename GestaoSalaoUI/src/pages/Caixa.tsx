import { useCallback, useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { SelectButton } from "primereact/selectbutton";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import useIsMobile from "../hooks/useIsMobile";
import { ICaixa, IDespesa, IMovimentoCaixa } from "../interfaces/ICaixa";
import { CATEGORIAS_DESPESA, FORMA_PAGAMENTO } from "../utilities/constants";
import { daApi, dataExtenso, hoje, mensagemErro, moeda, paraApiData, somarDias } from "../utilities/formatters";

type Modo = "dia" | "mes";

const ICONES: Record<IMovimentoCaixa["tipo"], string> = {
  Entrada: "pi pi-arrow-down-left",
  Despesa: "pi pi-shopping-bag",
  Vale: "pi pi-money-bill",
  Pagamento: "pi pi-wallet",
};

const periodo = (modo: Modo, dia: Date) =>
  modo === "dia"
    ? { inicio: dia, fim: dia }
    : { inicio: new Date(dia.getFullYear(), dia.getMonth(), 1), fim: new Date(dia.getFullYear(), dia.getMonth() + 1, 0) };

const nomeMes = (d: Date) => {
  const texto = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// Despesas e vales têm só a data; atendimentos e pagamentos têm a hora
const quando = (m: IMovimentoCaixa, modo: Modo) => {
  const d = daApi(m.data);
  const temHora = m.tipo === "Entrada" || m.tipo === "Pagamento";
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  if (modo === "dia") return temHora ? hora : "";
  return temHora ? `${data} ${hora}` : data;
};

export default function Caixa() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();

  const [modo, setModo] = useState<Modo>("dia");
  const [dia, setDia] = useState<Date>(hoje());
  const [caixa, setCaixa] = useState<ICaixa | null>(null);

  const [editando, setEditando] = useState<number | null>(null);
  const [dialogo, setDialogo] = useState(false);
  const [dataDespesa, setDataDespesa] = useState<Date>(hoje());
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<number | null>(null);
  const [valor, setValor] = useState<number | null>(null);
  const [forma, setForma] = useState<number | null>(null);

  const sucesso = (detail: string) => toast.current?.show({ severity: "success", summary: "Sucesso", detail, life: 3000 });
  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const load = useCallback(async () => {
    const { inicio, fim } = periodo(modo, dia);
    try {
      const r = await api.get("/caixa", { params: { inicio: paraApiData(inicio), fim: paraApiData(fim) } });
      setCaixa(r.data);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar o caixa."));
    }
  }, [modo, dia]);

  useEffect(() => {
    load();
  }, [load]);

  const mover = (passo: number) =>
    setDia(modo === "dia" ? somarDias(dia, passo) : new Date(dia.getFullYear(), dia.getMonth() + passo, 1));

  const noFuturo = modo === "dia" ? somarDias(dia, 1) > hoje() : new Date(dia.getFullYear(), dia.getMonth() + 1, 1) > hoje();

  const abrirDespesa = async (id?: number | null) => {
    setEditando(id ?? null);
    if (id) {
      try {
        const r = await api.get<IDespesa>(`/despesas/${id}`);
        setDataDespesa(daApi(r.data.data));
        setDescricao(r.data.descricao);
        setCategoria(r.data.categoria);
        setValor(r.data.valor);
        setForma(r.data.formaPagamento ?? null);
      } catch (err: any) {
        return erro(mensagemErro(err, "Erro ao carregar a despesa."));
      }
    } else {
      setDataDespesa(modo === "dia" && dia <= hoje() ? dia : hoje());
      setDescricao("");
      setCategoria(null);
      setValor(null);
      setForma(null);
    }
    setDialogo(true);
  };

  const salvarDespesa = async () => {
    if (!descricao.trim()) return erro("Informe a descrição.");
    if (!categoria) return erro("Escolha a categoria.");
    if (!valor || valor <= 0) return erro("Informe o valor.");
    const corpo = { data: paraApiData(dataDespesa), descricao, categoria, valor, formaPagamento: forma };
    try {
      if (editando) await api.put(`/despesas/${editando}`, corpo);
      else await api.post("/despesas", corpo);
      setDialogo(false);
      sucesso(editando ? "Despesa atualizada." : "Despesa registrada.");
      load();
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao salvar a despesa."));
    }
  };

  const excluirDespesa = (m: IMovimentoCaixa) =>
    confirmDialog({
      header: "Excluir despesa",
      icon: "pi pi-exclamation-triangle",
      message: `Excluir a despesa "${m.descricao}" de ${moeda(m.valor)}?`,
      acceptLabel: "Excluir",
      rejectLabel: "Voltar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/despesas/${m.despesaId}`);
          sucesso("Despesa excluída.");
          load();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao excluir a despesa."));
        }
      },
    });

  const titulo = modo === "dia" ? dataExtenso(dia) : nomeMes(dia);

  const resumo = (rotulo: string, valorResumo: number, cor: string, icone: string) => (
    <div className={mobile ? "col-4 px-1" : "col-12 md:col-4"}>
      <div className={`cartao-resumo ${mobile ? "compacto" : ""}`}>
        {!mobile && (
          <span className="resumo-icone" style={{ background: cor }}>
            <i className={icone} />
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="texto-pequeno">{rotulo}</div>
          <div className={mobile ? "font-bold" : "text-2xl font-bold"} style={{ color: cor }}>
            {moeda(valorResumo)}
          </div>
        </div>
      </div>
    </div>
  );

  const linhaTotal = (rotulo: string, total: number, detalhe?: string, recuo = false) => (
    <div className={`linha-valor ${recuo ? "pl-3" : ""}`}>
      <span className={recuo ? "texto-pequeno" : ""}>
        {rotulo}
        {detalhe && <span className="texto-pequeno"> · {detalhe}</span>}
      </span>
      <span className={recuo ? "texto-pequeno" : "font-semibold"}>{moeda(total)}</span>
    </div>
  );

  const extrato = (
    <Card title="Extrato" className="mt-3">
      {caixa?.movimentos.length === 0 && <div className="texto-pequeno py-2">Nenhuma movimentação neste período.</div>}
      {caixa?.movimentos.map((m, i) => (
        <div key={i} className="linha-movimento">
          <span className={`movimento-icone ${m.entrada ? "entrada" : "saida"}`}>
            <i className={ICONES[m.tipo]} />
          </span>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div className="font-medium">{m.descricao}</div>
            <div className="texto-pequeno">
              {[quando(m, modo), m.tipo, m.detalhe, m.formaPagamento].filter(Boolean).join(" · ")}
            </div>
          </div>
          <span className={`font-bold white-space-nowrap ${m.entrada ? "text-green-600" : "text-red-500"}`}>
            {m.entrada ? "+" : "−"} {moeda(m.valor)}
          </span>
          {m.despesaId && (
            <span className="flex">
              <Button icon="pi pi-pencil" className="p-button-text p-button-sm" aria-label="Editar despesa" onClick={() => abrirDespesa(m.despesaId)} />
              <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" aria-label="Excluir despesa" onClick={() => excluirDespesa(m)} />
            </span>
          )}
        </div>
      ))}
    </Card>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="titulo-pagina">Caixa</div>
          <div className="texto-pequeno">{titulo}</div>
        </div>
        <div className={`flex flex-wrap align-items-center gap-2 ${mobile ? "w-full" : ""}`}>
          <SelectButton
            value={modo}
            onChange={(e) => e.value && setModo(e.value)}
            options={[
              { label: "Dia", value: "dia" },
              { label: "Mês", value: "mes" },
            ]}
            className={mobile ? "w-full flex selecao-dias" : ""}
          />
          <div className="navegador-data" style={{ minWidth: mobile ? "100%" : "17rem" }}>
            <Button icon="pi pi-chevron-left" className="p-button-outlined" aria-label="Anterior" onClick={() => mover(-1)} />
            <Calendar
              value={dia}
              onChange={(e) => e.value && setDia(e.value as Date)}
              view={modo === "mes" ? "month" : "date"}
              dateFormat={modo === "mes" ? "mm/yy" : "dd/mm/yy"}
              maxDate={hoje()}
              readOnlyInput
              touchUI={mobile}
            />
            <Button icon="pi pi-chevron-right" className="p-button-outlined" aria-label="Próximo" disabled={noFuturo} onClick={() => mover(1)} />
          </div>
          <Button label="Nova despesa" icon="pi pi-plus" className={`p-button-danger ${mobile ? "w-full" : ""}`} onClick={() => abrirDespesa()} />
        </div>
      </div>

      <div className="grid">
        {resumo("Entradas", caixa?.entradas ?? 0, "var(--green-500)", "pi pi-arrow-down-left")}
        {resumo("Saídas", caixa?.saidas ?? 0, "var(--red-500)", "pi pi-arrow-up-right")}
        {resumo("Saldo", caixa?.saldo ?? 0, (caixa?.saldo ?? 0) < 0 ? "var(--red-500)" : "var(--primary-color)", "pi pi-wallet")}
      </div>

      <div className="grid">
        <div className="col-12 md:col-6">
          <Card title="Entradas" className="h-full">
            {caixa?.entradasPorForma.length === 0 && <div className="texto-pequeno">Nenhum atendimento recebido.</div>}
            {caixa?.entradasPorForma.map((f) => linhaTotal(f.descricao || "Sem forma informada", f.total, `${f.quantidade} atend.`))}
          </Card>
        </div>
        <div className="col-12 md:col-6">
          <Card title="Saídas" className="h-full">
            {linhaTotal("Despesas", caixa?.despesas ?? 0)}
            {caixa?.despesasPorCategoria.map((c) => linhaTotal(c.descricao, c.total, undefined, true))}
            {linhaTotal("Vales a funcionários", caixa?.vales ?? 0)}
            {linhaTotal("Pagamentos a funcionários", caixa?.pagamentos ?? 0)}
          </Card>
        </div>
      </div>

      {extrato}

      <Dialog
        header={editando ? "Editar despesa" : "Nova despesa"}
        visible={dialogo}
        onHide={() => setDialogo(false)}
        style={{ width: "28rem" }}
        breakpoints={{ "640px": "95vw" }}
        position={mobile ? "bottom" : "center"}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Voltar" className={`p-button-text ${mobile ? "flex-1" : ""}`} onClick={() => setDialogo(false)} />
            <Button label="Salvar" icon="pi pi-check" className={`p-button-success ${mobile ? "flex-1" : ""}`} onClick={salvarDespesa} />
          </div>
        }
      >
        <div className="field mb-3">
          <label className="block mb-2">Descrição</label>
          <InputText value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full" placeholder="Ex.: shampoo, conta de luz" maxLength={200} />
        </div>
        <div className="field mb-3">
          <label className="block mb-2">Categoria</label>
          <Dropdown value={categoria} onChange={(e) => setCategoria(e.value)} options={CATEGORIAS_DESPESA} optionLabel="descricao" optionValue="value" placeholder="Selecione" className="w-full" />
        </div>
        <div className="grid">
          <div className="col-6 pb-0">
            <label className="block mb-2">Data</label>
            <Calendar value={dataDespesa} onChange={(e) => e.value && setDataDespesa(e.value as Date)} maxDate={hoje()} dateFormat="dd/mm/yy" readOnlyInput touchUI={mobile} className="w-full" />
          </div>
          <div className="col-6 pb-0">
            <label className="block mb-2">Valor</label>
            <InputNumber value={valor} onValueChange={(e) => setValor(e.value ?? null)} mode="currency" currency="BRL" locale="pt-BR" className="w-full" inputClassName="w-full" />
          </div>
        </div>
        <div className="field mt-3 mb-0">
          <label className="block mb-2">Pago com</label>
          <Dropdown value={forma} onChange={(e) => setForma(e.value ?? null)} options={FORMA_PAGAMENTO} optionLabel="descricao" optionValue="value" placeholder="Opcional" showClear className="w-full" />
        </div>
      </Dialog>
    </>
  );
}
