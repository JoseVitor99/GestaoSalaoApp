namespace GestaoSalaoApi.Entidade
{
    public class HorarioFuncionamento
    {
        public int Id { get; set; }

        public DayOfWeek DiaSemana { get; set; }

        public bool Aberto { get; set; }

        public TimeSpan Abertura { get; set; }

        public TimeSpan Fechamento { get; set; }
    }
}
