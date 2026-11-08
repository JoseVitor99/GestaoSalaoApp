import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
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
import IFuncionario from "../interfaces/IFuncionario";
import { TIPO_REMUNERACAO, TIPOS_REMUNERACAO } from "../utilities/constants";
import { iniciais, mensagemErro, moeda } from "../utilities/formatters";

export default function Funcionarios() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();

  const [formAberto, setFormAberto] = useState(false);

  const [funcionarios, setFuncionarios] = useState<IFuncionario[]>([]);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [funcao, setFuncao] = useState("");
  const [tipoRemuneracao, setTipoRemuneracao] = useState<number>(TIPO_REMUNERACAO.DIARIA_MAIS_COMISSAO);
  const [valorDiaria, setValorDiaria] = useState<number | null>(null);
  const [percentualComissao, setPercentualComissao] = useState<number | null>(null);
  const [ativo, setAtivo] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const recebeDiaria = tipoRemuneracao !== TIPO_REMUNERACAO.COMISSAO;
  const recebeComissao = tipoRemuneracao !== TIPO_REMUNERACAO.DIARIA;

  const aviso = (detail: string) => toast.current?.show({ severity: "warn", summary: "Atenção", detail, life: 3000 });
  const sucesso = (detail: string) => toast.current?.show({ severity: "success", summary: "Sucesso", detail, life: 3000 });
  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const load = async () => {
    try {
      const response = await api.get("/funcionarios");
      setFuncionarios(response.data || []);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar funcionários."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const limpar = () => {
    setNome("");
    setTelefone("");
    setFuncao("");
    setTipoRemuneracao(TIPO_REMUNERACAO.DIARIA_MAIS_COMISSAO);
    setValorDiaria(null);
    setPercentualComissao(null);
    setAtivo(true);
    setEditandoId(null);
  };

  const submit = async () => {
    if (!nome.trim()) return aviso("Informe o nome.");
    if (recebeDiaria && (!valorDiaria || valorDiaria <= 0)) return aviso("Informe o valor da diária.");
    if (recebeComissao && (!percentualComissao || percentualComissao <= 0 || percentualComissao > 100))
      return aviso("Informe um percentual de comissão entre 0 e 100.");

    const corpo = {
      nome,
      telefone: telefone.trim() || null,
      funcao: funcao.trim() || null,
      tipoRemuneracao,
      valorDiaria: recebeDiaria ? valorDiaria : 0,
      percentualComissao: recebeComissao ? percentualComissao : 0,
      ativo,
    };

    try {
      if (editandoId) {
        await api.put(`/funcionarios/${editandoId}`, corpo);
      } else {
        await api.post("/funcionarios", corpo);
      }
      sucesso(`Funcionário ${editandoId ? "atualizado" : "cadastrado"} com sucesso!`);
      limpar();
      setFormAberto(false);
      load();
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao salvar funcionário."));
    }
  };

  const editar = (f: IFuncionario) => {
    setEditandoId(f.id);
    setNome(f.nome);
    setTelefone(f.telefone ?? "");
    setFuncao(f.funcao ?? "");
    setTipoRemuneracao(f.tipoRemuneracao);
    setValorDiaria(f.valorDiaria || null);
    setPercentualComissao(f.percentualComissao || null);
    setAtivo(f.ativo);
    setFormAberto(true);
    if (!mobile) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const alternarAtivo = async (f: IFuncionario) => {
    try {
      await api.put(`/funcionarios/${f.id}`, { ...f, ativo: !f.ativo });
      sucesso(`${f.nome} ${f.ativo ? "inativado(a)" : "ativado(a)"}.`);
      load();
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao alterar situação."));
    }
  };

  const remover = (f: IFuncionario) => {
    confirmDialog({
      message: `Tem certeza que deseja excluir ${f.nome}? Esta ação não poderá ser desfeita.`,
      header: "Confirmação",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim",
      rejectLabel: "Não",
      acceptClassName: "p-button-danger",
      rejectClassName: "p-button-secondary",
      accept: async () => {
        try {
          await api.delete(`/funcionarios/${f.id}`);
          sucesso("Funcionário removido com sucesso!");
          if (editandoId === f.id) limpar();
          load();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao remover funcionário."));
        }
      },
    });
  };

  const remuneracaoTemplate = (f: IFuncionario) => {
    switch (f.tipoRemuneracao) {
      case TIPO_REMUNERACAO.DIARIA:
        return `${moeda(f.valorDiaria)}/dia`;
      case TIPO_REMUNERACAO.COMISSAO:
        return `${f.percentualComissao}% dos atendimentos`;
      default:
        return `${moeda(f.valorDiaria)}/dia + ${f.percentualComissao}%`;
    }
  };

  const acoesTemplate = (f: IFuncionario) => (
    <div className="flex gap-2">
      <Button
        icon={f.ativo ? "pi pi-eye-slash" : "pi pi-eye"}
        className="p-button-secondary p-button-sm p-button-outlined"
        tooltip={f.ativo ? "Inativar" : "Ativar"}
        tooltipOptions={{ position: "top" }}
        onClick={() => alternarAtivo(f)}
      />
      <Button icon="pi pi-pencil" className="p-button-warning p-button-sm" onClick={() => editar(f)} />
      <Button icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => remover(f)} />
    </div>
  );

  const formulario = (
    <>
      {editandoId && (
        <div className="mb-3 text-orange-500 font-semibold">
          <i className="pi pi-pencil mr-2" />
          Editando funcionário...
        </div>
      )}

      <div className="field mb-3">
        <label className="block mb-2">Nome</label>
        <InputText value={nome} onChange={(e) => setNome(e.target.value)} className="w-full" placeholder="Nome do profissional" maxLength={200} />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Função</label>
        <InputText value={funcao} onChange={(e) => setFuncao(e.target.value)} className="w-full" placeholder="Cabeleireira, manicure..." maxLength={100} />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Telefone</label>
        <InputText value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full" placeholder="Opcional" maxLength={20} />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Forma de remuneração</label>
        <Dropdown
          value={tipoRemuneracao}
          onChange={(e) => setTipoRemuneracao(e.value)}
          options={TIPOS_REMUNERACAO}
          optionLabel="descricao"
          optionValue="value"
          className="w-full"
        />
      </div>

      <div className="grid">
        {recebeDiaria && (
          <div className="col field mb-3">
            <label className="block mb-2">Valor da diária</label>
            <InputNumber
              value={valorDiaria}
              onValueChange={(e) => setValorDiaria(e.value ?? null)}
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              className="w-full"
              inputClassName="w-full"
            />
          </div>
        )}
        {recebeComissao && (
          <div className="col field mb-3">
            <label className="block mb-2">Comissão</label>
            <InputNumber
              value={percentualComissao}
              onValueChange={(e) => setPercentualComissao(e.value ?? null)}
              suffix=" %"
              min={0}
              max={100}
              maxFractionDigits={2}
              className="w-full"
              inputClassName="w-full"
            />
          </div>
        )}
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
      {funcionarios.length === 0 && <div className="item-lista text-center texto-pequeno py-4">Nenhum funcionário cadastrado ainda.</div>}
      {funcionarios.map((f) => (
        <div key={f.id} className={`item-lista ${f.ativo ? "" : "opacity-60"}`}>
          <div className="flex align-items-center gap-3">
            <span className="avatar-iniciais">{iniciais(f.nome)}</span>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div className="item-titulo">{f.nome}</div>
              <div className="texto-pequeno mt-1">{f.funcao || "Sem função definida"}</div>
            </div>
            <Tag value={f.ativo ? "Ativo" : "Inativo"} severity={f.ativo ? "success" : "secondary"} rounded />
          </div>
          <div className="mt-3 flex align-items-center gap-2">
            <i className="pi pi-wallet text-500" />
            <span className="font-medium">{remuneracaoTemplate(f)}</span>
          </div>
          <div className="item-acoes">
            <Button
              label={f.ativo ? "Inativar" : "Ativar"}
              icon={f.ativo ? "pi pi-eye-slash" : "pi pi-eye"}
              className="p-button-outlined p-button-secondary"
              onClick={() => alternarAtivo(f)}
            />
            <Button label="Editar" icon="pi pi-pencil" className="p-button-outlined p-button-warning" onClick={() => editar(f)} />
            <Button icon="pi pi-trash" className="p-button-outlined p-button-danger" aria-label="Excluir" onClick={() => remover(f)} />
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
          <div className="titulo-pagina mb-3">Equipe ({funcionarios.filter((f) => f.ativo).length} ativos)</div>
          {listaMobile}
          <FormularioResponsivo
            titulo={editandoId ? "Editar funcionário" : "Novo funcionário"}
            aberto={formAberto}
            onFechar={() => {
              setFormAberto(false);
              if (editandoId) limpar();
            }}
          >
            {formulario}
          </FormularioResponsivo>
          <BotaoNovo label="Novo funcionário" icon="pi pi-user-plus" onClick={() => setFormAberto(true)} />
        </>
      ) : (
        <div className="grid">
          <div className="col-12 lg:col-4">
            <FormularioResponsivo titulo={editandoId ? "Editar funcionário" : "Cadastro de funcionários"} aberto={formAberto} onFechar={() => setFormAberto(false)}>
              {formulario}
            </FormularioResponsivo>
          </div>

          <div className="col-12 lg:col-8">
            <Card title={`Equipe (${funcionarios.filter((f) => f.ativo).length} ativos)`}>
              <DataTable value={funcionarios} paginator rows={10} className="p-datatable-sm" emptyMessage="Nenhum funcionário cadastrado">
                <Column field="nome" header="Nome" sortable />
                <Column field="funcao" header="Função" />
                <Column header="Remuneração" body={remuneracaoTemplate} />
                <Column
                  header="Situação"
                  body={(f: IFuncionario) => <Tag value={f.ativo ? "Ativo" : "Inativo"} severity={f.ativo ? "success" : "secondary"} rounded />}
                />
                <Column header="Ações" body={acoesTemplate} style={{ width: "150px" }} />
              </DataTable>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
