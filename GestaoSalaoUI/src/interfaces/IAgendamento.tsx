interface IAgendamento {
  id: number;
  clienteId: number;
  cliente: string;
  clienteTelefone: string;
  funcionarioId: number;
  funcionario: string;
  servicoId: number;
  servico: string;
  dataHora: string;
  dataHoraFim: string;
  duracaoMinutos: number;
  valor: number;
  status: number;
  statusDescricao: string;
  formaPagamento?: number | null;
  formaPagamentoDescricao: string;
  observacao?: string | null;
}

export default IAgendamento;
