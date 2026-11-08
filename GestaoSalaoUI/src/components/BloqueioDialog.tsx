import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";

import { api } from "../services/api";
import { useAutenticacao } from "../services/autenticacao";
import IFuncionario from "../interfaces/IFuncionario";
import { hoje, mensagemErro, paraApiData, somarDias } from "../utilities/formatters";
import useIsMobile from "../hooks/useIsMobile";

interface Props {
  aberto: boolean;
  diaInicial: Date;
  funcionarios: IFuncionario[];
  onFechar: () => void;
  onSalvo: (mensagem: string, atencao: boolean) => void;
  onErro: (mensagem: string) => void;
}

const SALAO = 0;

export default function BloqueioDialog({ aberto, diaInicial, funcionarios, onFechar, onSalvo, onErro }: Props) {
  const { usuario, administrador } = useAutenticacao();
  const mobile = useIsMobile();
  const meuFuncionario = usuario?.funcionarioId ?? null;

  const [funcionarioId, setFuncionarioId] = useState<number | null>(SALAO);
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [data, setData] = useState<Date>(hoje());
  const [dataFim, setDataFim] = useState<Date>(hoje());
  const [de, setDe] = useState("12:00");
  const [ate, setAte] = useState("13:00");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const inicial = diaInicial < hoje() ? hoje() : diaInicial;
    setFuncionarioId(administrador ? SALAO : meuFuncionario);
    setDiaInteiro(false);
    setData(inicial);
    setDataFim(inicial);
    setDe("12:00");
    setAte("13:00");
    setMotivo("");
  }, [aberto, diaInicial, administrador, meuFuncionario]);

  const opcoes = administrador
    ? [{ id: SALAO, nome: "Salão inteiro (todos)" }, ...funcionarios]
    : funcionarios.filter((f) => f.id === meuFuncionario);

  const salvar = async () => {
    if (funcionarioId === null) return onErro("Selecione o profissional.");
    if (diaInteiro && dataFim < data) return onErro("A data final precisa ser igual ou depois da inicial.");
    if (!diaInteiro && (!de || !ate || ate <= de)) return onErro("O horário final precisa ser depois do inicial.");

    const inicio = diaInteiro ? `${paraApiData(data)}T00:00:00` : `${paraApiData(data)}T${de}:00`;
    const fim = diaInteiro ? `${paraApiData(somarDias(dataFim, 1))}T00:00:00` : `${paraApiData(data)}T${ate}:00`;

    try {
      setSalvando(true);
      const r = await api.post("/bloqueios", {
        funcionarioId: funcionarioId === SALAO ? null : funcionarioId,
        inicio,
        fim,
        motivo: motivo.trim() || null,
      });
      const qtd: number = r.data?.atendimentosNoPeriodo ?? 0;
      onSalvo(
        qtd > 0
          ? `Bloqueio criado. Atenção: ${qtd} atendimento(s) já marcado(s) nesse período continua(m) na agenda; remarque ou cancele.`
          : "Bloqueio criado.",
        qtd > 0
      );
    } catch (err: any) {
      onErro(mensagemErro(err, "Erro ao criar o bloqueio."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog
      header="Bloquear horário"
      visible={aberto}
      onHide={onFechar}
      style={{ width: "28rem" }}
      breakpoints={{ "640px": "95vw" }}
      position={mobile ? "bottom" : "center"}
      modal
      footer={
        <div className="flex justify-content-end gap-2">
          <Button label="Voltar" className={`p-button-text ${mobile ? "flex-1" : ""}`} onClick={onFechar} />
          <Button label="Bloquear" icon="pi pi-ban" className={`p-button-danger ${mobile ? "flex-1" : ""}`} loading={salvando} onClick={salvar} />
        </div>
      }
    >
      <div className="field mb-3">
        <label className="block mb-2">Agenda de</label>
        <Dropdown
          value={funcionarioId}
          onChange={(e) => setFuncionarioId(e.value)}
          options={opcoes}
          optionLabel="nome"
          optionValue="id"
          disabled={!administrador}
          className="w-full"
        />
      </div>

      <div className="field mb-3 flex align-items-center gap-2">
        <InputSwitch checked={diaInteiro} onChange={(e) => setDiaInteiro(!!e.value)} />
        <span>{diaInteiro ? "Dia(s) inteiro(s): folga, férias, feriado" : "Só algumas horas: almoço, compromisso"}</span>
      </div>

      {diaInteiro ? (
        <div className="grid">
          <div className="col-6 pb-0">
            <label className="block mb-2">De</label>
            <Calendar value={data} onChange={(e) => e.value && setData(e.value as Date)} minDate={hoje()} dateFormat="dd/mm/yy" readOnlyInput touchUI={mobile} className="w-full" />
          </div>
          <div className="col-6 pb-0">
            <label className="block mb-2">Até</label>
            <Calendar value={dataFim} onChange={(e) => e.value && setDataFim(e.value as Date)} minDate={data} dateFormat="dd/mm/yy" readOnlyInput touchUI={mobile} className="w-full" />
          </div>
        </div>
      ) : (
        <div className="grid">
          <div className="col-12 md:col-6 pb-0">
            <label className="block mb-2">Dia</label>
            <Calendar value={data} onChange={(e) => e.value && setData(e.value as Date)} minDate={hoje()} dateFormat="dd/mm/yy" readOnlyInput touchUI={mobile} className="w-full" />
          </div>
          <div className="col-6 md:col-3 pb-0">
            <label className="block mb-2">Das</label>
            <input type="time" className="p-inputtext p-component w-full" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="col-6 md:col-3 pb-0">
            <label className="block mb-2">Às</label>
            <input type="time" className="p-inputtext p-component w-full" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </div>
      )}

      <div className="field mt-3 mb-0">
        <label className="block mb-2">Motivo</label>
        <InputText value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full" placeholder="Ex.: almoço, médico, férias, feriado" maxLength={200} />
      </div>
    </Dialog>
  );
}
