import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";

type ResponseData = {
  message?: string;
  streak?: number;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { email, resource_id }: { email: string; resource_id: string } =
    req.body;

  if (!email || !resource_id) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    // Inserir usuário e retornar ID diretamente
    const userQuery = await database.query({
      text: `
        INSERT INTO users (email)
        VALUES ($1)
        ON CONFLICT (email) DO UPDATE SET email = users.email
        RETURNING id;
      `,
      values: [email],
    });

    const userId = userQuery.rows[0].id;

    // Inserir newsletter e retornar ID diretamente
    const newsletterQuery = await database.query({
      text: `
        INSERT INTO newsletters (edition_id)
        VALUES ($1)
        ON CONFLICT (edition_id) DO UPDATE SET edition_id = newsletters.edition_id
        RETURNING id;
      `,
      values: [resource_id],
    });

    const newsletterId = newsletterQuery.rows[0].id;

    // Inserir leitura
    await database.query({
      text: "INSERT INTO reads (user_id, newsletter_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      values: [userId, newsletterId],
    });

    // Atualizar streaks de forma atômica
    const streakQuery = await database.query({
      text: `
        WITH last_streak AS (
          SELECT streak_count, last_read_at FROM streaks WHERE user_id = $1
        )
        INSERT INTO streaks (user_id, streak_count, last_read_at)
        VALUES ($1, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET 
          streak_count = CASE 
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

    return res
      .status(200)
      .json({ message: "Leitura registrada!", streak: newStreak });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}
