import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { api, aoExpirarSessao, definirToken } from "./api";
import IUsuario from "../interfaces/IUsuario";
import { PERFIL } from "../utilities/constants";

const CHAVE = "sessao";

interface Autenticacao {
  usuario: IUsuario | null;
  carregando: boolean;
  administrador: boolean;
  entrar: (accessToken: string) => Promise<void>;
  sair: () => void;
}

const Contexto = createContext<Autenticacao | null>(null);

function lerToken(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

function gravarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CHAVE, token);
    else localStorage.removeItem(CHAVE);
  } catch {}
}

export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<IUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const sair = useCallback(() => {
    definirToken(null);
    gravarToken(null);
    setUsuario(null);
  }, []);

  const entrar = useCallback(async (accessToken: string) => {
    definirToken(accessToken);
    const resposta = await api.get<IUsuario>("/auth/eu");
    gravarToken(accessToken);
    setUsuario(resposta.data);
  }, []);

  useEffect(() => {
    aoExpirarSessao(sair);

    const salvo = lerToken();
    if (!salvo) {
      setCarregando(false);
      return;
    }

    entrar(salvo)
      .catch(sair)
      .finally(() => setCarregando(false));
  }, [entrar, sair]);

  return (
    <Contexto.Provider
      value={{ usuario, carregando, administrador: usuario?.perfil === PERFIL.ADMINISTRADOR, entrar, sair }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useAutenticacao() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useAutenticacao precisa estar dentro de AutenticacaoProvider");
  return contexto;
}
