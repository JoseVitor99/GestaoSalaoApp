using System.Text.RegularExpressions;
using GestaoSalaoApi.Data;
using GestaoSalaoApi.DTO;
using GestaoSalaoApi.Entidade;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Services
{
    public class UsuarioService
    {
        private const int TamanhoMinimoSenha = 6;

        private readonly AppDbContext _context;

        public UsuarioService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> PrecisaConfigurar() => !await _context.Usuarios.AnyAsync();

        public async Task<Usuario?> Autenticar(string? login, string? senha)
        {
            var normalizado = NormalizarLogin(login);
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Login == normalizado);

            if (usuario == null || !usuario.Ativo || !Senha.Conferir(senha ?? string.Empty, usuario.SenhaHash))
                return null;

            return usuario;
        }

        public async Task<Usuario> CriarPrimeiroAdministrador(PrimeiroAcessoDTO dto)
        {
            if (!await PrecisaConfigurar())
                throw new RegraNegocioException("O sistema já possui usuários cadastrados.");

            var usuario = new Usuario
            {
                Nome = ValidarNome(dto.Nome),
                Login = await ValidarLogin(dto.Login, null),
                SenhaHash = Senha.Gerar(ValidarSenha(dto.Senha)),
                Perfil = PerfilUsuario.Administrador,
                Ativo = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            return usuario;
        }

        public async Task<List<UsuarioDTO>> Listar()
        {
            var usuarios = await Consulta().OrderBy(u => u.Nome).ToListAsync();
            return usuarios.Select(ToDTO).ToList();
        }

        public async Task<UsuarioDTO?> Buscar(int id)
        {
            var usuario = await Consulta().FirstOrDefaultAsync(u => u.Id == id);
            return usuario == null ? null : ToDTO(usuario);
        }

        public async Task<UsuarioDTO> Criar(UsuarioInputDTO dto)
        {
            var perfil = ValidarPerfil(dto.Perfil);

            var usuario = new Usuario
            {
                Nome = ValidarNome(dto.Nome),
                Login = await ValidarLogin(dto.Login, null),
                SenhaHash = Senha.Gerar(ValidarSenha(dto.Senha)),
                Perfil = perfil,
                FuncionarioId = await ValidarFuncionario(perfil, dto.FuncionarioId, null),
                Ativo = dto.Ativo
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            return (await Buscar(usuario.Id))!;
        }

        public async Task<UsuarioDTO> Editar(int id, UsuarioInputDTO dto, int idUsuarioLogado)
        {
            var usuario = await _context.Usuarios.FindAsync(id)
                ?? throw new RegraNegocioException("Usuário não encontrado.");

            var perfil = ValidarPerfil(dto.Perfil);

            if (id == idUsuarioLogado && (!dto.Ativo || perfil != PerfilUsuario.Administrador) && usuario.Perfil == PerfilUsuario.Administrador)
                throw new RegraNegocioException("Você não pode inativar nem tirar o perfil de administrador do seu próprio usuário.");

            if (usuario.Perfil == PerfilUsuario.Administrador && usuario.Ativo &&
                (perfil != PerfilUsuario.Administrador || !dto.Ativo))
                await GarantirOutroAdministrador(id);

            usuario.Nome = ValidarNome(dto.Nome);
            usuario.Login = await ValidarLogin(dto.Login, id);
            usuario.Perfil = perfil;
            usuario.FuncionarioId = await ValidarFuncionario(perfil, dto.FuncionarioId, id);
            usuario.Ativo = dto.Ativo;

            if (!string.IsNullOrWhiteSpace(dto.Senha))
                usuario.SenhaHash = Senha.Gerar(ValidarSenha(dto.Senha));

            await _context.SaveChangesAsync();
            return (await Buscar(id))!;
        }

        public async Task Excluir(int id, int idUsuarioLogado)
        {
            if (id == idUsuarioLogado)
                throw new RegraNegocioException("Você não pode excluir o seu próprio usuário.");

            var usuario = await _context.Usuarios.FindAsync(id)
                ?? throw new RegraNegocioException("Usuário não encontrado.");

            if (usuario.Perfil == PerfilUsuario.Administrador && usuario.Ativo)
                await GarantirOutroAdministrador(id);

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
        }

        public async Task AlterarPropriaSenha(int id, AlterarSenhaDTO dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id)
                ?? throw new RegraNegocioException("Usuário não encontrado.");

            if (!Senha.Conferir(dto.SenhaAtual ?? string.Empty, usuario.SenhaHash))
                throw new RegraNegocioException("A senha atual está incorreta.");

            usuario.SenhaHash = Senha.Gerar(ValidarSenha(dto.NovaSenha));
            await _context.SaveChangesAsync();
        }

        public static UsuarioDTO ToDTO(Usuario u) => new()
        {
            Id = u.Id,
            Nome = u.Nome ?? string.Empty,
            Login = u.Login ?? string.Empty,
            Perfil = (int)u.Perfil,
            PerfilDescricao = u.Perfil == PerfilUsuario.Administrador ? "Administrador" : "Funcionário",
            FuncionarioId = u.FuncionarioId,
            Funcionario = u.Funcionario?.Nome,
            Ativo = u.Ativo
        };

        private IQueryable<Usuario> Consulta() => _context.Usuarios.Include(u => u.Funcionario);

        private static string NormalizarLogin(string? login) => (login ?? string.Empty).Trim().ToLowerInvariant();

        private static string ValidarNome(string? nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                throw new RegraNegocioException("Informe o nome do usuário.");
            return nome.Trim();
        }

        private async Task<string> ValidarLogin(string? login, int? ignorarId)
        {
            var normalizado = NormalizarLogin(login);

            if (!Regex.IsMatch(normalizado, "^[a-z0-9._-]{3,50}$"))
                throw new RegraNegocioException("O usuário deve ter de 3 a 50 caracteres, usando letras sem acento, números, ponto, hífen ou sublinhado.");

            if (await _context.Usuarios.AnyAsync(u => u.Login == normalizado && u.Id != ignorarId))
                throw new RegraNegocioException("Já existe um usuário com esse login.");

            return normalizado;
        }

        private static string ValidarSenha(string? senha)
        {
            if (string.IsNullOrEmpty(senha) || senha.Length < TamanhoMinimoSenha)
                throw new RegraNegocioException($"A senha deve ter pelo menos {TamanhoMinimoSenha} caracteres.");
            return senha;
        }

        private static PerfilUsuario ValidarPerfil(int perfil)
        {
            if (!Enum.IsDefined(typeof(PerfilUsuario), perfil))
                throw new RegraNegocioException("Perfil inválido.");
            return (PerfilUsuario)perfil;
        }

        // Funcionário precisa estar vinculado para ver os próprios ganhos; administrador pode ou não estar
        private async Task<int?> ValidarFuncionario(PerfilUsuario perfil, int? funcionarioId, int? ignorarUsuarioId)
        {
            if (funcionarioId == null)
            {
                if (perfil == PerfilUsuario.Funcionario)
                    throw new RegraNegocioException("Selecione o funcionário vinculado a este usuário.");
                return null;
            }

            if (!await _context.Funcionarios.AnyAsync(f => f.Id == funcionarioId))
                throw new RegraNegocioException("Funcionário não encontrado.");

            if (await _context.Usuarios.AnyAsync(u => u.FuncionarioId == funcionarioId && u.Id != ignorarUsuarioId))
                throw new RegraNegocioException("Este funcionário já possui um usuário.");

            return funcionarioId;
        }

        private async Task GarantirOutroAdministrador(int idAlterado)
        {
            var outros = await _context.Usuarios.AnyAsync(u =>
                u.Id != idAlterado && u.Ativo && u.Perfil == PerfilUsuario.Administrador);

            if (!outros)
                throw new RegraNegocioException("O sistema precisa ter pelo menos um administrador ativo.");
        }
    }
}
