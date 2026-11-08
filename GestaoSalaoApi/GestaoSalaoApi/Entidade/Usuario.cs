using System.ComponentModel.DataAnnotations;

namespace GestaoSalaoApi.Entidade
{
    public enum PerfilUsuario
    {
        Administrador = 1,
        Funcionario = 2
    }

    public static class Perfis
    {
        public const string Administrador = nameof(PerfilUsuario.Administrador);
        public const string Funcionario = nameof(PerfilUsuario.Funcionario);
    }

    public class Usuario
    {
        public int Id { get; set; }

        [MaxLength(200)]
        [Required]
        public string? Nome { get; set; }

        [MaxLength(50)]
        [Required]
        public string? Login { get; set; }

        [MaxLength(200)]
        [Required]
        public string? SenhaHash { get; set; }

        public PerfilUsuario Perfil { get; set; }

        public int? FuncionarioId { get; set; }

        public Funcionario? Funcionario { get; set; }

        public bool Ativo { get; set; } = true;
    }
}
