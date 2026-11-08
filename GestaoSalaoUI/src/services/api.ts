import axios from "axios";

export const api = axios.create({
  // Mesmo host da página, para funcionar também pelo celular na rede local
  baseURL: `http://${window.location.hostname}:5100/api`,
});

let token: string | null = null;
let aoExpirar: (() => void) | null = null;

export function definirToken(novo: string | null) {
  token = novo;
}

export function aoExpirarSessao(callback: () => void) {
  aoExpirar = callback;
}

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401 && token) aoExpirar?.();
    if (erro.response?.status === 403) erro.response.data = "Você não tem permissão para esta ação.";
    return Promise.reject(erro);
  }
);
