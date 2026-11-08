using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/horarios")]
    public class HorariosController : ControllerBase
    {
        private readonly AgendaService _service;

        public HorariosController(AgendaService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get() => Ok(await _service.ListarHorarios());

        [Authorize(Roles = Perfis.Administrador)]
        [HttpPut]
        public async Task<IActionResult> Put(List<HorarioFuncionamentoDTO> horarios)
        {
            try
            {
                return Ok(await _service.SalvarHorarios(horarios));
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
