using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Authorize(Roles = Perfis.Administrador)]
    public class CaixaController : ControllerBase
    {
        private readonly CaixaService _service;

        public CaixaController(CaixaService service)
        {
            _service = service;
        }

        [HttpGet("api/caixa")]
        public async Task<IActionResult> Get([FromQuery] DateTime? inicio, [FromQuery] DateTime? fim)
        {
            var de = (inicio ?? DateTime.Today).Date;
            var ate = (fim ?? de).Date;

            if (ate < de)
                return BadRequest("O período informado é inválido.");

            return Ok(await _service.Resumo(de, ate));
        }

        [HttpGet("api/despesas/{id}")]
        public Task<IActionResult> GetDespesa(int id) => Executar(() => _service.BuscarDespesa(id));

        [HttpPost("api/despesas")]
        public Task<IActionResult> Create(DespesaInputDTO dto) => Executar(() => _service.CriarDespesa(dto));

        [HttpPut("api/despesas/{id}")]
        public Task<IActionResult> Update(int id, DespesaInputDTO dto) => Executar(() => _service.EditarDespesa(id, dto));

        [HttpDelete("api/despesas/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.ExcluirDespesa(id);
                return NoContent();
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private async Task<IActionResult> Executar(Func<Task<DespesaDTO>> operacao)
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
