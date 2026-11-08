import { api } from "../services/api";
import { paraApiData } from "./formatters";

export async function baixarBackup() {
  const resposta = await api.get("/backup", { responseType: "blob" });

  const url = URL.createObjectURL(resposta.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gestaosalao-${paraApiData(new Date())}.db`;
  link.click();
  URL.revokeObjectURL(url);
}
