import { useCallback, useEffect, useRef, useState } from "react";
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
import { useAutenticacao } from "../services/autenticacao";
import ICliente from "../interfaces/ICliente";
import IServico from "../interfaces/IServico";
import IFuncionario from "../interfaces/IFuncionario";
import IAgendamento from "../interfaces/IAgendamento";
import TabelaAgendamentos from "../components/TabelaAgendamentos";
import ConcluirAtendimentoDialog from "../components/ConcluirAtendimentoDialog";
import LembretesDialog from "../components/LembretesDialog";
import BloqueioDialog from "../components/BloqueioDialog";
import BloqueiosDia from "../components/BloqueiosDia";
import FormularioResponsivo from "../components/FormularioResponsivo";
import BotaoNovo from "../components/BotaoNovo";
import useIsMobile from "../hooks/useIsMobile";
import { STATUS_AGENDAMENTO } from "../utilities/constants";
import {
  daApi,
  dataExtenso,
  formatarTelefone,
  hoje,
  mensagemErro,
  mesmoDia,
  moeda,
  paraApiData,
  paraApiDataHora,
  somarDias,
  somenteDigitos,
} from "../utilities/formatters";
import InputTelefone from "../components/InputTelefone";

const proximoHorario = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil((d.getMinutes() + 1) / 15) * 15);
  return d;
};

interface ItemForm {
  chave: number;
  servicoId: number | null;
  funcionarioId: number | null;
  dataHora: Date | null;
  valor: number | null;
}

let proximaChave = 1;

const novoItem = (dataHora: Date | null, funcionarioId: number | null = null, servicoId: number | null = null, valor: number | null = null): ItemForm => ({
  chave: proximaChave++,
  servicoId,
  funcionarioId,
  dataHora,
  valor,
});

export default function Agenda() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();
  const [parametros, setParametros] = useSearchParams();
  const { usuario, administrador } = useAutenticacao();

  // Funcionário só agenda para si mesmo
  const meuFuncionario = administrador ? null : usuario?.funcionarioId ?? null;
  const podeAlterar = (a: IAgendamento) => administrador || a.funcionarioId === meuFuncionario;

  const [clientes, setClientes] = useState<ICliente[]>([]);
  const [servicos, setServicos] = useState<IServico[]>([]);
  const [funcionarios, setFuncionarios] = useState<IFuncionario[]>([]);

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [itens, setItens] = useState<ItemForm[]>(() => [novoItem(proximoHorario(), meuFuncionario)]);
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
  const [lembretesAberto, setLembretesAberto] = useState(false);
  const [bloqueando, setBloqueando] = useState(false);
  const [versaoBloqueios, setVersaoBloqueios] = useState(0);
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
  }, []);

  useEffect(() => {
    loadAgenda();
  }, [loadAgenda]);

  useEffect(() => {
    if (parametros.has("novo")) setParametros({}, { replace: true });
  }, [parametros, setParametros]);

  const duracao = (servicoId: number | null) => servicos.find((s) => s.id === servicoId)?.duracaoMinutos ?? 0;

  const fimDoItem = (item: ItemForm) =>
    item.dataHora ? new Date(item.dataHora.getTime() + duracao(item.servicoId) * 60000) : null;

  const alterarItem = (chave: number, mudanca: Partial<ItemForm>) =>
    setItens((lista) => lista.map((i) => (i.chave === chave ? { ...i, ...mudanca } : i)));

  // Ao escolher o serviço, o valor vem da tabela de preços
  const escolherServico = (chave: number, id: number) => {
    const servico = servicos.find((s) => s.id === id);
    alterarItem(chave, { servicoId: id, valor: servico?.preco ?? null });
  };

  // O próximo serviço começa quando o anterior termina, com a mesma profissional
  const adicionarItem = () =>
    setItens((lista) => {
      const ultimo = lista[lista.length - 1];
      return [...lista, novoItem(fimDoItem(ultimo) ?? ultimo.dataHora, ultimo.funcionarioId)];
    });

  const removerItem = (chave: number) => setItens((lista) => lista.filter((i) => i.chave !== chave));

  const totalItens = itens.reduce((acc, i) => acc + (i.valor ?? 0), 0);

  const limparFormulario = () => {
    setClienteId(null);
    setItens([novoItem(proximoHorario(), meuFuncionario)]);
    setObservacao("");
    setEditandoId(null);
  };

  const fecharFormulario = () => {
    setFormAberto(false);
    if (editandoId) limparFormulario();
  };

  const submit = async () => {
    if (!clienteId) return aviso("Selecione o cliente.");

    for (const [n, i] of itens.entries()) {
      const qual = itens.length > 1 ? ` (serviço ${n + 1})` : "";
      if (!i.servicoId) return aviso(`Selecione o serviço${qual}.`);
      if (!i.funcionarioId) return aviso(`Selecione o profissional${qual}.`);
      if (!i.dataHora) return aviso(`Informe a data e o horário${qual}.`);
      if (!i.valor || i.valor <= 0) return aviso(`Informe um valor válido${qual}.`);
    }

    const obs = observacao.trim() || null;

    try {
      setSalvando(true);
      if (editandoId) {
        const i = itens[0];
        await api.put(`/agendamentos/${editandoId}`, {
          clienteId,
          servicoId: i.servicoId,
          funcionarioId: i.funcionarioId,
          dataHora: paraApiDataHora(i.dataHora!),
          valor: i.valor,
          observacao: obs,
        });
      } else {
        await api.post("/agendamentos/lote", {
          clienteId,
          observacao: obs,
          itens: itens.map((i) => ({
            servicoId: i.servicoId,
            funcionarioId: i.funcionarioId,
            dataHora: paraApiDataHora(i.dataHora!),
            valor: i.valor,
          })),
        });
      }

      sucesso(
        editandoId
          ? "Horário atualizado com sucesso!"
          : itens.length > 1
          ? `${itens.length} serviços marcados com sucesso!`
          : "Horário marcado com sucesso!"
      );

      const diaSalvo = new Date(itens[0].dataHora!);
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
    setItens([novoItem(daApi(a.dataHora), a.funcionarioId, a.servicoId, a.valor)]);
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

  const naoCompareceu = (a: IAgendamento) => {
    confirmDialog({
      message: `Marcar que ${a.cliente} não compareceu (${a.servico})?`,
      header: "Não compareceu",
      icon: "pi pi-user-minus",
      acceptLabel: "Sim, marcar falta",
      rejectLabel: "Não",
      accept: async () => {
        try {
          await api.put(`/agendamentos/${a.id}/nao-compareceu`);
          sucesso("Falta registrada.");
          loadAgenda();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao registrar a falta."));
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
    if (somenteDigitos(novoClienteTelefone).length < 10) return aviso("Informe o telefone do cliente com DDD.");

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
                <div className="texto-pequeno">{formatarTelefone(c.telefone)}</div>
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

      <label className="block mb-2">{itens.length > 1 ? "Serviços" : "Serviço"}</label>
      {itens.map((item, n) => {
        const servico = servicos.find((s) => s.id === item.servicoId);
        const fim = fimDoItem(item);
        return (
          <div key={item.chave} className="item-servico mb-2">
            {itens.length > 1 && (
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="font-semibold">Serviço {n + 1}</span>
                <Button
                  icon="pi pi-times"
                  className="p-button-text p-button-danger p-button-sm p-button-rounded"
                  aria-label="Remover serviço"
                  onClick={() => removerItem(item.chave)}
                />
              </div>
            )}
            <Dropdown
              value={item.funcionarioId}
              onChange={(e) => alterarItem(item.chave, { funcionarioId: e.value })}
              options={administrador ? funcionarios : funcionarios.filter((f) => f.id === meuFuncionario)}
              disabled={!administrador}
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
              className="w-full mb-2"
            />
            <Dropdown
              value={item.servicoId}
              onChange={(e) => escolherServico(item.chave, e.value)}
              options={servicos}
              optionLabel="descricao"
              optionValue="id"
              itemTemplate={servicoTemplate}
              valueTemplate={() => servicoTemplate(servico)}
              placeholder="Selecione o serviço"
              emptyMessage="Cadastre os serviços primeiro"
              className="w-full mb-2"
            />
            <div className="grid">
              <div className="col-7 pb-0">
                <Calendar
                  value={item.dataHora}
                  onChange={(e) => alterarItem(item.chave, { dataHora: e.value ?? null })}
                  showTime
                  hourFormat="24"
                  stepMinute={5}
                  minDate={editandoId ? undefined : hoje()}
                  dateFormat="dd/mm/yy"
                  placeholder="Data e hora"
                  touchUI={mobile}
                  readOnlyInput={mobile}
                  className="w-full"
                />
              </div>
              <div className="col-5 pb-0">
                <InputNumber
                  value={item.valor}
                  onValueChange={(e) => alterarItem(item.chave, { valor: e.value ?? null })}
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                  placeholder="Valor"
                  className="w-full"
                  inputClassName="w-full"
                />
              </div>
            </div>
            {servico && fim && (
              <small className="texto-pequeno block mt-2">
                <i className="pi pi-clock mr-1" style={{ fontSize: "0.75rem" }} />
                {servico.duracaoMinutos} min · término às{" "}
                {fim.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </small>
            )}
          </div>
        );
      })}

      {!editandoId && (
        <Button label="Adicionar outro serviço" icon="pi pi-plus" className="p-button-text p-button-sm" onClick={adicionarItem} />
      )}

      {itens.length > 1 && (
        <div className="flex justify-content-between align-items-center mt-2 font-semibold">
          <span>Total da comanda</span>
          <span className="text-lg">{moeda(totalItens)}</span>
        </div>
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
          label={editandoId ? "Atualizar" : itens.length > 1 ? `Agendar ${itens.length} serviços` : "Agendar"}
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
      <div className="flex gap-2 mb-2">
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
      <div className="flex gap-2 mb-3">
        <Button label="Lembretes" icon="pi pi-whatsapp" className="p-button-outlined p-button-success flex-1" onClick={() => setLembretesAberto(true)} />
        <Button label="Bloquear" icon="pi pi-ban" className="p-button-outlined p-button-secondary flex-1" onClick={() => setBloqueando(true)} />
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
      <Button label="Lembretes" icon="pi pi-whatsapp" className="p-button-outlined p-button-success p-button-sm" onClick={() => setLembretesAberto(true)} />
      <Button label="Bloquear" icon="pi pi-ban" className="p-button-outlined p-button-secondary p-button-sm" onClick={() => setBloqueando(true)} />
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

  const avisosDia = (
    <BloqueiosDia
      dia={dia}
      funcionarios={funcionarios}
      filtroFuncionario={filtroFuncionario}
      versao={versaoBloqueios}
      onRemovido={sucesso}
      onErro={erro}
    />
  );

  const tabela = (
    <TabelaAgendamentos
      agendamentos={agendamentos}
      carregando={carregando}
      onConcluir={setConcluindo}
      onCancelar={cancelar}
      onNaoCompareceu={naoCompareceu}
      onEditar={editar}
      onExcluir={excluir}
      podeAlterar={podeAlterar}
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
          {avisosDia}
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
              {avisosDia}
              {tabela}
            </Card>
          </div>
        </div>
      )}

      <LembretesDialog aberto={lembretesAberto} onFechar={() => setLembretesAberto(false)} />

      <BloqueioDialog
        aberto={bloqueando}
        diaInicial={dia}
        funcionarios={funcionarios}
        onFechar={() => setBloqueando(false)}
        onSalvo={(msg, atencao) => {
          setBloqueando(false);
          setVersaoBloqueios((v) => v + 1);
          if (atencao) aviso(msg);
          else sucesso(msg);
        }}
        onErro={erro}
      />

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
          <InputTelefone value={novoClienteTelefone} onChange={setNovoClienteTelefone} className="w-full" />
        </div>
        <small className="texto-pequeno">Os demais dados podem ser completados depois na tela de Clientes.</small>
      </Dialog>
    </>
  );
}
