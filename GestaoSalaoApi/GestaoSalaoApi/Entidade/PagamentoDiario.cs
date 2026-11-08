namespace GestaoSalaoApi.Entidade
{
    public class PagamentoDiario
    {
        public int Id { get; set; }

        public int FuncionarioId { get; set; }

        public Funcionario? Funcionario { get; set; }

        public DateTime Data { get; set; }

        public int QuantidadeAtendimentos { get; set; }

        public decimal TotalAtendimentos { get; set; }

        public decimal ValorDiaria { get; set; }

        public decimal ValorComissao { get; set; }

        public decimal ValorTotal { get; set; }

        // Vales descontados neste pagamento; o valor entregue é ValorTotal - ValorVales
        public decimal ValorVales { get; set; }

        public DateTime DataPagamento { get; set; }
    }
}
