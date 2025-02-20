import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "styles/profile.module.css";

interface UserData {
  streak: number;
  lastRead: string;
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const urlEmail = router.query.email as string;
    const storedEmail = localStorage.getItem("userEmail");

    const userEmail = urlEmail || storedEmail;

    if (!userEmail) {
      router.push("/");
      return;
    }

    localStorage.setItem("userEmail", userEmail);

    fetch(`/api/v1/user?email=${userEmail}`)
      .then((res) => res.json())
      .then((data) => {
        setUserData({
          streak: data.streak || 0,
          lastRead: data.lastRead || "Nenhuma leitura registrada",
        });
      })
      .catch((error) => {
        console.error("Erro ao carregar perfil:", error);
      });
  }, [router]);

  // Função para definir mensagens motivacionais
  const getMotivationalMessage = (streak: number): string => {
    const messages = {
      low: [
        "Todo começo é difícil, mas cada passo conta! 🚀",
        "Ótima escolha! A consistência faz a diferença. 📚",
        "Continue firme, o hábito está se formando! 💪",
      ],
      medium: [
        "Você está mandando bem! Mantenha o ritmo. 🔥",
        "Seu streak está crescendo, continue assim! 🌟",
        "Bons hábitos trazem grandes resultados. 👏",
      ],
      high: [
        "Incrível! Você está construindo um hábito sólido. 🎯",
        "Sua consistência é inspiradora, continue! 💯",
        "Você é imparável! Que streak impressionante. 🚀",
      ],
    };

    if (streak < 4) {
      return messages.low[Math.floor(Math.random() * messages.low.length)];
    } else if (streak < 10) {
      return messages.medium[
        Math.floor(Math.random() * messages.medium.length)
      ];
    } else {
      return messages.high[Math.floor(Math.random() * messages.high.length)];
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.divProfile}>
        <h1 className={styles.h1}>Meu Streak</h1>
        {userData ? (
          <div>
            <p>Streak atual: {userData.streak} dias</p>
            <p>Última leitura: {userData.lastRead}</p>
            <div>
              <p>{getMotivationalMessage(userData.streak)}</p>
            </div>
          </div>
        ) : (
          <p>Carregando...</p>
        )}
      </div>
    </section>
  );
}
