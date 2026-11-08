using GestaoSalaoApi.Data;
using GestaoSalaoApi.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<CadastroService>();
builder.Services.AddScoped<AgendamentoService>();
builder.Services.AddScoped<RemuneracaoService>();

// Configuração do SQLite
var connectionString = builder.Configuration.GetConnectionString("GestaoSalao") ?? "Data Source=gestaosalao.db";
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

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

app.UseAuthorization();

app.MapControllers();

// Cria o banco de dados automaticamente, se não existir
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.Run();
