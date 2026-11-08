using GestaoSalaoApi.Data;
using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/painel")]
    [Authorize(Roles = Perfis.Administrador)]
    public class PainelController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PainelController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DateTime? data)
        {
            var dia = DateTime.SpecifyKind((data ?? DateTime.Today).Date, DateTimeKind.Unspecified);

            var agendamentos = await _context.Agendamentos
                .Where(a => a.DataHora >= dia && a.DataHora < dia.AddDays(1))
                .ToListAsync();

            var concluidos = agendamentos.Where(a => a.Status == StatusAgendamento.Concluido).ToList();
            var pendentes = agendamentos.Where(a => a.Status == StatusAgendamento.Agendado).ToList();

            var faturamento = concluidos.Sum(a => a.Valor);

            var painel = new PainelDiaDTO
            {
                Data = dia,
                TotalAgendamentos = agendamentos.Count,
                Pendentes = pendentes.Count,
                Concluidos = concluidos.Count,
                Cancelados = agendamentos.Count(a => a.Status == StatusAgendamento.Cancelado),
                Faltas = agendamentos.Count(a => a.Status == StatusAgendamento.NaoCompareceu),
                Faturamento = faturamento,
                PrevisaoPendentes = pendentes.Sum(a => a.Valor),
                TicketMedio = concluidos.Count > 0 ? Math.Round(faturamento / concluidos.Count, 2) : 0,
                PorFormaPagamento = concluidos
                    .GroupBy(a => a.FormaPagamento)
                    .Select(g => new TotalFormaPagamentoDTO
                    {
                        FormaPagamento = g.Key.HasValue ? (int)g.Key.Value : 0,
                        Descricao = Descricoes.FormaPagamento(g.Key),
                        Quantidade = g.Count(),
                        Total = g.Sum(a => a.Valor)
                    })
                    .OrderByDescending(t => t.Total)
                    .ToList()
            };

            return Ok(painel);
        }
    }
}
