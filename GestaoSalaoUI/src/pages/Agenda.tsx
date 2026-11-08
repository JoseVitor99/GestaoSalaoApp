import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { useSearchParams } from "react-router-dom";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import ICliente from "../interfaces/ICliente";
import IServico from "../interfaces/IServico";
import IFuncionario from "../interfaces/IFuncionario";
import IAgendamento from "../interfaces/IAgendamento";
import TabelaAgendamentos from "../components/TabelaAgendamentos";
import ConcluirAtendimentoDialog from "../components/ConcluirAtendimentoDialog";
import FormularioResponsivo from "../components/FormularioResponsivo";
import BotaoNovo from "../components/BotaoNovo";
import useIsMobile from "../hooks/useIsMobile";
import { STATUS_AGENDAMENTO } from "../utilities/constants";
import {
  daApi,
  dataExtenso,
  hoje,
  mensagemErro,
  mesmoDia,
  moeda,
  paraApiData,
  paraApiDataHora,
  somarDias,
} from "../utilities/formatters";

const proximoHorario = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil((d.getMinutes() + 1) / 15) * 15);
  return d;
};

export default function Agenda() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();
  const [parametros, setParametros] = useSearchParams();

  const [clientes, setClientes] = useState<ICliente[]>([]);
  const [servicos, setServicos] = useState<IServico[]>([]);
  const [funcionarios, setFuncionarios] = useState<IFuncionario[]>([]);

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [servicoId, setServicoId] = useState<number | null>(null);
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null);
  const [dataHora, setDataHora] = useState<Date | null>(proximoHorario());
  const [valor, setValor] = useState<number | null>(null);
  const [observacao, setObservacao] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  // "/agenda?novo=1" (botão do Painel) já abre o formulário
  const [formAberto, setFormAberto] = useState(parametros.get("novo") === "1");

  const [dia, setDia] = useState<Date>(hoje());
  const [filtroFuncionario, setFiltroFuncionario] = useState<number | null>(null);
  const [agendamentos, setAgendamentos] = useState<IAgendamento[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [concluindo, setConcluindo] = useState<IAgendamento | null>(null);
  const [novoClienteVisivel, setNovoClienteVisivel] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteTelefone, setNovoClienteTelefone] = useState("");

  const aviso = (detail: string) => toast.current?.show({ severity: "warn", summary: "Atenção", detail, life: 3500 });
  const sucesso = (detail: string) => toast.current?.show({ severity: "success", summary: "Sucesso", detail, life: 3000 });
  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const loadCadastros = async () => {
    try {
      const [c, s, f] = await Promise.all([
        api.get("/clientes"),
        api.get("/servicos", { params: { somenteAtivos: true } }),
        api.get("/funcionarios", { params: { somenteAtivos: true } }),
      ]);
      setClientes(c.data || []);
      setServicos(s.data || []);
      setFuncionarios(f.data || []);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar cadastros."));
    }
  };

  const loadAgenda = useCallback(async () => {
    try {
      setCarregando(true);
      const response = await api.get("/agendamentos", {
        params: { data: paraApiData(dia), funcionarioId: filtroFuncionario ?? undefined },
      });
      setAgendamentos(response.data || []);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar a agenda."));
    } finally {
      setCarregando(false);
    }
  }, [dia, filtroFuncionario]);

  useEffect(() => {
    loadCadastros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAgenda();
  }, [loadAgenda]);

  useEffect(() => {
    if (parametros.has("novo")) setParametros({}, { replace: true });
  }, [parametros, setParametros]);

  const servicoSelecionado = useMemo(() => servicos.find((s) => s.id === servicoId), [servicos, servicoId]);

  const escolherServico = (id: number) => {
    setServicoId(id);
    const servico = servicos.find((s) => s.id === id);
    if (servico) setValor(servico.preco);
  };

  const limparFormulario = () => {
    setClienteId(null);
    setServicoId(null);
    setFuncionarioId(null);
    setDataHora(proximoHorario());
    setValor(null);
    setObservacao("");
    setEditandoId(null);
  };

  const fecharFormulario = () => {
    setFormAberto(false);
    if (editandoId) limparFormulario();
  };

  const submit = async () => {
    if (!clienteId) return aviso("Selecione o cliente.");
    if (!servicoId) return aviso("Selecione o serviço.");
    if (!funcionarioId) return aviso("Selecione o profissional.");
    if (!dataHora) return aviso("Informe a data e o horário.");
    if (!valor || valor <= 0) return aviso("Informe um valor válido.");

    const corpo = {
      clienteId,
      servicoId,
      funcionarioId,
      dataHora: paraApiDataHora(dataHora),
      valor,
      observacao: observacao.trim() || null,
    };

    try {
      setSalvando(true);
      if (editandoId) {
        await api.put(`/agendamentos/${editandoId}`, corpo);
      } else {
        await api.post("/agendamentos", corpo);
      }

      sucesso(`Horário ${editandoId ? "atualizado" : "marcado"} com sucesso!`);

      const diaSalvo = new Date(dataHora);
      diaSalvo.setHours(0, 0, 0, 0);
      limparFormulario();
      setFormAberto(false);
      if (!mesmoDia(diaSalvo, dia)) setDia(diaSalvo);
      else loadAgenda();
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao salvar o agendamento."));
    } finally {
      setSalvando(false);
    }
  };

  const editar = (a: IAgendamento) => {
    setEditandoId(a.id);
    setClienteId(a.clienteId);
    setServicoId(a.servicoId);
    setFuncionarioId(a.funcionarioId);
    setDataHora(daApi(a.dataHora));
    setValor(a.valor);
    setObservacao(a.observacao ?? "");
    setFormAberto(true);
    if (!mobile) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelar = (a: IAgendamento) => {
    confirmDialog({
      message: `Cancelar o horário de ${a.cliente} (${a.servico})? O horário ficará livre na agenda.`,
      header: "Cancelar horário",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim, cancelar",
      rejectLabel: "Não",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.put(`/agendamentos/${a.id}/cancelar`);
          sucesso("Horário cancelado.");
          loadAgenda();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao cancelar."));
        }
      },
    });
  };

  const excluir = (a: IAgendamento) => {
    confirmDialog({
      message: "Excluir este agendamento? Use esta opção apenas para lançamentos feitos por engano.",
      header: "Confirmação",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim",
      rejectLabel: "Não",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/agendamentos/${a.id}`);
          sucesso("Agendamento excluído.");
          if (editandoId === a.id) limparFormulario();
          loadAgenda();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao excluir."));
        }
      },
    });
  };

  const salvarNovoCliente = async () => {
    if (!novoClienteNome.trim()) return aviso("Informe o nome do cliente.");
    if (!novoClienteTelefone.trim()) return aviso("Informe o telefone do cliente.");

    try {
      const response = await api.post("/clientes", { nome: novoClienteNome, telefone: novoClienteTelefone });
      const novo: ICliente = response.data;
      setClientes((lista) => [...lista, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setClienteId(novo.id);
      setNovoClienteVisivel(false);
      setNovoClienteNome("");
      setNovoClienteTelefone("");
      sucesso(`Cliente ${novo.nome} cadastrado.`);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao cadastrar cliente."));
    }
  };

  const pendentes = agendamentos.filter((a) => a.status === STATUS_AGENDAMENTO.AGENDADO).length;
  const faturado = agendamentos
    .filter((a) => a.status === STATUS_AGENDAMENTO.CONCLUIDO)
    .reduce((acc, a) => acc + a.valor, 0);

  const servicoTemplate = (s?: IServico) =>
    s ? (
      <div className="flex justify-content-between w-full gap-3">
        <span>{s.descricao}</span>
        <span className="texto-pequeno">
          {moeda(s.preco)} · {s.duracaoMinutos} min
        </span>
      </div>
    ) : (
      <span>Selecione o serviço</span>
    );

  const formulario = (
    <>
      {editandoId && (
        <div className="mb-3 text-orange-500 font-semibold">
          <i className="pi pi-pencil mr-2" />
          Editando agendamento...
        </div>
      )}

      <div className="field mb-3">
        <label className="block mb-2">Cliente</label>
        <div className="p-inputgroup">
          <Dropdown
            value={clienteId}
            onChange={(e) => setClienteId(e.value)}
            options={clientes}
            optionLabel="nome"
            optionValue="id"
            filter
            filterBy="nome,telefone"
            placeholder="Buscar cliente"
            emptyMessage="Nenhum cliente cadastrado"
            emptyFilterMessage="Cliente não encontrado"
            itemTemplate={(c: ICliente) => (
              <div>
                <div>{c.nome}</div>
                <div className="texto-pequeno">{c.telefone}</div>
              </div>
            )}
            className="w-full"
          />
          <Button
            icon="pi pi-user-plus"
            className="p-button-outlined"
            tooltip={mobile ? undefined : "Novo cliente"}
            tooltipOptions={{ position: "top" }}
            aria-label="Novo cliente"
            onClick={() => setNovoClienteVisivel(true)}
          />
        </div>
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Serviço</label>
        <Dropdown
          value={servicoId}
          onChange={(e) => escolherServico(e.value)}
          options={servicos}
          optionLabel="descricao"
          optionValue="id"
          itemTemplate={servicoTemplate}
          valueTemplate={() => servicoTemplate(servicoSelecionado)}
          placeholder="Selecione o serviço"
          emptyMessage="Cadastre os serviços primeiro"
          className="w-full"
        />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Profissional</label>
        <Dropdown
          value={funcionarioId}
          onChange={(e) => setFuncionarioId(e.value)}
          options={funcionarios}
          optionLabel="nome"
          optionValue="id"
          itemTemplate={(f: IFuncionario) => (
            <div>
              <div>{f.nome}</div>
              {f.funcao && <div className="texto-pequeno">{f.funcao}</div>}
            </div>
          )}
          placeholder="Selecione o profissional"
          emptyMessage="Cadastre os funcionários primeiro"
          className="w-full"
        />
      </div>

      <div className="grid">
        <div className="col-12 field mb-0">
          <label className="block mb-2">Data e horário</label>
          <Calendar
            value={dataHora}
            onChange={(e) => setDataHora(e.value ?? null)}
            showTime
            hourFormat="24"
            stepMinute={5}
            minDate={editandoId ? undefined : hoje()}
            dateFormat="dd/mm/yy"
            showIcon
            touchUI={mobile}
            readOnlyInput={mobile}
            className="w-full"
          />
        </div>
        <div className="col-12 field mb-0">
          <label className="block mb-2">Valor</label>
          <InputNumber
            value={valor}
            onValueChange={(e) => setValor(e.value ?? null)}
            mode="currency"
            currency="BRL"
            locale="pt-BR"
            className="w-full"
            inputClassName="w-full"
          />
        </div>
      </div>
      {servicoSelecionado && dataHora && (
        <small className="texto-pequeno block mb-3">
          <i className="pi pi-clock mr-1" style={{ fontSize: "0.75rem" }} />
          Término previsto às{" "}
          {new Date(dataHora.getTime() + servicoSelecionado.duracaoMinutos * 60000).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </small>
      )}

      <div className="field mb-4 mt-3">
        <label className="block mb-2">Observação</label>
        <InputText
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Opcional"
          className="w-full"
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
              limparFormulario();
              setFormAberto(false);
            }}
          />
        )}
        <Button
          label={editandoId ? "Atualizar" : "Agendar"}
          icon={editandoId ? "pi pi-refresh" : "pi pi-calendar-plus"}
          className={`p-button-success ${mobile ? "flex-1" : ""}`}
          loading={salvando}
          onClick={submit}
        />
      </div>
    </>
  );

  const filtros = mobile ? (
    <>
      <div className="navegador-data mb-2">
        <Button icon="pi pi-chevron-left" className="p-button-outlined" aria-label="Dia anterior" onClick={() => setDia(somarDias(dia, -1))} />
        <Calendar
          value={dia}
          onChange={(e) => e.value && setDia(e.value as Date)}
          dateFormat="dd/mm/yy"
          touchUI
          readOnlyInput
        />
        <Button icon="pi pi-chevron-right" className="p-button-outlined" aria-label="Próximo dia" onClick={() => setDia(somarDias(dia, 1))} />
      </div>
      <div className="flex gap-2 mb-3">
        <Dropdown
          value={filtroFuncionario}
          onChange={(e) => setFiltroFuncionario(e.value ?? null)}
          options={funcionarios}
          optionLabel="nome"
          optionValue="id"
          placeholder="Todos os profissionais"
          showClear
          className="flex-1"
        />
        {!mesmoDia(dia, hoje()) && <Button label="Hoje" className="p-button-outlined" onClick={() => setDia(hoje())} />}
      </div>
    </>
  ) : (
    <div className="flex flex-wrap align-items-center gap-2">
      <Button icon="pi pi-chevron-left" className="p-button-outlined p-button-sm" onClick={() => setDia(somarDias(dia, -1))} />
      <Button label="Hoje" className="p-button-outlined p-button-sm" disabled={mesmoDia(dia, hoje())} onClick={() => setDia(hoje())} />
      <Button icon="pi pi-chevron-right" className="p-button-outlined p-button-sm" onClick={() => setDia(somarDias(dia, 1))} />
      <Calendar
        value={dia}
        onChange={(e) => e.value && setDia(e.value as Date)}
        dateFormat="dd/mm/yy"
        showIcon
        inputStyle={{ width: "7.5rem" }}
      />
      <Dropdown
        value={filtroFuncionario}
        onChange={(e) => setFiltroFuncionario(e.value ?? null)}
        options={funcionarios}
        optionLabel="nome"
        optionValue="id"
        placeholder="Todos os profissionais"
        showClear
        style={{ minWidth: "13rem" }}
      />
    </div>
  );

  const resumoDia = (
    <>
      <div className={mobile ? "titulo-pagina" : "text-xl font-bold"}>{dataExtenso(dia)}</div>
      <div className="texto-pequeno mt-1">
        {agendamentos.length} horário(s) · {pendentes} pendente(s) · faturado {moeda(faturado)}
      </div>
    </>
  );

  const tabela = (
    <TabelaAgendamentos
      agendamentos={agendamentos}
      carregando={carregando}
      onConcluir={setConcluindo}
      onCancelar={cancelar}
      onEditar={editar}
      onExcluir={excluir}
    />
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      {mobile ? (
        <>
          <div className="mb-3">{resumoDia}</div>
          {filtros}
          {tabela}
          <FormularioResponsivo
            titulo={editandoId ? "Remarcar horário" : "Marcar horário"}
            aberto={formAberto}
            onFechar={fecharFormulario}
          >
            {formulario}
          </FormularioResponsivo>
          <BotaoNovo label="Agendar" icon="pi pi-calendar-plus" onClick={() => setFormAberto(true)} />
        </>
      ) : (
        <div className="grid">
          <div className="col-12 lg:col-4">
            <FormularioResponsivo
              titulo={editandoId ? "Remarcar horário" : "Marcar horário"}
              aberto={formAberto}
              onFechar={fecharFormulario}
            >
              {formulario}
            </FormularioResponsivo>
          </div>

          <div className="col-12 lg:col-8">
            <Card>
              <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                <div>{resumoDia}</div>
                {filtros}
              </div>
              {tabela}
            </Card>
          </div>
        </div>
      )}

      <ConcluirAtendimentoDialog
        agendamento={concluindo}
        onFechar={() => setConcluindo(null)}
        onConcluido={(msg) => {
          setConcluindo(null);
          sucesso(msg);
          loadAgenda();
        }}
        onErro={erro}
      />

      <Dialog
        header="Novo cliente"
        visible={novoClienteVisivel}
        onHide={() => setNovoClienteVisivel(false)}
        style={{ width: "26rem" }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Voltar" className="p-button-text" onClick={() => setNovoClienteVisivel(false)} />
            <Button label="Cadastrar" icon="pi pi-check" className="p-button-success" onClick={salvarNovoCliente} />
          </div>
        }
      >
        <div className="field mb-3">
          <label className="block mb-2">Nome</label>
          <InputText value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} className="w-full" autoFocus={!mobile} />
        </div>
        <div className="field">
          <label className="block mb-2">Telefone / WhatsApp</label>
          <InputText
            value={novoClienteTelefone}
            onChange={(e) => setNovoClienteTelefone(e.target.value)}
            className="w-full"
            placeholder="(00) 00000-0000"
            inputMode="tel"
          />
        </div>
        <small className="texto-pequeno">Os demais dados podem ser completados depois na tela de Clientes.</small>
      </Dialog>
    </>
  );
}
