using GestaoSalaoApi.Data;
using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Services
{
    public class RelatorioService
    {
        private readonly AppDbContext _context;

        public RelatorioService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<RelatorioDTO> Periodo(DateTime inicio, DateTime fim)
        {
            var de = inicio.Date;
            var ate = fim.Date.AddDays(1);

            var agendamentos = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.Servico)
                .Include(a => a.Funcionario)
                .Where(a => a.DataHora >= de && a.DataHora < ate)
                .ToListAsync();

            var concluidos = agendamentos.Where(a => a.Status == StatusAgendamento.Concluido).ToList();
            var faltas = agendamentos.Where(a => a.Status == StatusAgendamento.NaoCompareceu).ToList();

            var pagamentos = await _context.PagamentosDiarios
                .Where(p => p.Data >= de && p.Data < ate)
                .ToListAsync();

            var funcionarios = await _context.Funcionarios.ToListAsync();

            // Somas em memória: o SQLite não soma decimais no banco
            var faturamento = concluidos.Sum(a => a.Valor);

            var relatorio = new RelatorioDTO
            {
                Inicio = de,
                Fim = ate.AddDays(-1),
                Faturamento = faturamento,
                Atendimentos = concluidos.Count,
                TicketMedio = concluidos.Count > 0 ? Math.Round(faturamento / concluidos.Count, 2) : 0,
                ClientesAtendidas = concluidos.Select(a => a.ClienteId).Distinct().Count(),
                Marcados = agendamentos.Count,
                Faltas = faltas.Count,
                Cancelados = agendamentos.Count(a => a.Status == StatusAgendamento.Cancelado)
            };

            for (var dia = de; dia < ate; dia = dia.AddDays(1))
            {
                var doDia = concluidos.Where(a => a.DataHora.Date == dia).ToList();
                relatorio.PorDia.Add(new FaturamentoDiaDTO { Data = dia, Quantidade = doDia.Count, Total = doDia.Sum(a => a.Valor) });
            }

            relatorio.Servicos = concluidos
                .GroupBy(a => a.Servico?.Descricao ?? "Serviço")
                .Select(g => new ItemRelatorioDTO { Descricao = g.Key, Quantidade = g.Count(), Total = g.Sum(a => a.Valor) })
                .OrderByDescending(s => s.Total)
                .ToList();

            relatorio.Profissionais = funcionarios
                .Select(f => new ProfissionalRelatorioDTO
                {
                    FuncionarioId = f.Id,
                    Funcionario = f.Nome ?? string.Empty,
                    Atendimentos = concluidos.Count(a => a.FuncionarioId == f.Id),
                    Produzido = concluidos.Where(a => a.FuncionarioId == f.Id).Sum(a => a.Valor),
                    Recebido = pagamentos.Where(p => p.FuncionarioId == f.Id).Sum(p => p.ValorTotal)
                })
                .Where(p => p.Atendimentos > 0 || p.Recebido > 0)
                .OrderByDescending(p => p.Produzido)
                .ToList();

            relatorio.MelhoresClientes = concluidos
                .GroupBy(a => a.ClienteId)
                .Select(g => new ClienteRelatorioDTO
                {
                    ClienteId = g.Key,
                    Nome = g.First().Cliente?.Nome ?? string.Empty,
                    Telefone = g.First().Cliente?.Telefone ?? string.Empty,
                    Quantidade = g.Count(),
                    Total = g.Sum(a => a.Valor),
                    UltimaVisita = g.Max(a => a.DataHora)
                })
                .OrderByDescending(c => c.Total)
                .Take(10)
                .ToList();

            relatorio.ClientesComFaltas = faltas
                .GroupBy(a => a.ClienteId)
                .Select(g => new ClienteRelatorioDTO
                {
                    ClienteId = g.Key,
                    Nome = g.First().Cliente?.Nome ?? string.Empty,
                    Telefone = g.First().Cliente?.Telefone ?? string.Empty,
                    Quantidade = g.Count()
                })
                .OrderByDescending(c => c.Quantidade)
                .Take(10)
                .ToList();

            return relatorio;
        }

        // Clientes que já vieram, mas não aparecem há mais de N dias e não têm horário marcado
        public async Task<List<ClienteRelatorioDTO>> ClientesSumidos(int dias)
        {
            var limite = DateTime.Today.AddDays(-dias);

            var concluidos = await _context.Agendamentos
                .Where(a => a.Status == StatusAgendamento.Concluido)
                .Select(a => new { a.ClienteId, a.DataHora })
                .ToListAsync();

            var comHorarioMarcado = await _context.Agendamentos
                .Where(a => a.Status == StatusAgendamento.Agendado && a.DataHora >= DateTime.Today)
                .Select(a => a.ClienteId)
                .ToListAsync();

            var clientes = await _context.Clientes.ToListAsync();

            return concluidos
                .GroupBy(a => a.ClienteId)
                .Select(g => new { ClienteId = g.Key, Ultima = g.Max(a => a.DataHora), Visitas = g.Count() })
                .Where(x => x.Ultima < limite && !comHorarioMarcado.Contains(x.ClienteId))
                .Join(clientes, x => x.ClienteId, c => c.Id, (x, c) => new ClienteRelatorioDTO
                {
                    ClienteId = c.Id,
                    Nome = c.Nome ?? string.Empty,
                    Telefone = c.Telefone ?? string.Empty,
                    Quantidade = x.Visitas,
                    UltimaVisita = x.Ultima,
                    DiasSemVir = (DateTime.Today - x.Ultima.Date).Days
                })
                .OrderBy(c => c.DiasSemVir)
                .ToList();
        }

        public async Task<List<ClienteRelatorioDTO>> Aniversariantes(int mes)
        {
            var clientes = await _context.Clientes
                .Where(c => c.DataNascimento != null)
                .ToListAsync();

            return clientes
                .Where(c => c.DataNascimento!.Value.Month == mes)
                .OrderBy(c => c.DataNascimento!.Value.Day)
                .Select(c => new ClienteRelatorioDTO
                {
                    ClienteId = c.Id,
                    Nome = c.Nome ?? string.Empty,
                    Telefone = c.Telefone ?? string.Empty,
                    DataNascimento = c.DataNascimento
                })
                .ToList();
        }
    }
}
