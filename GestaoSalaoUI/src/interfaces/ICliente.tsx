interface ICliente {
  id: number;
  nome: string;
  telefone: string;
  email?: string | null;
  dataNascimento?: string | null;
  observacoes?: string | null;
  dataCadastro?: string;
}

export default ICliente;
