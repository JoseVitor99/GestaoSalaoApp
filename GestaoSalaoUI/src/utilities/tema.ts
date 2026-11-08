export type Tema = "claro" | "escuro";

const CHAVE = "tema";

const arquivos: Record<Tema, () => Promise<{ default: string }>> = {
  claro: () => import("primereact/resources/themes/lara-light-pink/theme.css?inline"),
  escuro: () => import("primereact/resources/themes/lara-dark-pink/theme.css?inline"),
};

export function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

export function temaAtual(): Tema {
  return document.documentElement.dataset.tema === "escuro" ? "escuro" : "claro";
}

export async function aplicarTema(tema: Tema) {
  const css = (await arquivos[tema]()).default;

  // O tema fica no início do <head> para que o index.css continue sobrescrevendo o que precisa
  let estilo = document.getElementById("tema-primereact") as HTMLStyleElement | null;
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = "tema-primereact";
    document.head.prepend(estilo);
  }
  estilo.textContent = css;

  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tema === "escuro" ? "#111827" : "#ec4899");

  try {
    localStorage.setItem(CHAVE, tema);
  } catch {}
}
