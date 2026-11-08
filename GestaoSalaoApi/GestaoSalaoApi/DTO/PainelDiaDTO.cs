namespace GestaoSalaoApi.DTO
{
    public class PainelDiaDTO
    {
        public DateTime Data { get; set; }

        public int TotalAgendamentos { get; set; }
        public int Pendentes { get; set; }
        public int Concluidos { get; set; }
        public int Cancelados { get; set; }

        public decimal Faturamento { get; set; }

        public decimal PrevisaoPendentes { get; set; }

        public decimal TicketMedio { get; set; }

        public List<TotalFormaPagamentoDTO> PorFormaPagamento { get; set; } = new();
    }

    public class TotalFormaPagamentoDTO
    {
        public int FormaPagamento { get; set; }
        public string Descricao { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal Total { get; set; }
    }
}
