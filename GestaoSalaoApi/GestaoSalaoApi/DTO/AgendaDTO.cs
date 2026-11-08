namespace GestaoSalaoApi.DTO
{
    public class HorarioFuncionamentoDTO
    {
        public int DiaSemana { get; set; }
        public string DiaDescricao { get; set; } = string.Empty;
        public bool Aberto { get; set; }
        public string Abertura { get; set; } = "08:00";
        public string Fechamento { get; set; } = "19:00";
    }

    public class BloqueioInputDTO
    {
        public int? FuncionarioId { get; set; }
        public DateTime Inicio { get; set; }
        public DateTime Fim { get; set; }
        public string? Motivo { get; set; }
    }

    public class BloqueioDTO
    {
        public int Id { get; set; }
        public int? FuncionarioId { get; set; }
        public string Funcionario { get; set; } = string.Empty;
        public DateTime Inicio { get; set; }
        public DateTime Fim { get; set; }
        public string? Motivo { get; set; }
    }

    public class BloqueioCriadoDTO
    {
        public BloqueioDTO Bloqueio { get; set; } = new();

        // Atendimentos pendentes que já estavam marcados dentro do período bloqueado
        public int AtendimentosNoPeriodo { get; set; }
    }
}
