using GestaoSalaoApi.Entidade;
using Microsoft.EntityFrameworkCore;

namespace GestaoSalaoApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Cliente> Clientes { get; set; }

        public DbSet<Funcionario> Funcionarios { get; set; }

        public DbSet<Servico> Servicos { get; set; }

        public DbSet<Agendamento> Agendamentos { get; set; }

        public DbSet<PagamentoDiario> PagamentosDiarios { get; set; }

        public DbSet<Usuario> Usuarios { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Restrict: não deixa apagar cadastro que já tem atendimentos
            modelBuilder.Entity<Agendamento>()
                .HasOne(a => a.Cliente)
                .WithMany()
                .HasForeignKey(a => a.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Agendamento>()
                .HasOne(a => a.Funcionario)
                .WithMany()
                .HasForeignKey(a => a.FuncionarioId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Agendamento>()
                .HasOne(a => a.Servico)
                .WithMany()
                .HasForeignKey(a => a.ServicoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Agendamento>()
                .HasIndex(a => new { a.FuncionarioId, a.DataHora });

            modelBuilder.Entity<PagamentoDiario>()
                .HasOne(p => p.Funcionario)
                .WithMany()
                .HasForeignKey(p => p.FuncionarioId)
                .OnDelete(DeleteBehavior.Restrict);

            // Só pode existir um pagamento por funcionário em cada dia
            modelBuilder.Entity<PagamentoDiario>()
                .HasIndex(p => new { p.FuncionarioId, p.Data })
                .IsUnique();

            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Login)
                .IsUnique();

            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Funcionario)
                .WithMany()
                .HasForeignKey(u => u.FuncionarioId)
                .OnDelete(DeleteBehavior.SetNull);

            // Serviços iniciais
            modelBuilder.Entity<Servico>().HasData(
                new Servico { Id = 1, Descricao = "Corte feminino", Preco = 50m, DuracaoMinutos = 45, Ativo = true },
                new Servico { Id = 2, Descricao = "Corte masculino", Preco = 35m, DuracaoMinutos = 30, Ativo = true },
                new Servico { Id = 3, Descricao = "Escova", Preco = 40m, DuracaoMinutos = 40, Ativo = true },
                new Servico { Id = 4, Descricao = "Coloração", Preco = 120m, DuracaoMinutos = 90, Ativo = true },
                new Servico { Id = 5, Descricao = "Manicure", Preco = 30m, DuracaoMinutos = 40, Ativo = true },
                new Servico { Id = 6, Descricao = "Pedicure", Preco = 35m, DuracaoMinutos = 45, Ativo = true },
                new Servico { Id = 7, Descricao = "Design de sobrancelha", Preco = 30m, DuracaoMinutos = 20, Ativo = true }
            );
        }
    }
}
