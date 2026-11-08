# Gestão de Salão

Sistema de gestão para salão de beleza, no estilo de um PDV: cadastro de clientes, agenda de horários, baixa dos atendimentos com forma de pagamento, equipe de funcionários e cálculo/pagamento da remuneração diária de cada profissional.

Projeto de extensão desenvolvido para um salão da comunidade, a **CIA da Beleza**.

O nome do salão aparece apenas como o cliente que usa o sistema (constante `NOME_CLIENTE` em `GestaoSalaoUI/src/utilities/constants.tsx`), o que permite usar o mesmo sistema em outros salões.

---

## Objetivo

Substituir o caderno de agenda e as anotações de caixa do salão por um sistema simples, que permita:

* Cadastrar clientes e consultar o histórico de cada um
* Marcar horários sem conflito na agenda das profissionais
* Registrar o pagamento de cada atendimento (dinheiro, Pix, débito, crédito)
* Ver o movimento do dia (faturamento, atendimentos, ticket médio)
* Calcular e registrar quanto cada funcionário recebe por dia

---

## Arquitetura e Tecnologias

A aplicação foi dividida em duas partes principais:

### Backend (API)

* .NET 10 (ASP.NET Core)
* Entity Framework Core
* SQLite

Responsável por:

* Regras de negócio
* Organização dos endpoints REST

### Frontend (Interface)

* React
* TypeScript
* PrimeReact / PrimeFlex

Responsável por:

* Interação com o usuário
* Consumo da API
* Apresentação dos registros

---

## Estrutura do Projeto

GestaoSalaoApp/

 -> GestaoSalaoApi/ -> Backend (API REST)

 -> GestaoSalaoUI/  -> Frontend (Interface)

### Organização do Backend

Controllers -> Rotas da API
Services    -> Regras de negócio (agenda, remuneração, validação dos cadastros)
Data        -> Contexto do banco (Entity Framework)
Entidade    -> Espelho do Banco
DTO         -> Objetos de transferência de dados

### Organização do Frontend

pages       -> Telas (Painel, Agenda, Clientes, Funcionários, Serviços, Remuneração)
components  -> Componentes reaproveitados (tabela da agenda, janela de concluir atendimento)
interfaces  -> Tipos dos dados recebidos da API
utilities   -> Constantes, formatação de moeda/data e tradução pt-BR
services    -> Configuração do acesso à API (axios)

---

## Funcionalidades

### Painel (tela inicial)

* Faturamento do dia, atendimentos concluídos, pendentes e ticket médio
* Total recebido por forma de pagamento (fechamento de caixa)
* Agenda do dia com atalho para concluir ou cancelar atendimentos
* Resumo do que já foi pago e do que falta pagar aos funcionários

### Agenda

* Marcar horário: cliente + serviço + profissional + data/hora
* Valor preenchido automaticamente com o preço do serviço (pode ser alterado)
* Cadastro rápido de cliente novo sem sair da agenda
* Navegação por dia e filtro por profissional
* Remarcar, cancelar, excluir e concluir atendimentos

### Clientes

* Cadastro, edição, exclusão, listagem e busca
* Observações (alergias, preferências)
* Destaque dos aniversariantes do mês
* Histórico de atendimentos de cada cliente

### Funcionários

* Cadastro, edição, exclusão e listagem
* Forma de remuneração: diária fixa, comissão (%) ou diária + comissão
* Ativar/inativar (inativos não aparecem na agenda, mas o histórico é mantido)

### Serviços

* Tabela de serviços com preço e duração
* Já vem com alguns serviços cadastrados (corte, escova, manicure...)

### Remuneração diária

* Cálculo por funcionário: diária + comissão sobre os atendimentos concluídos no dia
* Marcação "trabalhou" para incluir a diária de quem não teve atendimentos
* Registro do pagamento (individual ou "pagar todos") e estorno
* Histórico de pagamentos por período e por funcionário

---

## Regras de Negócio

### Agenda

* Cliente, serviço e profissional devem existir; serviço e profissional devem estar ativos
* Não é possível agendar em data que já passou
* A mesma profissional não pode ter dois atendimentos no mesmo horário (considera a duração do serviço)
* O preço e a duração do serviço são copiados para o agendamento (mudar a tabela de preços não altera horários já marcados)
* Só atendimentos pendentes podem ser remarcados, cancelados ou concluídos
* Para concluir é obrigatório informar a forma de pagamento; o valor final pode ter desconto, mas deve ser maior que zero
* Não é possível concluir atendimento de data futura
* Atendimentos concluídos não podem ser excluídos (fazem parte do faturamento)

### Remuneração

* Comissão = soma dos atendimentos **concluídos** no dia × percentual do funcionário
* Diária = valor fixo, incluída quando o funcionário trabalhou no dia
* Cada funcionário só pode ser pago uma vez por dia; não é possível pagar dia futuro nem valor zero
* Os valores são gravados no momento do pagamento (servem de comprovante)
* Depois de pago, os atendimentos daquele funcionário naquele dia não podem ser concluídos; é preciso estornar o pagamento antes

### Cadastros

* Cliente: nome e telefone obrigatórios; data de nascimento não pode ser futura
* Funcionário: quem recebe diária precisa de valor > 0; quem recebe comissão precisa de percentual entre 0 e 100
* Serviço: preço > 0 e duração entre 5 minutos e 8 horas
* Clientes, funcionários e serviços com histórico não podem ser excluídos (funcionários e serviços podem ser inativados)

---

## Fluxo de Utilização

1. Cadastrar os funcionários e sua forma de remuneração
2. Conferir/ajustar a tabela de serviços
3. Cadastrar clientes (ou cadastrar na hora, pela agenda)
4. Marcar horários na agenda
5. Ao terminar cada atendimento, clicar em concluir e informar a forma de pagamento
6. No fim do dia, conferir o Painel e pagar os funcionários na tela de Remuneração

---

## Como Executar o Projeto

### Backend

cd GestaoSalaoApi/GestaoSalaoApi

dotnet run

A API será iniciada em: http://localhost:5100 (Swagger em http://localhost:5100/swagger)

---

### Frontend

cd GestaoSalaoUI

npm install

npm start

A aplicação estará disponível em: http://localhost:3000

---

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | /api/clientes | Listar (com `?busca=`) / cadastrar |
| PUT/DELETE | /api/clientes/{id} | Atualizar / excluir |
| GET | /api/clientes/{id}/agendamentos | Histórico do cliente |
| GET/POST | /api/funcionarios | Listar (com `?somenteAtivos=true`) / cadastrar |
| PUT/DELETE | /api/funcionarios/{id} | Atualizar / excluir |
| GET/POST | /api/servicos | Listar / cadastrar |
| PUT/DELETE | /api/servicos/{id} | Atualizar / excluir |
| GET | /api/agendamentos?data= | Agenda do dia (ou `?inicio=&fim=`, `funcionarioId`, `clienteId`) |
| POST | /api/agendamentos | Marcar horário |
| PUT | /api/agendamentos/{id} | Remarcar / editar |
| PUT | /api/agendamentos/{id}/concluir | Dar baixa (forma de pagamento e valor final) |
| PUT | /api/agendamentos/{id}/cancelar | Cancelar |
| DELETE | /api/agendamentos/{id} | Excluir lançamento feito por engano |
| GET | /api/painel?data= | Resumo do dia |
| GET | /api/remuneracoes?data= | Remuneração de cada funcionário no dia |
| POST | /api/remuneracoes/pagar | Registrar pagamento do dia |
| DELETE | /api/remuneracoes/pagamentos/{id} | Estornar pagamento |
| GET | /api/remuneracoes/historico | Histórico de pagamentos |

---

## Observações

* O banco SQLite (`gestaosalao.db`) é criado automaticamente na primeira execução, já com alguns serviços cadastrados
* Como o banco é criado com `EnsureCreated`, se a estrutura das entidades mudar, apague o `gestaosalao.db` para recriá-lo (ou passe a usar Migrations)
* A API usa a porta 5100 (configurada em `Properties/launchSettings.json`)
* Para usar no celular (mesma rede Wi-Fi), abra `http://IP-DO-COMPUTADOR:3000`; a API escuta em todas as interfaces e o front chama a API no mesmo IP. É preciso liberar as portas 3000 e 5100 no Firewall do Windows (rede marcada como Privada)
* O CORS está liberado para facilitar a integração entre frontend e backend
* As regras de negócio estão centralizadas na camada de serviços
* Datas e horários são tratados no horário local do salão (sem fuso)
