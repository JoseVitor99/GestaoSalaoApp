using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

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

        // Dias da semana de folga, gravados como "1,3" (0 = domingo)
        [MaxLength(20)]
        [JsonIgnore]
        public string? Folgas { get; set; }

        [NotMapped]
        public List<int> DiasFolga
        {
            get => string.IsNullOrWhiteSpace(Folgas) ? new List<int>() : Folgas.Split(',').Select(int.Parse).ToList();
            set => Folgas = value == null || value.Count == 0 ? null : string.Join(",", value.Distinct().OrderBy(d => d));
        }
    }
}
