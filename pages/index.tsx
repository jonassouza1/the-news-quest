import { useState } from "react";
import { useRouter } from "next/router";
import styles from "styles/index.module.css";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage("Por favor, insira um e-mail válido.");
      return;
    }

    setIsLoading(true);
    setMessage("Verificando email...");

    // try {
    // Envia a requisição para o webhook que irá verificar e cadastrar o email
    //  const res =
    await fetch("https://the-news-quest.vercel.app/api/v1/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    //if (res.ok) {
    // const data = await res.json();
    //  if (data.message) {
    //    setMessage(data.message);
    //  }
    // if (data.streak !== undefined) {
    //  setMessage("Cadastro enviado! Aguardando confirmação...");
    router.push(`/profile?email=${email}`);
    // }
    // } else {
    //  setMessage(
    //    "Erro ao cadastrar no sistema de newsletter. Tente novamente."
    //  );
    //}
    // } catch (error) {
    // console.error("Erro ao se inscrever:", error);
    //   setMessage("Erro inesperado. Tente novamente.");
    //  } finally {
    // setIsLoading(false);
    //}
  };

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <h1 className={styles.h1}>Bem-vindo ao The News!</h1>
        <p>Cadastre-se para acompanhar suas estatísticas:</p>
        <input
          type="email"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <br /> <br />
        <button
          className={styles.btn}
          onClick={handleSubscribe}
          //className={` ${
          // isLoading
          //  ? " btntrue"
          //  : "btnfalse"
          // }`}
          //disabled={isLoading}
        >
          {isLoading ? "Processando..." : "Cadastrar"}
        </button>
      </section>

      {message && <p>{message}</p>}
    </main>
  );
}
