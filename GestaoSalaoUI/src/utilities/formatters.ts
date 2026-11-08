const pad = (n: number) => String(n).padStart(2, "0");

export const moeda = (valor: number | null | undefined) =>
  (valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// A API usa horário local sem fuso; toISOString() converteria para UTC
export const paraApiData = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const paraApiDataHora = (d: Date) =>
  `${paraApiData(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

export const daApi = (valor: string) => new Date(valor.length === 10 ? `${valor}T00:00:00` : valor);

export const hora = (valor: string) =>
  daApi(valor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const data = (valor: string) => daApi(valor).toLocaleDateString("pt-BR");

export const dataExtenso = (d: Date) => {
  const texto = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const mesmoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const somarDias = (d: Date, dias: number) => {
  const nova = new Date(d);
  nova.setDate(nova.getDate() + dias);
  return nova;
};

export const hoje = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const linkTelefone = (telefone: string) => `tel:${telefone.replace(/\D/g, "")}`;

// Telefones com DDD recebem o código do Brasil (55)
export const linkWhatsApp = (telefone: string) => {
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  return `https://wa.me/${digitos}`;
};

export const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

export const mensagemErro = (err: any, padrao: string): string => {
  if (!err?.response) return "Não foi possível conectar à API. Verifique se ela está em execução.";

  const dados = err.response.data;
  if (typeof dados === "string" && dados.trim()) return dados;

  if (dados?.errors) {
    const mensagens = Object.values(dados.errors as Record<string, string[]>).flat();
    if (mensagens.length) return mensagens.join(" ");
  }

  return padrao;
};
