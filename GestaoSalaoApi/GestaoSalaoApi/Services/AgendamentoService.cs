using GestaoSalaoApi.Data;
using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Services
{
    public class AgendamentoService
    {
        private readonly AppDbContext _context;
        private readonly AgendaService _agenda;

        public AgendamentoService(AppDbContext context, AgendaService agenda)
        {
            _context = context;
            _agenda = agenda;
        }

        public async Task<List<AgendamentoDTO>> Listar(DateTime inicio, DateTime fim, int? funcionarioId, int? clienteId)
        {
            var query = Consulta()
                .Where(a => a.DataHora >= inicio && a.DataHora < fim);

            if (funcionarioId.HasValue)
                query = query.Where(a => a.FuncionarioId == funcionarioId.Value);

            if (clienteId.HasValue)
                query = query.Where(a => a.ClienteId == clienteId.Value);

            var agendamentos = await query.OrderBy(a => a.DataHora).ToListAsync();
            return agendamentos.Select(ToDTO).ToList();
        }

        public async Task<List<AgendamentoDTO>> HistoricoCliente(int clienteId)
        {
            var agendamentos = await Consulta()
                .Where(a => a.ClienteId == clienteId)
                .OrderByDescending(a => a.DataHora)
                .ToListAsync();

            return agendamentos.Select(ToDTO).ToList();
        }

        public async Task<AgendamentoDTO> Criar(AgendamentoInputDTO dto, int? somenteFuncionario = null)
        {
            ConferirResponsavel(dto.FuncionarioId, somenteFuncionario);
            var (_, _, servico) = await ValidarDados(dto, null);

            if (dto.DataHora.Date < DateTime.Today)
                throw new RegraNegocioException("Não é possível agendar em uma data que já passou.");

            var agendamento = new Agendamento
            {
                ClienteId = dto.ClienteId,
                FuncionarioId = dto.FuncionarioId,
                ServicoId = dto.ServicoId,
                DataHora = SemSegundos(dto.DataHora),
                DuracaoMinutos = servico.DuracaoMinutos,
                Valor = dto.Valor ?? servico.Preco,
                Status = StatusAgendamento.Agendado,
                Observacao = dto.Observacao?.Trim()
            };

            _context.Agendamentos.Add(agendamento);
            await _context.SaveChangesAsync();

            return await BuscarDTO(agendamento.Id);
        }

        // Marca vários serviços da mesma cliente de uma vez: ou todos são salvos, ou nenhum
        public async Task<List<AgendamentoDTO>> CriarLote(AgendamentoLoteDTO dto, int? somenteFuncionario = null)
        {
            if (dto.Itens.Count == 0)
                throw new RegraNegocioException("Adicione pelo menos um serviço.");

            var novos = new List<Agendamento>();

            foreach (var item in dto.Itens)
            {
                ConferirResponsavel(item.FuncionarioId, somenteFuncionario);

                var entrada = new AgendamentoInputDTO
                {
                    ClienteId = dto.ClienteId,
                    FuncionarioId = item.FuncionarioId,
                    ServicoId = item.ServicoId,
                    DataHora = item.DataHora,
                    Valor = item.Valor,
                    Observacao = dto.Observacao
                };

                var (_, funcionario, servico) = await ValidarDados(entrada, null);

                if (item.DataHora.Date < DateTime.Today)
                    throw new RegraNegocioException("Não é possível agendar em uma data que já passou.");

                var inicio = SemSegundos(item.DataHora);
                var fim = inicio.AddMinutes(servico.DuracaoMinutos);

                var choque = novos.FirstOrDefault(n =>
                    n.FuncionarioId == item.FuncionarioId &&
                    inicio < n.DataHora.AddMinutes(n.DuracaoMinutos) &&
                    n.DataHora < fim);

                if (choque != null)
                    throw new RegraNegocioException(
                        $"{funcionario.Nome} ficou com dois serviços no mesmo horário ({choque.DataHora:HH:mm} e {inicio:HH:mm}). Ajuste os horários.");

                novos.Add(new Agendamento
                {
                    ClienteId = dto.ClienteId,
                    FuncionarioId = item.FuncionarioId,
                    ServicoId = item.ServicoId,
                    DataHora = inicio,
                    DuracaoMinutos = servico.DuracaoMinutos,
                    Valor = item.Valor ?? servico.Preco,
                    Status = StatusAgendamento.Agendado,
                    Observacao = dto.Observacao?.Trim()
                });
            }

            _context.Agendamentos.AddRange(novos);
            await _context.SaveChangesAsync();

            var ids = novos.Select(n => n.Id).ToList();
            var salvos = await Consulta().Where(a => ids.Contains(a.Id)).OrderBy(a => a.DataHora).ToListAsync();
            return salvos.Select(ToDTO).ToList();
        }

        // Conclui de uma vez os serviços da comanda da cliente, com uma única forma de pagamento
        public async Task<List<AgendamentoDTO>> FecharComanda(FecharComandaDTO dto, int? somenteFuncionario = null)
        {
            if (dto.Itens.Count == 0)
                throw new RegraNegocioException("Selecione pelo menos um serviço da comanda.");

            if (!Enum.IsDefined(typeof(FormaPagamento), dto.FormaPagamento))
                throw new RegraNegocioException("Informe a forma de pagamento.");

            var ids = dto.Itens.Select(i => i.AgendamentoId).Distinct().ToList();
            var agendamentos = await _context.Agendamentos.Where(a => ids.Contains(a.Id)).ToListAsync();

            if (agendamentos.Count != ids.Count)
                throw new RegraNegocioException("Algum serviço da comanda não foi encontrado.");

            if (agendamentos.Select(a => a.ClienteId).Distinct().Count() > 1)
                throw new RegraNegocioException("A comanda só pode ter serviços da mesma cliente.");

            foreach (var agendamento in agendamentos)
                ConferirResponsavel(agendamento.FuncionarioId, somenteFuncionario);

            foreach (var agendamento in agendamentos)
            {
                if (agendamento.Status != StatusAgendamento.Agendado)
                    throw new RegraNegocioException("A comanda tem um serviço que não está mais pendente. Atualize a tela.");

                if (agendamento.DataHora.Date > DateTime.Today)
                    throw new RegraNegocioException("Não é possível concluir um atendimento de data futura.");

                var valor = dto.Itens.First(i => i.AgendamentoId == agendamento.Id).Valor ?? agendamento.Valor;
                if (valor <= 0)
                    throw new RegraNegocioException("O valor de cada serviço deve ser maior que zero.");

                await ValidarDiaNaoPago(agendamento.FuncionarioId, agendamento.DataHora);

                agendamento.Status = StatusAgendamento.Concluido;
                agendamento.FormaPagamento = (FormaPagamento)dto.FormaPagamento;
                agendamento.Valor = valor;
            }

            await _context.SaveChangesAsync();

            var concluidos = await Consulta().Where(a => ids.Contains(a.Id)).OrderBy(a => a.DataHora).ToListAsync();
            return concluidos.Select(ToDTO).ToList();
        }

        public async Task<AgendamentoDTO> Editar(int id, AgendamentoInputDTO dto, int? somenteFuncionario = null)
        {
            var agendamento = await _context.Agendamentos.FindAsync(id)
                ?? throw new RegraNegocioException("Agendamento não encontrado.");

            ConferirResponsavel(agendamento.FuncionarioId, somenteFuncionario);
            ConferirResponsavel(dto.FuncionarioId, somenteFuncionario);

            if (agendamento.Status != StatusAgendamento.Agendado)
                throw new RegraNegocioException("Somente agendamentos pendentes podem ser alterados.");

            // Expediente, folga e bloqueios só são conferidos se o horário ou a profissional mudar
            var mudouHorario = SemSegundos(dto.DataHora) != agendamento.DataHora
                || dto.FuncionarioId != agendamento.FuncionarioId
                || dto.ServicoId != agendamento.ServicoId;

            var (_, _, servico) = await ValidarDados(dto, id, mudouHorario);

            var novaDataHora = SemSegundos(dto.DataHora);
            if (novaDataHora != agendamento.DataHora && novaDataHora.Date < DateTime.Today)
                throw new RegraNegocioException("Não é possível remarcar para uma data que já passou.");

            // Ao trocar de serviço, a duração passa a ser a do novo
            if (agendamento.ServicoId != dto.ServicoId)
                agendamento.DuracaoMinutos = servico.DuracaoMinutos;

            agendamento.ClienteId = dto.ClienteId;
            agendamento.FuncionarioId = dto.FuncionarioId;
            agendamento.ServicoId = dto.ServicoId;
            agendamento.DataHora = novaDataHora;
            agendamento.Valor = dto.Valor ?? servico.Preco;
            agendamento.Observacao = dto.Observacao?.Trim();

            await _context.SaveChangesAsync();
            return await BuscarDTO(id);
        }

        public async Task<AgendamentoDTO> Concluir(int id, ConcluirAgendamentoDTO dto, int? somenteFuncionario = null)
        {
            var agendamento = await _context.Agendamentos.FindAsync(id)
                ?? throw new RegraNegocioException("Agendamento não encontrado.");

            ConferirResponsavel(agendamento.FuncionarioId, somenteFuncionario);

            if (agendamento.Status != StatusAgendamento.Agendado)
                throw new RegraNegocioException("Este agendamento não está pendente.");

            if (agendamento.DataHora.Date > DateTime.Today)
                throw new RegraNegocioException("Não é possível concluir um atendimento de data futura.");

            if (!Enum.IsDefined(typeof(FormaPagamento), dto.FormaPagamento))
                throw new RegraNegocioException("Informe a forma de pagamento.");

            var valorFinal = dto.Valor ?? agendamento.Valor;
            if (valorFinal <= 0)
                throw new RegraNegocioException("O valor do atendimento deve ser maior que zero.");

            await ValidarDiaNaoPago(agendamento.FuncionarioId, agendamento.DataHora);

            agendamento.Status = StatusAgendamento.Concluido;
            agendamento.FormaPagamento = (FormaPagamento)dto.FormaPagamento;
            agendamento.Valor = valorFinal;

            await _context.SaveChangesAsync();
            return await BuscarDTO(id);
        }

        public async Task<AgendamentoDTO> Cancelar(int id, int? somenteFuncionario = null)
        {
            var agendamento = await _context.Agendamentos.FindAsync(id)
                ?? throw new RegraNegocioException("Agendamento não encontrado.");

            ConferirResponsavel(agendamento.FuncionarioId, somenteFuncionario);

            if (agendamento.Status != StatusAgendamento.Agendado)
                throw new RegraNegocioException("Somente agendamentos pendentes podem ser cancelados.");

            agendamento.Status = StatusAgendamento.Cancelado;
            await _context.SaveChangesAsync();

            return await BuscarDTO(id);
        }

        // Falta da cliente: só depois que o horário passou, e o horário deixa de contar como pendente
        public async Task<AgendamentoDTO> MarcarNaoCompareceu(int id, int? somenteFuncionario = null)
        {
            var agendamento = await _context.Agendamentos.FindAsync(id)
                ?? throw new RegraNegocioException("Agendamento não encontrado.");

            ConferirResponsavel(agendamento.FuncionarioId, somenteFuncionario);

            if (agendamento.Status != StatusAgendamento.Agendado)
                throw new RegraNegocioException("Somente agendamentos pendentes podem ser marcados como falta.");

            if (agendamento.DataHora > DateTime.Now)
                throw new RegraNegocioException("Só é possível marcar a falta depois do horário agendado.");

            agendamento.Status = StatusAgendamento.NaoCompareceu;
            await _context.SaveChangesAsync();

            return await BuscarDTO(id);
        }

        public async Task Excluir(int id, int? somenteFuncionario = null)
        {
            var agendamento = await _context.Agendamentos.FindAsync(id)
                ?? throw new RegraNegocioException("Agendamento não encontrado.");

            ConferirResponsavel(agendamento.FuncionarioId, somenteFuncionario);

            if (agendamento.Status == StatusAgendamento.Concluido)
                throw new RegraNegocioException("Atendimentos concluídos não podem ser excluídos.");

            _context.Agendamentos.Remove(agendamento);
            await _context.SaveChangesAsync();
        }

        public static AgendamentoDTO ToDTO(Agendamento a) => new()
        {
            Id = a.Id,
            ClienteId = a.ClienteId,
            Cliente = a.Cliente?.Nome ?? string.Empty,
            ClienteTelefone = a.Cliente?.Telefone ?? string.Empty,
            FuncionarioId = a.FuncionarioId,
            Funcionario = a.Funcionario?.Nome ?? string.Empty,
            ServicoId = a.ServicoId,
            Servico = a.Servico?.Descricao ?? string.Empty,
            DataHora = a.DataHora,
            DataHoraFim = a.DataHora.AddMinutes(a.DuracaoMinutos),
            DuracaoMinutos = a.DuracaoMinutos,
            Valor = a.Valor,
            Status = (int)a.Status,
            StatusDescricao = Descricoes.Status(a.Status),
            FormaPagamento = a.FormaPagamento.HasValue ? (int)a.FormaPagamento.Value : null,
            FormaPagamentoDescricao = Descricoes.FormaPagamento(a.FormaPagamento),
            Observacao = a.Observacao
        };

        private IQueryable<Agendamento> Consulta() => _context.Agendamentos
            .Include(a => a.Cliente)
            .Include(a => a.Funcionario)
            .Include(a => a.Servico);

        private async Task<AgendamentoDTO> BuscarDTO(int id)
        {
            var agendamento = await Consulta().FirstAsync(a => a.Id == id);
            return ToDTO(agendamento);
        }

        private static DateTime SemSegundos(DateTime data) =>
            new(data.Year, data.Month, data.Day, data.Hour, data.Minute, 0, DateTimeKind.Unspecified);

        private async Task<(Cliente, Funcionario, Servico)> ValidarDados(AgendamentoInputDTO dto, int? ignorarAgendamentoId, bool conferirDisponibilidade = true)
        {
            var cliente = await _context.Clientes.FindAsync(dto.ClienteId)
                ?? throw new RegraNegocioException("Cliente não encontrado.");

            var funcionario = await _context.Funcionarios.FindAsync(dto.FuncionarioId)
                ?? throw new RegraNegocioException("Funcionário não encontrado.");

            if (!funcionario.Ativo)
                throw new RegraNegocioException("Este funcionário está inativo.");

            var servico = await _context.Servicos.FindAsync(dto.ServicoId)
                ?? throw new RegraNegocioException("Serviço não encontrado.");

            if (!servico.Ativo)
                throw new RegraNegocioException("Este serviço está inativo.");

            if (dto.DataHora == default)
                throw new RegraNegocioException("Informe a data e o horário.");

            if (dto.Valor.HasValue && dto.Valor.Value <= 0)
                throw new RegraNegocioException("O valor deve ser maior que zero.");

            // O funcionário não pode ter dois atendimentos no mesmo horário
            var inicio = SemSegundos(dto.DataHora);
            var fim = inicio.AddMinutes(servico.DuracaoMinutos);
            var dia = inicio.Date;

            var agendaDoDia = await _context.Agendamentos
                .Include(a => a.Cliente)
                .Where(a => a.FuncionarioId == dto.FuncionarioId
                         && a.Status != StatusAgendamento.Cancelado
                         && a.Status != StatusAgendamento.NaoCompareceu
                         && a.DataHora >= dia && a.DataHora < dia.AddDays(1))
                .ToListAsync();

            var conflito = agendaDoDia.FirstOrDefault(a =>
                a.Id != ignorarAgendamentoId &&
                inicio < a.DataHora.AddMinutes(a.DuracaoMinutos) &&
                a.DataHora < fim);

            if (conflito != null)
            {
                var fimConflito = conflito.DataHora.AddMinutes(conflito.DuracaoMinutos);
                throw new RegraNegocioException(
                    $"{funcionario.Nome} já tem atendimento das {conflito.DataHora:HH:mm} às {fimConflito:HH:mm} " +
                    $"({conflito.Cliente?.Nome}). Escolha outro horário.");
            }

            if (conferirDisponibilidade)
                await _agenda.ValidarDisponibilidade(funcionario, inicio, fim);

            return (cliente, funcionario, servico);
        }

        // Funcionário só mexe nos próprios atendimentos; o administrador (null) mexe em todos
        private static void ConferirResponsavel(int funcionarioId, int? somenteFuncionario)
        {
            if (somenteFuncionario.HasValue && funcionarioId != somenteFuncionario.Value)
                throw new RegraNegocioException("Você só pode agendar e alterar os seus próprios atendimentos.");
        }

        private async Task ValidarDiaNaoPago(int funcionarioId, DateTime dataHora)
        {
            var dia = dataHora.Date;
            var pago = await _context.PagamentosDiarios
                .AnyAsync(p => p.FuncionarioId == funcionarioId && p.Data == dia);

            if (pago)
                throw new RegraNegocioException(
                    "A remuneração deste funcionário neste dia já foi paga. Estorne o pagamento para alterar os atendimentos.");
        }
    }
}
