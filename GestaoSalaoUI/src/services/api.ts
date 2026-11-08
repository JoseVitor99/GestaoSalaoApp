import axios from "axios";

export const api = axios.create({
  // Mesmo host da página, para funcionar também pelo celular na rede local
  baseURL: `http://${window.location.hostname}:5100/api`,
});
