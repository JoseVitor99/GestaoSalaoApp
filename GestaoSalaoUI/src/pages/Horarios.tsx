import { useCallback, useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import BloqueioDialog from "../components/BloqueioDialog";
import IFuncionario from "../interfaces/IFuncionario";
import { IBloqueio, IHorarioFuncionamento } from "../interfaces/IAgenda";
import { DIAS_SEMANA } from "../utilities/constants";
import { hoje, mensagemErro, paraApiData, somarDias } from "../utilities/formatters";
import { periodoBloqueio } from "../utilities/bloqueios";

export default function Horarios() {
  const toast = useRef<Toast>(null);

  const [horarios, setHorarios] = useState<IHorarioFuncionamento[]>([]);
  const [bloqueios, setBloqueios] = useState<IBloqueio[]>([]);
  const [funcionarios, setFuncionarios] = useState<IFuncionario[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [bloqueando, setBloqueando] = useState(false);

  const mostrar = (severity: "success" | "warn" | "error", detail: string) =>
    toast.current?.show({ severity, summary: severity === "error" ? "Erro" : severity === "warn" ? "Atenção" : "Sucesso", detail, life: severity === "success" ? 3000 : 6000 });

  const loadBloqueios = useCallback(async () => {
    try {
      const r = await api.get("/bloqueios", { params: { inicio: paraApiData(hoje()), fim: paraApiData(somarDias(hoje(), 365)) } });
      setBloqueios(r.data || []);
    } catch (err: any) {
      mostrar("error", mensagemErro(err, "Erro ao carregar os bloqueios."));
    }
  }, []);

  useEffect(() => {
    Promise.all([api.get("/horarios"), api.get("/funcionarios", { params: { somenteAtivos: true } })])
      .then(([h, f]) => {
        setHorarios(h.data || []);
        setFuncionarios(f.data || []);
      })
      .catch((err) => mostrar("error", mensagemErro(err, "Erro ao carregar os horários.")));
    loadBloqueios();
  }, [loadBloqueios]);

  const alterar = (diaSemana: number, mudanca: Partial<IHorarioFuncionamento>) =>
    setHorarios((lista) => lista.map((h) => (h.diaSemana === diaSemana ? { ...h, ...mudanca } : h)));

  const salvar = async () => {
    try {
      setSalvando(true);
      const r = await api.put("/horarios", horarios);
      setHorarios(r.data || []);
      mostrar("success", "Horário de funcionamento salvo.");
    } catch (err: any) {
      mostrar("error", mensagemErro(err, "Erro ao salvar os horários."));
    } finally {
      setSalvando(false);
    }
  };

  const remover = (b: IBloqueio) =>
    confirmDialog({
      message: `Remover o bloqueio de ${b.funcionario} (${periodoBloqueio(b)})?`,
      header: "Remover bloqueio",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Remover",
      rejectLabel: "Voltar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/bloqueios/${b.id}`);
          mostrar("success", "Bloqueio removido.");
          loadBloqueios();
        } catch (err: any) {
          mostrar("error", mensagemErro(err, "Erro ao remover o bloqueio."));
        }
      },
    });

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="grid">
        <div className="col-12 lg:col-6">
          <Card title="Horário de funcionamento">
            {DIAS_SEMANA.map((d) => {
              const h = horarios.find((x) => x.diaSemana === d.value);
              if (!h) return null;
              return (
                <div key={d.value} className="linha-horario">
                  <span className="font-medium nome-dia">{d.descricao}</span>
                  <InputSwitch checked={h.aberto} onChange={(e) => alterar(d.value, { aberto: !!e.value })} />
                  {h.aberto ? (
                    <span className="flex align-items-center gap-2 flex-1 justify-content-end">
                      <input type="time" className="p-inputtext p-component" value={h.abertura} onChange={(e) => alterar(d.value, { abertura: e.target.value })} />
                      <span className="texto-pequeno">às</span>
                      <input type="time" className="p-inputtext p-component" value={h.fechamento} onChange={(e) => alterar(d.value, { fechamento: e.target.value })} />
                    </span>
                  ) : (
                    <span className="texto-pequeno flex-1 text-right">Fechado</span>
                  )}
                </div>
              );
            })}
            <div className="flex justify-content-end mt-3">
              <Button label="Salvar horários" icon="pi pi-check" className="p-button-success" loading={salvando} onClick={salvar} />
            </div>
          </Card>
        </div>

        <div className="col-12 lg:col-6">
          <Card title="Bloqueios e folgas programadas">
            <div className="texto-pequeno mb-3">
              Feriados, férias e compromissos. A folga fixa de cada profissional fica no cadastro dela, em Funcionários.
            </div>
            {bloqueios.length === 0 && <div className="texto-pequeno py-2">Nenhum bloqueio programado.</div>}
            {bloqueios.map((b) => (
              <div key={b.id} className="linha-valor gap-2">
                <div style={{ minWidth: 0 }}>
                  <div className="font-medium">{periodoBloqueio(b)}</div>
                  <div className="texto-pequeno">
                    {b.funcionario}
                    {b.motivo && ` · ${b.motivo}`}
                  </div>
                </div>
                <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" aria-label="Remover" onClick={() => remover(b)} />
              </div>
            ))}
            <Button label="Novo bloqueio" icon="pi pi-ban" className="p-button-outlined w-full mt-3" onClick={() => setBloqueando(true)} />
          </Card>
        </div>
      </div>

      <BloqueioDialog
        aberto={bloqueando}
        diaInicial={hoje()}
        funcionarios={funcionarios}
        onFechar={() => setBloqueando(false)}
        onSalvo={(msg, atencao) => {
          setBloqueando(false);
          mostrar(atencao ? "warn" : "success", msg);
          loadBloqueios();
        }}
        onErro={(msg) => mostrar("error", msg)}
      />
    </>
  );
}
