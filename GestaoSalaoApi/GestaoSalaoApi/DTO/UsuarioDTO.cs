namespace GestaoSalaoApi.DTO
{
    public class LoginDTO
    {
        public string? Login { get; set; }
        public string? Senha { get; set; }
    }

    public class PrimeiroAcessoDTO
    {
        public string? Nome { get; set; }
        public string? Login { get; set; }
        public string? Senha { get; set; }
    }

    public class AlterarSenhaDTO
    {
        public string? SenhaAtual { get; set; }
        public string? NovaSenha { get; set; }
    }

    public class UsuarioInputDTO
    {
        public string? Nome { get; set; }
        public string? Login { get; set; }

        // Obrigatória ao criar; na edição, vazia mantém a senha atual
        public string? Senha { get; set; }

        public int Perfil { get; set; }
        public int? FuncionarioId { get; set; }
        public bool Ativo { get; set; } = true;
    }

    public class UsuarioDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Login { get; set; } = string.Empty;
        public int Perfil { get; set; }
        public string PerfilDescricao { get; set; } = string.Empty;
        public int? FuncionarioId { get; set; }
        public string? Funcionario { get; set; }
        public bool Ativo { get; set; }
    }
}
