using System.ComponentModel.DataAnnotations;

namespace GestaoSalaoApi.Entidade
{
    // Período em que não se pode agendar: almoço, compromisso, férias, feriado...
    public class Bloqueio
    {
        public int Id { get; set; }

        // Sem funcionário, o bloqueio vale para o salão inteiro
        public int? FuncionarioId { get; set; }
        public Funcionario? Funcionario { get; set; }

        public DateTime Inicio { get; set; }

        public DateTime Fim { get; set; }

        [MaxLength(200)]
        public string? Motivo { get; set; }
    }
}
