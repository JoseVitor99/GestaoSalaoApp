import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import FormularioResponsivo from "../components/FormularioResponsivo";
import BotaoNovo from "../components/BotaoNovo";
import useIsMobile from "../hooks/useIsMobile";
import { useAutenticacao } from "../services/autenticacao";
import ICliente from "../interfaces/ICliente";
import IAgendamento from "../interfaces/IAgendamento";
import StatusTag from "../components/StatusTag";
import { STATUS_AGENDAMENTO } from "../utilities/constants";
import { daApi, data, formatarTelefone, hora, iniciais, linkTelefone, linkWhatsApp, mensagemErro, moeda, paraApiData, somenteDigitos } from "../utilities/formatters";
import InputTelefone from "../components/InputTelefone";

export default function Clientes() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();
  const { administrador } = useAutenticacao();

  const [formAberto, setFormAberto] = useState(false);

  const [clientes, setClientes] = useState<ICliente[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState<Date | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [historicoCliente, setHistoricoCliente] = useState<ICliente | null>(null);
  const [historico, setHistorico] = useState<IAgendamento[]>([]);

  const aviso = (detail: string) => toast.current?.show({ severity: "warn", summary: "Atenção", detail, life: 3000 });
  const sucesso = (detail: string) => toast.current?.show({ severity: "success", summary: "Sucesso", detail, life: 3000 });
  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const load = async () => {
    try {
      const response = await api.get("/clientes");
      setClientes(response.data || []);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar clientes."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const limpar = () => {
    setNome("");
    setTelefone("");
    setEmail("");
    setDataNascimento(null);
    setObservacoes("");
    setEditandoId(null);
  };

  const submit = async () => {
    if (!nome.trim()) return aviso("Informe o nome.");
    if (somenteDigitos(telefone).length < 10) return aviso("Informe o telefone com DDD.");

    const corpo = {
      nome,
      telefone,
      email: email.trim() || null,
      dataNascimento: dataNascimento ? paraApiData(dataNascimento) : null,
      observacoes: observacoes.trim() || null,
    };

    try {
      if (editandoId) {
        await api.put(`/clientes/${editandoId}`, corpo);
      } else {
        await api.post("/clientes", corpo);
      }

      sucesso(`Cliente ${editandoId ? "atualizado" : "cadastrado"} com sucesso!`);
      limpar();
      setFormAberto(false);
      load();
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao salvar cliente."));
    }
  };

  const editar = (c: ICliente) => {
    setEditandoId(c.id);
    setNome(c.nome);
    setTelefone(c.telefone);
    setEmail(c.email ?? "");
    setDataNascimento(c.dataNascimento ? daApi(c.dataNascimento) : null);
    setObservacoes(c.observacoes ?? "");
    setFormAberto(true);
    if (!mobile) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remover = (c: ICliente) => {
    confirmDialog({
      message: `Tem certeza que deseja excluir ${c.nome}? Esta ação não poderá ser desfeita.`,
      header: "Confirmação",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim",
      rejectLabel: "Não",
      acceptClassName: "p-button-danger",
      rejectClassName: "p-button-secondary",
      accept: async () => {
        try {
          await api.delete(`/clientes/${c.id}`);
          sucesso("Cliente removido com sucesso!");
          if (editandoId === c.id) limpar();
          load();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao remover cliente."));
        }
      },
    });
  };

  const abrirHistorico = async (c: ICliente) => {
    try {
      const response = await api.get(`/clientes/${c.id}/agendamentos`);
      setHistorico(response.data || []);
      setHistoricoCliente(c);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar histórico."));
    }
  };

  const aniversarioTemplate = (c: ICliente) => {
    if (!c.dataNascimento) return <span className="texto-pequeno">—</span>;
    const nasc = daApi(c.dataNascimento);
    const doMes = nasc.getMonth() === new Date().getMonth();
    return (
      <span className={doMes ? "text-primary font-semibold" : ""}>
        {nasc.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        {doMes && <i className="pi pi-gift ml-2" title="Aniversariante do mês" />}
      </span>
    );
  };

  const acoesTemplate = (c: ICliente) => (
    <div className="flex gap-2">
      <Button icon="pi pi-history" className="p-button-info p-button-sm p-button-outlined" tooltip="Histórico" tooltipOptions={{ position: "top" }} onClick={() => abrirHistorico(c)} />
      <Button icon="pi pi-pencil" className="p-button-warning p-button-sm" onClick={() => editar(c)} />
      {administrador && <Button icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => remover(c)} />}
    </div>
  );

  const faltas = historico.filter((a) => a.status === STATUS_AGENDAMENTO.NAO_COMPARECEU).length;

  const totalGasto = historico
    .filter((a) => a.status === STATUS_AGENDAMENTO.CONCLUIDO)
    .reduce((acc, a) => acc + a.valor, 0);

  const termo = busca.trim().toLowerCase();
  const digitosBusca = somenteDigitos(busca);
  const clientesFiltrados = termo
    ? clientes.filter(
        (c) =>
          [c.nome, c.email ?? ""].some((v) => v.toLowerCase().includes(termo)) ||
          (digitosBusca.length > 0 && c.telefone.includes(digitosBusca))
      )
    : clientes;

  const formulario = (
    <>
      {editandoId && (
        <div className="mb-3 text-orange-500 font-semibold">
          <i className="pi pi-pencil mr-2" />
          Editando cliente...
        </div>
      )}

      <div className="field mb-3">
        <label className="block mb-2">Nome</label>
        <InputText value={nome} onChange={(e) => setNome(e.target.value)} className="w-full" placeholder="Nome completo" maxLength={200} />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Telefone / WhatsApp</label>
        <InputTelefone value={telefone} onChange={setTelefone} className="w-full" />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">E-mail</label>
        <InputText value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" placeholder="Opcional" maxLength={200} inputMode="email" />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Data de nascimento</label>
        <Calendar
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.value ?? null)}
          dateFormat="dd/mm/yy"
          maxDate={new Date()}
          showIcon
          showButtonBar
          touchUI={mobile}
          readOnlyInput={mobile}
          placeholder="Opcional"
          className="w-full"
        />
      </div>

      <div className="field mb-4">
        <label className="block mb-2">Observações</label>
        <InputTextarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          autoResize
          className="w-full"
          placeholder="Alergias, preferências, produtos usados..."
          maxLength={500}
        />
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

  const campoBusca = (
    <IconField iconPosition="left" className={mobile ? "w-full" : ""}>
      <InputIcon className="pi pi-search" />
      <InputText
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou telefone"
        className={mobile ? "w-full" : ""}
        type="search"
      />
    </IconField>
  );

  const listaMobile = (
    <>
      {clientesFiltrados.length === 0 && (
        <div className="item-lista text-center texto-pequeno py-4">
          {clientes.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado."}
        </div>
      )}
      {clientesFiltrados.map((c) => (
        <div key={c.id} className="item-lista">
          <div className="flex align-items-center gap-3" onClick={() => abrirHistorico(c)}>
            <span className="avatar-iniciais">{iniciais(c.nome)}</span>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div className="item-titulo">{c.nome}</div>
              <div className="texto-pequeno mt-1">{formatarTelefone(c.telefone)}</div>
            </div>
            {aniversarioTemplate(c)}
          </div>
          {c.observacoes && <div className="texto-pequeno font-italic mt-2">{c.observacoes}</div>}
          <div className="item-acoes">
            <Button
              icon="pi pi-whatsapp"
              className="p-button-outlined p-button-success"
              aria-label="WhatsApp"
              onClick={() => window.open(linkWhatsApp(c.telefone), "_blank")}
            />
            <Button icon="pi pi-phone" className="p-button-outlined" aria-label="Ligar" onClick={() => (window.location.href = linkTelefone(c.telefone))} />
            <Button label="Histórico" icon="pi pi-history" className="p-button-outlined p-button-info" onClick={() => abrirHistorico(c)} />
            <Button icon="pi pi-pencil" className="p-button-outlined p-button-warning" aria-label="Editar" onClick={() => editar(c)} />
            {administrador && (
              <Button icon="pi pi-trash" className="p-button-outlined p-button-danger" aria-label="Excluir" onClick={() => remover(c)} />
            )}
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
          <div className="titulo-pagina mb-2">Clientes ({clientes.length})</div>
          <div className="mb-3">{campoBusca}</div>
          {listaMobile}
          <FormularioResponsivo titulo={editandoId ? "Editar cliente" : "Novo cliente"} aberto={formAberto} onFechar={() => { setFormAberto(false); if (editandoId) limpar(); }}>
            {formulario}
          </FormularioResponsivo>
          <BotaoNovo label="Novo cliente" icon="pi pi-user-plus" onClick={() => setFormAberto(true)} />
        </>
      ) : (
        <div className="grid">
          <div className="col-12 lg:col-4">
            <FormularioResponsivo titulo={editandoId ? "Editar cliente" : "Cadastro de clientes"} aberto={formAberto} onFechar={() => setFormAberto(false)}>
              {formulario}
            </FormularioResponsivo>
          </div>

          <div className="col-12 lg:col-8">
            <Card>
              <div className="flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div className="text-xl font-bold">Clientes ({clientes.length})</div>
                {campoBusca}
              </div>

              <DataTable
                value={clientesFiltrados}
                paginator
                rows={10}
                className="p-datatable-sm"
                emptyMessage="Nenhum cliente encontrado"
              >
                <Column field="nome" header="Nome" sortable />
                <Column header="Telefone" body={(c: ICliente) => <span className="white-space-nowrap">{formatarTelefone(c.telefone)}</span>} />
                <Column header="Aniversário" body={aniversarioTemplate} />
                <Column header="Ações" body={acoesTemplate} style={{ width: "150px" }} />
              </DataTable>
            </Card>
          </div>
        </div>
      )}

      <Dialog
        header={`Histórico de ${historicoCliente?.nome ?? ""}`}
        visible={!!historicoCliente}
        onHide={() => setHistoricoCliente(null)}
        style={{ width: "54rem" }}
        breakpoints={{ "960px": "95vw" }}
        contentClassName={mobile ? "px-3" : undefined}
      >
        {historicoCliente?.observacoes && (
          <div className="surface-100 border-round p-3 mb-3">
            <i className="pi pi-info-circle mr-2" />
            {historicoCliente.observacoes}
          </div>
        )}

        {mobile ? (
          <>
            {historico.length === 0 && <div className="texto-pequeno text-center py-3">Este cliente ainda não tem atendimentos.</div>}
            {historico.map((a) => (
              <div key={a.id} className="linha-valor">
                <div style={{ minWidth: 0 }}>
                  <div className="font-medium">{a.servico}</div>
                  <div className="texto-pequeno">
                    {data(a.dataHora)} {hora(a.dataHora)} · {a.funcionario}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{moeda(a.valor)}</div>
                  <StatusTag status={a.status} descricao={a.statusDescricao} />
                </div>
              </div>
            ))}
          </>
        ) : (
          <DataTable value={historico} paginator rows={8} className="p-datatable-sm" emptyMessage="Este cliente ainda não tem atendimentos.">
            <Column header="Data" body={(a: IAgendamento) => `${data(a.dataHora)} ${hora(a.dataHora)}`} />
            <Column field="servico" header="Serviço" />
            <Column field="funcionario" header="Profissional" />
            <Column header="Valor" body={(a: IAgendamento) => moeda(a.valor)} />
            <Column header="Situação" body={(a: IAgendamento) => <StatusTag status={a.status} descricao={a.statusDescricao} />} />
          </DataTable>
        )}
        <div className="flex flex-wrap justify-content-between gap-2 mt-3 font-semibold">
          <span className={faltas > 0 ? "text-orange-600" : "texto-pequeno"}>
            {faltas === 1 ? "1 falta" : `${faltas} faltas`}
          </span>
          <span>Total em atendimentos concluídos: {moeda(totalGasto)}</span>
        </div>
      </Dialog>
    </>
  );
}
