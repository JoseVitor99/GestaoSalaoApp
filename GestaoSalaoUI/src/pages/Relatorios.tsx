import { useCallback, useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";

import { api } from "../services/api";
import useIsMobile from "../hooks/useIsMobile";
import { IClienteRelatorio, IRelatorio } from "../interfaces/IRelatorio";
import { NOME_CLIENTE } from "../utilities/constants";
import { daApi, data, formatarTelefone, hoje, linkWhatsApp, mensagemErro, moeda, paraApiData, somarDias } from "../utilities/formatters";

type Preset = "mes" | "mesPassado" | "30dias" | "ano" | "outro";

const PRESETS = [
  { label: "Este mês", value: "mes" },
  { label: "Mês passado", value: "mesPassado" },
  { label: "Últimos 30 dias", value: "30dias" },
  { label: "Este ano", value: "ano" },
  { label: "Escolher datas", value: "outro" },
];

const DIAS_SUMIDA = [30, 60, 90].map((d) => ({ label: `${d} dias`, value: d }));

const intervalo = (preset: Preset, outro: (Date | null)[]): [Date, Date] | null => {
  const h = hoje();
  switch (preset) {
    case "mes":
      return [new Date(h.getFullYear(), h.getMonth(), 1), h];
    case "mesPassado":
      return [new Date(h.getFullYear(), h.getMonth() - 1, 1), new Date(h.getFullYear(), h.getMonth(), 0)];
    case "30dias":
      return [somarDias(h, -29), h];
    case "ano":
      return [new Date(h.getFullYear(), 0, 1), h];
    default:
      return outro[0] ? [outro[0], outro[1] ?? outro[0]] : null;
  }
};

const primeiroNome = (nome: string) => nome.split(" ")[0];

// Períodos longos viram barras por mês para o gráfico continuar legível
const barras = (porDia: IRelatorio["porDia"]) => {
  if (porDia.length <= 62)
    return porDia.map((d) => ({ rotulo: daApi(d.data).getDate().toString(), titulo: data(d.data), total: d.total, quantidade: d.quantidade }));
  const meses = new Map<string, { rotulo: string; titulo: string; total: number; quantidade: number }>();
  porDia.forEach((d) => {
    const dia = daApi(d.data);
    const chave = `${dia.getFullYear()}-${dia.getMonth()}`;
    const mes = dia.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const atual = meses.get(chave) ?? { rotulo: mes, titulo: dia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), total: 0, quantidade: 0 };
    atual.total += d.total;
    atual.quantidade += d.quantidade;
    meses.set(chave, atual);
  });
  return Array.from(meses.values());
};

export default function Relatorios() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();

  const [preset, setPreset] = useState<Preset>("mes");
  const [outro, setOutro] = useState<(Date | null)[]>([somarDias(hoje(), -6), hoje()]);
  const [relatorio, setRelatorio] = useState<IRelatorio | null>(null);
  const [diasSumida, setDiasSumida] = useState(60);
  const [sumidas, setSumidas] = useState<IClienteRelatorio[]>([]);
  const [aniversariantes, setAniversariantes] = useState<IClienteRelatorio[]>([]);

  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const periodo = intervalo(preset, outro);
  const inicio = periodo ? paraApiData(periodo[0]) : null;
  const fim = periodo ? paraApiData(periodo[1]) : null;

  const load = useCallback(async () => {
    if (!inicio || !fim) return;
    try {
      const r = await api.get("/relatorios", { params: { inicio, fim } });
      setRelatorio(r.data);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar o relatório."));
    }
  }, [inicio, fim]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get("/relatorios/clientes-sumidos", { params: { dias: diasSumida } }).then((r) => setSumidas(r.data || [])).catch(() => setSumidas([]));
  }, [diasSumida]);

  useEffect(() => {
    api.get("/relatorios/aniversariantes").then((r) => setAniversariantes(r.data || [])).catch(() => setAniversariantes([]));
  }, []);

  const indicador = (rotulo: string, valor: string, icone: string, detalhe?: string) => (
    <div className="col-6 lg:col-3">
      <div className="cartao-resumo h-full">
        {!mobile && (
          <span className="resumo-icone" style={{ background: "var(--primary-color)" }}>
            <i className={icone} />
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="texto-pequeno">{rotulo}</div>
          <div className={mobile ? "text-lg font-bold" : "text-2xl font-bold"}>{valor}</div>
          {detalhe && <div className="texto-pequeno">{detalhe}</div>}
        </div>
      </div>
    </div>
  );

  const whatsapp = (c: IClienteRelatorio, mensagem: string) => (
    <Button
      icon="pi pi-whatsapp"
      className="p-button-text p-button-success p-button-sm"
      aria-label={`WhatsApp de ${c.nome}`}
      onClick={() => window.open(linkWhatsApp(c.telefone, mensagem), "_blank")}
    />
  );

  const grafico = relatorio && (() => {
    const lista = barras(relatorio.porDia);
    const maior = Math.max(...lista.map((b) => b.total), 1);
    const passo = Math.ceil(lista.length / (mobile ? 8 : 16));
    return (
      <div className="grafico-barras">
        {lista.map((b, i) => (
          <div key={i} className="coluna-grafico" title={`${b.titulo}: ${moeda(b.total)} (${b.quantidade} atend.)`}>
            <div className="barra" style={{ height: `${(b.total / maior) * 100}%` }} />
            <span className="rotulo-barra">{i % passo === 0 ? b.rotulo : ""}</span>
          </div>
        ))}
      </div>
    );
  })();

  const barraHorizontal = (rotulo: string, detalhe: string, total: number, maior: number) => (
    <div key={rotulo} className="mb-3">
      <div className="flex justify-content-between gap-2">
        <span className="font-medium">{rotulo}</span>
        <span className="font-semibold">{moeda(total)}</span>
      </div>
      <div className="trilho-barra">
        <div className="barra" style={{ width: `${(total / Math.max(maior, 1)) * 100}%` }} />
      </div>
      <div className="texto-pequeno">{detalhe}</div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

      <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="titulo-pagina">Relatórios</div>
          {relatorio && (
            <div className="texto-pequeno">
              {data(relatorio.inicio)} a {data(relatorio.fim)}
            </div>
          )}
        </div>
        <div className={`flex flex-wrap gap-2 ${mobile ? "w-full" : ""}`}>
          <Dropdown value={preset} onChange={(e) => setPreset(e.value)} options={PRESETS} className={mobile ? "w-full" : ""} style={{ minWidth: "12rem" }} />
          {preset === "outro" && (
            <Calendar
              value={outro}
              onChange={(e) => setOutro((e.value as (Date | null)[]) ?? [null, null])}
              selectionMode="range"
              readOnlyInput
              dateFormat="dd/mm/yy"
              maxDate={hoje()}
              showIcon
              touchUI={mobile}
              className={mobile ? "w-full" : ""}
              inputStyle={{ width: mobile ? "100%" : "14rem" }}
            />
          )}
        </div>
      </div>

      {relatorio && (
        <>
          <div className="grid">
            {indicador("Faturamento", moeda(relatorio.faturamento), "pi pi-dollar")}
            {indicador("Atendimentos", String(relatorio.atendimentos), "pi pi-check-circle", `${relatorio.marcados} marcados`)}
            {indicador("Ticket médio", moeda(relatorio.ticketMedio), "pi pi-chart-line")}
            {indicador("Clientes atendidas", String(relatorio.clientesAtendidas), "pi pi-users", `${relatorio.faltas} falta(s) · ${relatorio.cancelados} cancel.`)}
          </div>

          <Card title={relatorio.porDia.length > 62 ? "Faturamento por mês" : "Faturamento por dia"} className="mb-3">
            {relatorio.faturamento === 0 ? <div className="texto-pequeno">Nenhum atendimento concluído no período.</div> : grafico}
          </Card>

          <div className="grid">
            <div className="col-12 lg:col-6">
              <Card title="Serviços mais vendidos" className="h-full">
                {relatorio.servicos.length === 0 && <div className="texto-pequeno">Nenhum serviço no período.</div>}
                {relatorio.servicos.map((s) =>
                  barraHorizontal(s.descricao, `${s.quantidade} atendimento(s)`, s.total, relatorio.servicos[0]?.total ?? 1)
                )}
              </Card>
            </div>
            <div className="col-12 lg:col-6">
              <Card title="Produção por profissional" className="h-full">
                {relatorio.profissionais.length === 0 && <div className="texto-pequeno">Nenhum atendimento no período.</div>}
                {relatorio.profissionais.map((p) =>
                  barraHorizontal(
                    p.funcionario,
                    `${p.atendimentos} atendimento(s) · recebeu ${moeda(p.recebido)} nos dias pagos`,
                    p.produzido,
                    relatorio.profissionais[0]?.produzido ?? 1
                  )
                )}
              </Card>
            </div>
          </div>

          <div className="grid">
            <div className="col-12 lg:col-4">
              <Card title="Melhores clientes" className="h-full">
                {relatorio.melhoresClientes.length === 0 && <div className="texto-pequeno">Nenhum atendimento no período.</div>}
                {relatorio.melhoresClientes.map((c, i) => (
                  <div key={c.clienteId} className="linha-valor gap-2">
                    <div style={{ minWidth: 0 }}>
                      <div className="font-medium">
                        {i + 1}. {c.nome}
                      </div>
                      <div className="texto-pequeno">{c.quantidade} atendimento(s)</div>
                    </div>
                    <span className="font-semibold">{moeda(c.total)}</span>
                  </div>
                ))}
              </Card>
            </div>

            <div className="col-12 lg:col-4">
              <Card className="h-full">
                <div className="flex align-items-center justify-content-between gap-2 mb-3">
                  <span className="text-xl font-bold">Não voltam há</span>
                  <Dropdown value={diasSumida} onChange={(e) => setDiasSumida(e.value)} options={DIAS_SUMIDA} />
                </div>
                {sumidas.length === 0 && <div className="texto-pequeno">Nenhuma cliente sumida. Ótimo sinal!</div>}
                {sumidas.map((c) => (
                  <div key={c.clienteId} className="linha-valor gap-2">
                    <div style={{ minWidth: 0 }}>
                      <div className="font-medium">{c.nome}</div>
                      <div className="texto-pequeno">
                        Última visita {c.ultimaVisita && data(c.ultimaVisita)} · há {c.diasSemVir} dias
                      </div>
                    </div>
                    {whatsapp(
                      c,
                      `Olá, ${primeiroNome(c.nome)}! Sentimos sua falta aqui na ${NOME_CLIENTE}. Que tal marcar um horário? É só responder esta mensagem.`
                    )}
                  </div>
                ))}
              </Card>
            </div>

            <div className="col-12 lg:col-4">
              <Card title="Aniversariantes do mês" className="h-full">
                {aniversariantes.length === 0 && <div className="texto-pequeno">Nenhuma aniversariante cadastrada neste mês.</div>}
                {aniversariantes.map((c) => (
                  <div key={c.clienteId} className="linha-valor gap-2">
                    <div style={{ minWidth: 0 }}>
                      <div className="font-medium">{c.nome}</div>
                      <div className="texto-pequeno">
                        Dia {c.dataNascimento && daApi(c.dataNascimento).getDate()} · {formatarTelefone(c.telefone)}
                      </div>
                    </div>
                    {whatsapp(c, `Olá, ${primeiroNome(c.nome)}! A ${NOME_CLIENTE} deseja um feliz aniversário! Venha comemorar com a gente.`)}
                  </div>
                ))}
              </Card>
            </div>
          </div>

          {relatorio.clientesComFaltas.length > 0 && (
            <Card title="Clientes que mais faltaram" className="mt-3">
              {relatorio.clientesComFaltas.map((c) => (
                <div key={c.clienteId} className="linha-valor">
                  <span>{c.nome}</span>
                  <span className="font-semibold text-orange-600">{c.quantidade} falta(s)</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </>
  );
}
