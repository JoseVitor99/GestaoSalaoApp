using System.ComponentModel.DataAnnotations;

namespace GestaoSalaoApi.Entidade
{
    // Adiantamento ao funcionário, descontado no próximo pagamento
    public class Vale
    {
        public int Id { get; set; }

        public int FuncionarioId { get; set; }
        public Funcionario? Funcionario { get; set; }

        public DateTime Data { get; set; }

        public decimal Valor { get; set; }

        [MaxLength(200)]
        public string? Observacao { get; set; }

        // Preenchido quando o vale é descontado num pagamento
        public int? PagamentoId { get; set; }
        public PagamentoDiario? Pagamento { get; set; }

        public DateTime DataRegistro { get; set; }
    }
}
