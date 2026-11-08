const NOME_APP = "Gestão de Salão";

const NOME_CLIENTE = "CIA da Beleza";

const PERFIL = {
  ADMINISTRADOR: 1,
  FUNCIONARIO: 2,
};

const PERFIS = [
  { value: PERFIL.ADMINISTRADOR, descricao: "Administrador" },
  { value: PERFIL.FUNCIONARIO, descricao: "Funcionário" },
];

const STATUS_AGENDAMENTO = {
  AGENDADO: 1,
  CONCLUIDO: 2,
  CANCELADO: 3,
  NAO_COMPARECEU: 4,
};

const FORMA_PAGAMENTO = [
  { value: 1, descricao: "Dinheiro", curto: "Dinheiro", icone: "pi pi-money-bill" },
  { value: 2, descricao: "Pix", curto: "Pix", icone: "pi pi-qrcode" },
  { value: 3, descricao: "Cartão de débito", curto: "Débito", icone: "pi pi-credit-card" },
  { value: 4, descricao: "Cartão de crédito", curto: "Crédito", icone: "pi pi-credit-card" },
];

const TIPO_REMUNERACAO = {
  DIARIA: 1,
  COMISSAO: 2,
  DIARIA_MAIS_COMISSAO: 3,
};

const TIPOS_REMUNERACAO = [
  { value: TIPO_REMUNERACAO.DIARIA, descricao: "Diária fixa" },
  { value: TIPO_REMUNERACAO.COMISSAO, descricao: "Comissão (%)" },
  { value: TIPO_REMUNERACAO.DIARIA_MAIS_COMISSAO, descricao: "Diária + comissão" },
];

// Começa na segunda; o valor segue o padrão do .NET (0 = domingo)
const DIAS_SEMANA = [
  { value: 1, curto: "Seg", descricao: "Segunda-feira" },
  { value: 2, curto: "Ter", descricao: "Terça-feira" },
  { value: 3, curto: "Qua", descricao: "Quarta-feira" },
  { value: 4, curto: "Qui", descricao: "Quinta-feira" },
  { value: 5, curto: "Sex", descricao: "Sexta-feira" },
  { value: 6, curto: "Sáb", descricao: "Sábado" },
  { value: 0, curto: "Dom", descricao: "Domingo" },
];

const CATEGORIAS_DESPESA = [
  { value: 1, descricao: "Produtos" },
  { value: 2, descricao: "Aluguel" },
  { value: 3, descricao: "Contas (luz, água, internet)" },
  { value: 4, descricao: "Manutenção" },
  { value: 5, descricao: "Outros" },
];

export { CATEGORIAS_DESPESA, DIAS_SEMANA, NOME_APP, NOME_CLIENTE, PERFIL, PERFIS, STATUS_AGENDAMENTO, FORMA_PAGAMENTO, TIPO_REMUNERACAO, TIPOS_REMUNERACAO };
