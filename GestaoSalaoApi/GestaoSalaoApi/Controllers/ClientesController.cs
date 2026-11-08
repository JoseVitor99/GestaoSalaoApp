using GestaoSalaoApi.Data;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/clientes")]
    public class ClientesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CadastroService _cadastro;
        private readonly AgendamentoService _agendamentos;

        public ClientesController(AppDbContext context, CadastroService cadastro, AgendamentoService agendamentos)
        {
            _context = context;
            _cadastro = cadastro;
            _agendamentos = agendamentos;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? busca)
        {
            var query = _context.Clientes.AsQueryable();

            if (!string.IsNullOrWhiteSpace(busca))
            {
                var termo = $"%{busca.Trim()}%";
                query = query.Where(c => EF.Functions.Like(c.Nome!, termo) || EF.Functions.Like(c.Telefone!, termo));
            }

            var clientes = await query.OrderBy(c => c.Nome).ToListAsync();
            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
                return NotFound("Cliente não encontrado.");

            return Ok(cliente);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Cliente cliente)
        {
            try
            {
                _cadastro.ValidarCliente(cliente);
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }

            cliente.Id = 0;
            cliente.DataCadastro = DateTime.Now;

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return Ok(cliente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Cliente cliente)
        {
            var existente = await _context.Clientes.FindAsync(id);
            if (existente == null)
                return NotFound("Cliente não encontrado.");

            try
            {
                _cadastro.ValidarCliente(cliente);
            }
            catch (RegraNegocioException ex)
            {
                return BadRequest(ex.Message);
            }

            existente.Nome = cliente.Nome;
            existente.Telefone = cliente.Telefone;
            existente.Email = cliente.Email;
            existente.DataNascimento = cliente.DataNascimento;
            existente.Observacoes = cliente.Observacoes;

            await _context.SaveChangesAsync();
            return Ok(existente);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
                return NotFound("Cliente não encontrado.");

            var possuiAgendamentos = await _context.Agendamentos.AnyAsync(a => a.ClienteId == id);
            if (possuiAgendamentos)
                return BadRequest("Este cliente possui agendamentos registrados e não pode ser excluído.");

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/agendamentos")]
        public async Task<IActionResult> GetHistorico(int id)
        {
            var existe = await _context.Clientes.AnyAsync(c => c.Id == id);
            if (!existe)
                return NotFound("Cliente não encontrado.");

            return Ok(await _agendamentos.HistoricoCliente(id));
        }
    }
}
