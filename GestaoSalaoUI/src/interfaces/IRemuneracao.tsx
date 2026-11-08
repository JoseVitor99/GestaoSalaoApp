export interface IRemuneracaoDiaria {
  funcionarioId: number;
  funcionario: string;
  funcao?: string | null;
  tipoRemuneracao: number;
  tipoRemuneracaoDescricao: string;
  percentualComissao: number;
  valorDiariaConfigurada: number;
  data: string;
  quantidadeAtendimentos: number;
  totalAtendimentos: number;
  diariaIncluida: boolean;
  valorDiaria: number;
  valorComissao: number;
  valorTotal: number;
  valorVales: number;
  valorAPagar: number;
  pago: boolean;
  pagamentoId?: number | null;
  dataPagamento?: string | null;
}

export interface IPagamentoDiario {
  id: number;
  funcionarioId: number;
  funcionario: string;
  data: string;
  quantidadeAtendimentos: number;
  totalAtendimentos: number;
  valorDiaria: number;
  valorComissao: number;
  valorTotal: number;
  valorVales: number;
  valorPago: number;
  dataPagamento: string;
}

export interface IVale {
  id: number;
  funcionarioId: number;
  funcionario: string;
  data: string;
  valor: number;
  observacao?: string | null;
  descontado: boolean;
  descontadoNoDia?: string | null;
}

export interface IPainelDia {
  data: string;
  totalAgendamentos: number;
  pendentes: number;
  concluidos: number;
  cancelados: number;
  faltas: number;
  faturamento: number;
  previsaoPendentes: number;
  ticketMedio: number;
  porFormaPagamento: { formaPagamento: number; descricao: string; quantidade: number; total: number }[];
}
