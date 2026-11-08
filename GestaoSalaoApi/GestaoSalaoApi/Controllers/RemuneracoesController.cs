using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/remuneracoes")]
    public class RemuneracoesController : ControllerBase
    {
        private readonly RemuneracaoService _service;

        public RemuneracoesController(RemuneracaoService service)
        {
            _service = service;
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DateTime? data)
        {
            var result = await _service.CalcularDia(data ?? DateTime.Today);
            return Ok(result);
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpPost("pagar")]
        public async Task<IActionResult> Pagar(PagarRemuneracaoDTO dto)
        {
            try
            {
                return Ok(await _service.Pagar(dto));
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpDelete("pagamentos/{id}")]
        public async Task<IActionResult> Estornar(int id)
        {
            try
            {
                await _service.Estornar(id);
                return NoContent();
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpGet("historico")]
        public async Task<IActionResult> Historico(
            [FromQuery] DateTime? inicio,
            [FromQuery] DateTime? fim,
            [FromQuery] int? funcionarioId)
        {
            var ate = (fim ?? DateTime.Today).Date;
            var de = (inicio ?? ate.AddDays(-30)).Date;

            if (de > ate)
                return BadRequest("O período informado é inválido.");

            return Ok(await _service.Historico(de, ate, funcionarioId));
        }

        [HttpGet("minha")]
        public async Task<IActionResult> Minha([FromQuery] DateTime? data)
        {
            var funcionarioId = User.IdFuncionario();
            if (funcionarioId == null)
                return BadRequest("Seu usuário não está vinculado a um funcionário.");

            var dia = await _service.CalcularDia(data ?? DateTime.Today);
            return Ok(dia.FirstOrDefault(r => r.FuncionarioId == funcionarioId));
        }

        [HttpGet("minha/historico")]
        public async Task<IActionResult> MinhaHistorico([FromQuery] DateTime? inicio, [FromQuery] DateTime? fim)
        {
            var funcionarioId = User.IdFuncionario();
            if (funcionarioId == null)
                return BadRequest("Seu usuário não está vinculado a um funcionário.");

            var ate = (fim ?? DateTime.Today).Date;
            var de = (inicio ?? ate.AddDays(-30)).Date;

            if (de > ate)
                return BadRequest("O período informado é inválido.");

            return Ok(await _service.Historico(de, ate, funcionarioId));
        }
    }
}
