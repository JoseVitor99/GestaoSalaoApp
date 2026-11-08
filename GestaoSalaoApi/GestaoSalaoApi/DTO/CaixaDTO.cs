namespace GestaoSalaoApi.DTO
{
    public class DespesaInputDTO
    {
        public DateTime Data { get; set; }
        public string? Descricao { get; set; }
        public int Categoria { get; set; }
        public decimal Valor { get; set; }
        public int? FormaPagamento { get; set; }
    }

    public class DespesaDTO
    {
        public int Id { get; set; }
        public DateTime Data { get; set; }
        public string Descricao { get; set; } = string.Empty;
        public int Categoria { get; set; }
        public string CategoriaDescricao { get; set; } = string.Empty;
        public decimal Valor { get; set; }
        public int? FormaPagamento { get; set; }
        public string FormaPagamentoDescricao { get; set; } = string.Empty;
    }

    public class TotalItemDTO
    {
        public string Descricao { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal Total { get; set; }
    }

    public class MovimentoCaixaDTO
    {
        public DateTime Data { get; set; }

        // Entrada, Despesa, Vale ou Pagamento
        public string Tipo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public string? Detalhe { get; set; }
        public string FormaPagamento { get; set; } = string.Empty;
        public decimal Valor { get; set; }
        public bool Entrada { get; set; }
        public int? DespesaId { get; set; }
    }

    public class CaixaDTO
    {
        public DateTime Inicio { get; set; }
        public DateTime Fim { get; set; }

        public decimal Entradas { get; set; }
        public List<TotalItemDTO> EntradasPorForma { get; set; } = new();

        public decimal Despesas { get; set; }
        public List<TotalItemDTO> DespesasPorCategoria { get; set; } = new();
        public decimal Vales { get; set; }
        public decimal Pagamentos { get; set; }
        public decimal Saidas => Despesas + Vales + Pagamentos;

        public decimal Saldo => Entradas - Saidas;

        public List<MovimentoCaixaDTO> Movimentos { get; set; } = new();
    }
}
