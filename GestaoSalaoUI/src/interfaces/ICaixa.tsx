export interface ITotalItem {
  descricao: string;
  quantidade: number;
  total: number;
}

export interface IMovimentoCaixa {
  data: string;
  tipo: "Entrada" | "Despesa" | "Vale" | "Pagamento";
  descricao: string;
  detalhe?: string | null;
  formaPagamento: string;
  valor: number;
  entrada: boolean;
  despesaId?: number | null;
}

export interface ICaixa {
  inicio: string;
  fim: string;
  entradas: number;
  entradasPorForma: ITotalItem[];
  despesas: number;
  despesasPorCategoria: ITotalItem[];
  vales: number;
  pagamentos: number;
  saidas: number;
  saldo: number;
  movimentos: IMovimentoCaixa[];
}

export interface IDespesa {
  id: number;
  data: string;
  descricao: string;
  categoria: number;
  categoriaDescricao: string;
  valor: number;
  formaPagamento?: number | null;
}
