using GestaoSalaoApi.Data;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/servicos")]
    public class ServicosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CadastroService _cadastro;

        public ServicosController(AppDbContext context, CadastroService cadastro)
        {
            _context = context;
            _cadastro = cadastro;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] bool somenteAtivos = false)
        {
            var query = _context.Servicos.AsQueryable();

            if (somenteAtivos)
                query = query.Where(s => s.Ativo);

            var servicos = await query.OrderBy(s => s.Descricao).ToListAsync();
            return Ok(servicos);
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpPost]
        public async Task<IActionResult> Create(Servico servico)
        {
            try
            {
                _cadastro.ValidarServico(servico);
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }

            servico.Id = 0;
            _context.Servicos.Add(servico);
            await _context.SaveChangesAsync();

            return Ok(servico);
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Servico servico)
        {
            var existente = await _context.Servicos.FindAsync(id);
            if (existente == null)
                return NotFound("Serviço não encontrado.");

            try
            {
                _cadastro.ValidarServico(servico);
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }

            existente.Descricao = servico.Descricao;
            existente.Preco = servico.Preco;
            existente.DuracaoMinutos = servico.DuracaoMinutos;
            existente.Ativo = servico.Ativo;

            await _context.SaveChangesAsync();
            return Ok(existente);
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var servico = await _context.Servicos.FindAsync(id);
            if (servico == null)
                return NotFound("Serviço não encontrado.");

            var emUso = await _context.Agendamentos.AnyAsync(a => a.ServicoId == id);
            if (emUso)
                return BadRequest("Este serviço já foi usado em agendamentos. Inative-o em vez de excluir.");

            _context.Servicos.Remove(servico);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
