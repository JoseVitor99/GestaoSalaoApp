using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/vales")]
    public class ValesController : ControllerBase
    {
        private readonly RemuneracaoService _service;

        public ValesController(RemuneracaoService service)
        {
            _service = service;
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? funcionarioId, [FromQuery] bool somenteAbertos = false, [FromQuery] DateTime? desde = null) =>
            Ok(await _service.ListarVales(funcionarioId, somenteAbertos, desde));

        [HttpGet("meus")]
        public async Task<IActionResult> Meus()
        {
            var funcionarioId = User.IdFuncionario();
            if (funcionarioId == null)
                return BadRequest("Seu usuário não está vinculado a um funcionário.");

            return Ok(await _service.ListarVales(funcionarioId, false, null));
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpPost]
        public async Task<IActionResult> Create(ValeInputDTO dto)
        {
            try
            {
                return Ok(await _service.CriarVale(dto));
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.ExcluirVale(id);
                return NoContent();
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
