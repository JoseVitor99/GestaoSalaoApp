using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GestaoSalaoApi.Migrations
{
    /// <inheritdoc />
    public partial class HorariosBloqueios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Folgas",
                table: "Funcionarios",
                type: "TEXT",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Bloqueios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FuncionarioId = table.Column<int>(type: "INTEGER", nullable: true),
                    Inicio = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Fim = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Motivo = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bloqueios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bloqueios_Funcionarios_FuncionarioId",
                        column: x => x.FuncionarioId,
                        principalTable: "Funcionarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HorariosFuncionamento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DiaSemana = table.Column<int>(type: "INTEGER", nullable: false),
                    Aberto = table.Column<bool>(type: "INTEGER", nullable: false),
                    Abertura = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    Fechamento = table.Column<TimeSpan>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorariosFuncionamento", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "HorariosFuncionamento",
                columns: new[] { "Id", "Aberto", "Abertura", "DiaSemana", "Fechamento" },
                values: new object[,]
                {
                    { 1, false, new TimeSpan(0, 8, 0, 0, 0), 0, new TimeSpan(0, 19, 0, 0, 0) },
                    { 2, true, new TimeSpan(0, 8, 0, 0, 0), 1, new TimeSpan(0, 19, 0, 0, 0) },
                    { 3, true, new TimeSpan(0, 8, 0, 0, 0), 2, new TimeSpan(0, 19, 0, 0, 0) },
                    { 4, true, new TimeSpan(0, 8, 0, 0, 0), 3, new TimeSpan(0, 19, 0, 0, 0) },
                    { 5, true, new TimeSpan(0, 8, 0, 0, 0), 4, new TimeSpan(0, 19, 0, 0, 0) },
                    { 6, true, new TimeSpan(0, 8, 0, 0, 0), 5, new TimeSpan(0, 19, 0, 0, 0) },
                    { 7, true, new TimeSpan(0, 8, 0, 0, 0), 6, new TimeSpan(0, 17, 0, 0, 0) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bloqueios_FuncionarioId",
                table: "Bloqueios",
                column: "FuncionarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Bloqueios_Inicio_Fim",
                table: "Bloqueios",
                columns: new[] { "Inicio", "Fim" });

            migrationBuilder.CreateIndex(
                name: "IX_HorariosFuncionamento_DiaSemana",
                table: "HorariosFuncionamento",
                column: "DiaSemana",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bloqueios");

            migrationBuilder.DropTable(
                name: "HorariosFuncionamento");

            migrationBuilder.DropColumn(
                name: "Folgas",
                table: "Funcionarios");
        }
    }
}
