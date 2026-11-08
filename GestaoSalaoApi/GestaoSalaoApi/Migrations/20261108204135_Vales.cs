using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GestaoSalaoApi.Migrations
{
    /// <inheritdoc />
    public partial class Vales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ValorVales",
                table: "PagamentosDiarios",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "Vales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FuncionarioId = table.Column<int>(type: "INTEGER", nullable: false),
                    Data = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Valor = table.Column<decimal>(type: "TEXT", nullable: false),
                    Observacao = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    PagamentoId = table.Column<int>(type: "INTEGER", nullable: true),
                    DataRegistro = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vales_Funcionarios_FuncionarioId",
                        column: x => x.FuncionarioId,
                        principalTable: "Funcionarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Vales_PagamentosDiarios_PagamentoId",
                        column: x => x.PagamentoId,
                        principalTable: "PagamentosDiarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vales_FuncionarioId",
                table: "Vales",
                column: "FuncionarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Vales_PagamentoId",
                table: "Vales",
                column: "PagamentoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Vales");

            migrationBuilder.DropColumn(
                name: "ValorVales",
                table: "PagamentosDiarios");
        }
    }
}
