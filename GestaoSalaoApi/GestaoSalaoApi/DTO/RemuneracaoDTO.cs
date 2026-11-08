namespace GestaoSalaoApi.DTO
{
    public class RemuneracaoDiariaDTO
    {
        public int FuncionarioId { get; set; }
        public string Funcionario { get; set; } = string.Empty;
        public string? Funcao { get; set; }

        public int TipoRemuneracao { get; set; }
        public string TipoRemuneracaoDescricao { get; set; } = string.Empty;
        public decimal PercentualComissao { get; set; }

        public decimal ValorDiariaConfigurada { get; set; }

        public DateTime Data { get; set; }

        public int QuantidadeAtendimentos { get; set; }
        public decimal TotalAtendimentos { get; set; }

        public bool DiariaIncluida { get; set; }

        public decimal ValorDiaria { get; set; }
        public decimal ValorComissao { get; set; }
        public decimal ValorTotal => ValorDiaria + ValorComissao;

        public bool Pago { get; set; }
        public int? PagamentoId { get; set; }
        public DateTime? DataPagamento { get; set; }
    }

    public class PagarRemuneracaoDTO
    {
        public int FuncionarioId { get; set; }
        public DateTime Data { get; set; }

        public bool IncluirDiaria { get; set; } = true;
    }

    public class PagamentoDiarioDTO
    {
        public int Id { get; set; }
        public int FuncionarioId { get; set; }
        public string Funcionario { get; set; } = string.Empty;
        public DateTime Data { get; set; }
        public int QuantidadeAtendimentos { get; set; }
        public decimal TotalAtendimentos { get; set; }
        public decimal ValorDiaria { get; set; }
        public decimal ValorComissao { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DataPagamento { get; set; }
    }
}
