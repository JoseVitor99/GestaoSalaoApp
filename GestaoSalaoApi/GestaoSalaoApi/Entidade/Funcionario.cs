using System.ComponentModel.DataAnnotations;

namespace GestaoSalaoApi.Entidade
{
    public enum TipoRemuneracao
    {
        Diaria = 1,
        Comissao = 2,
        DiariaMaisComissao = 3
    }

    public class Funcionario
    {
        public int Id { get; set; }

        [MaxLength(200)]
        [Required(ErrorMessage = "Informe o nome do funcionário.")]
        public string? Nome { get; set; }

        [MaxLength(20)]
        public string? Telefone { get; set; }

        [MaxLength(100)]
        public string? Funcao { get; set; }

        public TipoRemuneracao TipoRemuneracao { get; set; }

        public decimal ValorDiaria { get; set; }

        public decimal PercentualComissao { get; set; }

        public bool Ativo { get; set; } = true;
    }
}
