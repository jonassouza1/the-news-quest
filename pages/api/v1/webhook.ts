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
    return res
      .status(405)
      .json({ error: "Método não permitido. Apenas POST é permitido." });
  }

  // Extrair apenas as variáveis necessárias
  const {
    data: { id: resource_id, publish_date },
    email,
  }: { data: { id: string; publish_date: string }; email?: string } = req.body;

  if (!email || !resource_id) {
    return res
      .status(400)
      .json({ error: "Dados inválidos: 'email' ou 'resource_id' ausentes." });
  }

  try {
    // Lógica do streak e verificação de domingos
    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0) {
      return res
        .status(200)
        .json({ message: "Leituras aos domingos não contam para o streak." });
    }

    await database.query("BEGIN");

    // Inserir ou obter usuário
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

    // Inserir ou verificar a edição da newsletter
    const editionQuery = await database.query({
      text: `
        INSERT INTO newsletters (edition_id, publish_date)
        VALUES ($1, $2)
        ON CONFLICT (edition_id) DO NOTHING
        RETURNING id;
      `,
      values: [resource_id, publish_date],
    });

    const newsletterId = editionQuery.rows[0]?.id;

    // Registrar a leitura do usuário
    await database.query({
      text: `
        INSERT INTO reads (user_id, newsletter_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING;
      `,
      values: [userId, newsletterId],
    });

    // Atualizar streak
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

    await database.query("COMMIT");

    return res
      .status(200)
      .json({ message: "Leitura registrada!", streak: newStreak });
  } catch (error) {
    await database.query("ROLLBACK");
    console.error("Erro no webhook:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}
