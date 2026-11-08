import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";

import { api } from "../services/api";
import { useAutenticacao } from "../services/autenticacao";
import { baixarBackup } from "../utilities/backup";
import { iniciais, mensagemErro } from "../utilities/formatters";
import useIsMobile from "../hooks/useIsMobile";

export default function MenuUsuario() {
  const { usuario, administrador, sair } = useAutenticacao();
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const menu = useRef<Menu>(null);
  const toast = useRef<Toast>(null);

  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  if (!usuario) return null;

  const erro = (detail: string) => toast.current?.show({ severity: "error", summary: "Erro", detail, life: 5000 });

  const backup = async () => {
    try {
      await baixarBackup();
      toast.current?.show({ severity: "success", summary: "Backup", detail: "Cópia do banco de dados baixada.", life: 3000 });
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao gerar o backup."));
    }
  };

  const fecharSenha = () => {
    setTrocandoSenha(false);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmacao("");
  };

  const salvarSenha = async () => {
    if (novaSenha !== confirmacao) return erro("As senhas não conferem.");
    try {
      await api.put("/auth/minha-senha", { senhaAtual, novaSenha });
      fecharSenha();
      toast.current?.show({ severity: "success", summary: "Sucesso", detail: "Senha alterada.", life: 3000 });
    } catch (err: any) {
      erro(mensagemErro(err, "Erro ao alterar a senha."));
    }
  };

  const itens: MenuItem[] = [
    {
      template: () => (
        <div className="px-3 py-2">
          <div className="font-semibold text-900">{usuario.nome}</div>
          <div className="texto-pequeno">{usuario.perfilDescricao}</div>
        </div>
      ),
    },
    { separator: true },
    { label: "Alterar senha", icon: "pi pi-key", command: () => setTrocandoSenha(true) },
    ...(administrador
      ? [
          ...(mobile
            ? [
                { label: "Relatórios", icon: "pi pi-chart-line", command: () => navigate("/relatorios") },
                { label: "Serviços", icon: "pi pi-list", command: () => navigate("/servicos") },
              ]
            : []),
          { label: "Horário e bloqueios", icon: "pi pi-clock", command: () => navigate("/horarios") },
          { label: "Usuários", icon: "pi pi-user-edit", command: () => navigate("/usuarios") },
          { label: "Baixar backup", icon: "pi pi-download", command: backup },
        ]
      : []),
    { separator: true },
    { label: "Sair", icon: "pi pi-sign-out", command: sair },
  ];

  return (
    <>
      <Toast ref={toast} />
      <Menu model={itens} popup ref={menu} popupAlignment="right" />
      <Button
        className="botao-usuario p-button-rounded"
        aria-label="Menu do usuário"
        onClick={(e) => menu.current?.toggle(e)}
      >
        {iniciais(usuario.nome)}
      </Button>

      <Dialog
        header="Alterar senha"
        visible={trocandoSenha}
        onHide={fecharSenha}
        style={{ width: "24rem" }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Voltar" className="p-button-text" onClick={fecharSenha} />
            <Button label="Salvar" icon="pi pi-check" className="p-button-success" onClick={salvarSenha} />
          </div>
        }
      >
        <div className="field mb-3">
          <label className="block mb-2">Senha atual</label>
          <Password value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} feedback={false} toggleMask className="w-full" inputClassName="w-full" />
        </div>
        <div className="field mb-3">
          <label className="block mb-2">Nova senha</label>
          <Password value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} feedback={false} toggleMask className="w-full" inputClassName="w-full" />
        </div>
        <div className="field">
          <label className="block mb-2">Confirme a nova senha</label>
          <Password value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} feedback={false} toggleMask className="w-full" inputClassName="w-full" />
        </div>
      </Dialog>
    </>
  );
}
