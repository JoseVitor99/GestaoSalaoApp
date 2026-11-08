namespace GestaoSalaoApi.DTO
{
    public class AgendamentoInputDTO
    {
        public int ClienteId { get; set; }
        public int FuncionarioId { get; set; }
        public int ServicoId { get; set; }
        public DateTime DataHora { get; set; }

        public decimal? Valor { get; set; }

        public string? Observacao { get; set; }
    }

    public class AgendamentoLoteDTO
    {
        public int ClienteId { get; set; }
        public string? Observacao { get; set; }
        public List<ItemAgendamentoDTO> Itens { get; set; } = new();
    }

    public class ItemAgendamentoDTO
    {
        public int ServicoId { get; set; }
        public int FuncionarioId { get; set; }
        public DateTime DataHora { get; set; }
        public decimal? Valor { get; set; }
    }

    public class FecharComandaDTO
    {
        public int FormaPagamento { get; set; }
        public List<ItemComandaDTO> Itens { get; set; } = new();
    }

    public class ItemComandaDTO
    {
        public int AgendamentoId { get; set; }
        public decimal? Valor { get; set; }
    }

    public class ConcluirAgendamentoDTO
    {
        public int FormaPagamento { get; set; }

        public decimal? Valor { get; set; }
    }

    public class AgendamentoDTO
    {
        public int Id { get; set; }

        public int ClienteId { get; set; }
        public string Cliente { get; set; } = string.Empty;
        public string ClienteTelefone { get; set; } = string.Empty;

        public int FuncionarioId { get; set; }
        public string Funcionario { get; set; } = string.Empty;

        public int ServicoId { get; set; }
        public string Servico { get; set; } = string.Empty;

        public DateTime DataHora { get; set; }
        public DateTime DataHoraFim { get; set; }
        public int DuracaoMinutos { get; set; }

        public decimal Valor { get; set; }

        public int Status { get; set; }
        public string StatusDescricao { get; set; } = string.Empty;

        public int? FormaPagamento { get; set; }
        public string FormaPagamentoDescricao { get; set; } = string.Empty;

        public string? Observacao { get; set; }
    }
}
