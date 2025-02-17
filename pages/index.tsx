import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const checkUserExists = async () => {
    try {
      const res = await fetch(`/api/v1/user?email=${email}`, {
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      return false;
    }
  };

  const handleSubscribe = async () => {
    if (!email) {
      setMessage("Por favor, insira um e-mail válido.");
      return;
    }

    setIsLoading(true);
    setMessage("Verificando email...");

    // Verifica se o usuário já existe no banco
    const userExists = await checkUserExists();
    if (userExists) {
      setMessage("Usuário encontrado. Redirecionando...");
      router.push(`/profile?email=${email}`);
      return;
    }

    setMessage("Usuário não encontrado. Cadastrando...");

    try {
      // Envia a requisição para o sistema de newsletter
      const res = await fetch(
        "https://backend.testeswaffle.org/webhooks/case/subscribe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      if (res.ok) {
        setMessage("Cadastro enviado! Aguardando confirmação...");
        let attempts = 5; // Tentativas limitadas para verificar novamente no banco
        while (attempts > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Espera entre tentativas
          const userExistsAfterRegister = await checkUserExists();
          if (userExistsAfterRegister) {
            setMessage("Usuário cadastrado com sucesso. Redirecionando...");
            router.push(`/profile?email=${email}`);
            return;
          }
          attempts--;
        }
        setMessage(
          "Não conseguimos processar seu cadastro. Tente novamente mais tarde.",
        );
      } else {
        setMessage(
          "Erro ao cadastrar no sistema de newsletter. Tente novamente.",
        );
      }
    } catch (error) {
      console.error("Erro ao se inscrever:", error);
      setMessage("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-4">Bem-vindo ao The News!</h1>
      <p className="mb-4">Cadastre-se para acompanhar suas estatísticas:</p>

      <input
        type="email"
        placeholder="Digite seu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full mb-2"
        disabled={isLoading}
      />

      <button
        onClick={handleSubscribe}
        className={`p-2 w-full text-white rounded ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        disabled={isLoading}
      >
        {isLoading ? "Processando..." : "Cadastrar"}
      </button>

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
    </div>
  );
};
