using System.Security.Cryptography;

namespace GestaoSalaoApi.Services
{
    public static class Senha
    {
        private const int Iteracoes = 100_000;
        private const int TamanhoSalt = 16;
        private const int TamanhoHash = 32;

        // Formato gravado: iteracoes.salt.hash (salt e hash em Base64)
        public static string Gerar(string senha)
        {
            var salt = RandomNumberGenerator.GetBytes(TamanhoSalt);
            var hash = Rfc2898DeriveBytes.Pbkdf2(senha, salt, Iteracoes, HashAlgorithmName.SHA256, TamanhoHash);
            return $"{Iteracoes}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }

        public static bool Conferir(string senha, string? gravada)
        {
            var partes = gravada?.Split('.');
            if (partes is not { Length: 3 } || !int.TryParse(partes[0], out var iteracoes))
                return false;

            var salt = Convert.FromBase64String(partes[1]);
            var esperado = Convert.FromBase64String(partes[2]);
            var hash = Rfc2898DeriveBytes.Pbkdf2(senha, salt, iteracoes, HashAlgorithmName.SHA256, esperado.Length);
            return CryptographicOperations.FixedTimeEquals(hash, esperado);
        }
    }
}
