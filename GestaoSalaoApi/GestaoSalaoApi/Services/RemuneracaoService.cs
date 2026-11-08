using GestaoSalaoApi.Data;
using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Services
{
    public class RemuneracaoService
    {
        private readonly AppDbContext _context;

        public RemuneracaoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<RemuneracaoDiariaDTO>> CalcularDia(DateTime data)
        {
            var dia = SomenteData(data);

            var pagamentos = await _context.PagamentosDiarios
                .Where(p => p.Data == dia)
                .ToListAsync();

            var concluidos = await AtendimentosConcluidos(dia, null);

            var funcionarios = await _context.Funcionarios
                .OrderBy(f => f.Nome)
                .ToListAsync();

            return funcionarios
                .Where(f => f.Ativo
                         || concluidos.Any(a => a.FuncionarioId == f.Id)
                         || pagamentos.Any(p => p.FuncionarioId == f.Id))
                .Select(f =>
                {
                    var pagamento = pagamentos.FirstOrDefault(p => p.FuncionarioId == f.Id);
                    if (pagamento != null)
                        return DoPagamento(f, pagamento);

                    var atendimentos = concluidos.Where(a => a.FuncionarioId == f.Id).ToList();
                    return Calcular(f, dia, atendimentos, incluirDiaria: atendimentos.Count > 0);
                })
                .ToList();
        }

        public async Task<RemuneracaoDiariaDTO> Pagar(PagarRemuneracaoDTO dto)
        {
            var dia = SomenteData(dto.Data);

            if (dia > DateTime.Today)
                throw new RegraNegocioException("Não é possível pagar um dia que ainda não aconteceu.");

            var funcionario = await _context.Funcionarios.FindAsync(dto.FuncionarioId)
                ?? throw new RegraNegocioException("Funcionário não encontrado.");

            var jaPago = await _context.PagamentosDiarios
                .AnyAsync(p => p.FuncionarioId == funcionario.Id && p.Data == dia);
            if (jaPago)
                throw new RegraNegocioException($"A remuneração de {funcionario.Nome} neste dia já foi paga.");

            var atendimentos = await AtendimentosConcluidos(dia, funcionario.Id);
            var calculo = Calcular(funcionario, dia, atendimentos, dto.IncluirDiaria);

            if (calculo.ValorTotal <= 0)
                throw new RegraNegocioException(
                    $"Não há valor a pagar para {funcionario.Nome} neste dia. " +
                    "Verifique se os atendimentos foram concluídos ou se a diária foi marcada.");

            var pagamento = new PagamentoDiario
            {
                FuncionarioId = funcionario.Id,
                Data = dia,
                QuantidadeAtendimentos = calculo.QuantidadeAtendimentos,
                TotalAtendimentos = calculo.TotalAtendimentos,
                ValorDiaria = calculo.ValorDiaria,
                ValorComissao = calculo.ValorComissao,
                ValorTotal = calculo.ValorTotal,
                DataPagamento = DateTime.Now
            };

            _context.PagamentosDiarios.Add(pagamento);
            await _context.SaveChangesAsync();

            return DoPagamento(funcionario, pagamento);
        }

        public async Task Estornar(int pagamentoId)
        {
            var pagamento = await _context.PagamentosDiarios.FindAsync(pagamentoId)
                ?? throw new RegraNegocioException("Pagamento não encontrado.");

            _context.PagamentosDiarios.Remove(pagamento);
            await _context.SaveChangesAsync();
        }

        public async Task<List<PagamentoDiarioDTO>> Historico(DateTime inicio, DateTime fim, int? funcionarioId)
        {
            var query = _context.PagamentosDiarios
                .Include(p => p.Funcionario)
                .Where(p => p.Data >= inicio.Date && p.Data <= fim.Date);

            if (funcionarioId.HasValue)
                query = query.Where(p => p.FuncionarioId == funcionarioId.Value);

            var pagamentos = await query
                .OrderByDescending(p => p.Data)
                .ThenBy(p => p.Funcionario!.Nome)
                .ToListAsync();

            return pagamentos.Select(p => new PagamentoDiarioDTO
            {
                Id = p.Id,
                FuncionarioId = p.FuncionarioId,
                Funcionario = p.Funcionario?.Nome ?? string.Empty,
                Data = p.Data,
                QuantidadeAtendimentos = p.QuantidadeAtendimentos,
                TotalAtendimentos = p.TotalAtendimentos,
                ValorDiaria = p.ValorDiaria,
                ValorComissao = p.ValorComissao,
                ValorTotal = p.ValorTotal,
                DataPagamento = p.DataPagamento
            }).ToList();
        }

        private static DateTime SomenteData(DateTime data) =>
            DateTime.SpecifyKind(data.Date, DateTimeKind.Unspecified);

        private async Task<List<Agendamento>> AtendimentosConcluidos(DateTime dia, int? funcionarioId)
        {
            var query = _context.Agendamentos
                .Where(a => a.Status == StatusAgendamento.Concluido
                         && a.DataHora >= dia && a.DataHora < dia.AddDays(1));

            if (funcionarioId.HasValue)
                query = query.Where(a => a.FuncionarioId == funcionarioId.Value);

            return await query.ToListAsync();
        }

        private static RemuneracaoDiariaDTO Calcular(Funcionario f, DateTime dia, List<Agendamento> atendimentos, bool incluirDiaria)
        {
            // A soma é feita em memória porque o SQLite não soma decimais no banco
            var total = atendimentos.Sum(a => a.Valor);

            var recebeDiaria = f.TipoRemuneracao != TipoRemuneracao.Comissao;
            var recebeComissao = f.TipoRemuneracao != TipoRemuneracao.Diaria;

            var diariaIncluida = recebeDiaria && incluirDiaria;
            var valorDiaria = diariaIncluida ? f.ValorDiaria : 0;
            var valorComissao = recebeComissao
                ? Math.Round(total * f.PercentualComissao / 100m, 2, MidpointRounding.AwayFromZero)
                : 0;

            return new RemuneracaoDiariaDTO
            {
                FuncionarioId = f.Id,
                Funcionario = f.Nome ?? string.Empty,
                Funcao = f.Funcao,
                TipoRemuneracao = (int)f.TipoRemuneracao,
                TipoRemuneracaoDescricao = Descricoes.TipoRemuneracao(f.TipoRemuneracao),
                PercentualComissao = f.PercentualComissao,
                ValorDiariaConfigurada = f.TipoRemuneracao == TipoRemuneracao.Comissao ? 0 : f.ValorDiaria,
                Data = dia,
                QuantidadeAtendimentos = atendimentos.Count,
                TotalAtendimentos = total,
                DiariaIncluida = diariaIncluida,
                ValorDiaria = valorDiaria,
                ValorComissao = valorComissao,
                Pago = false
            };
        }

        private static RemuneracaoDiariaDTO DoPagamento(Funcionario f, PagamentoDiario p) => new()
        {
            FuncionarioId = f.Id,
            Funcionario = f.Nome ?? string.Empty,
            Funcao = f.Funcao,
            TipoRemuneracao = (int)f.TipoRemuneracao,
            TipoRemuneracaoDescricao = Descricoes.TipoRemuneracao(f.TipoRemuneracao),
            PercentualComissao = f.PercentualComissao,
            ValorDiariaConfigurada = f.TipoRemuneracao == TipoRemuneracao.Comissao ? 0 : f.ValorDiaria,
            Data = p.Data,
            QuantidadeAtendimentos = p.QuantidadeAtendimentos,
            TotalAtendimentos = p.TotalAtendimentos,
            DiariaIncluida = p.ValorDiaria > 0,
            ValorDiaria = p.ValorDiaria,
            ValorComissao = p.ValorComissao,
            Pago = true,
            PagamentoId = p.Id,
            DataPagamento = p.DataPagamento
        };
    }
}
