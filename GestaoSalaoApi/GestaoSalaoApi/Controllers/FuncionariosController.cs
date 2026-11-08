using GestaoSalaoApi.Data;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/funcionarios")]
    public class FuncionariosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CadastroService _cadastro;

        public FuncionariosController(AppDbContext context, CadastroService cadastro)
        {
            _context = context;
            _cadastro = cadastro;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] bool somenteAtivos = false)
        {
            var query = _context.Funcionarios.AsQueryable();

            if (somenteAtivos)
                query = query.Where(f => f.Ativo);

            var funcionarios = await query.OrderBy(f => f.Nome).ToListAsync();
            return Ok(funcionarios);
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpPost]
        public async Task<IActionResult> Create(Funcionario funcionario)
        {
            try
            {
                _cadastro.ValidarFuncionario(funcionario);
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }

            funcionario.Id = 0;
            _context.Funcionarios.Add(funcionario);
            await _context.SaveChangesAsync();

            return Ok(funcionario);
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Funcionario funcionario)
        {
            var existente = await _context.Funcionarios.FindAsync(id);
            if (existente == null)
                return NotFound("Funcionário não encontrado.");

            try
            {
                _cadastro.ValidarFuncionario(funcionario);
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }

            existente.Nome = funcionario.Nome;
            existente.Telefone = funcionario.Telefone;
            existente.Funcao = funcionario.Funcao;
            existente.TipoRemuneracao = funcionario.TipoRemuneracao;
            existente.ValorDiaria = funcionario.ValorDiaria;
            existente.PercentualComissao = funcionario.PercentualComissao;
            existente.Ativo = funcionario.Ativo;
            existente.Folgas = funcionario.Folgas;

            await _context.SaveChangesAsync();
            return Ok(existente);
        }

        [Authorize(Roles = Perfis.Administrador)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var funcionario = await _context.Funcionarios.FindAsync(id);
            if (funcionario == null)
                return NotFound("Funcionário não encontrado.");

            var possuiHistorico =
                await _context.Agendamentos.AnyAsync(a => a.FuncionarioId == id) ||
                await _context.PagamentosDiarios.AnyAsync(p => p.FuncionarioId == id);

            if (possuiHistorico)
                return BadRequest("Este funcionário possui atendimentos ou pagamentos registrados. Inative-o em vez de excluir.");

            _context.Funcionarios.Remove(funcionario);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
