using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Data
{
    public static class BancoDeDados
    {
        public static void Preparar(AppDbContext db)
        {
            if (!db.Database.GetMigrations().Any())
            {
                db.Database.EnsureCreated();
                return;
            }

            // Banco criado antes das migrations (pelo EnsureCreated): já está no estado da migration inicial
            if (TabelaExiste(db, "Clientes") && !TabelaExiste(db, "__EFMigrationsHistory"))
            {
                db.Database.ExecuteSqlRaw(
                    "CREATE TABLE \"__EFMigrationsHistory\" (\"MigrationId\" TEXT NOT NULL CONSTRAINT \"PK___EFMigrationsHistory\" PRIMARY KEY, \"ProductVersion\" TEXT NOT NULL)");
                db.Database.ExecuteSqlRaw(
                    "INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ({0}, {1})",
                    db.Database.GetMigrations().First(), "9.0.0");
            }

            db.Database.Migrate();

            // Telefones gravados com máscara antes da mudança passam a ter só os números
            db.Database.ExecuteSqlRaw(LimparTelefones.Replace("#tabela", "Clientes"));
            db.Database.ExecuteSqlRaw(LimparTelefones.Replace("#tabela", "Funcionarios"));
        }

        private const string LimparTelefones =
            "UPDATE \"#tabela\" SET \"Telefone\" = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(\"Telefone\", '(', ''), ')', ''), ' ', ''), '-', ''), '.', '') " +
            "WHERE \"Telefone\" GLOB '*[^0-9]*'";

        private static bool TabelaExiste(AppDbContext db, string tabela)
        {
            var conexao = db.Database.GetDbConnection();
            var abriu = conexao.State != System.Data.ConnectionState.Open;
            if (abriu) conexao.Open();

            try
            {
                using var comando = conexao.CreateCommand();
                comando.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = $nome";
                var parametro = comando.CreateParameter();
                parametro.ParameterName = "$nome";
                parametro.Value = tabela;
                comando.Parameters.Add(parametro);
                return Convert.ToInt32(comando.ExecuteScalar()) > 0;
            }
            finally
            {
                if (abriu) conexao.Close();
            }
        }
    }
}
