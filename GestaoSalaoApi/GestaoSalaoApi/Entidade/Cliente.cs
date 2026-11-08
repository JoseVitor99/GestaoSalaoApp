using System.ComponentModel.DataAnnotations;

namespace GestaoSalaoApi.Entidade
{
    public class Cliente
    {
        public int Id { get; set; }

        [MaxLength(200)]
        [Required(ErrorMessage = "Informe o nome do cliente.")]
        public string? Nome { get; set; }

        [MaxLength(20)]
        [Required(ErrorMessage = "Informe o telefone do cliente.")]
        public string? Telefone { get; set; }

        [MaxLength(200)]
        public string? Email { get; set; }

        public DateTime? DataNascimento { get; set; }

        [MaxLength(500)]
        public string? Observacoes { get; set; }

        public DateTime DataCadastro { get; set; }
    }
}
