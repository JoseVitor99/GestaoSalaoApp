using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestaoSalaoApi.Controllers
{
    [ApiController]
    [Route("api/backup")]
    [Authorize(Roles = Perfis.Administrador)]
    public class BackupController : ControllerBase
    {
        private readonly BackupService _backup;

        public BackupController(BackupService backup)
        {
            _backup = backup;
        }

        [HttpGet]
        public IActionResult Baixar()
        {
            var conteudo = _backup.GerarCopia();
            return File(conteudo, "application/octet-stream", $"gestaosalao-{DateTime.Now:yyyy-MM-dd-HHmm}.db");
        }
    }
}
