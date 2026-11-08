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

        public static string TipoRemuneracao(TipoRemuneracao tipo) => tipo switch
        {
            Entidade.TipoRemuneracao.Diaria => "Diária fixa",
            Entidade.TipoRemuneracao.Comissao => "Comissão",
            Entidade.TipoRemuneracao.DiariaMaisComissao => "Diária + comissão",
            _ => tipo.ToString()
        };
    }
}
