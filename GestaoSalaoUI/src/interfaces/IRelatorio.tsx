export interface IItemRelatorio {
  descricao: string;
  quantidade: number;
  total: number;
}

export interface IClienteRelatorio {
  clienteId: number;
  nome: string;
  telefone: string;
  quantidade: number;
  total: number;
  ultimaVisita?: string | null;
  diasSemVir?: number | null;
  dataNascimento?: string | null;
}

export interface IRelatorio {
  inicio: string;
  fim: string;
  faturamento: number;
  atendimentos: number;
  ticketMedio: number;
  clientesAtendidas: number;
  marcados: number;
  faltas: number;
  cancelados: number;
  porDia: { data: string; quantidade: number; total: number }[];
  servicos: IItemRelatorio[];
  profissionais: { funcionarioId: number; funcionario: string; atendimentos: number; produzido: number; recebido: number }[];
  melhoresClientes: IClienteRelatorio[];
  clientesComFaltas: IClienteRelatorio[];
}
