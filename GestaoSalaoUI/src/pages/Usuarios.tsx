import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import { api } from "../services/api";
import { useAutenticacao } from "../services/autenticacao";
import FormularioResponsivo from "../components/FormularioResponsivo";
import BotaoNovo from "../components/BotaoNovo";
import useIsMobile from "../hooks/useIsMobile";
import IUsuario from "../interfaces/IUsuario";
import IFuncionario from "../interfaces/IFuncionario";
import { PERFIL, PERFIS } from "../utilities/constants";
import { iniciais, mensagemErro } from "../utilities/formatters";

export default function Usuarios() {
  const toast = useRef<Toast>(null);
  const mobile = useIsMobile();
  const { usuario: logado } = useAutenticacao();

  const [formAberto, setFormAberto] = useState(false);

  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [funcionarios, setFuncionarios] = useState<IFuncionario[]>([]);

  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<number>(PERFIL.FUNCIONARIO);
  const [funcionarioId, setFuncionarioId] = useState<number | null>(null);
  const [ativo, setAtivo] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const aviso = (detail: string) => toast.current?.show({ severity: "warn", summary: "Atenção", detail, life: 3000 });
  const sucesso = (detail: string) => toast.current?.show({ severity: "success", summary: "Sucesso", detail, life: 3000 });
  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const load = async () => {
    try {
      const [u, f] = await Promise.all([api.get("/usuarios"), api.get("/funcionarios")]);
      setUsuarios(u.data || []);
      setFuncionarios(f.data || []);
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao carregar usuários."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const limpar = () => {
    setNome("");
    setLogin("");
    setSenha("");
    setPerfil(PERFIL.FUNCIONARIO);
    setFuncionarioId(null);
    setAtivo(true);
    setEditandoId(null);
  };

  // Ao escolher o funcionário, o nome é preenchido se ainda estiver vazio
  const escolherFuncionario = (id: number | null) => {
    setFuncionarioId(id);
    const f = funcionarios.find((x) => x.id === id);
    if (f && !nome.trim()) setNome(f.nome);
  };

  const submit = async () => {
    if (!nome.trim()) return aviso("Informe o nome.");
    if (!login.trim()) return aviso("Informe o usuário (login).");
    if (!editandoId && senha.length < 6) return aviso("A senha deve ter pelo menos 6 caracteres.");
    if (perfil === PERFIL.FUNCIONARIO && !funcionarioId) return aviso("Selecione o funcionário vinculado.");

    const corpo = { nome, login, senha: senha || null, perfil, funcionarioId, ativo };

    try {
      if (editandoId) {
        await api.put(`/usuarios/${editandoId}`, corpo);
      } else {
        await api.post("/usuarios", corpo);
      }
      sucesso(`Usuário ${editandoId ? "atualizado" : "cadastrado"} com sucesso!`);
      limpar();
      setFormAberto(false);
      load();
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao salvar usuário."));
    }
  };

  const editar = (u: IUsuario) => {
    setEditandoId(u.id);
    setNome(u.nome);
    setLogin(u.login);
    setSenha("");
    setPerfil(u.perfil);
    setFuncionarioId(u.funcionarioId ?? null);
    setAtivo(u.ativo);
    setFormAberto(true);
    if (!mobile) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remover = (u: IUsuario) => {
    confirmDialog({
      message: `Excluir o usuário ${u.nome}? A pessoa não conseguirá mais entrar no sistema.`,
      header: "Confirmação",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim",
      rejectLabel: "Não",
      acceptClassName: "p-button-danger",
      rejectClassName: "p-button-secondary",
      accept: async () => {
        try {
          await api.delete(`/usuarios/${u.id}`);
          sucesso("Usuário excluído.");
          if (editandoId === u.id) limpar();
          load();
        } catch (err: any) {
          erro(mensagemErro(err, "Erro ao excluir usuário."));
        }
      },
    });
  };

  const perfilTag = (u: IUsuario) => (
    <Tag value={u.perfilDescricao} severity={u.perfil === PERFIL.ADMINISTRADOR ? "info" : undefined} rounded />
  );

  const situacaoTag = (u: IUsuario) => (
    <Tag value={u.ativo ? "Ativo" : "Inativo"} severity={u.ativo ? "success" : "secondary"} rounded />
  );

  const formulario = (
    <>
      {editandoId && (
        <div className="mb-3 text-orange-500 font-semibold">
          <i className="pi pi-pencil mr-2" />
          Editando usuário...
        </div>
      )}

      <div className="field mb-3">
        <label className="block mb-2">Perfil</label>
        <Dropdown
          value={perfil}
          onChange={(e) => setPerfil(e.value)}
          options={PERFIS}
          optionLabel="descricao"
          optionValue="value"
          className="w-full"
        />
        <small className="texto-pequeno block mt-1">
          {perfil === PERFIL.ADMINISTRADOR
            ? "Acesso completo: painel, remuneração, cadastros, usuários e backup."
            : "Acesso à agenda, aos clientes e aos próprios ganhos."}
        </small>
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Funcionário vinculado{perfil === PERFIL.ADMINISTRADOR && " (opcional)"}</label>
        <Dropdown
          value={funcionarioId}
          onChange={(e) => escolherFuncionario(e.value ?? null)}
          options={funcionarios}
          optionLabel="nome"
          optionValue="id"
          placeholder="Selecione"
          showClear
          className="w-full"
        />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Nome</label>
        <InputText value={nome} onChange={(e) => setNome(e.target.value)} className="w-full" maxLength={200} />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">Usuário (login)</label>
        <InputText
          value={login}
          onChange={(e) => setLogin(e.target.value.toLowerCase())}
          className="w-full"
          placeholder="ex.: joana"
          autoCapitalize="none"
          maxLength={50}
        />
      </div>

      <div className="field mb-3">
        <label className="block mb-2">{editandoId ? "Nova senha (deixe em branco para manter)" : "Senha"}</label>
        <Password
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          feedback={false}
          toggleMask
          className="w-full"
          inputClassName="w-full"
          autoComplete="new-password"
        />
      </div>

      <div className="field mb-4 flex align-items-center gap-2">
        <InputSwitch checked={ativo} onChange={(e) => setAtivo(!!e.value)} />
        <span>{ativo ? "Ativo (pode entrar no sistema)" : "Inativo"}</span>
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
      {usuarios.map((u) => (
        <div key={u.id} className={`item-lista ${u.ativo ? "" : "opacity-60"}`}>
          <div className="flex align-items-center gap-3">
            <span className="avatar-iniciais">{iniciais(u.nome)}</span>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div className="item-titulo">
                {u.nome}
                {u.id === logado?.id && <span className="texto-pequeno"> (você)</span>}
              </div>
              <div className="texto-pequeno mt-1">
                {u.login}
                {u.funcionario && ` · ${u.funcionario}`}
              </div>
            </div>
            {perfilTag(u)}
          </div>
          <div className="item-acoes">
            <Button label="Editar" icon="pi pi-pencil" className="p-button-outlined p-button-warning" onClick={() => editar(u)} />
            {u.id !== logado?.id && (
              <Button icon="pi pi-trash" className="p-button-outlined p-button-danger" aria-label="Excluir" onClick={() => remover(u)} />
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
          <div className="titulo-pagina mb-3">Usuários</div>
          {listaMobile}
          <FormularioResponsivo
            titulo={editandoId ? "Editar usuário" : "Novo usuário"}
            aberto={formAberto}
            onFechar={() => {
              setFormAberto(false);
              if (editandoId) limpar();
            }}
          >
            {formulario}
          </FormularioResponsivo>
          <BotaoNovo label="Novo usuário" icon="pi pi-user-plus" onClick={() => setFormAberto(true)} />
        </>
      ) : (
        <div className="grid">
          <div className="col-12 lg:col-4">
            <FormularioResponsivo titulo={editandoId ? "Editar usuário" : "Cadastro de usuários"} aberto={formAberto} onFechar={() => setFormAberto(false)}>
              {formulario}
            </FormularioResponsivo>
          </div>

          <div className="col-12 lg:col-8">
            <Card title="Usuários do sistema">
              <DataTable value={usuarios} className="p-datatable-sm" emptyMessage="Nenhum usuário cadastrado">
                <Column
                  header="Nome"
                  body={(u: IUsuario) => (
                    <span>
                      {u.nome}
                      {u.id === logado?.id && <span className="texto-pequeno"> (você)</span>}
                    </span>
                  )}
                />
                <Column field="login" header="Usuário" />
                <Column header="Perfil" body={perfilTag} />
                <Column header="Funcionário" body={(u: IUsuario) => u.funcionario ?? <span className="texto-pequeno">—</span>} />
                <Column header="Situação" body={situacaoTag} />
                <Column
                  header="Ações"
                  style={{ width: "120px" }}
                  body={(u: IUsuario) => (
                    <div className="flex gap-2">
                      <Button icon="pi pi-pencil" className="p-button-warning p-button-sm" onClick={() => editar(u)} />
                      {u.id !== logado?.id && (
                        <Button icon="pi pi-trash" className="p-button-danger p-button-sm" onClick={() => remover(u)} />
                      )}
                    </div>
                  )}
                />
              </DataTable>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
