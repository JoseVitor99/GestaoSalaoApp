using System.ComponentModel.DataAnnotations;

namespace GestaoSalaoApi.Entidade
{
    public enum StatusAgendamento
    {
        Agendado = 1,
        Concluido = 2,
        Cancelado = 3
    }

    public enum FormaPagamento
    {
        Dinheiro = 1,
        Pix = 2,
        CartaoDebito = 3,
        CartaoCredito = 4
    }

    public class Agendamento
    {
        public int Id { get; set; }

        public int ClienteId { get; set; }

        public Cliente? Cliente { get; set; }

        public int FuncionarioId { get; set; }

        public Funcionario? Funcionario { get; set; }

        public int ServicoId { get; set; }

        public Servico? Servico { get; set; }

        public DateTime DataHora { get; set; }

        public int DuracaoMinutos { get; set; }

        public decimal Valor { get; set; }

        public StatusAgendamento Status { get; set; } = StatusAgendamento.Agendado;

        public FormaPagamento? FormaPagamento { get; set; }

        [MaxLength(500)]
        public string? Observacao { get; set; }
    }
}
