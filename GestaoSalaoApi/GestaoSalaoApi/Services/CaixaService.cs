using GestaoSalaoApi.Data;
using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Services
{
    // Caixa pelo dia em que o dinheiro entra ou sai: atendimentos recebidos, despesas, vales e pagamentos
    public class CaixaService
    {
        private readonly AppDbContext _context;

        public CaixaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CaixaDTO> Resumo(DateTime inicio, DateTime fim)
        {
            var de = inicio.Date;
            var ate = fim.Date.AddDays(1);

            var atendimentos = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Include(a => a.Servico)
                .Include(a => a.Funcionario)
                .Where(a => a.Status == StatusAgendamento.Concluido && a.DataHora >= de && a.DataHora < ate)
                .ToListAsync();

            var despesas = await _context.Despesas.Where(d => d.Data >= de && d.Data < ate).ToListAsync();
            var vales = await _context.Vales.Include(v => v.Funcionario).Where(v => v.Data >= de && v.Data < ate).ToListAsync();
            var pagamentos = await _context.PagamentosDiarios.Include(p => p.Funcionario)
                .Where(p => p.DataPagamento >= de && p.DataPagamento < ate)
                .ToListAsync();

            // Somas em memória: o SQLite não soma decimais no banco
            var caixa = new CaixaDTO
            {
                Inicio = de,
                Fim = ate.AddDays(-1),
                Entradas = atendimentos.Sum(a => a.Valor),
                EntradasPorForma = atendimentos
                    .GroupBy(a => a.FormaPagamento)
                    .Select(g => new TotalItemDTO { Descricao = Descricoes.FormaPagamento(g.Key), Quantidade = g.Count(), Total = g.Sum(a => a.Valor) })
                    .OrderByDescending(t => t.Total)
                    .ToList(),
                Despesas = despesas.Sum(d => d.Valor),
                DespesasPorCategoria = despesas
                    .GroupBy(d => d.Categoria)
                    .Select(g => new TotalItemDTO { Descricao = Descricoes.CategoriaDespesa(g.Key), Quantidade = g.Count(), Total = g.Sum(d => d.Valor) })
                    .OrderByDescending(t => t.Total)
                    .ToList(),
                Vales = vales.Sum(v => v.Valor),
                Pagamentos = pagamentos.Sum(p => p.ValorTotal - p.ValorVales)
            };

            caixa.Movimentos.AddRange(atendimentos.Select(a => new MovimentoCaixaDTO
            {
                Data = a.DataHora,
                Tipo = "Entrada",
                Descricao = $"{a.Cliente?.Nome} · {a.Servico?.Descricao}",
                Detalhe = a.Funcionario?.Nome,
                FormaPagamento = Descricoes.FormaPagamento(a.FormaPagamento),
                Valor = a.Valor,
                Entrada = true
            }));

            caixa.Movimentos.AddRange(despesas.Select(d => new MovimentoCaixaDTO
            {
                Data = d.Data,
                Tipo = "Despesa",
                Descricao = d.Descricao ?? string.Empty,
                Detalhe = Descricoes.CategoriaDespesa(d.Categoria),
                FormaPagamento = Descricoes.FormaPagamento(d.FormaPagamento),
                Valor = d.Valor,
                DespesaId = d.Id
            }));

            caixa.Movimentos.AddRange(vales.Select(v => new MovimentoCaixaDTO
            {
                Data = v.Data,
                Tipo = "Vale",
                Descricao = $"Vale para {v.Funcionario?.Nome}",
                Detalhe = v.Observacao,
                Valor = v.Valor
            }));

            caixa.Movimentos.AddRange(pagamentos.Where(p => p.ValorTotal - p.ValorVales > 0).Select(p => new MovimentoCaixaDTO
            {
                Data = p.DataPagamento,
                Tipo = "Pagamento",
                Descricao = $"Pagamento de {p.Funcionario?.Nome}",
                Detalhe = $"Referente a {p.Data:dd/MM}" + (p.ValorVales > 0 ? " · descontados os vales" : ""),
                Valor = p.ValorTotal - p.ValorVales
            }));

            caixa.Movimentos = caixa.Movimentos.OrderByDescending(m => m.Data).ToList();
            return caixa;
        }

        public async Task<DespesaDTO> CriarDespesa(DespesaInputDTO dto)
        {
            var despesa = new Despesa { DataRegistro = DateTime.Now };
            Preencher(despesa, dto);

            _context.Despesas.Add(despesa);
            await _context.SaveChangesAsync();
            return ToDTO(despesa);
        }

        public async Task<DespesaDTO> EditarDespesa(int id, DespesaInputDTO dto)
        {
            var despesa = await _context.Despesas.FindAsync(id)
                ?? throw new RegraNegocioException("Despesa não encontrada.");

            Preencher(despesa, dto);
            await _context.SaveChangesAsync();
            return ToDTO(despesa);
        }

        public async Task ExcluirDespesa(int id)
        {
            var despesa = await _context.Despesas.FindAsync(id)
                ?? throw new RegraNegocioException("Despesa não encontrada.");

            _context.Despesas.Remove(despesa);
            await _context.SaveChangesAsync();
        }

        public async Task<DespesaDTO> BuscarDespesa(int id)
        {
            var despesa = await _context.Despesas.FindAsync(id)
                ?? throw new RegraNegocioException("Despesa não encontrada.");
            return ToDTO(despesa);
        }

        private static void Preencher(Despesa despesa, DespesaInputDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Descricao))
                throw new RegraNegocioException("Informe a descrição da despesa.");

            if (!Enum.IsDefined(typeof(CategoriaDespesa), dto.Categoria))
                throw new RegraNegocioException("Escolha a categoria da despesa.");

            if (dto.Valor <= 0)
                throw new RegraNegocioException("O valor da despesa deve ser maior que zero.");

            if (dto.FormaPagamento.HasValue && !Enum.IsDefined(typeof(FormaPagamento), dto.FormaPagamento.Value))
                throw new RegraNegocioException("Forma de pagamento inválida.");

            var data = (dto.Data == default ? DateTime.Today : dto.Data).Date;
            if (data > DateTime.Today)
                throw new RegraNegocioException("A data da despesa não pode ser futura.");

            despesa.Data = data;
            despesa.Descricao = dto.Descricao.Trim();
            despesa.Categoria = (CategoriaDespesa)dto.Categoria;
            despesa.Valor = Math.Round(dto.Valor, 2);
            despesa.FormaPagamento = dto.FormaPagamento.HasValue ? (FormaPagamento)dto.FormaPagamento.Value : null;
        }

        private static DespesaDTO ToDTO(Despesa d) => new()
        {
            Id = d.Id,
            Data = d.Data,
            Descricao = d.Descricao ?? string.Empty,
            Categoria = (int)d.Categoria,
            CategoriaDescricao = Descricoes.CategoriaDespesa(d.Categoria),
            Valor = d.Valor,
            FormaPagamento = d.FormaPagamento.HasValue ? (int)d.FormaPagamento.Value : null,
            FormaPagamentoDescricao = Descricoes.FormaPagamento(d.FormaPagamento)
        };
    }
}
