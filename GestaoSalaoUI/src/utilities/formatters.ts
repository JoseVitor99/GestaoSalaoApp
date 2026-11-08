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

export const somenteDigitos = (valor: string | null | undefined) => (valor ?? "").replace(/\D/g, "").slice(0, 11);

// Máscara aplicada enquanto digita: (XX) X XXXX-XXXX, ou (XX) XXXX-XXXX para fixo
export const mascaraTelefone = (valor: string | null | undefined) => {
  const d = somenteDigitos(valor);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;

  const numero = d.slice(2);
  let texto = `(${d.slice(0, 2)}) ${numero.slice(0, 1)}`;
  if (numero.length > 1) texto += ` ${numero.slice(1, 5)}`;
  if (numero.length > 5) texto += `-${numero.slice(5)}`;
  return texto;
};

export const formatarTelefone = (valor: string | null | undefined) => {
  const d = (valor ?? "").replace(/\D/g, "");
  return d.length === 10 || d.length === 11 ? mascaraTelefone(d) : valor ?? "";
};

export const linkTelefone = (telefone: string) => `tel:${telefone.replace(/\D/g, "")}`;

// Telefones com DDD recebem o código do Brasil (55)
export const linkWhatsApp = (telefone: string, mensagem?: string) => {
  let digitos = telefone.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  return `https://wa.me/${digitos}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
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
