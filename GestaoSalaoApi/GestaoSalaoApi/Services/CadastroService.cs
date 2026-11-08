using GestaoSalaoApi.Entidade;

namespace GestaoSalaoApi.Services
{
    public class CadastroService
    {
        public void ValidarCliente(Cliente cliente)
        {
            if (string.IsNullOrWhiteSpace(cliente.Nome))
                throw new RegraNegocioException("Informe o nome do cliente.");

            cliente.Telefone = ValidarTelefone(cliente.Telefone, obrigatorio: true);

            if (cliente.DataNascimento.HasValue && cliente.DataNascimento.Value.Date > DateTime.Today)
                throw new RegraNegocioException("A data de nascimento não pode ser futura.");

            cliente.Nome = cliente.Nome.Trim();
        }

        public void ValidarFuncionario(Funcionario funcionario)
        {
            if (string.IsNullOrWhiteSpace(funcionario.Nome))
                throw new RegraNegocioException("Informe o nome do funcionário.");

            funcionario.Telefone = ValidarTelefone(funcionario.Telefone, obrigatorio: false);

            if (!Enum.IsDefined(funcionario.TipoRemuneracao))
                throw new RegraNegocioException("Tipo de remuneração inválido.");

            var recebeDiaria = funcionario.TipoRemuneracao != TipoRemuneracao.Comissao;
            var recebeComissao = funcionario.TipoRemuneracao != TipoRemuneracao.Diaria;

            if (recebeDiaria && funcionario.ValorDiaria <= 0)
                throw new RegraNegocioException("Informe o valor da diária (maior que zero).");

            if (recebeComissao && (funcionario.PercentualComissao <= 0 || funcionario.PercentualComissao > 100))
                throw new RegraNegocioException("O percentual de comissão deve ser maior que 0 e no máximo 100.");

            if (!recebeDiaria) funcionario.ValorDiaria = 0;
            if (!recebeComissao) funcionario.PercentualComissao = 0;

            funcionario.Nome = funcionario.Nome.Trim();
        }

        // Grava só os números, com DDD: 10 dígitos (fixo) ou 11 (celular)
        private static string? ValidarTelefone(string? telefone, bool obrigatorio)
        {
            var digitos = new string((telefone ?? string.Empty).Where(char.IsDigit).ToArray());

            if (digitos.Length == 0)
            {
                if (obrigatorio) throw new RegraNegocioException("Informe o telefone do cliente.");
                return null;
            }

            if (digitos.Length is < 10 or > 11)
                throw new RegraNegocioException("Informe o telefone com DDD, no formato (XX) X XXXX-XXXX.");

            return digitos;
        }

        public void ValidarServico(Servico servico)
        {
            if (string.IsNullOrWhiteSpace(servico.Descricao))
                throw new RegraNegocioException("Informe a descrição do serviço.");

            if (servico.Preco <= 0)
                throw new RegraNegocioException("O preço deve ser maior que zero.");

            if (servico.DuracaoMinutos < 5 || servico.DuracaoMinutos > 480)
                throw new RegraNegocioException("A duração deve ser entre 5 minutos e 8 horas.");

            servico.Descricao = servico.Descricao.Trim();
        }
    }
}
