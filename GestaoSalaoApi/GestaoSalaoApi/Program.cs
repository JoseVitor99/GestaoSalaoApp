using GestaoSalaoApi.Data;
using GestaoSalaoApi.Entidade;
using GestaoSalaoApi.Services;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<CadastroService>();
builder.Services.AddScoped<AgendaService>();
builder.Services.AddScoped<AgendamentoService>();
builder.Services.AddScoped<RemuneracaoService>();
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddSingleton<BackupService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<BackupService>());

// Configuração do SQLite
var connectionString = builder.Configuration.GetConnectionString("GestaoSalao") ?? "Data Source=gestaosalao.db";
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

// Login por token; toda rota exige usuário logado, exceto as marcadas com [AllowAnonymous]
builder.Services.AddAuthentication(BearerTokenDefaults.AuthenticationScheme)
    .AddBearerToken(BearerTokenDefaults.AuthenticationScheme, options => options.BearerTokenExpiration = TimeSpan.FromHours(12));
builder.Services.AddAuthorization(options =>
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

// Configuração de CORS para acessar o frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();

// Usuário inativado ou com perfil alterado perde o acesso na hora, mesmo com token válido
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var db = context.RequestServices.GetRequiredService<AppDbContext>();
        var id = context.User.IdUsuario();
        var valido = Enum.TryParse<PerfilUsuario>(context.User.Perfil(), out var perfil)
            && await db.Usuarios.AnyAsync(u => u.Id == id && u.Ativo && u.Perfil == perfil);

        if (!valido)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }
    }

    await next();
});

app.UseAuthorization();

app.MapControllers();

// Cria ou atualiza o banco de dados pelas migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    BancoDeDados.Preparar(db);
}

app.Run();
