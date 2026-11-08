using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/agendamentos")]
    public class AgendamentosController : ControllerBase
    {
        private readonly AgendamentoService _service;

        public AgendamentosController(AgendamentoService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] DateTime? data,
            [FromQuery] DateTime? inicio,
            [FromQuery] DateTime? fim,
            [FromQuery] int? funcionarioId,
            [FromQuery] int? clienteId)
        {
            var de = (inicio ?? data ?? DateTime.Today).Date;
            var ate = (fim ?? data ?? de).Date.AddDays(1);

            if (ate <= de)
                return BadRequest("O período informado é inválido.");

            var result = await _service.Listar(de, ate, funcionarioId, clienteId);
            return Ok(result);
        }

        [HttpPost]
        public Task<IActionResult> Create(AgendamentoInputDTO dto) =>
            Executar(() => _service.Criar(dto));

        [HttpPut("{id}")]
        public Task<IActionResult> Update(int id, AgendamentoInputDTO dto) =>
            Executar(() => _service.Editar(id, dto));

        [HttpPut("{id}/concluir")]
        public Task<IActionResult> Concluir(int id, ConcluirAgendamentoDTO dto) =>
            Executar(() => _service.Concluir(id, dto));

        [HttpPut("{id}/cancelar")]
        public Task<IActionResult> Cancelar(int id) =>
            Executar(() => _service.Cancelar(id));

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.Excluir(id);
                return NoContent();
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private async Task<IActionResult> Executar(Func<Task<AgendamentoDTO>> operacao)
        {
            try
            {
                return Ok(await operacao());
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
