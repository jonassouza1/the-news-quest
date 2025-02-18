import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";
import axios from "axios";

type ResponseData = {
  message?: string;
  streak?: number;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method === "GET") {
    const { email, id } = req.query;

    if (!email || !id) {
      return res
        .status(400)
        .json({ error: "Dados inválidos: 'email' ou 'id' ausentes." });
    }

    if (typeof id !== "string" || !id.startsWith("post_")) {
      return res.status(400).json({ error: "Formato de 'id' inválido." });
    }

    try {
      // Requisição para obter detalhes do post
      const postResponse = await axios.get<{ success: boolean; data: any }>(
        `https://backend.testeswaffle.org/webhooks/case/publication/teste/post/${id}`,
      );

      if (!postResponse.data?.success || !postResponse.data?.data) {
        return res.status(500).json({ error: "Falha ao obter dados do post." });
      }

      const postDetails = postResponse.data.data;
      const extractedPost = {
        id: postDetails.id,
        title: postDetails.title,
        content: postDetails.content?.free?.web || "Sem conteúdo disponível",
        published_at: postDetails.created,
        author: postDetails.authors?.[0] || "Desconhecido",
      };

      const today = new Date();
      if (today.getDay() === 0) {
        return res
          .status(200)
          .json({ message: "Leituras aos domingos não contam para o streak." });
      }

      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      await database.query("BEGIN");

      // Inserir ou buscar usuário
      const userQuery = await database.query({
        text: `
          INSERT INTO users (email)
          VALUES ($1)
          ON CONFLICT (email) DO NOTHING
          RETURNING id;
        `,
        values: [email],
      });

      let userId = userQuery.rows[0]?.id || null;
      if (!userId) {
        const userSelect = await database.query({
          text: "SELECT id FROM users WHERE email = $1;",
          values: [email],
        });
        userId = userSelect.rows[0]?.id;
      }

      if (!userId) {
        throw new Error("Falha ao obter ID do usuário.");
      }

      // Inserir ou obter newsletter
      const editionQuery = await database.query({
        text: `
          INSERT INTO newsletters (edition_id, title, content, published_at, author)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (edition_id) DO UPDATE
          SET title = EXCLUDED.title,
              content = EXCLUDED.content,
              published_at = EXCLUDED.published_at,
              author = EXCLUDED.author
          RETURNING id;
        `,
        values: [
          id,
          extractedPost.title,
          extractedPost.content,
          extractedPost.published_at,
          extractedPost.author,
        ],
      });

      let newsletterId = editionQuery.rows[0]?.id;
      if (!newsletterId) {
        const newsletterSelect = await database.query({
          text: "SELECT id FROM newsletters WHERE edition_id = $1;",
          values: [id],
        });
        newsletterId = newsletterSelect.rows[0]?.id;
      }

      if (!newsletterId) {
        throw new Error("Falha ao obter ID da newsletter.");
      }

      // Verificar se o usuário já leu hoje
      const dailyReadQuery = await database.query({
        text: `
          SELECT 1 FROM reads
          WHERE user_id = $1
          AND read_at >= $2
          LIMIT 1;
        `,
        values: [userId, todayMidnight.toISOString()],
      });

      if (dailyReadQuery.rows.length > 0) {
        return res.status(400).json({ error: "Você já fez uma leitura hoje." });
      }

      // Registrar a leitura
      await database.query({
        text: `
          INSERT INTO reads (user_id, newsletter_id, read_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, newsletter_id) DO NOTHING;
        `,
        values: [userId, newsletterId],
      });

      // Atualizar streaks
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

      return res.status(200).json({
        message: "Leitura registrada!",
        streak: newStreak,
      });
    } catch (error) {
      await database.query("ROLLBACK");
      console.error("Erro no webhook:", error);
      return res.status(500).json({ error: "Erro interno" });
    }
  }

  return res.status(405).json({ error: "Método não permitido." });
}
