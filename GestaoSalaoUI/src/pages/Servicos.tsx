import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import FormularioResponsivo from "../components/FormularioResponsivo";
import BotaoNovo from "../components/BotaoNovo";
import useIsMobile from "../hooks/useIsMobile";
import IServico from "../interfaces/IServico";
import { mensagemErro, moeda } from "../utilities/formatters";

export default function Servicos() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();

  const [formAberto, setFormAberto] = useState(false);

  const [servicos, setServicos] = useState<IServico[]>([]);
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState<number | null>(null);
  const [duracao, setDuracao] = useState<number | null>(30);
  const [ativo, setAtivo] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const aviso = (detail: string) => toast.current?.show({ severity: "warn", summary: "Atenção", detail, life: 3000 });
  const sucesso = (detail: string) => toast.current?.show({ severity: "success", summary: "Sucesso", detail, life: 3000 });
  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const load = async () => {
    try {
      const response = await api.get("/servicos");
      setServicos(response.data || []);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar serviços."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const limpar = () => {
    setDescricao("");
    setPreco(null);
    setDuracao(30);
    setAtivo(true);
    setEditandoId(null);
  };

  const submit = async () => {
    if (!descricao.trim()) return aviso("Informe a descrição.");
    if (!preco || preco <= 0) return aviso("Informe um preço válido.");
    if (!duracao || duracao < 5) return aviso("Informe a duração em minutos (mínimo 5).");

    const corpo = { descricao, preco, duracaoMinutos: duracao, ativo };

    try {
      if (editandoId) {
        await api.put(`/servicos/${editandoId}`, corpo);
      } else {
        await api.post("/servicos", corpo);
      }
      sucesso(`Serviço ${editandoId ? "atualizado" : "cadastrado"} com sucesso!`);
      limpar();
      setFormAberto(false);
      load();
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao salvar serviço."));
    }
  };

  const editar = (s: IServico) => {
    setEditandoId(s.id);
    setDescricao(s.descricao);
    setPreco(s.preco);
    setDuracao(s.duracaoMinutos);
    setAtivo(s.ativo);
    setFormAberto(true);
  };

  const remover = (s: IServico) => {
    confirmDialog({
      message: `Tem certeza que deseja excluir o serviço "${s.descricao}"?`,
      header: "Confirmação",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim",
      rejectLabel: "Não",
      acceptClassName: "p-button-danger",
      rejectClassName: "p-button-secondary",
      accept: async () => {
        try {
          await api.delete(`/servicos/${s.id}`);
          sucesso("Serviço removido com sucesso!");
          if (editandoId === s.id) limpar();
          load();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao remover serviço."));
        }
      },
    });
  };

  const duracaoTemplate = (s: IServico) => {
    const h = Math.floor(s.duracaoMinutos / 60);
    const m = s.duracaoMinutos % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m} min`;
  };

  const acoesTemplate = (s: IServico) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" className="p-button-warning p-button-sm" onClick={() => editar(s)} />
      <Button icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => remover(s)} />
    </div>
  );

  const formulario = (
    <>
      {editandoId && (
        <div className="mb-3 text-orange-500 font-semibold">
          <i className="pi pi-pencil mr-2" />
          Editando serviço...
        </div>
      )}

      <div className="field mb-3">
        <label className="block mb-2">Descrição</label>
        <InputText value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full" placeholder="Ex.: Corte feminino" maxLength={200} />
      </div>

      <div className="grid">
        <div className="col field mb-3">
          <label className="block mb-2">Preço</label>
          <InputNumber
            value={preco}
            onValueChange={(e) => setPreco(e.value ?? null)}
            mode="currency"
            currency="BRL"
            locale="pt-BR"
            className="w-full"
            inputClassName="w-full"
          />
        </div>
        <div className="col field mb-3">
          <label className="block mb-2">Duração</label>
          <InputNumber
            value={duracao}
            onValueChange={(e) => setDuracao(e.value ?? null)}
            suffix=" min"
            min={5}
            max={480}
            step={5}
            showButtons
            className="w-full"
            inputClassName="w-full"
          />
        </div>
      </div>

      <div className="field mb-4 flex align-items-center gap-2">
        <InputSwitch checked={ativo} onChange={(e) => setAtivo(!!e.value)} />
        <span>{ativo ? "Ativo (aparece na agenda)" : "Inativo"}</span>
      </div>

      <div className="flex justify-content-end gap-2">
        {(editandoId || mobile) && (
          <Button
            label="Cancelar"
            icon="pi pi-times"
            className={`p-button-secondary ${mobile ? "p-button-outlined flex-1" : ""}`}
            onClick={() => {
              limpar();
              setFormAberto(false);
            }}
          />
        )}
        <Button
          label={editandoId ? "Atualizar" : "Salvar"}
          icon={editandoId ? "pi pi-refresh" : "pi pi-check"}
          onClick={submit}
          className={`p-button-success ${mobile ? "flex-1" : ""}`}
        />
      </div>
    </>
  );

  const listaMobile = (
    <>
      {servicos.length === 0 && <div className="item-lista text-center texto-pequeno py-4">Nenhum serviço cadastrado ainda.</div>}
      {servicos.map((s) => (
        <div key={s.id} className={`item-lista ${s.ativo ? "" : "opacity-60"}`}>
          <div className="flex align-items-center gap-2">
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div className="item-titulo">{s.descricao}</div>
              <div className="texto-pequeno mt-1">
                <i className="pi pi-clock mr-1" style={{ fontSize: "0.7rem" }} />
                {duracaoTemplate(s)}
                {!s.ativo && " · Inativo"}
              </div>
            </div>
            <div className="text-lg font-bold white-space-nowrap mr-1">{moeda(s.preco)}</div>
            <Button icon="pi pi-pencil" className="p-button-text p-button-warning p-button-rounded p-button-sm" aria-label="Editar" onClick={() => editar(s)} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-rounded p-button-sm" aria-label="Excluir" onClick={() => remover(s)} />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      {mobile ? (
        <>
          <div className="titulo-pagina mb-3">Serviços e preços</div>
          {listaMobile}
          <FormularioResponsivo
            titulo={editandoId ? "Editar serviço" : "Novo serviço"}
            aberto={formAberto}
            onFechar={() => {
              setFormAberto(false);
              if (editandoId) limpar();
            }}
          >
            {formulario}
          </FormularioResponsivo>
          <BotaoNovo label="Novo serviço" icon="pi pi-plus" onClick={() => setFormAberto(true)} />
        </>
      ) : (
        <div className="grid">
          <div className="col-12 lg:col-4">
            <FormularioResponsivo titulo={editandoId ? "Editar serviço" : "Cadastro de serviços"} aberto={formAberto} onFechar={() => setFormAberto(false)}>
              {formulario}
            </FormularioResponsivo>
          </div>

          <div className="col-12 lg:col-8">
            <Card title="Tabela de serviços">
              <DataTable value={servicos} paginator rows={10} className="p-datatable-sm" emptyMessage="Nenhum serviço cadastrado">
                <Column field="descricao" header="Serviço" sortable />
                <Column field="preco" header="Preço" sortable body={(s: IServico) => moeda(s.preco)} />
                <Column header="Duração" body={duracaoTemplate} />
                <Column
                  header="Situação"
                  body={(s: IServico) => <Tag value={s.ativo ? "Ativo" : "Inativo"} severity={s.ativo ? "success" : "secondary"} rounded />}
                />
                <Column header="Ações" body={acoesTemplate} style={{ width: "120px" }} />
              </DataTable>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
