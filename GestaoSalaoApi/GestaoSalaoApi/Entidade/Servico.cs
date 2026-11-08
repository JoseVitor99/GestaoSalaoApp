using System.ComponentModel.DataAnnotations;

namespace GestaoSalaoApi.Entidade
{
    public class Servico
    {
        public int Id { get; set; }

        [MaxLength(200)]
        [Required(ErrorMessage = "Informe a descrição do serviço.")]
        public string? Descricao { get; set; }

        public decimal Preco { get; set; }

        public int DuracaoMinutos { get; set; }

        public bool Ativo { get; set; } = true;
    }
}
