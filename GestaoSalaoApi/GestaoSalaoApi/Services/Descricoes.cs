using GestaoSalaoApi.Entidade;

namespace GestaoSalaoApi.Services
{
    public static class Descricoes
    {
        public static string Status(StatusAgendamento status) => status switch
        {
            StatusAgendamento.Agendado => "Agendado",
            StatusAgendamento.Concluido => "Concluído",
            StatusAgendamento.Cancelado => "Cancelado",
            StatusAgendamento.NaoCompareceu => "Não compareceu",
            _ => status.ToString()
        };

        public static string FormaPagamento(FormaPagamento? forma) => forma switch
        {
            Entidade.FormaPagamento.Dinheiro => "Dinheiro",
            Entidade.FormaPagamento.Pix => "Pix",
            Entidade.FormaPagamento.CartaoDebito => "Cartão de débito",
            Entidade.FormaPagamento.CartaoCredito => "Cartão de crédito",
            null => string.Empty,
            _ => forma.ToString() ?? string.Empty
        };

        public static string CategoriaDespesa(CategoriaDespesa categoria) => categoria switch
        {
            Entidade.CategoriaDespesa.Produtos => "Produtos",
            Entidade.CategoriaDespesa.Aluguel => "Aluguel",
            Entidade.CategoriaDespesa.Contas => "Contas (luz, água, internet)",
            Entidade.CategoriaDespesa.Manutencao => "Manutenção",
            _ => "Outros"
        };

        public static string DiaSemana(DayOfWeek dia) => dia switch
        {
            DayOfWeek.Sunday => "domingo",
            DayOfWeek.Monday => "segunda-feira",
            DayOfWeek.Tuesday => "terça-feira",
            DayOfWeek.Wednesday => "quarta-feira",
            DayOfWeek.Thursday => "quinta-feira",
            DayOfWeek.Friday => "sexta-feira",
            _ => "sábado"
        };

        public static string TipoRemuneracao(TipoRemuneracao tipo) => tipo switch
        {
            Entidade.TipoRemuneracao.Diaria => "Diária fixa",
            Entidade.TipoRemuneracao.Comissao => "Comissão",
            Entidade.TipoRemuneracao.DiariaMaisComissao => "Diária + comissão",
            _ => tipo.ToString()
        };
    }
}
