using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UsuarioService _usuarios;

        public AuthController(UsuarioService usuarios)
        {
            _usuarios = usuarios;
        }

        [AllowAnonymous]
        [HttpGet("situacao")]
        public async Task<IActionResult> Situacao() =>
            Ok(new { precisaConfigurar = await _usuarios.PrecisaConfigurar() });

        [AllowAnonymous]
        [HttpPost("primeiro-acesso")]
        public async Task<IActionResult> PrimeiroAcesso(PrimeiroAcessoDTO dto)
        {
            try
            {
                var usuario = await _usuarios.CriarPrimeiroAdministrador(dto);
                return SignIn(UsuarioLogado.CriarPrincipal(usuario, BearerTokenDefaults.AuthenticationScheme), BearerTokenDefaults.AuthenticationScheme);
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // A resposta traz o token: { tokenType, accessToken, expiresIn, refreshToken }
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            var usuario = await _usuarios.Autenticar(dto.Login, dto.Senha);
            if (usuario == null)
                return BadRequest("Usuário ou senha inválidos.");

            return SignIn(UsuarioLogado.CriarPrincipal(usuario, BearerTokenDefaults.AuthenticationScheme), BearerTokenDefaults.AuthenticationScheme);
        }

        [HttpGet("eu")]
        public async Task<IActionResult> Eu()
        {
            var usuario = await _usuarios.Buscar(User.IdUsuario());
            return usuario == null ? Unauthorized() : Ok(usuario);
        }

        [HttpPut("minha-senha")]
        public async Task<IActionResult> AlterarSenha(AlterarSenhaDTO dto)
        {
            try
            {
                await _usuarios.AlterarPropriaSenha(User.IdUsuario(), dto);
                return NoContent();
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
