import { addLocale, locale } from "primereact/api";

export function configurarLocalePtBr() {
  addLocale("pt", {
    firstDayOfWeek: 0,
    dayNames: ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"],
    dayNamesShort: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
    dayNamesMin: ["D", "S", "T", "Q", "Q", "S", "S"],
    monthNames: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
    monthNamesShort: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    today: "Hoje",
    clear: "Limpar",
    accept: "Sim",
    reject: "Não",
    choose: "Escolher",
    cancel: "Cancelar",
    emptyMessage: "Nenhum registro encontrado",
    emptyFilterMessage: "Nenhum resultado encontrado",
    weekHeader: "Sem",
    dateFormat: "dd/mm/yy",
  });

  locale("pt");
}
