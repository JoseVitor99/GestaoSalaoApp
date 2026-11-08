using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/relatorios")]
    [Authorize(Roles = Perfis.Administrador)]
    public class RelatoriosController : ControllerBase
    {
        private readonly RelatorioService _service;

        public RelatoriosController(RelatorioService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DateTime? inicio, [FromQuery] DateTime? fim)
        {
            var ate = DateTime.SpecifyKind((fim ?? DateTime.Today).Date, DateTimeKind.Unspecified);
            var de = DateTime.SpecifyKind((inicio ?? new DateTime(ate.Year, ate.Month, 1)).Date, DateTimeKind.Unspecified);

            if (de > ate)
                return BadRequest("O período informado é inválido.");

            if ((ate - de).TotalDays > 366)
                return BadRequest("Escolha um período de até um ano.");

            return Ok(await _service.Periodo(de, ate));
        }

        [HttpGet("clientes-sumidos")]
        public async Task<IActionResult> ClientesSumidos([FromQuery] int dias = 60) =>
            Ok(await _service.ClientesSumidos(Math.Clamp(dias, 7, 365)));

        [HttpGet("aniversariantes")]
        public async Task<IActionResult> Aniversariantes([FromQuery] int? mes) =>
            Ok(await _service.Aniversariantes(Math.Clamp(mes ?? DateTime.Today.Month, 1, 12)));
    }
}
