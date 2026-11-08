using System.Security.Claims;
using GestaoSalaoApi.Entidade;

namespace GestaoSalaoApi.Services
{
    public static class UsuarioLogado
    {
        private const string ClaimFuncionario = "funcionarioId";

        public static ClaimsPrincipal CriarPrincipal(Usuario usuario, string esquema)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new(ClaimTypes.Name, usuario.Nome ?? string.Empty),
                new(ClaimTypes.Role, usuario.Perfil.ToString())
            };

            if (usuario.FuncionarioId.HasValue)
                claims.Add(new Claim(ClaimFuncionario, usuario.FuncionarioId.Value.ToString()));

            return new ClaimsPrincipal(new ClaimsIdentity(claims, esquema));
        }

        public static int IdUsuario(this ClaimsPrincipal user) =>
            int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        public static string? Perfil(this ClaimsPrincipal user) => user.FindFirstValue(ClaimTypes.Role);

        public static int? IdFuncionario(this ClaimsPrincipal user) =>
            int.TryParse(user.FindFirstValue(ClaimFuncionario), out var id) ? id : null;
    }
}
