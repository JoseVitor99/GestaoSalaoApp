using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/bloqueios")]
    public class BloqueiosController : ControllerBase
    {
        private readonly AgendaService _service;

        public BloqueiosController(AgendaService service)
        {
            _service = service;
        }

        // Funcionário fica restrito à própria agenda
        private int? Restricao => User.IsInRole(Perfis.Administrador) ? null : User.IdFuncionario() ?? 0;

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DateTime? inicio, [FromQuery] DateTime? fim, [FromQuery] int? funcionarioId)
        {
            var de = (inicio ?? DateTime.Today).Date;
            var ate = (fim ?? de).Date.AddDays(1);
            return Ok(await _service.ListarBloqueios(de, ate, funcionarioId));
        }

        [HttpPost]
        public async Task<IActionResult> Create(BloqueioInputDTO dto)
        {
            try
            {
                return Ok(await _service.CriarBloqueio(dto, Restricao));
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.ExcluirBloqueio(id, Restricao);
                return NoContent();
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
