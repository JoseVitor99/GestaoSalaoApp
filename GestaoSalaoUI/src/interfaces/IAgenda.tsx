export interface IHorarioFuncionamento {
  diaSemana: number;
  diaDescricao: string;
  aberto: boolean;
  abertura: string;
  fechamento: string;
}

export interface IBloqueio {
  id: number;
  funcionarioId?: number | null;
  funcionario: string;
  inicio: string;
  fim: string;
  motivo?: string | null;
}
