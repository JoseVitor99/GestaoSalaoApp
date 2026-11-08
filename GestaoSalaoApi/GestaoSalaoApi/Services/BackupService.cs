using GestaoSalaoApi.Data;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Services
{
    public class BackupService : BackgroundService
    {
        private const int DiasGuardados = 30;

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<BackupService> _logger;
        private readonly string _pasta;

        public BackupService(IServiceScopeFactory scopeFactory, IWebHostEnvironment env, ILogger<BackupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _pasta = Path.Combine(env.ContentRootPath, "Backups");
        }

        public byte[] GerarCopia()
        {
            var arquivo = Path.Combine(Path.GetTempPath(), $"gestaosalao-{Guid.NewGuid():N}.db");
            try
            {
                Copiar(arquivo);
                return File.ReadAllBytes(arquivo);
            }
            finally
            {
                File.Delete(arquivo);
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    BackupDoDia();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao gerar o backup automático.");
                }

                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }

        private void BackupDoDia()
        {
            Directory.CreateDirectory(_pasta);

            var arquivo = Path.Combine(_pasta, $"gestaosalao-{DateTime.Today:yyyy-MM-dd}.db");
            if (File.Exists(arquivo)) return;

            Copiar(arquivo);
            _logger.LogInformation("Backup criado em {Arquivo}", arquivo);

            foreach (var antigo in Directory.GetFiles(_pasta, "gestaosalao-*.db").OrderByDescending(f => f).Skip(DiasGuardados))
                File.Delete(antigo);
        }

        // VACUUM INTO gera uma cópia consistente mesmo com o banco em uso
        private void Copiar(string destino)
        {
            if (File.Exists(destino)) File.Delete(destino);

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.ExecuteSqlRaw("VACUUM INTO {0}", destino);
        }
    }
}
