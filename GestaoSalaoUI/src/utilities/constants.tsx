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

export { NOME_APP, NOME_CLIENTE, PERFIL, PERFIS, STATUS_AGENDAMENTO, FORMA_PAGAMENTO, TIPO_REMUNERACAO, TIPOS_REMUNERACAO };
