import { FormEvent, useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";

import { api } from "../services/api";
import { useAutenticacao } from "../services/autenticacao";
import { NOME_APP, NOME_CLIENTE } from "../utilities/constants";
import { mensagemErro } from "../utilities/formatters";

export default function Login() {
  const { entrar } = useAutenticacao();

  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [nome, setNome] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .get("/auth/situacao")
      .then((r) => setPrimeiroAcesso(!!r.data?.precisaConfigurar))
      .catch((err) => setErro(mensagemErro(err, "Não foi possível conectar à API.")));
  }, []);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");

    if (primeiroAcesso) {
      if (!nome.trim()) return setErro("Informe o seu nome.");
      if (senha !== confirmacao) return setErro("As senhas não conferem.");
    }
    if (!login.trim() || !senha) return setErro("Informe o usuário e a senha.");

    try {
      setEnviando(true);
      const rota = primeiroAcesso ? "/auth/primeiro-acesso" : "/auth/login";
      const corpo = primeiroAcesso ? { nome, login, senha } : { login, senha };
      const resposta = await api.post(rota, corpo);
      await entrar(resposta.data.accessToken);
    } catch (err: any) {
      setErro(mensagemErro(err, "Não foi possível entrar."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="tela-login">
      <form className="cartao-login" onSubmit={enviar}>
        <div className="flex flex-column align-items-center mb-4">
          <span className="marca-icone mb-3" style={{ width: 56, height: 56, fontSize: "1.5rem" }}>
            <i className="pi pi-star-fill" style={{ fontSize: "1.4rem" }} />
          </span>
          <div className="text-2xl font-bold text-900">{NOME_APP}</div>
          <div className="texto-pequeno">{NOME_CLIENTE}</div>
        </div>

        {primeiroAcesso && (
          <Message
            severity="info"
            className="w-full mb-3 justify-content-start"
            text="Primeiro acesso: crie o usuário administrador do sistema."
          />
        )}

        {primeiroAcesso && (
          <div className="field mb-3">
            <label className="block mb-2">Seu nome</label>
            <InputText value={nome} onChange={(e) => setNome(e.target.value)} className="w-full" autoComplete="name" />
          </div>
        )}

        <div className="field mb-3">
          <label className="block mb-2">Usuário</label>
          <InputText
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
          />
        </div>

        <div className="field mb-3">
          <label className="block mb-2">Senha</label>
          <Password
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            feedback={false}
            toggleMask
            className="w-full"
            inputClassName="w-full"
            autoComplete={primeiroAcesso ? "new-password" : "current-password"}
          />
        </div>

        {primeiroAcesso && (
          <div className="field mb-3">
            <label className="block mb-2">Confirme a senha</label>
            <Password
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
              autoComplete="new-password"
            />
          </div>
        )}

        {erro && <Message severity="error" className="w-full mb-3 justify-content-start" text={erro} />}

        <Button
          type="submit"
          label={primeiroAcesso ? "Criar administrador e entrar" : "Entrar"}
          icon="pi pi-sign-in"
          className="w-full"
          loading={enviando}
        />
      </form>
    </div>
  );
}
