# Manual de uso – Gestão de Salão

Guia rápido para quem usa o sistema no dia a dia da **CIA da Beleza**.

---

## 1. Como acessar

* **No computador do salão:** abra o navegador em `http://localhost:5100`
* **No celular:** conectado ao mesmo Wi-Fi do salão, abra `http://IP-DO-COMPUTADOR:5100` (o endereço completo aparece no fim da instalação). Dica: salve como atalho na tela inicial do celular
* O sistema liga sozinho junto com o computador. Basta o computador estar ligado e no Wi-Fi

Cada pessoa entra com o **seu usuário e senha**. O login vale por 12 horas; depois disso o sistema pede para entrar de novo.

No canto superior direito há a chave **claro/escuro** e o **círculo com as suas iniciais**, que abre o menu do usuário (alterar senha, sair e, para o administrador, as configurações).

---

## 2. Perfis de acesso

| | Administrador | Funcionário |
|---|---|---|
| Agenda e clientes | Tudo | Marca, remarca e conclui **só os próprios atendimentos**; não exclui clientes |
| Painel, funcionários, serviços | Sim | Não |
| Remuneração, vales, caixa e relatórios | Sim | Não (vê só os próprios ganhos em **Meus ganhos**) |
| Usuários, horários, backup | Sim | Não |

**Primeiro acesso:** na primeira vez que o sistema abre, ele pede para criar o administrador. Depois, o administrador cadastra os demais em **menu do usuário → Usuários**.

> Dica: cadastre **dois administradores** (por exemplo, a dona e a gerente). Se um esquecer a senha, o outro consegue trocar.

---

## 3. Agenda

### Marcar horário
1. Escolha a cliente (ou toque no botão ao lado para cadastrar uma nova só com nome e telefone)
2. Escolha o serviço, a profissional, o dia/hora e confira o valor
3. Para mais de um serviço na mesma visita, toque em **Adicionar outro serviço**: o próximo já começa quando o anterior termina
4. Toque em **Agendar**

O sistema não deixa marcar:
* duas clientes no mesmo horário com a mesma profissional
* fora do horário de funcionamento do salão
* no dia de folga da profissional ou num horário bloqueado

### Durante o dia
Cada horário na agenda tem botões:

* **✓ Concluir** – abre a **comanda** da cliente com todos os serviços dela no dia. Ajuste os valores se der desconto, escolha a forma de pagamento (dinheiro, Pix, débito, crédito) e confirme
* **Não compareceu** (ícone roxo) – aparece depois que o horário passa; registra a falta e libera o horário
* **Lápis** – remarcar ou trocar serviço/profissional
* **X** – cancelar o horário
* **Lixeira** – excluir (só para lançamentos feitos por engano)

### Lembretes por WhatsApp
O botão **Lembretes** mostra as clientes de amanhã (dá para escolher outro dia). Cada botão **Enviar** abre o WhatsApp com a mensagem pronta; é só conferir e mandar. Quem já recebeu fica marcado.

### Bloquear horário
O botão **Bloquear** fecha a agenda para almoço, médico, férias ou feriado. Pode ser de uma profissional ou do salão inteiro, por algumas horas ou por dias inteiros. A funcionária consegue bloquear só a própria agenda. Os bloqueios do dia aparecem numa faixa acima da agenda, com um **x** para remover.

---

## 4. Clientes

* Cadastro com nome, telefone/WhatsApp, e-mail, aniversário e observações (alergias, preferências…)
* Toque na cliente para ver o **histórico**: serviços feitos, quanto já gastou e quantas faltas teve
* Botões para ligar ou chamar no WhatsApp

---

## 5. Funcionários e serviços (administrador)

* **Funcionários:** nome, função, telefone, forma de remuneração (diária, comissão ou diária + comissão) e **folga semanal** (os dias em que a agenda não aceita horários com ela)
* **Serviços:** nome, preço e duração. A duração define quanto tempo o horário ocupa na agenda
* Para a funcionária entrar no sistema, crie o usuário dela em **Usuários** e vincule ao cadastro

---

## 6. Horário de funcionamento (administrador)

Em **menu do usuário → Horário e bloqueios**:

* Ligue ou desligue cada dia da semana e ajuste a hora de abrir e fechar. Toque em **Salvar horários**
* Ao lado ficam todos os bloqueios programados (feriados, férias…), com opção de criar e remover

---

## 7. Remuneração e vales (administrador)

### Pagamento do dia
Mostra, para cada profissional, os atendimentos concluídos, a comissão, a diária, os vales e o **valor a pagar**.

* Marque **Trabalhou** para somar a diária de quem recebe diária
* Toque em **Pagar** em cada uma, ou em **Pagar todos**
* Errou? **Estornar** desfaz o pagamento

### Vales (adiantamentos)
Na aba **Vales**, registre o adiantamento (funcionária, data, valor e observação). Ele é **descontado sozinho no próximo pagamento**. Se o vale for maior que o valor do dia, o restante fica para o pagamento seguinte.

### Histórico
Todos os pagamentos de um período, com filtro por funcionária.

---

## 8. Caixa (administrador)

Mostra o dinheiro que **entrou** e **saiu**, por dia ou por mês:

* **Entradas:** atendimentos recebidos, separados por forma de pagamento
* **Saídas:** despesas, vales e pagamentos às funcionárias
* **Saldo** e o **extrato** com todas as movimentações

Use **Nova despesa** para lançar compras de produtos, aluguel, contas e outros gastos. As despesas podem ser editadas ou excluídas pelo extrato.

---

## 9. Relatórios (administrador)

Escolha o período (este mês, mês passado, últimos 30 dias, este ano ou datas livres) e veja:

* faturamento, número de atendimentos e ticket médio, com gráfico
* serviços mais vendidos e quanto cada profissional produziu
* melhores clientes e quem mais faltou
* **clientes que não voltam** há 30, 60 ou 90 dias e **aniversariantes do mês**, com botão de WhatsApp com mensagem pronta

---

## 10. Meus ganhos (funcionária)

A funcionária vê quanto vai receber no dia (comissão, diária e vales a descontar), os atendimentos dela, os vales e os pagamentos dos últimos 30 dias. O valor só fica confirmado quando o administrador registra o pagamento.

---

## 11. Backup (cópia de segurança)

* O sistema guarda sozinho **uma cópia por dia** na pasta `C:\GestaoSalao\Backups` (últimos 30 dias)
* O administrador pode baixar uma cópia na hora em **menu do usuário → Baixar backup**
* **Recomendado:** uma vez por semana, baixe o backup e guarde fora do computador (pen drive, Google Drive, e-mail). Se o computador estragar, é essa cópia que salva os dados

---

## 12. Dúvidas frequentes

**O celular não abre o sistema.**
Confira se o celular está no mesmo Wi-Fi do salão e se o computador está ligado. Se o endereço do computador mudou (acontece quando o roteador reinicia), veja o endereço atual rodando `ipconfig` no computador (linha "Endereço IPv4").

**Esqueci minha senha.**
Peça ao administrador: em **Usuários**, ele edita o seu cadastro e coloca uma senha nova.

**O sistema não abre nem no computador.**
Reinicie o computador. Se continuar, abra o **Agendador de Tarefas** do Windows, procure a tarefa **GestaoSalao** e clique em **Executar**.

**Apareceu "Você não tem permissão para esta ação".**
Essa função é só do administrador.

**A agenda não deixa marcar um horário.**
Leia a mensagem: ela diz o motivo (horário ocupado, salão fechado, folga ou bloqueio). Se for um caso especial, o administrador pode ajustar o horário de funcionamento ou remover o bloqueio.
