using GestaoSalaoApi.Data;
using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Services
{
    // Horário de funcionamento, folgas e bloqueios: o que define quando se pode agendar
    public class AgendaService
    {
        private readonly AppDbContext _context;

        public AgendaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<HorarioFuncionamentoDTO>> ListarHorarios()
        {
            var horarios = await _context.HorariosFuncionamento.ToListAsync();
            return horarios.OrderBy(h => h.DiaSemana).Select(ToDTO).ToList();
        }

        public async Task<List<HorarioFuncionamentoDTO>> SalvarHorarios(List<HorarioFuncionamentoDTO> lista)
        {
            var horarios = await _context.HorariosFuncionamento.ToListAsync();

            foreach (var dto in lista)
            {
                if (dto.DiaSemana < 0 || dto.DiaSemana > 6)
                    throw new RegraNegocioException("Dia da semana inválido.");

                var dia = (DayOfWeek)dto.DiaSemana;
                var nome = Descricoes.DiaSemana(dia);

                if (!TimeSpan.TryParse(dto.Abertura, out var abertura) || !TimeSpan.TryParse(dto.Fechamento, out var fechamento))
                    throw new RegraNegocioException($"Horário inválido na {nome}.");

                if (dto.Aberto && abertura >= fechamento)
                    throw new RegraNegocioException($"Na {nome}, o fechamento precisa ser depois da abertura.");

                var horario = horarios.FirstOrDefault(h => h.DiaSemana == dia);
                if (horario == null)
                {
                    horario = new HorarioFuncionamento { DiaSemana = dia };
                    _context.HorariosFuncionamento.Add(horario);
                    horarios.Add(horario);
                }

                horario.Aberto = dto.Aberto;
                horario.Abertura = abertura;
                horario.Fechamento = fechamento;
            }

            await _context.SaveChangesAsync();
            return await ListarHorarios();
        }

        public async Task<List<BloqueioDTO>> ListarBloqueios(DateTime inicio, DateTime fim, int? funcionarioId)
        {
            var query = _context.Bloqueios.Include(b => b.Funcionario).Where(b => b.Inicio < fim && inicio < b.Fim);

            if (funcionarioId.HasValue)
                query = query.Where(b => b.FuncionarioId == null || b.FuncionarioId == funcionarioId);

            var bloqueios = await query.OrderBy(b => b.Inicio).ToListAsync();
            return bloqueios.Select(ToDTO).ToList();
        }

        public async Task<BloqueioCriadoDTO> CriarBloqueio(BloqueioInputDTO dto, int? somenteFuncionario)
        {
            // Funcionário só bloqueia a própria agenda; o salão inteiro é com o administrador
            if (somenteFuncionario.HasValue && dto.FuncionarioId != somenteFuncionario)
                throw new RegraNegocioException("Você só pode bloquear a sua própria agenda.");

            if (dto.Inicio == default || dto.Fim == default)
                throw new RegraNegocioException("Informe o início e o fim do bloqueio.");

            var inicio = SemSegundos(dto.Inicio);
            var fim = SemSegundos(dto.Fim);

            if (fim <= inicio)
                throw new RegraNegocioException("O fim do bloqueio precisa ser depois do início.");

            if (fim < DateTime.Today)
                throw new RegraNegocioException("Não é possível bloquear um período que já passou.");

            if (dto.FuncionarioId.HasValue && !await _context.Funcionarios.AnyAsync(f => f.Id == dto.FuncionarioId))
                throw new RegraNegocioException("Funcionário não encontrado.");

            var bloqueio = new Bloqueio
            {
                FuncionarioId = dto.FuncionarioId,
                Inicio = inicio,
                Fim = fim,
                Motivo = string.IsNullOrWhiteSpace(dto.Motivo) ? null : dto.Motivo.Trim()
            };

            _context.Bloqueios.Add(bloqueio);
            await _context.SaveChangesAsync();

            var noPeriodo = await _context.Agendamentos.CountAsync(a =>
                a.Status == StatusAgendamento.Agendado &&
                (dto.FuncionarioId == null || a.FuncionarioId == dto.FuncionarioId) &&
                a.DataHora < fim && inicio < a.DataHora.AddMinutes(a.DuracaoMinutos));

            if (bloqueio.FuncionarioId.HasValue)
                bloqueio.Funcionario = await _context.Funcionarios.FindAsync(bloqueio.FuncionarioId.Value);

            return new BloqueioCriadoDTO { Bloqueio = ToDTO(bloqueio), AtendimentosNoPeriodo = noPeriodo };
        }

        public async Task ExcluirBloqueio(int id, int? somenteFuncionario)
        {
            var bloqueio = await _context.Bloqueios.FindAsync(id)
                ?? throw new RegraNegocioException("Bloqueio não encontrado.");

            if (somenteFuncionario.HasValue && bloqueio.FuncionarioId != somenteFuncionario)
                throw new RegraNegocioException("Você só pode remover bloqueios da sua própria agenda.");

            _context.Bloqueios.Remove(bloqueio);
            await _context.SaveChangesAsync();
        }

        public async Task ValidarDisponibilidade(Funcionario funcionario, DateTime inicio, DateTime fim)
        {
            var dia = inicio.DayOfWeek;
            var nomeDia = Descricoes.DiaSemana(dia);
            var noDia = dia is DayOfWeek.Sunday or DayOfWeek.Saturday ? $"no {nomeDia}" : $"na {nomeDia}";
            var horario = await _context.HorariosFuncionamento.FirstOrDefaultAsync(h => h.DiaSemana == dia);

            if (horario != null)
            {
                if (!horario.Aberto)
                    throw new RegraNegocioException($"O salão não abre {noDia}.");

                if (inicio.TimeOfDay < horario.Abertura || fim - inicio.Date > horario.Fechamento)
                    throw new RegraNegocioException(
                        $"Fora do horário de funcionamento: o salão abre das {horario.Abertura:hh\\:mm} às {horario.Fechamento:hh\\:mm} neste dia.");
            }

            if (funcionario.DiasFolga.Contains((int)dia))
                throw new RegraNegocioException($"{funcionario.Nome} está de folga {noDia}.");

            var bloqueio = await _context.Bloqueios
                .Where(b => (b.FuncionarioId == null || b.FuncionarioId == funcionario.Id) && b.Inicio < fim && inicio < b.Fim)
                .OrderBy(b => b.Inicio)
                .FirstOrDefaultAsync();

            if (bloqueio != null)
            {
                var quem = bloqueio.FuncionarioId == null ? "O salão" : funcionario.Nome;
                var ultimoDia = bloqueio.Fim.AddMinutes(-1).Date;
                var diaInteiro = bloqueio.Inicio.TimeOfDay == TimeSpan.Zero && bloqueio.Fim.TimeOfDay == TimeSpan.Zero;
                var periodo = diaInteiro
                    ? (bloqueio.Inicio.Date == ultimoDia ? $"no dia {bloqueio.Inicio:dd/MM}" : $"de {bloqueio.Inicio:dd/MM} a {ultimoDia:dd/MM}")
                    : bloqueio.Inicio.Date == ultimoDia
                        ? $"das {bloqueio.Inicio:HH:mm} às {bloqueio.Fim:HH:mm}"
                        : $"de {bloqueio.Inicio:dd/MM HH:mm} a {bloqueio.Fim:dd/MM HH:mm}";
                var motivo = string.IsNullOrWhiteSpace(bloqueio.Motivo) ? "" : $" ({bloqueio.Motivo})";
                throw new RegraNegocioException($"{quem} está com a agenda bloqueada {periodo}{motivo}. Escolha outro horário.");
            }
        }

        private static DateTime SemSegundos(DateTime d) => new(d.Year, d.Month, d.Day, d.Hour, d.Minute, 0);

        private static HorarioFuncionamentoDTO ToDTO(HorarioFuncionamento h) => new()
        {
            DiaSemana = (int)h.DiaSemana,
            DiaDescricao = Descricoes.DiaSemana(h.DiaSemana),
            Aberto = h.Aberto,
            Abertura = h.Abertura.ToString(@"hh\:mm"),
            Fechamento = h.Fechamento.ToString(@"hh\:mm")
        };

        private static BloqueioDTO ToDTO(Bloqueio b) => new()
        {
            Id = b.Id,
            FuncionarioId = b.FuncionarioId,
            Funcionario = b.Funcionario?.Nome ?? "Salão inteiro",
            Inicio = b.Inicio,
            Fim = b.Fim,
            Motivo = b.Motivo
        };
    }
}
