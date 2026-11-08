interface IUsuario {
  id: number;
  nome: string;
  login: string;
  perfil: number;
  perfilDescricao: string;
  funcionarioId?: number | null;
  funcionario?: string | null;
  ativo: boolean;
}

export default IUsuario;
