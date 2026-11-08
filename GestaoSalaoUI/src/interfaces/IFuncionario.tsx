interface IFuncionario {
  id: number;
  nome: string;
  telefone?: string | null;
  funcao?: string | null;
  tipoRemuneracao: number;
  valorDiaria: number;
  percentualComissao: number;
  ativo: boolean;
}

export default IFuncionario;
