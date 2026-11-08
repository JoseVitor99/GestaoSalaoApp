import { IBloqueio } from "../interfaces/IAgenda";
import { daApi, mesmoDia, somarDias } from "./formatters";

const hhmm = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const ddmm = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const meiaNoite = (d: Date) => d.getHours() === 0 && d.getMinutes() === 0;

// Texto do período completo, ex.: "12/11 · 12:00 às 13:00" ou "20/12 a 05/01"
export const periodoBloqueio = (b: IBloqueio) => {
  const inicio = daApi(b.inicio);
  const fim = daApi(b.fim);
  if (meiaNoite(inicio) && meiaNoite(fim)) {
    const ultimo = somarDias(fim, -1);
    return mesmoDia(inicio, ultimo) ? `${ddmm(inicio)} · dia inteiro` : `${ddmm(inicio)} a ${ddmm(ultimo)}`;
  }
  return mesmoDia(inicio, fim) ? `${ddmm(inicio)} · ${hhmm(inicio)} às ${hhmm(fim)}` : `${ddmm(inicio)} ${hhmm(inicio)} a ${ddmm(fim)} ${hhmm(fim)}`;
};

// Texto do período visto de um dia da agenda, ex.: "12:00 às 13:00" ou "Dia inteiro"
export const periodoNoDia = (b: IBloqueio, dia: Date) => {
  const inicio = daApi(b.inicio);
  const fim = daApi(b.fim);
  const abreDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const fechaDia = somarDias(abreDia, 1);
  if (inicio <= abreDia && fim >= fechaDia) return "Dia inteiro";
  const de = inicio < abreDia ? abreDia : inicio;
  const ate = fim > fechaDia ? fechaDia : fim;
  return `${hhmm(de)} às ${fim > fechaDia ? "fim do dia" : hhmm(ate)}`;
};
