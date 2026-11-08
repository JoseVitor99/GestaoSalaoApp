using System.ComponentModel.DataAnnotations;

namespace GestaoSalaoApi.Entidade
{
    public enum CategoriaDespesa
    {
        Produtos = 1,
        Aluguel = 2,
        Contas = 3,
        Manutencao = 4,
        Outros = 5
    }

    public class Despesa
    {
        public int Id { get; set; }

        public DateTime Data { get; set; }

        [MaxLength(200)]
        public string? Descricao { get; set; }

        public CategoriaDespesa Categoria { get; set; }

        public decimal Valor { get; set; }

        public FormaPagamento? FormaPagamento { get; set; }

        public DateTime DataRegistro { get; set; }
    }
}
