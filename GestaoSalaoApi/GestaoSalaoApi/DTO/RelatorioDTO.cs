namespace GestaoSalaoApi.DTO
{
    public class RelatorioDTO
    {
        public DateTime Inicio { get; set; }
        public DateTime Fim { get; set; }

        public decimal Faturamento { get; set; }
        public int Atendimentos { get; set; }
        public decimal TicketMedio { get; set; }
        public int ClientesAtendidas { get; set; }

        public int Marcados { get; set; }
        public int Faltas { get; set; }
        public int Cancelados { get; set; }

        public List<FaturamentoDiaDTO> PorDia { get; set; } = new();
        public List<ItemRelatorioDTO> Servicos { get; set; } = new();
        public List<ProfissionalRelatorioDTO> Profissionais { get; set; } = new();
        public List<ClienteRelatorioDTO> MelhoresClientes { get; set; } = new();
        public List<ClienteRelatorioDTO> ClientesComFaltas { get; set; } = new();
    }

    public class FaturamentoDiaDTO
    {
        public DateTime Data { get; set; }
        public int Quantidade { get; set; }
        public decimal Total { get; set; }
    }

    public class ItemRelatorioDTO
    {
        public string Descricao { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal Total { get; set; }
    }

    public class ProfissionalRelatorioDTO
    {
        public int FuncionarioId { get; set; }
        public string Funcionario { get; set; } = string.Empty;
        public int Atendimentos { get; set; }
        public decimal Produzido { get; set; }

        // Soma dos dias pagos no período (diária + comissão)
        public decimal Recebido { get; set; }
    }

    public class ClienteRelatorioDTO
    {
        public int ClienteId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal Total { get; set; }
        public DateTime? UltimaVisita { get; set; }
        public int? DiasSemVir { get; set; }
        public DateTime? DataNascimento { get; set; }
    }
}
