using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Services;
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

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DateTime? data)
        {
            var result = await _service.CalcularDia(data ?? DateTime.Today);
            return Ok(result);
        }

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
    }
}
