import { NextApiRequest, NextApiResponse } from "next";
import database from "infra/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const email = req.query.email as string;

  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    const userQuery = await database.query({
      text: `
        SELECT streaks.streak_count, streaks.last_read_at
        FROM users
        LEFT JOIN streaks ON users.id = streaks.user_id
        WHERE users.email = $1
      `,
      values: [email],
    });

    if (userQuery.rowCount === 0) {
      return res.status(404).json({ found: false });
    }

    const { streak_count, last_read_at } = userQuery.rows[0];

    return res.status(200).json({
      found: true,
      streak: streak_count ?? 0,
      lastRead: last_read_at
        ? new Date(last_read_at).toLocaleString()
        : "Nenhuma leitura registrada",
    });
  } catch (error: any) {
    console.error("Erro ao buscar usuário:", error);
    return res
      .status(500)
      .json({ error: "Erro interno no servidor", details: error.message });
  }
}
