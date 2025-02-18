import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";
import axios from "axios";

type ResponseData = {
  message?: string;
  streak?: number;
  error?: string;
  post?: PostDetails;
};

type PostDetails = {
  id: string;
  title: string;
  content: string;
  published_at: string;
  author: {
    name: string;
    email: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "Método não permitido. Apenas GET é permitido." });
  }

  const { email, id } = req.query;

  if (!email || !id) {
    return res
      .status(400)
      .json({ error: "Dados inválidos: 'email' ou 'id' ausentes." });
  }

  try {
    // Fazendo a requisição para a API externa
    const postResponse = await axios.get<PostDetails>(
      `https://backend.testeswaffle.org/webhooks/case/publication/teste/post/${id}`,
    );

    // Verificando o status da resposta da API externa
    if (postResponse.status !== 200) {
      return res.status(500).json({ error: "Falha ao obter dados do post." });
    }

    const postDetails = postResponse.data;
    if (!postDetails) {
      return res.status(404).json({ error: "Post não encontrado." });
    }

    // Evitando leitura aos domingos
    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0) {
      return res
        .status(200)
        .json({ message: "Leituras aos domingos não contam para o streak." });
    }

    // Verificando se o usuário já fez leitura recentemente (última hora)
    const oneHourAgo = new Date(today);
    oneHourAgo.setHours(today.getHours() - 1);

    const existingReadQuery = await database.query({
      text: `
        SELECT 1 FROM reads 
        WHERE user_id = $1 
        AND read_at > $2
        LIMIT 1;
      `,
      values: [email, oneHourAgo.toISOString()],
    });

    if (existingReadQuery.rowCount > 0) {
      return res.status(400).json({
        error: "Você já fez uma leitura recentemente (dentro da última hora).",
      });
    }

    // Verificando se o usuário já fez leitura no dia de hoje
    const todayMidnight = new Date(today.setHours(0, 0, 0, 0));

    const dailyReadQuery = await database.query({
      text: `
        SELECT 1 FROM reads
        WHERE user_id = $1
        AND read_at >= $2
        LIMIT 1;
      `,
      values: [email, todayMidnight.toISOString()],
    });

    if (dailyReadQuery.rowCount > 0) {
      return res.status(400).json({ error: "Você já fez uma leitura hoje." });
    }

    // Iniciando transação no banco
    await database.query("BEGIN");

    // Verificando ou inserindo o usuário no banco
    const userQuery = await database.query({
      text: `
        INSERT INTO users (email)
        VALUES ($1)
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
      `,
      values: [email],
    });

    let userId = userQuery.rows[0]?.id;
    if (!userId) {
      const userSelect = await database.query({
        text: "SELECT id FROM users WHERE email = $1;",
        values: [email],
      });
      userId = userSelect.rows[0].id;
    }

    // Inserindo ou atualizando o registro da newsletter

    const editionQuery = await database.query({
      text: `
    INSERT INTO newsletters (edition_id)
    VALUES ($1)
    ON CONFLICT (edition_id) DO NOTHING
    RETURNING id;
  `,
      values: [id],
    });

    const newsletterIdInserted = editionQuery.rows[0]?.id;

    // Inserindo o registro de leitura
    await database.query({
      text: `
        INSERT INTO reads (user_id, newsletter_id, read_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, newsletter_id) DO NOTHING;
      `,
      values: [userId, newsletterIdInserted],
    });

    // Atualizando o streak de leitura
    const streakQuery = await database.query({
      text: `
        WITH last_streak AS (
          SELECT streak_count, last_read_at FROM streaks WHERE user_id = $1
        )
        INSERT INTO streaks (user_id, streak_count, last_read_at)
        VALUES ($1, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET streak_count = CASE
          WHEN (SELECT last_read_at FROM last_streak) IS NULL THEN 1
          WHEN (DATE(NOW()) - DATE((SELECT last_read_at FROM last_streak))) = 1 THEN (SELECT streak_count FROM last_streak) + 1
          ELSE 1
        END,
        last_read_at = NOW()
        RETURNING streak_count;
      `,
      values: [userId],
    });

    const newStreak = streakQuery.rows[0].streak_count;

    // Finalizando a transação
    await database.query("COMMIT");

    return res.status(200).json({
      message: "Leitura registrada!",
      streak: newStreak,
      post: postDetails,
    });
  } catch (error) {
    // Rollback da transação em caso de erro
    await database.query("ROLLBACK");
    console.error("Erro no webhook:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}
